/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const input = path.resolve(process.argv[2] || "docs/research/amc-theatrical-slate-2026-2027.md");
const output = path.resolve(process.argv[3] || input.replace(/\.md$/i, ".docx"));
const lines = fs.readFileSync(input, "utf8").split(/\r?\n/);

function cleanInline(value) {
  return value.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

function inlineRuns(value, options = {}) {
  const text = cleanInline(value);
  const urlPattern = /(https?:\/\/[^\s)]+)/g;
  const pieces = text.split(urlPattern).filter(Boolean);
  return pieces.map((piece) => {
    if (/^https?:\/\//.test(piece)) {
      return new ExternalHyperlink({
        link: piece,
        children: [new TextRun({ text: piece, color: "1F6B52", underline: {}, size: options.size || 18 })],
      });
    }
    return new TextRun({ text: piece, size: options.size || 20, color: options.color || "26332D", italics: options.italics, bold: options.bold });
  });
}

function paragraph(value, options = {}) {
  return new Paragraph({
    children: inlineRuns(value, options),
    spacing: { after: options.after ?? 130, line: 300 },
    alignment: options.alignment,
    shading: options.shading ? { type: ShadingType.CLEAR, fill: options.shading } : undefined,
    border: options.border ? { left: { style: BorderStyle.SINGLE, size: 12, color: options.border, space: 8 } } : undefined,
    indent: options.indent,
    numbering: options.numbering,
  });
}

function tableFrom(rows) {
  const count = Math.max(...rows.map((row) => row.length));
  const totalWidth = 14400;
  const widths = Array.from({ length: count }, () => Math.floor(totalWidth / count));
  widths[widths.length - 1] += totalWidth - widths.reduce((sum, value) => sum + value, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((row, rowIndex) => new TableRow({
      tableHeader: rowIndex === 0,
      children: widths.map((width, columnIndex) => new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: rowIndex === 0 ? { type: ShadingType.CLEAR, fill: "153F32" } : rowIndex % 2 ? { type: ShadingType.CLEAR, fill: "F2F6F3" } : undefined,
        margins: { top: 90, right: 90, bottom: 90, left: 90 },
        children: [new Paragraph({
          children: inlineRuns(row[columnIndex] || "", { size: count >= 5 ? 14 : 17, color: rowIndex === 0 ? "FFFFFF" : "26332D", bold: rowIndex === 0 }),
          spacing: { after: 0, line: count >= 5 ? 220 : 250 },
        })],
      })),
    })),
  });
}

const children = [];
let paragraphBuffer = [];

function flushParagraph() {
  if (!paragraphBuffer.length) return;
  children.push(paragraph(paragraphBuffer.join(" ")));
  paragraphBuffer = [];
}

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  if (!line.trim()) {
    flushParagraph();
    continue;
  }
  if (/^\|.+\|$/.test(line) && /^\|[\s:|-]+\|$/.test(lines[index + 1] || "")) {
    flushParagraph();
    const rows = [line];
    index += 2;
    while (index < lines.length && /^\|.+\|$/.test(lines[index])) {
      rows.push(lines[index]);
      index += 1;
    }
    index -= 1;
    children.push(tableFrom(rows.map((row) => row.split("|").slice(1, -1).map((cell) => cleanInline(cell)))));
    children.push(new Paragraph({ spacing: { after: 150 } }));
    continue;
  }
  const heading = line.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
    flushParagraph();
    children.push(new Paragraph({
      text: cleanInline(heading[2]),
      heading: heading[1].length === 1 ? HeadingLevel.TITLE : heading[1].length === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      spacing: { before: heading[1].length === 1 ? 0 : 280, after: 120 },
    }));
    continue;
  }
  if (line.startsWith("> ")) {
    flushParagraph();
    children.push(paragraph(line.slice(2), { italics: true, color: "5D6D66", shading: "F4F0E5", border: "C89936", indent: { left: 180, right: 180 }, after: 180 }));
    continue;
  }
  const bullet = line.match(/^-\s+(.+)$/);
  if (bullet) {
    flushParagraph();
    children.push(paragraph(bullet[1], { numbering: { reference: "research-bullets", level: 0 }, after: 55 }));
    continue;
  }
  const numbered = line.match(/^\d+\.\s+(.+)$/);
  if (numbered) {
    flushParagraph();
    children.push(paragraph(numbered[1], { numbering: { reference: "research-numbers", level: 0 }, after: 55 }));
    continue;
  }
  paragraphBuffer.push(line.trim().replace(/\s{2,}$/, ""));
}
flushParagraph();

const document = new Document({
  creator: "Learn What You Own",
  title: "AMC Theatrical Slate Research Monitor: August 2026–December 2027",
  description: "Source-linked theatrical release and box-office scenario research for AMC Entertainment.",
  styles: {
    default: { document: { run: { font: "Aptos", size: 20, color: "26332D" }, paragraph: { spacing: { line: 300 } } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Georgia", size: 42, bold: false, color: "153F32" }, paragraph: { spacing: { after: 240 }, outlineLevel: 0 } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Georgia", size: 30, color: "153F32" }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Aptos", size: 23, bold: true, color: "416887" }, paragraph: { spacing: { before: 200, after: 90 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "research-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } }] },
      { reference: "research-numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 220 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
        margin: { top: 720, right: 720, bottom: 720, left: 720 },
      },
    },
    headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "LEARN WHAT YOU OWN  ·  AMC RESEARCH", size: 15, bold: true, color: "658077" })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "B9C8C1", space: 6 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Research compiled August 2, 2026  ·  Page ", size: 15, color: "658077" }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: "658077" })] })] }) },
    children,
  }],
});

Packer.toBuffer(document).then((buffer) => {
  fs.writeFileSync(output, buffer);
  console.log(output);
});
