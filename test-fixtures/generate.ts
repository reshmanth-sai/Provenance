import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function main() {
  const dir = path.resolve(process.cwd(), "test-fixtures");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Layout A (Classical Centered Diploma): Alice Candidate, 2023, clean metadata
  const doc1 = await PDFDocument.create();
  const date1 = new Date();
  doc1.setTitle("Bachelor Degree");
  doc1.setAuthor("University Registrar");
  doc1.setProducer("University Registrar System");
  doc1.setCreator("SIS Batch Generator");
  doc1.setCreationDate(date1);
  doc1.setModificationDate(date1);
  const fontBold1 = await doc1.embedFont(StandardFonts.HelveticaBold);
  const fontReg1 = await doc1.embedFont(StandardFonts.Helvetica);
  const page1 = doc1.addPage([600, 400]);
  // Border frame
  page1.drawRectangle({ x: 30, y: 30, width: 540, height: 340, borderWidth: 3, borderColor: rgb(0.1, 0.2, 0.5) });
  // Centered Header
  page1.drawText("ACME UNIVERSITY", { x: 190, y: 330, size: 22, font: fontBold1, color: rgb(0.1, 0.2, 0.5) });
  page1.drawText("DIPLOMA OF GRADUATION", { x: 200, y: 300, size: 14, font: fontReg1, color: rgb(0.3, 0.3, 0.3) });
  // Gold Crest / Seal
  page1.drawCircle({ x: 300, y: 210, size: 36, color: rgb(0.85, 0.7, 0.2) });
  // Recipient details
  page1.drawText("Alice Candidate", { x: 230, y: 140, size: 18, font: fontBold1, color: rgb(0.1, 0.1, 0.1) });
  page1.drawText("Bachelor of Science in Computer Science", { x: 160, y: 110, size: 14, font: fontReg1, color: rgb(0.2, 0.2, 0.2) });
  page1.drawText("Conferred in the year 2023 with all honors.", { x: 175, y: 80, size: 12, font: fontReg1, color: rgb(0.3, 0.3, 0.3) });
  page1.drawText("Certificate: ACM-2023-9988", { x: 230, y: 55, size: 10, font: fontReg1, color: rgb(0.4, 0.4, 0.4) });
  const bytes1 = await doc1.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "clean-degree.pdf"), bytes1);

  // 2. Layout A Variant (Same Layout A template, different candidate "Bob Smith" and date "2024")
  const doc2 = await PDFDocument.create();
  const date2 = new Date();
  doc2.setTitle("Bachelor Degree");
  doc2.setAuthor("University Registrar");
  doc2.setProducer("University Registrar System");
  doc2.setCreator("SIS Batch Generator");
  doc2.setCreationDate(date2);
  doc2.setModificationDate(date2);
  const fontBold2 = await doc2.embedFont(StandardFonts.HelveticaBold);
  const fontReg2 = await doc2.embedFont(StandardFonts.Helvetica);
  const page2 = doc2.addPage([600, 400]);
  // Identical border frame & gold seal
  page2.drawRectangle({ x: 30, y: 30, width: 540, height: 340, borderWidth: 3, borderColor: rgb(0.1, 0.2, 0.5) });
  page2.drawText("ACME UNIVERSITY", { x: 190, y: 330, size: 22, font: fontBold2, color: rgb(0.1, 0.2, 0.5) });
  page2.drawText("DIPLOMA OF GRADUATION", { x: 200, y: 300, size: 14, font: fontReg2, color: rgb(0.3, 0.3, 0.3) });
  page2.drawCircle({ x: 300, y: 210, size: 36, color: rgb(0.85, 0.7, 0.2) });
  page2.drawText("Bob Smith", { x: 255, y: 140, size: 18, font: fontBold2, color: rgb(0.1, 0.1, 0.1) });
  page2.drawText("Bachelor of Arts in Economics", { x: 200, y: 110, size: 14, font: fontReg2, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText("Conferred in the year 2024 with all honors.", { x: 175, y: 80, size: 12, font: fontReg2, color: rgb(0.3, 0.3, 0.3) });
  page2.drawText("Certificate: ACM-2024-1102", { x: 230, y: 55, size: 10, font: fontReg2, color: rgb(0.4, 0.4, 0.4) });
  const bytes2 = await doc2.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "clean-degree-variant.pdf"), bytes2);

  // 3. Layout B (Modern Tech Certificate - Solid dark left sidebar banner, 2-column tabular layout)
  const doc3 = await PDFDocument.create();
  const date3 = new Date();
  doc3.setTitle("Tech Certificate");
  doc3.setProducer("Cloud Academy Platform");
  doc3.setCreator("Certificate Engine 3.0");
  doc3.setCreationDate(date3);
  doc3.setModificationDate(date3);
  const fontBold3 = await doc3.embedFont(StandardFonts.HelveticaBold);
  const fontReg3 = await doc3.embedFont(StandardFonts.Helvetica);
  const page3 = doc3.addPage([600, 400]);
  // Dark Navy Left Sidebar (0 to 180 x)
  page3.drawRectangle({ x: 0, y: 0, width: 180, height: 400, color: rgb(0.08, 0.14, 0.24) });
  page3.drawText("CLOUD", { x: 35, y: 320, size: 24, font: fontBold3, color: rgb(1, 1, 1) });
  page3.drawText("ACADEMY", { x: 35, y: 290, size: 20, font: fontBold3, color: rgb(0.2, 0.75, 0.95) });
  // Right Column Content
  page3.drawText("CERTIFICATE OF EXCELLENCE", { x: 210, y: 320, size: 18, font: fontBold3, color: rgb(0.15, 0.15, 0.15) });
  page3.drawText("This acknowledges that Charlie Davis", { x: 210, y: 270, size: 14, font: fontReg3, color: rgb(0.3, 0.3, 0.3) });
  page3.drawText("has successfully completed Cloud Solutions Architect Pro.", { x: 210, y: 240, size: 12, font: fontReg3, color: rgb(0.4, 0.4, 0.4) });
  page3.drawRectangle({ x: 210, y: 150, width: 350, height: 45, color: rgb(0.92, 0.96, 0.99) });
  page3.drawText("Credential ID: CLD-2024-ARCH", { x: 230, y: 168, size: 12, font: fontBold3, color: rgb(0.1, 0.4, 0.6) });
  const bytes3 = await doc3.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "tech-cert-layout-b.pdf"), bytes3);

  // 4. Mismatched PDF (Readable text with name 'John Doe' and year '2018')
  const doc4 = await PDFDocument.create();
  const date4 = new Date();
  doc4.setTitle("Bachelor Degree");
  doc4.setAuthor("University Registrar");
  doc4.setProducer("University Registrar System");
  doc4.setCreator("SIS Batch Generator");
  doc4.setCreationDate(date4);
  doc4.setModificationDate(date4);
  const fontBold4 = await doc4.embedFont(StandardFonts.HelveticaBold);
  const fontReg4 = await doc4.embedFont(StandardFonts.Helvetica);
  const page4 = doc4.addPage([600, 400]);
  page4.drawRectangle({ x: 30, y: 30, width: 540, height: 340, borderWidth: 3, borderColor: rgb(0.1, 0.2, 0.5) });
  page4.drawText("ACME UNIVERSITY", { x: 190, y: 330, size: 22, font: fontBold4, color: rgb(0.1, 0.2, 0.5) });
  page4.drawText("DIPLOMA OF GRADUATION", { x: 200, y: 300, size: 14, font: fontReg4, color: rgb(0.3, 0.3, 0.3) });
  page4.drawCircle({ x: 300, y: 210, size: 36, color: rgb(0.85, 0.7, 0.2) });
  page4.drawText("John Doe", { x: 260, y: 140, size: 18, font: fontBold4, color: rgb(0.1, 0.1, 0.1) });
  page4.drawText("Bachelor of Science in Mechanical Engineering", { x: 140, y: 110, size: 14, font: fontReg4, color: rgb(0.2, 0.2, 0.2) });
  page4.drawText("Conferred in the year 2018 with all honors.", { x: 175, y: 80, size: 12, font: fontReg4, color: rgb(0.3, 0.3, 0.3) });
  page4.drawText("Certificate: ACM-2018-4422", { x: 230, y: 55, size: 10, font: fontReg4, color: rgb(0.4, 0.4, 0.4) });
  const bytes4 = await doc4.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "mismatched-degree.pdf"), bytes4);

  // 5. Flagged PDF (Photoshop metadata, >24h mod gap)
  const doc5 = await PDFDocument.create();
  doc5.setTitle("Certificate of Completion");
  doc5.setProducer("Adobe Photoshop 2024 (Macintosh)");
  doc5.setCreator("Adobe Photoshop 2024 (Macintosh)");
  doc5.setCreationDate(new Date("2020-01-01T00:00:00Z"));
  doc5.setModificationDate(new Date("2024-05-01T18:00:00Z"));
  const fontBold5 = await doc5.embedFont(StandardFonts.HelveticaBold);
  const fontReg5 = await doc5.embedFont(StandardFonts.Helvetica);
  const page5 = doc5.addPage([600, 400]);
  page5.drawRectangle({ x: 30, y: 30, width: 540, height: 340, borderWidth: 3, borderColor: rgb(0.1, 0.2, 0.5) });
  page5.drawText("ACME UNIVERSITY", { x: 190, y: 330, size: 22, font: fontBold5, color: rgb(0.1, 0.2, 0.5) });
  page5.drawText("CERTIFICATE OF COMPLETION", { x: 175, y: 300, size: 14, font: fontReg5, color: rgb(0.3, 0.3, 0.3) });
  page5.drawText("Alice Candidate", { x: 230, y: 200, size: 18, font: fontBold5, color: rgb(0.1, 0.1, 0.1) });
  page5.drawText("Conferred in the year 2024 under faculty supervision.", { x: 140, y: 150, size: 12, font: fontReg5, color: rgb(0.3, 0.3, 0.3) });
  const bytes5 = await doc5.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "flagged-degree.pdf"), bytes5);

  // 6. Unreadable Scanned PDF (Vector graphics only, zero text)
  const doc6 = await PDFDocument.create();
  const date6 = new Date();
  doc6.setCreationDate(date6);
  doc6.setModificationDate(date6);
  const page6 = doc6.addPage([600, 400]);
  page6.drawRectangle({
    x: 50,
    y: 50,
    width: 500,
    height: 300,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 2,
    color: rgb(0.95, 0.95, 0.95),
  });
  page6.drawLine({
    start: { x: 70, y: 200 },
    end: { x: 530, y: 200 },
    thickness: 3,
    color: rgb(0.7, 0.7, 0.7),
  });
  const bytes6 = await doc6.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(dir, "unreadable-scanned.pdf"), bytes6);

  // 7. Fake PDF (Spoofed extension text file)
  fs.writeFileSync(path.join(dir, "fake-pdf.pdf"), "This is plain text with a .pdf extension.");

  console.log("All 7 fixtures generated successfully!");
}

main().catch(console.error);
