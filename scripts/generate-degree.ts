import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function generateDegree(recipientName: string, outFilename: string = "clean-degree.pdf", options: {
  institution?: string;
  degree?: string;
  year?: string;
  certNumber?: string;
} = {}) {
  const institution = options.institution || "ACME UNIVERSITY";
  const degree = options.degree || "Bachelor of Science in Computer Science";
  const year = options.year || "2023";
  const certNumber = options.certNumber || "ACM-2023-9988";

  const dir = path.resolve(process.cwd(), "test-fixtures");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const doc = await PDFDocument.create();
  const date = new Date();
  doc.setTitle("Bachelor Degree");
  doc.setAuthor("University Registrar");
  doc.setProducer("University Registrar System");
  doc.setCreator("SIS Batch Generator");
  doc.setCreationDate(date);
  doc.setModificationDate(date);

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 400]);

  // Border frame
  page.drawRectangle({
    x: 30,
    y: 30,
    width: 540,
    height: 340,
    borderWidth: 3,
    borderColor: rgb(0.1, 0.2, 0.5),
  });

  // Centered Header
  const instWidth = fontBold.widthOfTextAtSize(institution, 22);
  page.drawText(institution, {
    x: (600 - instWidth) / 2,
    y: 330,
    size: 22,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.5),
  });

  const subHeader = "DIPLOMA OF GRADUATION";
  const subWidth = fontReg.widthOfTextAtSize(subHeader, 14);
  page.drawText(subHeader, {
    x: (600 - subWidth) / 2,
    y: 300,
    size: 14,
    font: fontReg,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Gold Crest / Seal
  page.drawCircle({ x: 300, y: 210, size: 36, color: rgb(0.85, 0.7, 0.2) });

  // Recipient Name (Centered)
  const nameWidth = fontBold.widthOfTextAtSize(recipientName, 18);
  page.drawText(recipientName, {
    x: (600 - nameWidth) / 2,
    y: 140,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Degree Title (Centered)
  const degWidth = fontReg.widthOfTextAtSize(degree, 14);
  page.drawText(degree, {
    x: (600 - degWidth) / 2,
    y: 110,
    size: 14,
    font: fontReg,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Conferred year text (Centered)
  const confText = `Conferred in the year ${year} with all honors.`;
  const confWidth = fontReg.widthOfTextAtSize(confText, 12);
  page.drawText(confText, {
    x: (600 - confWidth) / 2,
    y: 80,
    size: 12,
    font: fontReg,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Certificate ID (Centered)
  const certText = `Certificate: ${certNumber}`;
  const certWidth = fontReg.widthOfTextAtSize(certText, 10);
  page.drawText(certText, {
    x: (600 - certWidth) / 2,
    y: 55,
    size: 10,
    font: fontReg,
    color: rgb(0.4, 0.4, 0.4),
  });

  const bytes = await doc.save({ useObjectStreams: false });
  const outPath = path.join(dir, outFilename);
  fs.writeFileSync(outPath, bytes);
  console.log(`Generated diploma PDF for "${recipientName}" at: ${outPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const name = args[0] || "Alex Rivera";
  const filename = args[1] || "clean-degree.pdf";

  await generateDegree(name, filename);
}

main().catch((err) => {
  console.error("Error generating degree:", err);
  process.exit(1);
});
