import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFile, parsePastedText, type ParseInput } from "../index";
import { verifyCitation } from "../../analysis/citation";
import { normalizeText } from "../normalize";

const FIXTURES = join(__dirname, "..", "..", "..", "tests", "fixtures", "parse", "plaintext");

function fixtureFile(name: string, asName = name, type = ""): ParseInput {
  const bytes = readFileSync(join(FIXTURES, name));
  return {
    name: asName,
    type,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  };
}

function expectOk<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  expect(r.ok).toBe(true);
  return r as Extract<T, { ok: true }>;
}

describe("parseFile with a clean .txt", () => {
  it("returns normalized text and one readable section per paragraph", async () => {
    const r = expectOk(await parseFile(fixtureFile("clean-lease.txt")));
    expect(r.sections.map((s) => s.id)).toEqual([
      "paragraph-1",
      "paragraph-2",
      "paragraph-3",
      "paragraph-4",
      "paragraph-5",
    ]);
    expect(r.sections.every((s) => s.readable)).toBe(true);
    expect(r.text).toBe(
      [
        "RESIDENTIAL LEASE",
        "1. RENT. Tenant shall pay rent of $1,200.00 per month, due on the\nfirst day of each month. Rent paid after the fifth day incurs a late fee of $50.",
        "2. TERMINATION. Either party may end this lease on thirty days written termination notice. The Landlord’s obligations survive the term.",
        "----------",
        "3. PETS. No pets are allowed without Landlord's written consent, and a pet deposit of $300 applies.",
      ].join("\n\n")
    );
  });

  it("makes every readable section a verbatim piece of the text", async () => {
    const r = expectOk(await parseFile(fixtureFile("clean-lease.txt")));
    for (const s of r.sections) {
      if (s.readable) expect(r.text.includes(s.text)).toBe(true);
    }
    expect(
      verifyCitation("Rent paid after the fifth day incurs a late fee of $50.", r.text, r.sections)
    ).toBe(true);
  });

  it("decodes UTF-16 text with a byte-order mark", async () => {
    const r = expectOk(await parseFile(fixtureFile("utf16-lease.txt")));
    expect(r.text).toBe(
      "RESIDENTIAL LEASE\n\n1. RENT. Tenant shall pay rent of $1,200.00 per month."
    );
  });

  it("detects a text file with no extension from its MIME type", async () => {
    const r = expectOk(await parseFile(fixtureFile("clean-lease.txt", "lease", "text/plain")));
    expect(r.sections.length).toBe(5);
  });
});

describe("readability", () => {
  it("marks a control-character paragraph unreadable, with null text and a reason", async () => {
    const r = expectOk(await parseFile(fixtureFile("control-chars-lease.txt")));
    expect(r.sections).toHaveLength(4);
    const bad = r.sections[2];
    expect(bad).toMatchObject({ id: "paragraph-3", text: null, readable: false });
    expect(bad.readable === false && bad.reason.length).toBeGreaterThan(0);
    expect(r.sections.filter((s) => s.readable)).toHaveLength(3);
  });

  it("keeps unreadable content out of the returned text entirely", async () => {
    const r = expectOk(await parseFile(fixtureFile("control-chars-lease.txt")));
    expect(r.text).not.toMatch(/DEPOSIT/);
    expect(r.text).not.toMatch(/[\u0000-\u0008]/);
    expect(r.text).toBe(
      [
        "RESIDENTIAL LEASE",
        "1. RENT. Tenant shall pay rent of $1,200.00 per month, due on the first day of each month.",
        "3. PETS. No pets are allowed without Landlord's written consent.",
      ].join("\n\n")
    );
  });

  it("marks a scrambled paragraph unreadable and keeps the clean ones", async () => {
    const r = expectOk(await parseFile(fixtureFile("scrambled-lease.txt")));
    expect(r.sections.map((s) => s.readable)).toEqual([true, true, false, true]);
    expect(r.text).not.toMatch(/Agr33ment/);
    expect(
      verifyCitation("Th1s Agr33ment sh4ll", r.text, r.sections)
    ).toBe(false);
  });

  it("refuses a file that is not text at all", async () => {
    const r = await parseFile(fixtureFile("binary-renamed.txt"));
    expect(r).toMatchObject({ ok: false, code: "no-readable-text" });
  });

  it("refuses an empty file", async () => {
    const r = await parseFile(fixtureFile("empty.txt"));
    expect(r).toMatchObject({ ok: false, code: "no-readable-text" });
  });
});

