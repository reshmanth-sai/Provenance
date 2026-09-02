import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const API_BASE = "http://localhost:4000";
const WEB_BASE = "http://localhost:3000";

async function main() {
  console.log("================================================================================");
  console.log("DEMO WORKFLOW: Candidate Upload -> Verification Request -> Issuer Approval");
  console.log("================================================================================\n");

  const browser = await chromium.launch({ headless: true });

  // ---------------------------------------------------------------------------
  // CANDIDATE WORKFLOW
  // ---------------------------------------------------------------------------
  const candidateContext = await browser.newContext();
  const candidatePage = await candidateContext.newPage();

  console.log("1. Candidate: Signing in as Alex Rivera (candidate@provenance.test)...");
  await candidatePage.goto(`${WEB_BASE}/login`);
  await candidatePage.fill('input[type="email"]', "candidate@provenance.test");
  await candidatePage.fill('input[type="password"]', "CandidatePass123!");
  await candidatePage.click('button[type="submit"]');
  await candidatePage.waitForURL("**/dashboard");
  console.log("   -> Candidate signed in successfully.");

  console.log("2. Candidate: Navigating to Upload page...");
  await candidatePage.goto(`${WEB_BASE}/dashboard/upload`);
  await candidatePage.waitForSelector("form");

  const pdfPath = path.resolve("test-fixtures/clean-degree.pdf");
  console.log(`3. Candidate: Uploading file: ${pdfPath}...`);
  await candidatePage.setInputFiles('input[type="file"]', pdfPath);
  await candidatePage.fill('input[name="claimedIssuerName"]', "Acme University");
  await candidatePage.selectOption('select[name="credentialType"]', "degree");
  await candidatePage.fill('input[name="credentialTitle"]', "Bachelor of Science in Computer Science");
  await candidatePage.fill('input[name="certificateNumber"]', "ACM-2021-CS-101");
  await candidatePage.fill('input[name="issueDate"]', "2021-06-15");

  console.log("4. Candidate: Submitting for deterministic analysis...");
  await candidatePage.click('button[type="submit"]');

  await candidatePage.waitForSelector("text=Deterministic Signal Inspection", { timeout: 20000 });
  console.log("   -> Analysis complete! Extracted signals and disclaimers displayed.");

  console.log("5. Candidate: Requesting institutional attestation from Acme University...");
  const requestBtn = candidatePage.locator('button:has-text("Request Verification")');
  await requestBtn.waitFor({ state: "visible", timeout: 5000 });
  await requestBtn.click();
  
  await candidatePage.waitForSelector('text=Verification Requested', { timeout: 10000 });
  console.log("   -> Verification request created and dispatched to Acme University.");

  const candidateScreenshot = path.resolve("candidate_upload_success.png");
  await candidatePage.screenshot({ path: candidateScreenshot, fullPage: true });
  console.log(`   -> Captured candidate screenshot: ${candidateScreenshot}`);

  await candidateContext.close();

  // ---------------------------------------------------------------------------
  // ISSUER STAFF WORKFLOW
  // ---------------------------------------------------------------------------
  const issuerContext = await browser.newContext();
  const issuerPage = await issuerContext.newPage();

  // Accept confirmation dialogs automatically
  issuerPage.on("dialog", async (dialog) => {
    console.log(`   -> Browser Dialog: "${dialog.message()}" -> Accepting`);
    await dialog.accept();
  });

  console.log("\n6. Issuer: Signing in as Acme University Staff (issuer@provenance.test)...");
  await issuerPage.goto(`${WEB_BASE}/login`);
  await issuerPage.fill('input[type="email"]', "issuer@provenance.test");
  await issuerPage.fill('input[type="password"]', "IssuerPass123!");
  await issuerPage.click('button[type="submit"]');
  await issuerPage.waitForURL("**/issuer/**");
  console.log("   -> Issuer signed in successfully.");

  console.log("7. Issuer: Opening verification queue...");
  await issuerPage.goto(`${WEB_BASE}/issuer/queue`);
  await issuerPage.waitForSelector('text=Verification Request Queue', { timeout: 10000 });
  
  const reviewLink = issuerPage.locator('a:has-text("Review Request")').first();
  await reviewLink.waitFor({ state: "visible", timeout: 5000 });
  await reviewLink.click();

  await issuerPage.waitForSelector('text=Deterministic Analysis Signals', { timeout: 10000 });
  console.log("   -> Opened verification review drawer. Document stream and signal checks loaded.");

  console.log("8. Issuer: Approving credential onto Acme University hash chain...");
  const approveButton = issuerPage.locator('button:has-text("Approve & Append to Chain")');
  await approveButton.waitFor({ state: "visible", timeout: 5000 });
  await approveButton.click();

  await issuerPage.waitForSelector('text=Verification Recorded to Cryptographic Ledger', { timeout: 15000 });
  console.log("   -> Credential approved! Cryptographic block appended to hash chain.");

  const issuerScreenshot = path.resolve("issuer_review_approved.png");
  await issuerPage.screenshot({ path: issuerScreenshot, fullPage: true });
  console.log(`   -> Captured issuer approval screenshot: ${issuerScreenshot}`);

  await issuerContext.close();
  await browser.close();

  console.log("\n================================================================================");
  console.log("DEMO WORKFLOW COMPLETED SUCCESSFULLY!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Workflow failed:", err);
  process.exit(1);
});
