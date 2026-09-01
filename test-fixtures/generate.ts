import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function main() {
  const dir = path.resolve(process.cwd(), "test-fixtures");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Clean PDF: Matches Alice Candidate, 2023, clean metadata
  const doc1 = await PDFDocument.create();
  const date1 = new Date();
  doc1.setTitle("Bachelor Degree");
  doc1.setAuthor("University Registrar");
  doc1.setProducer("University Registrar System");
  doc1.setCreator("SIS Batch Generator");
  doc1.setCreationDate(date1);
  doc1.setModificationDate(date1);
  const font1 = await doc1.embedFont(StandardFonts.Helvetica);
  const page1 = doc1.addPage([600, 400]);
  page1.drawText("Alice Candidate", { x: 50, y: 320, size: 24, font: font1, color: rgb(0, 0, 0) });
  page1.drawText("Acme University - Bachelor of Science in Computer Science", { x: 50, y: 270, size: 16, font: font1, color: rgb(0, 0, 0) });
  page1.drawText("Conferred in the year 2023 with all honors.", { x: 50, y: 220, size: 14, font: font1, color: rgb(0, 0, 0) });
  page1.drawText("Certificate: ACM-2023-9988", { x: 50, y: 170, size: 12, font: font1, color: rgb(0, 0, 0) });
  const bytes1 = await doc1.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "clean-degree.pdf"), bytes1);

  // 2. Mismatched PDF: Clean metadata, perfectly legible text with name 'John Doe' and year '2018'
  const doc2 = await PDFDocument.create();
  const date2 = new Date();
  doc2.setTitle("Bachelor Degree");
  doc2.setAuthor("University Registrar");
  doc2.setProducer("University Registrar System");
  doc2.setCreator("SIS Batch Generator");
  doc2.setCreationDate(date2);
  doc2.setModificationDate(date2);
  const font2 = await doc2.embedFont(StandardFonts.Helvetica);
  const page2 = doc2.addPage([600, 400]);
  page2.drawText("John Doe", { x: 50, y: 320, size: 24, font: font2, color: rgb(0, 0, 0) });
  page2.drawText("Acme University - Bachelor of Science in Mechanical Engineering", { x: 50, y: 270, size: 16, font: font2, color: rgb(0, 0, 0) });
  page2.drawText("Conferred in the year 2018 with all honors.", { x: 50, y: 220, size: 14, font: font2, color: rgb(0, 0, 0) });
  page2.drawText("Certificate: ACM-2018-4422", { x: 50, y: 170, size: 12, font: font2, color: rgb(0, 0, 0) });
  const bytes2 = await doc2.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "mismatched-degree.pdf"), bytes2);

  // 3. Flagged PDF: Photoshop metadata, ModDate gap > 24h, legible matching text
  const doc3 = await PDFDocument.create();
  doc3.setTitle("Certificate of Completion");
  doc3.setProducer("Adobe Photoshop 2024 (Macintosh)");
  doc3.setCreator("Adobe Photoshop 2024 (Macintosh)");
  doc3.setCreationDate(new Date("2020-01-01T00:00:00Z"));
  doc3.setModificationDate(new Date("2024-05-01T18:00:00Z"));
  const font3 = await doc3.embedFont(StandardFonts.Helvetica);
  const page3 = doc3.addPage([600, 400]);
  page3.drawText("Alice Candidate", { x: 50, y: 320, size: 24, font: font3, color: rgb(0, 0, 0) });
  page3.drawText("Acme University - Certificate of Completion", { x: 50, y: 270, size: 16, font: font3, color: rgb(0, 0, 0) });
  page3.drawText("Conferred in the year 2024 under faculty supervision.", { x: 50, y: 220, size: 14, font: font3, color: rgb(0, 0, 0) });
  const bytes3 = await doc3.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "flagged-degree.pdf"), bytes3);

  // 4. Unreadable Scanned PDF: Graphical vector rectangle only, no text
  const doc4 = await PDFDocument.create();
  const date4 = new Date();
  doc4.setCreationDate(date4);
  doc4.setModificationDate(date4);
  const page4 = doc4.addPage([600, 400]);
  page4.drawRectangle({
    x: 50,
    y: 50,
    width: 500,
    height: 300,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 2,
    color: rgb(0.95, 0.95, 0.95),
  });
  page4.drawLine({
    start: { x: 70, y: 200 },
    end: { x: 530, y: 200 },
    thickness: 3,
    color: rgb(0.7, 0.7, 0.7),
  });
  const bytes4 = await doc4.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "unreadable-scanned.pdf"), bytes4);

  // 5. Fake PDF: Text file
  fs.writeFileSync(path.join(dir, "fake-pdf.pdf"), "This is plain text with a .pdf extension.");

  console.log("Cleanly generated all 5 test fixtures in test-fixtures/!");
}

main().catch(console.error);
