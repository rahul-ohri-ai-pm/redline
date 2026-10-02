/**
 * Writes the PDF fixtures under tests/fixtures/parse/pdf/ as hand-built,
 * minimal PDF bytes (no PDF library). Run with: npx tsx scripts/make-pdf-fixtures.ts
 * The generated files are committed; this script is how they were made.
 *
 *  clean-lease.pdf     4 pages of ordinary lease text, with two paragraphs on page 2
 *  garbled-page.pdf    the same 4 pages, but page 3 is scrambled characters
 *  no-text-layer.pdf   2 pages that only draw shapes, with no text at all
 *  mixed-scan-page.pdf 3 pages where page 2 is a drawing only and the rest is text
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Line = string | null; // null = a gap before the next paragraph
type PageSpec = { kind: "text"; lines: Line[] } | { kind: "drawing" };

const OUT = join(__dirname, "..", "tests", "fixtures", "parse", "pdf");

/** Escapes text for a PDF literal string. "’" (U+2019) becomes the WinAnsi byte 0x92 (written as latin1). */
function pdfString(text: string): string {
  let out = "";
  for (const ch of text) {
    if (ch === "(" || ch === ")" || ch === "\\") out += "\\" + ch;
    else if (ch === "’") out += "\x92";
    else out += ch;
  }
  return `(${out})`;
}

function contentFor(page: PageSpec): string {
  if (page.kind === "drawing") {
    // Filled boxes standing in for a scanned picture. No text operators.
    return "0.8 g 72 500 468 200 re f 0.4 g 72 300 468 120 re f";
  }
  let y = 720;
  let ops = "BT /F1 12 Tf 14 TL 72 " + y + " Td\n";
  let first = true;
  for (const line of page.lines) {
    if (line === null) {
      ops += "0 -14 Td\n";
      continue;
    }
    ops += (first ? "" : "0 -14 Td\n") + `${pdfString(line)} Tj\n`;
    first = false;
  }
  return ops + "ET";
}

function buildPdf(pages: PageSpec[]): Buffer {
  const objects: string[] = [];
  const add = (body: string) => objects.push(body); // object n is objects[n-1]
  // 1 catalog, 2 pages, 3 font, then (page, content) pairs
  add("<< /Type /Catalog /Pages 2 0 R >>");
  const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(" ");
  add(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  pages.forEach((page, i) => {
    const content = contentFor(page);
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${5 + i * 2} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`
    );
    add(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefAt = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

const page1: PageSpec = {
  kind: "text",
  lines: [
    "RESIDENTIAL LEASE AGREEMENT",
    null,
    "1. RENT. Tenant shall pay rent of $1,200.00 per month, due on the",
    "first day of each month. Rent paid after the fifth day incurs a late fee of $50.",
  ],
};
const page2: PageSpec = {
  kind: "text",
  lines: [
    "2. SECURITY DEPOSIT. Tenant shall pay a security deposit of $2,400.00 before moving in.",
    "Landlord may deduct from the deposit any amount Landlord decides is needed for cleaning.",
    null,
    "3. TERMINATION. Either party may end this lease on thirty days written notice.",
    "The Landlord’s obligations survive the term of the lease.",
  ],
};
const page3Clean: PageSpec = {
  kind: "text",
  lines: [
    "4. ENTRY. Landlord may enter the unit at any time to inspect it, with notice",
    "given by posting a note on the door at least one hour beforehand.",
  ],
};
const page3Garbled: PageSpec = {
  kind: "text",
  lines: [
    "xq zvkt wrplm hgfd bnsk qzxv tkrw plmh gfdb nskq zxvt krwp lmhg",
    "%%&#@ ^^~~ $$## fdbn skqz xvtk rwpl mhgf dbns kqzx vtkr wplm hgfd",
    "}{][ ;;:: bnsk qzxv tkrw plmh gfdb nskq zxvt krwp lmhg fdbn skqz",
  ],
};
const page4: PageSpec = {
  kind: "text",
  lines: [
    "5. PETS. No pets are allowed without Landlord's written consent, and a pet",
    "deposit of $300 applies. Tenant shall not have overnight guests for more than",
    "seven days in any month.",
  ],
};

mkdirSync(OUT, { recursive: true });
const files: Record<string, PageSpec[]> = {
  "clean-lease.pdf": [page1, page2, page3Clean, page4],
  "garbled-page.pdf": [page1, page2, page3Garbled, page4],
  "no-text-layer.pdf": [{ kind: "drawing" }, { kind: "drawing" }],
  "mixed-scan-page.pdf": [page1, { kind: "drawing" }, page4],
};
for (const [name, pages] of Object.entries(files)) {
  writeFileSync(join(OUT, name), buildPdf(pages));
  console.log("wrote", name);
}
