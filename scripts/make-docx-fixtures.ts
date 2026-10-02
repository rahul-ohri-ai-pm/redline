/**
 * Writes the DOCX fixtures under tests/fixtures/parse/docx/ as hand-built,
 * minimal Word files (a DOCX is a zip, written here with a store-only zip
 * writer, so no zip library is needed). Run with: npx tsx scripts/make-docx-fixtures.ts
 * The generated files are committed; this script is how they were made.
 *
 *  clean-lease.docx     headings, paragraphs, a table, a tab, a line break, an empty paragraph and a rule
 *  garbled-block.docx   the same lease, but one paragraph is symbol-font leftovers and scrambled letters
 *  scrambled-block.docx the same lease, but one paragraph is plain letters in no order
 *  image-only-block.docx the same lease, but one paragraph holds only a picture
 *  all-garbled.docx     every paragraph is garbled
 *  no-text.docx         only empty paragraphs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(__dirname, "..", "tests", "fixtures", "parse", "docx");

// ---- store-only zip writer -------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files: { name: string; data: Buffer }[]): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBytes = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // utf-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0x21, 12); // date: 1980-01-01
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, nameBytes, data);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4); // version made by
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(0, 10);
    entry.writeUInt16LE(0, 12);
    entry.writeUInt16LE(0x21, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, centralBytes, end]);
}

// ---- WordprocessingML ------------------------------------------------------

type Block =
  | { kind: "p"; text: string; style?: string }
  | { kind: "tabbed"; left: string; right: string }
  | { kind: "broken"; first: string; second: string }
  | { kind: "image" }
  | { kind: "table"; rows: string[][] };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const run = (text: string) => `<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const para = (inner: string, style?: string) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}${inner}</w:p>`;

const IMAGE_RUN =
  '<w:r><w:drawing><wp:inline><wp:extent cx="952500" cy="952500"/><wp:docPr id="1" name="Picture 1"/>' +
  '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
  '<pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="p.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
  '<pic:blipFill><a:blip r:embed="rId1"/></pic:blipFill><pic:spPr/></pic:pic>' +
  "</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>";

function blockXml(block: Block): string {
  switch (block.kind) {
    case "p":
      return para(block.text === "" ? "" : run(block.text), block.style);
    case "tabbed":
      return para(`${run(block.left)}<w:r><w:tab/></w:r>${run(block.right)}`);
    case "broken":
      return para(`${run(block.first)}<w:r><w:br/></w:r>${run(block.second)}`);
    case "image":
      return para(IMAGE_RUN);
    case "table":
      return (
        "<w:tbl>" +
        block.rows
          .map(
            (row) =>
              "<w:tr>" +
              row.map((cell) => `<w:tc>${para(run(cell))}</w:tc>`).join("") +
              "</w:tr>"
          )
          .join("") +
        "</w:tbl>"
      );
  }
}

// 1x1 transparent PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

function buildDocx(blocks: Block[], withImage = false): Buffer {
  const document =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    `<w:body>${blocks.map(blockXml).join("")}</w:body></w:document>`;

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Default Extension="png" ContentType="image/png"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    "</Types>";
  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    "</Relationships>";
  const docRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    (withImage
      ? '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>'
      : "") +
    "</Relationships>";

  const files = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes) },
    { name: "_rels/.rels", data: Buffer.from(rootRels) },
    { name: "word/document.xml", data: Buffer.from(document) },
    { name: "word/_rels/document.xml.rels", data: Buffer.from(docRels) },
  ];
  if (withImage) files.push({ name: "word/media/image1.png", data: PNG });
  return zip(files);
}

// ---- the lease -------------------------------------------------------------

const GARBLED = "xqzv wkrtp bnmcl vghzxqw";

const lease = (middle: Block): Block[] => [
  { kind: "p", text: "RESIDENTIAL LEASE AGREEMENT", style: "Heading1" },
  { kind: "p", text: "" },
  {
    kind: "p",
    text: "1. RENT. Tenant shall pay rent of $1,200.00 per month, due on the first day of each month. Rent paid after the fifth day incurs a late fee of $50.",
  },
  {
    kind: "p",
    text: "2. SECURITY DEPOSIT. Tenant shall pay a security deposit of $2,400.00 before moving in. Landlord may deduct from the deposit any amount Landlord decides is needed for cleaning.",
  },
  middle,
  { kind: "p", text: "______________________________" },
  { kind: "table", rows: [["Monthly rent", "$1,200.00"], ["Security deposit", "$2,400.00"]] },
  { kind: "broken", first: "Landlord: Pat Owner", second: "Tenant: Sam Renter" },
  { kind: "tabbed", left: "Date", right: "March 1" },
  {
    kind: "p",
    text: "5. PETS. No pets are allowed without Landlord’s written consent, and a pet deposit of $300 applies.",
  },
];

const CLEAN_MIDDLE: Block = {
  kind: "p",
  text: "3. ENTRY. Landlord may enter the unit at any time to inspect it, with notice given by posting a note on the door at least one hour beforehand.",
};

mkdirSync(OUT, { recursive: true });
const write = (name: string, bytes: Buffer) => writeFileSync(join(OUT, name), bytes);

write("clean-lease.docx", buildDocx(lease(CLEAN_MIDDLE)));
write("garbled-block.docx", buildDocx(lease({ kind: "p", text: GARBLED })));
write(
  "scrambled-block.docx",
  buildDocx(lease({ kind: "p", text: "3. ENTRY. Lnrdl mxy ntr thh nt qzt insp wkvt tk dnr, wth ntc gvn bxp stng nt n th dr." }))
);
write("image-only-block.docx", buildDocx(lease({ kind: "image" }), true));
write(
  "all-garbled.docx",
  buildDocx([
    { kind: "p", text: GARBLED },
    { kind: "p", text: " " },
  ])
);
write("no-text.docx", buildDocx([{ kind: "p", text: "" }, { kind: "p", text: "" }]));
console.log("Wrote DOCX fixtures to", OUT);
