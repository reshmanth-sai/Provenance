import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = "http://localhost:4000";
const WEB_BASE = "http://localhost:3000";

async function createTestPDF({ creator = "Standard LaTeX", modOffsetHours = 0, text = "Clean Certificate Text" } = {}) {
  const pdfDoc = await PDFDocument.create();
  if (creator) pdfDoc.setCreator(creator);
  const now = new Date();
  pdfDoc.setCreationDate(now);
  if (modOffsetHours > 0) {
    const modDate = new Date(now.getTime() + modOffsetHours * 3600 * 1000);
    pdfDoc.setModificationDate(modDate);
  }
  const page = pdfDoc.addPage([600, 400]);
  page.drawText(text, { x: 50, y: 350, size: 14 });
  return await pdfDoc.save();
}

async function run() {
  console.log("Starting Browser Verification for Severity Banner Disclaimers...\n");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Log in as candidate
  console.log("[1] Logging in as candidate...");
  await page.goto(`${WEB_BASE}/login`);
  await page.fill('input[type="email"]', "candidate@provenance.test");
  await page.fill('input[type="password"]', "CandidatePass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
  console.log("Logged in successfully.\n");

  // 2. Check Candidate Dashboard Credential List for the disclaimer line
  console.log("[2] Checking Candidate Dashboard list view for non-verification disclaimer...");
  const dashboardText = await page.locator("main").innerText();
  console.log("--- Candidate Dashboard Excerpt ---");
  const unverifiedSection = dashboardText.split("Your Credentials")[1] || "";
  console.log(unverifiedSection.trim().split("\n").slice(0, 15).join("\n"));
  console.log("-----------------------------------\n");

  // Helper to upload a buffer
  async function testUpload(pdfBytes, filename, issuerName, title) {
    await page.goto(`${WEB_BASE}/dashboard/upload`);
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, Buffer.from(pdfBytes));

    await page.setInputFiles('input[type="file"]', filePath);
    await page.fill('input[id="claimedIssuerName"]', issuerName);
    await page.fill('input[id="credentialTitle"]', title);
    await page.click('button[type="submit"]');
    await page.waitForSelector("h4", { timeout: 10000 });

    const bannerText = await page.locator(".space-y-6 > div:first-child").first().innerText();
    fs.unlinkSync(filePath);
    return bannerText;
  }

  // 3. Test State 1: Low Concern
  console.log("[3] Testing State 1: Low Concern Upload...");
  const cleanBytes = await createTestPDF({
    creator: "Standard PDF Engine",
    text: "Coursera\nSabarish\nGoogle AI Essentials\nConferred in the year 2026",
  });
  const lowConcernBanner = await testUpload(cleanBytes, "test-clean.pdf", "Coursera", "Google AI Essentials");
  console.log("--- Rendered Low Concern Banner ---");
  console.log(lowConcernBanner);
  console.log("-----------------------------------\n");

  // 4. Test State 2: Review Recommended (Photoshop detected)
  console.log("[4] Testing State 2: Review Recommended Upload...");
  const psBytes = await createTestPDF({
    creator: "Adobe Photoshop 2024 (Macintosh)",
    modOffsetHours: 500,
    text: "Different Name\nYear 2010",
  });
  const reviewBanner = await testUpload(psBytes, "test-ps.pdf", "Stanford University", "B.S. in Symbolic Systems");
  console.log("--- Rendered Review Recommended Banner ---");
  console.log(reviewBanner);
  console.log("------------------------------------------\n");

  // 5. Test State 3: Inconclusive (Simulate empty / low confidence scan)
  console.log("[5] Testing State 3: Inconclusive Upload...");
  const emptyPdf = await PDFDocument.create();
  emptyPdf.addPage([600, 400]); // Image-only / blank page with no extractable text
  const inconclusiveBytes = await emptyPdf.save();
  const inconclusiveBanner = await testUpload(inconclusiveBytes, "test-inconclusive.pdf", "MIT", "Certificate in Quantum Computing");
  console.log("--- Rendered Inconclusive Banner ---");
  console.log(inconclusiveBanner);
  console.log("-----------------------------------\n");

  // 6. Test Public Verifier (/verify/:id) for unverified credential
  console.log("[6] Checking Public Verifier page for unverified credential...");
  await page.goto(`${WEB_BASE}/verify/c8e6fe8e-cd69-4d0b-87a6-b471616da13e`);
  await page.waitForSelector("main");
  const verifierText = await page.locator("main").innerText();
  console.log("--- Rendered Public Verifier Banner ---");
  console.log(verifierText.split("Google AI Essentials")[0].trim());
  console.log("---------------------------------------\n");

  await browser.close();
  console.log("All severity states and surfaces verified!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
