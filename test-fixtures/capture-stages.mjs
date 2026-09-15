import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const WEB_BASE = "http://localhost:3000";
const ARTIFACTS_DIR = "/Users/sai/.gemini/antigravity-ide/brain/e79ea5c6-e34e-4f16-8b4f-e4e692bc91b5";

async function main() {
  console.log("================================================================================");
  console.log("CAPTURING FULL-STAGE HIGH-RES SCREENSHOTS FOR LIVE WEBSITE DEMO");
  console.log("================================================================================\n");

  const browser = await chromium.launch({ headless: true });

  // ---------------------------------------------------------------------------
  // STAGE 1: Landing Page & Public Verification
  // ---------------------------------------------------------------------------
  console.log("Capturing Stage 1: Landing Page...");
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page1.goto(`${WEB_BASE}/`);
  await page1.waitForSelector("header");
  await page1.screenshot({ path: path.join(ARTIFACTS_DIR, "stage1_landing_page.png"), fullPage: false });
  await page1.close();

  // ---------------------------------------------------------------------------
  // STAGE 2: Candidate Login & Dashboard
  // ---------------------------------------------------------------------------
  console.log("Capturing Stage 2: Candidate Dashboard & Credentials...");
  const candidateCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await candidateCtx.newPage();
  await page2.goto(`${WEB_BASE}/login`);
  await page2.fill('input[type="email"]', "candidate@provenance.test");
  await page2.fill('input[type="password"]', "CandidatePass123!");
  await page2.click('button[type="submit"]');
  await page2.waitForURL("**/dashboard");
  await page2.waitForSelector("h1, h2");
  await page2.screenshot({ path: path.join(ARTIFACTS_DIR, "stage2_candidate_dashboard.png"), fullPage: true });

  // ---------------------------------------------------------------------------
  // STAGE 3: Document Upload Interface
  // ---------------------------------------------------------------------------
  console.log("Capturing Stage 3: Document Upload Interface...");
  await page2.goto(`${WEB_BASE}/dashboard/upload`);
  await page2.waitForSelector("form");
  await page2.screenshot({ path: path.join(ARTIFACTS_DIR, "stage3_upload_interface.png"), fullPage: true });

  // ---------------------------------------------------------------------------
  // STAGE 4: Deterministic Analysis Results (Low Concern Clean Diploma)
  // ---------------------------------------------------------------------------
  console.log("Capturing Stage 4: Deterministic Analysis Signals (Clean Degree)...");
  const cleanPdf = path.resolve("test-fixtures/clean-degree.pdf");
  await page2.setInputFiles('input[type="file"]', cleanPdf);
  await page2.fill('input[name="claimedIssuerName"]', "Acme University");
  await page2.selectOption('select[name="credentialType"]', "degree");
  await page2.fill('input[name="credentialTitle"]', "Bachelor of Science in Computer Science");
  await page2.fill('input[name="certificateNumber"]', "ACM-2021-CS-101");
  await page2.click('button[type="submit"]');
  await page2.waitForSelector("text=Deterministic Signal Inspection", { timeout: 15000 });
  await page2.screenshot({ path: path.join(ARTIFACTS_DIR, "stage4_analysis_clean_degree.png"), fullPage: true });

  // Dispatch verification request for this document
  const reqBtn = page2.locator('button:has-text("Request Verification")');
  if (await reqBtn.isVisible()) {
    await reqBtn.click();
    await page2.waitForSelector('text=Verification Requested', { timeout: 10000 });
  }

  // ---------------------------------------------------------------------------
  // STAGE 5: Coursera Connector & OCR Reconstruction Mismatch Signal
  // ---------------------------------------------------------------------------
  console.log("Capturing Stage 5: Coursera Connector Name Mismatch & OCR Reconstruction...");
  await page2.goto(`${WEB_BASE}/dashboard/upload`);
  await page2.waitForSelector("form");
  const courseraPng = path.resolve("test-fixtures/coursera-google-ai-tampered.png");
  await page2.setInputFiles('input[type="file"]', courseraPng);
  await page2.fill('input[name="claimedIssuerName"]', "Coursera");
  await page2.selectOption('select[name="credentialType"]', "certificate");
  await page2.fill('input[name="credentialTitle"]', "Google AI Essentials");
  // Certificate number intentionally left empty to trigger OCR reconstruction
  await page2.click('button[type="submit"]');
  await page2.waitForSelector("text=ISSUER LOOKUP", { timeout: 20000 });
  await page2.screenshot({ path: path.join(ARTIFACTS_DIR, "stage5_coursera_ocr_reconstruction.png"), fullPage: true });

  await candidateCtx.close();

  // ---------------------------------------------------------------------------
  // STAGE 6: Issuer Staff Queue
  // ---------------------------------------------------------------------------
  console.log("Capturing Stage 6: Issuer Verification Queue...");
  const issuerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page3 = await issuerCtx.newPage();
  await page3.goto(`${WEB_BASE}/login`);
  await page3.fill('input[type="email"]', "issuer@provenance.test");
  await page3.fill('input[type="password"]', "IssuerPass123!");
  await page3.click('button[type="submit"]');
  await page3.waitForURL("**/issuer/**");

  await page3.goto(`${WEB_BASE}/issuer/queue`);
  await page3.waitForSelector('text=Verification Request Queue');
  await page3.screenshot({ path: path.join(ARTIFACTS_DIR, "stage6_issuer_queue.png"), fullPage: true });

  // ---------------------------------------------------------------------------
  // STAGE 7: Issuer Request Review Drawer & Attestation Decision
  // ---------------------------------------------------------------------------
  console.log("Capturing Stage 7: Issuer Review Drawer & Attestation Decision...");
  const reviewLink = page3.locator('a:has-text("Review Request")').first();
  await reviewLink.click();
  await page3.waitForSelector('text=Deterministic Analysis Signals');
  await page3.screenshot({ path: path.join(ARTIFACTS_DIR, "stage7_issuer_review_drawer.png"), fullPage: true });

  // Approve credential
  page3.on("dialog", async (dialog) => {
    await dialog.accept();
  });
  const approveBtn = page3.locator('button:has-text("Approve & Append to Chain")');
  if (await approveBtn.isVisible()) {
    await approveBtn.click();
    await page3.waitForSelector('text=Verification Recorded to Cryptographic Ledger', { timeout: 15000 });
    await page3.screenshot({ path: path.join(ARTIFACTS_DIR, "stage7_issuer_approved_ledger.png"), fullPage: true });
  }

  // ---------------------------------------------------------------------------
  // STAGE 8: Public Verifier Ledger Page
  // ---------------------------------------------------------------------------
  console.log("Capturing Stage 8: Public Verifier Proof Page...");
  const page4 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page4.goto(`${WEB_BASE}/verify/cred-alex-cs-verified`);
  await page4.waitForSelector("h1, h2");
  await page4.screenshot({ path: path.join(ARTIFACTS_DIR, "stage8_public_verifier_proof.png"), fullPage: true });
  await page4.close();

  await issuerCtx.close();
  await browser.close();

  console.log("\n================================================================================");
  console.log("ALL STAGE SCREENSHOTS CAPTURED SUCCESSFULLY IN ARTIFACTS DIR");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
