import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function generateFixtures() {
  const fixturesDir = path.resolve(process.cwd(), "test-fixtures");
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // 1. Clean PDF: Valid PDF with "Alice Candidate", year "2023", clean Producer, recent creation date
  const cleanDoc = await PDFDocument.create();
  const cleanDate = new Date(); // Created today
  cleanDoc.setTitle("Degree Certificate");
  cleanDoc.setSubject("Academic Credential");
  cleanDoc.setAuthor("University Registrar");
  cleanDoc.setProducer("University Registrar System");
  cleanDoc.setCreator("SIS Batch Generator");
  cleanDoc.setCreationDate(cleanDate);
  cleanDoc.setModificationDate(cleanDate);

  const font = await cleanDoc.embedFont(StandardFonts.Helvetica);
  const cleanPage = cleanDoc.addPage([600, 400]);
  cleanPage.drawText("Alice Candidate", { x: 50, y: 320, size: 24, font, color: rgb(0.1, 0.1, 0.1) });
  cleanPage.drawText("Acme University - Bachelor of Science in Computer Science", {
    x: 50,
    y: 270,
    size: 16,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  cleanPage.drawText("Conferred in the year 2023 with all honors and privileges.", {
    x: 50,
    y: 220,
    size: 14,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  cleanPage.drawText("Certificate: ACM-2023-9988", {
    x: 50,
    y: 170,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const cleanBytes = await cleanDoc.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(fixturesDir, "clean-degree.pdf"), cleanBytes);

  // 2. Flagged PDF: Valid PDF with Photoshop producer metadata, ModDate gap (>24h), and wrong year (2018 instead of declared 2024)
  const flaggedDoc = await PDFDocument.create();
  flaggedDoc.setTitle("Certificate of Completion");
  flaggedDoc.setSubject("Academic Credential");
  flaggedDoc.setAuthor("Faculty Committee");
  flaggedDoc.setProducer("Adobe Photoshop 2024 (Macintosh)");
  flaggedDoc.setCreator("Adobe Photoshop 2024 (Macintosh)");
  flaggedDoc.setCreationDate(new Date("2020-01-01T00:00:00Z")); // 6 years ago
  flaggedDoc.setModificationDate(new Date("2024-05-01T18:00:00Z")); // Gap > 4 years!

  const flaggedFont = await flaggedDoc.embedFont(StandardFonts.Helvetica);
  const flaggedPage = flaggedDoc.addPage([600, 400]);
  flaggedPage.drawText("Alice Candidate", { x: 50, y: 320, size: 24, font: flaggedFont, color: rgb(0.1, 0.1, 0.1) });
  flaggedPage.drawText("Acme University - Certificate of Completion", {
    x: 50,
    y: 270,
    size: 16,
    font: flaggedFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  flaggedPage.drawText("Completed in the year 2018 under faculty supervision.", {
    x: 50,
    y: 220,
    size: 14,
    font: flaggedFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  const flaggedBytes = await flaggedDoc.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(fixturesDir, "flagged-degree.pdf"), flaggedBytes);

  // 3. Fake PDF: Text file pretending to be a PDF
  const fakePdfContent = "This is simply plain text and definitely not a valid PDF file binary.";
  fs.writeFileSync(path.join(fixturesDir, "fake-pdf.pdf"), fakePdfContent);

  console.log("Fixtures generated successfully.");
}

generateFixtures().catch(console.error);
