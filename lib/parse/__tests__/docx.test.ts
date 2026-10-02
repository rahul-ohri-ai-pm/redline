import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { availableFileTypeLabels, parseFile, type ParseInput } from "../index";
import { verifyCitation } from "../../analysis/citation";

const FIXTURES = join(__dirname, "..", "..", "..", "tests", "fixtures", "parse", "docx");
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function docxFile(name: string): ParseInput {
  const bytes = readFileSync(join(FIXTURES, name));
  return {
    name,
    type: DOCX_MIME,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  };
}

const TITLE = "RESIDENTIAL LEASE AGREEMENT";
const RENT =
  "1. RENT. Tenant shall pay rent of $1,200.00 per month, due on the first day of each month. Rent paid after the fifth day incurs a late fee of $50.";
const DEPOSIT =
  "2. SECURITY DEPOSIT. Tenant shall pay a security deposit of $2,400.00 before moving in. Landlord may deduct from the deposit any amount Landlord decides is needed for cleaning.";
const ENTRY =
  "3. ENTRY. Landlord may enter the unit at any time to inspect it, with notice given by posting a note on the door at least one hour beforehand.";
const TAIL = [
  "Monthly rent",
  "$1,200.00",
  "Security deposit",
  "$2,400.00",
  "Landlord: Pat Owner\nTenant: Sam Renter",
  "Date March 1",
  "5. PETS. No pets are allowed without Landlord’s written consent, and a pet deposit of $300 applies.",
];

describe("parseFile with a clean DOCX", () => {
  it("returns one readable section per non-empty paragraph, table cells included, and the text joined by a blank line", async () => {
    const r = await parseFile(docxFile("clean-lease.docx"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const texts = [TITLE, RENT, DEPOSIT, ENTRY, ...TAIL];
    expect(r.sections).toEqual(
      texts.map((text, i) => ({ id: `block-${i + 1}`, text, readable: true }))
    );
    expect(r.text).toBe(texts.join("\n\n"));
  });

  it("drops empty paragraphs and rules without leaving a gap in the ids", async () => {
    const r = await parseFile(docxFile("clean-lease.docx"));
    if (!r.ok) throw new Error("expected ok");
    expect(r.sections.some((s) => s.readable && /^_+$/.test(s.text))).toBe(false);
    expect(r.sections[r.sections.length - 1].id).toBe("block-11");
  });

  it("lets a citation of a sentence in the middle of a block verify against the text", async () => {
    const r = await parseFile(docxFile("clean-lease.docx"));
    if (!r.ok) throw new Error("expected ok");
    expect(
      verifyCitation(
        "Landlord may deduct from the deposit any amount Landlord decides is needed for cleaning.",
        r.text,
        r.sections
      )
    ).toBe(true);
  });
});

describe("parseFile with one garbled block", () => {
  it("marks only that block unreadable, with no text, and keeps the rest", async () => {
    const r = await parseFile(docxFile("garbled-block.docx"));
    if (!r.ok) throw new Error("expected ok");
    const unreadable = r.sections.filter((s) => !s.readable);
    expect(unreadable).toHaveLength(1);
    const bad = unreadable[0];
    expect(bad.id).toBe("block-4");
    expect(bad.text).toBeNull();
    expect(bad.readable === false && bad.reason).toMatch(/didn.t come through as readable text/i);
    // It says where the block sits, using the readable block before it.
    expect(bad.readable === false && bad.reason).toContain("needed for cleaning.");
    expect(r.sections.filter((s) => s.readable)).toHaveLength(r.sections.length - 1);
    expect(r.text).toBe([TITLE, RENT, DEPOSIT, ...TAIL].join("\n\n"));
    expect(r.text).not.toMatch(/xqzv/);
  });
});

describe("parseFile with a block of plain letters in no order", () => {
  it("skips it as scrambled even though every character is an ordinary letter", async () => {
    const r = await parseFile(docxFile("scrambled-block.docx"));
    if (!r.ok) throw new Error("expected ok");
    const bad = r.sections.filter((s) => !s.readable);
    expect(bad.map((s) => s.id)).toEqual(["block-4"]);
    expect(bad[0].readable === false && bad[0].reason).toMatch(/scrambled/i);
    expect(r.text).not.toContain("Lnrdl");
  });
});

describe("parseFile with a picture-only block", () => {
  it("skips the block with a reason that mentions the picture", async () => {
    const r = await parseFile(docxFile("image-only-block.docx"));
    if (!r.ok) throw new Error("expected ok");
    const bad = r.sections.filter((s) => !s.readable);
    expect(bad).toHaveLength(1);
    expect(bad[0].id).toBe("block-4");
    expect(bad[0].text).toBeNull();
    expect(bad[0].readable === false && bad[0].reason).toMatch(/picture/i);
    expect(r.text).toBe([TITLE, RENT, DEPOSIT, ...TAIL].join("\n\n"));
  });
});

describe("parseFile with a DOCX that cannot be used", () => {
  it("refuses a document where every block is garbled, with no text or sections", async () => {
    const r = await parseFile(docxFile("all-garbled.docx"));
    expect(r).toMatchObject({ ok: false, code: "no-readable-text" });
    expect(r).not.toHaveProperty("text");
    expect(r).not.toHaveProperty("sections");
  });

  it("refuses a document with no text", async () => {
    const r = await parseFile(docxFile("no-text.docx"));
    expect(r).toMatchObject({ ok: false, code: "no-readable-text" });
    if (!r.ok) expect(r.reason).toMatch(/no text/i);
  });

  it("refuses a .docx that holds other bytes", async () => {
    const r = await parseFile({
      name: "fake.docx",
      arrayBuffer: async () => new TextEncoder().encode("just some words").buffer as ArrayBuffer,
    });
    expect(r).toMatchObject({ ok: false, code: "read-failed" });
  });
});

describe("file type support", () => {
  it("lists DOCX among the file types that can be read", () => {
    expect(availableFileTypeLabels()).toContain("DOCX");
  });
});
