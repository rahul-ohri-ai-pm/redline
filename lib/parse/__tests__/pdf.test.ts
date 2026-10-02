import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFile, type ParseInput } from "../index";
import { verifyCitation } from "../../analysis/citation";

const FIXTURES = join(__dirname, "..", "..", "..", "tests", "fixtures", "parse", "pdf");

function pdfFile(name: string): ParseInput {
  const bytes = readFileSync(join(FIXTURES, name));
  return {
    name,
    type: "application/pdf",
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  };
}

const PAGE_1 =
  "RESIDENTIAL LEASE AGREEMENT\n\n1. RENT. Tenant shall pay rent of $1,200.00 per month, due on the\nfirst day of each month. Rent paid after the fifth day incurs a late fee of $50.";
const PAGE_2 =
  "2. SECURITY DEPOSIT. Tenant shall pay a security deposit of $2,400.00 before moving in.\nLandlord may deduct from the deposit any amount Landlord decides is needed for cleaning.\n\n3. TERMINATION. Either party may end this lease on thirty days written notice.\nThe Landlord’s obligations survive the term of the lease.";
const PAGE_3 =
  "4. ENTRY. Landlord may enter the unit at any time to inspect it, with notice\ngiven by posting a note on the door at least one hour beforehand.";
const PAGE_4 =
  "5. PETS. No pets are allowed without Landlord's written consent, and a pet\ndeposit of $300 applies. Tenant shall not have overnight guests for more than\nseven days in any month.";

describe("parseFile with a clean text PDF", () => {
  it("returns one readable section per page and the page text joined by a blank line", async () => {
    const r = await parseFile(pdfFile("clean-lease.pdf"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.sections).toEqual([
      { id: "page-1", text: PAGE_1, readable: true },
      { id: "page-2", text: PAGE_2, readable: true },
      { id: "page-3", text: PAGE_3, readable: true },
      { id: "page-4", text: PAGE_4, readable: true },
    ]);
    expect(r.text).toBe([PAGE_1, PAGE_2, PAGE_3, PAGE_4].join("\n\n"));
  });

  it("lets a citation of a page-4 sentence verify against the text", async () => {
    const r = await parseFile(pdfFile("clean-lease.pdf"));
    if (!r.ok) throw new Error("expected ok");
    expect(
      verifyCitation(
        "Tenant shall not have overnight guests for more than\nseven days in any month.",
        r.text,
        r.sections
      )
    ).toBe(true);
  });
});

describe("parseFile with one garbled page", () => {
  it("marks only that page unreadable, with no text, and keeps the rest", async () => {
    const r = await parseFile(pdfFile("garbled-page.pdf"));
    if (!r.ok) throw new Error("expected ok");
    expect(r.sections.map((s) => [s.id, s.readable])).toEqual([
      ["page-1", true],
      ["page-2", true],
      ["page-3", false],
      ["page-4", true],
    ]);
    const bad = r.sections[2];
    expect(bad.text).toBeNull();
    expect(bad.readable === false && bad.reason.length > 0).toBe(true);
    expect(r.text).toBe([PAGE_1, PAGE_2, PAGE_4].join("\n\n"));
    expect(r.text).not.toContain("xq zvkt");
  });
});

describe("parseFile with a page that has no text in an otherwise readable PDF", () => {
  it("skips the drawing-only page with a reason", async () => {
    const r = await parseFile(pdfFile("mixed-scan-page.pdf"));
    if (!r.ok) throw new Error("expected ok");
    expect(r.sections.map((s) => s.readable)).toEqual([true, false, true]);
    const page2 = r.sections[1];
    expect(page2.id).toBe("page-2");
    expect(page2.text).toBeNull();
    expect(page2.readable === false && page2.reason).toMatch(/no text/i);
    expect(r.text).toBe([PAGE_1, PAGE_4].join("\n\n"));
  });
});

describe("parseFile with a PDF that has no text layer", () => {
  it("refuses it, says scans aren't supported, and produces no text", async () => {
    const r = await parseFile(pdfFile("no-text-layer.pdf"));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("no-readable-text");
    expect(r.reason).toMatch(/scan/i);
    expect(r).not.toHaveProperty("text");
    expect(r).not.toHaveProperty("sections");
  });
});

describe("parseFile with a file that is not a PDF", () => {
  it("refuses a .pdf that holds other bytes", async () => {
    const r = await parseFile({
      name: "fake.pdf",
      arrayBuffer: async () => new TextEncoder().encode("just some words").buffer as ArrayBuffer,
    });
    expect(r).toMatchObject({ ok: false, code: "read-failed" });
  });
});