describe("normalization", () => {
  it("is applied once and is stable: normalizing the result changes nothing", async () => {
    for (const name of ["clean-lease.txt", "control-chars-lease.txt", "scrambled-lease.txt"]) {
      const r = expectOk(await parseFile(fixtureFile(name)));
      expect(normalizeText(r.text)).toBe(r.text);
    }
  });

  it("gives pasted text the same result as the same text uploaded", async () => {
    const bytes = readFileSync(join(FIXTURES, "clean-lease.txt"), "utf8");
    const pasted = expectOk(parsePastedText(bytes));
    const uploaded = expectOk(await parseFile(fixtureFile("clean-lease.txt")));
    expect(pasted.text).toBe(uploaded.text);
    expect(pasted.sections).toEqual(uploaded.sections);
  });

  it("applies the readability check to pasted text", () => {
    const r = expectOk(parsePastedText("Rent is due monthly.\n\nTh1s Agr##ment sh4ll r3n3w %%% ###"));
    expect(r.sections.map((s) => s.readable)).toEqual([true, false]);
  });

  it("refuses pasted text that is blank", () => {
    expect(parsePastedText("   \n ")).toMatchObject({ ok: false, code: "no-readable-text" });
  });
});

describe("file type handling", () => {
  it("refuses an unsupported type and names the supported ones", async () => {
    const r = await parseFile({
      name: "lease.rtf",
      type: "application/rtf",
      arrayBuffer: async () => new ArrayBuffer(4),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("unsupported-type");
      expect(r.reason).toContain("PDF");
      expect(r.reason).toContain("DOCX");
      expect(r.reason).toContain("plain text");
      expect(r.reason).toContain("lease.rtf");
    }
  });

  it("says PDF and DOCX are not available yet while no parser is registered", async () => {
    for (const name of ["lease.pdf", "lease.docx"]) {
      const r = await parseFile(
        { name, arrayBuffer: async () => new ArrayBuffer(4) },
        { text: async () => ({ ok: true, text: "x", sections: [] }) }
      );
      expect(r).toMatchObject({ ok: false, code: "not-available-yet" });
    }
  });

  it("hands a registered type to its parser", async () => {
    const r = await parseFile(
      { name: "lease.pdf", arrayBuffer: async () => new ArrayBuffer(0) },
      {
        pdf: async () => ({
          ok: true,
          text: "From the registry.",
          sections: [{ id: "page-1", text: "From the registry.", readable: true }],
        }),
      }
    );
    expect(expectOk(r).text).toBe("From the registry.");
  });
});

describe("against the engine's own lease fixtures", () => {
  const dir = join(__dirname, "..", "..", "..", "tests", "fixtures");
  it("reads the clean and adhesion leases with no unreadable sections", () => {
    for (const name of ["clean-lease.txt", "adhesion-lease.txt", "qa-lease-excerpt.txt"]) {
      const r = expectOk(parsePastedText(readFileSync(join(dir, name), "utf8")));
      expect(r.sections.filter((s) => !s.readable)).toEqual([]);
    }
  });
  it("skips only the garbled renewal clause in the partial-extraction lease", () => {
    const r = expectOk(
      parsePastedText(readFileSync(join(dir, "partial-extraction-lease.txt"), "utf8"))
    );
    const skipped = r.sections.filter((s) => !s.readable);
    expect(skipped).toHaveLength(1);
    expect(r.text).not.toMatch(/RENEWAL/);
  });
});
