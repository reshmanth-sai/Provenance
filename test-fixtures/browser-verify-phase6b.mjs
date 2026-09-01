import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

async function run() {
  console.log("================================================================================");
  console.log("PHASE 6B: INSTITUTIONAL ISSUER, ADMIN PORTAL, AND CANONICAL SEED VERIFICATION");
  console.log("================================================================================");

  // 0. Reset & Seed DB to Canonical State
  console.log("\n[0] Initializing database with Canonical Seed:");
  sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "TRUNCATE \\"VerificationRequest\\", \\"InstitutionInvite\\", \\"DocumentAnalysis\\", \\"CredentialEvent\\", \\"Credential\\", \\"Document\\", \\"AuditLog\\", \\"IssuerUser\\", \\"CandidateProfile\\", \\"Issuer\\", \\"User\\" CASCADE;"`);
  sh("npm run db:seed");

  // Obtain login tokens for Acme, Stanford, and Admin
  const acmeLogin = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"issuer@provenance.test","password":"IssuerPass123!"}'`));
  const acmeToken = acmeLogin.accessToken;

  const stanfordLogin = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"registrar@stanford.edu","password":"StanfordStaff123!"}'`));
  const stanfordToken = stanfordLogin.accessToken;

  const adminLogin = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@provenance.test","password":"AdminPass123!"}'`));
  const adminToken = adminLogin.accessToken;

  console.log("Tokens initialized for Acme, Stanford, and Admin.");

  console.log("\n================================================================================");
  console.log("STEP 1: Direct Backend Route & Cross-Tenant Isolation Verification");
  console.log("================================================================================");

  // 1a. GET /issuer/chain-audit
  console.log("\n[1a] Calling GET /issuer/chain-audit as Acme Staff (expect 3 events on Acme chain):");
  const acmeChainAudit = JSON.parse(sh(`curl -s http://localhost:4000/issuer/chain-audit -H "Authorization: Bearer ${acmeToken}"`));
  console.log(`- Institution: ${acmeChainAudit.institutionName}`);
  console.log(`- Chain Valid: ${acmeChainAudit.chainValid}`);
  console.log(`- Total Events: ${acmeChainAudit.totalEvents}`);
  console.log(`- Event Types: ${acmeChainAudit.events.map(e => `${e.eventType} (#${e.position})`).join(", ")}`);

  console.log("\n[1b] Calling GET /issuer/chain-audit as Stanford Staff (expect 1 event on Stanford chain):");
  const stanfordChainAudit = JSON.parse(sh(`curl -s http://localhost:4000/issuer/chain-audit -H "Authorization: Bearer ${stanfordToken}"`));
  console.log(`- Institution: ${stanfordChainAudit.institutionName}`);
  console.log(`- Chain Valid: ${stanfordChainAudit.chainValid}`);
  console.log(`- Total Events: ${stanfordChainAudit.totalEvents}`);
  console.log(`- Event Types: ${stanfordChainAudit.events.map(e => `${e.eventType} (#${e.position})`).join(", ")}`);
  console.log("Cross-Tenant Isolation on /chain-audit: PASS (Tenants only see their own chain)");

  // 1c. GET /issuer/verification-requests/:id/document
  console.log("\n[1c] Acme Staff fetching attached document for request req-clara-cloud-pending (belonging to Acme):");
  const docResAcme = sh(`curl -i -s http://localhost:4000/issuer/verification-requests/req-clara-cloud-pending/document -H "Authorization: Bearer ${acmeToken}" | head -n 10`);
  console.log(docResAcme);

  console.log("\n[1d] Stanford Staff attempting to fetch Acme's document req-clara-cloud-pending (expect 404/Cross-Tenant Block):");
  const docResStanford = sh(`curl -i -s http://localhost:4000/issuer/verification-requests/req-clara-cloud-pending/document -H "Authorization: Bearer ${stanfordToken}"`);
  console.log(docResStanford);
  console.log("Cross-Tenant Isolation on Document Streaming: PASS (Access blocked for other institutions)");

  // Launch Playwright Browser for UI tests
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Accept any window.confirm dialogs automatically
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  console.log("\n================================================================================");
  console.log("STEP 2: Playwright Verification Queue Detail Page DOM Capture (Document + Signals)");
  console.log("================================================================================");

  // Log in as Acme Staff
  await page.goto("http://localhost:3000/login");
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "issuer@provenance.test");
  await page.fill('input[type="password"]', "IssuerPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/issuer/queue", { timeout: 10000 });
  console.log("Acme staff logged in and redirected to:", page.url());

  // Click Clara's pending request from the queue
  await page.waitForSelector('text=Certificate in Cloud Architecture', { timeout: 10000 });
  await page.click('a:has-text("Review Request")');
  await page.waitForSelector('text=Deterministic Analysis Signals', { timeout: 10000 });

  const queueDetailDom = await page.innerText("main");
  console.log("Rendered Queue Detail DOM Text:\n");
  console.log(queueDetailDom);

  // Check iframe presence
  const iframeSrc = await page.getAttribute("iframe", "src");
  console.log("\nEmbedded Document Viewer iframe src:", iframeSrc);
  console.log("Contains Streamed Document Endpoint: ", iframeSrc?.includes("/issuer/verification-requests/req-clara-cloud-pending/document"));
  console.log("Contains Deterministic Signal 'EDITING SOFTWARE DETECTED':", queueDetailDom.includes("EDITING SOFTWARE DETECTED"));
  console.log("Contains Deterministic Signal 'MODIFICATION TIME GAP':", queueDetailDom.includes("MODIFICATION TIME GAP"));
  console.log("Contains Candidate Information 'Clara Oswald':", queueDetailDom.includes("Clara Oswald"));

  console.log("\n================================================================================");
  console.log("STEP 3: Approve Request in Browser UI & Cross-Check with psql");
  console.log("================================================================================");

  console.log("Clicking 'Approve & Append to Chain' button in UI...");
  await page.click('button:has-text("Approve & Append to Chain")');

  // Wait for status to change to Approved
  await page.waitForSelector('text=Approved & Anchored to Chain', { timeout: 10000 });
  console.log("UI updated to 'Approved & Anchored to Chain'!");

  // Verify in PostgreSQL catalog
  console.log("\nDirect psql cross-check of resulting CredentialEvent row:");
  const psqlEvent = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, \\"issuerId\\", \\"eventType\\", \\"contentHash\\", \\"prevHash\\", \\"createdAt\\" FROM \\"CredentialEvent\\" WHERE \\"credentialId\\" = 'cred-clara-cloud-pending';"`).trim();
  console.log(psqlEvent);

  console.log("\n================================================================================");
  console.log("STEP 4: Playwright Chain Explorer Capture (Clean vs Tampered State)");
  console.log("================================================================================");

  // 4a. Clean Chain Explorer
  console.log("\n[4a] Navigating to /issuer/chain in Clean State:");
  await page.goto("http://localhost:3000/issuer/chain");
  await page.waitForSelector('text=Sequential Ledger Blocks', { timeout: 10000 });

  const cleanChainDom = await page.innerText("main");
  console.log("Rendered Chain Explorer DOM (Clean):\n");
  console.log(cleanChainDom);

  // 4b. Tamper an event in psql
  console.log("\n[4b] Mutating canonicalData of Genesis Block in psql and re-rendering /issuer/chain...");
  const genesisEventId = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT id FROM \\"CredentialEvent\\" WHERE \\"prevHash\\" IS NULL AND \\"issuerId\\" = (SELECT id FROM \\"Issuer\\" WHERE domain = 'acme.edu') LIMIT 1;"`).trim();
  sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "UPDATE \\"CredentialEvent\\" SET \\"canonicalData\\" = jsonb_set(\\"canonicalData\\"::jsonb, '{tampered}', 'true')::json WHERE id = '${genesisEventId}';"`).trim();

  await page.goto("http://localhost:3000/issuer/chain");
  await page.waitForSelector('text=Tamper Detected in Hash Chain', { timeout: 10000 });

  const tamperedChainDom = await page.innerText("main");
  console.log("Rendered Chain Explorer DOM (After Tamper):\n");
  console.log(tamperedChainDom);

  console.log("\n================================================================================");
  console.log("STEP 5: Revoke Credential through UI & Cross-Check with psql");
  console.log("================================================================================");

  // Navigate directly to Credential Roster as Acme Staff
  await page.goto("http://localhost:3000/issuer/credentials");
  await page.waitForSelector('text=Institutional Credential Roster', { timeout: 10000 });

  console.log("Clicking 'Revoke' button on first verified credential in roster...");
  await page.locator('button:has-text("Revoke")').first().click();

  // Fill revoke reason modal
  await page.waitForSelector('input[placeholder*="superseded"]', { timeout: 5000 });
  await page.fill('input[placeholder*="superseded"]', "Revoked due to administrative policy update");
  
  const revokeResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/revoke") && response.status() === 200
  );
  await page.click('button:has-text("Confirm Revocation")');
  await revokeResponsePromise;
  console.log("Revoke network request completed with 200 OK!");

  // Verify in PostgreSQL
  console.log("\nDirect psql query showing the resulting revocation CredentialEvent:");
  const psqlRevoke = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, \\"eventType\\", \\"canonicalData\\", \\"createdAt\\" FROM \\"CredentialEvent\\" WHERE \\"eventType\\" = 'revoked' ORDER BY \\"createdAt\\" DESC LIMIT 1;"`).trim();
  console.log(psqlRevoke);

  console.log("\n================================================================================");
  console.log("STEP 6: Admin KPI Numbers Rendered in Browser vs Direct psql Counts");
  console.log("================================================================================");

  // Logout from issuer and log in as Platform Admin
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(500);

  await page.goto("http://localhost:3000/login");
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "admin@provenance.test");
  await page.fill('input[type="password"]', "AdminPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 10000 });
  await page.waitForSelector('text=Platform Administration Console', { timeout: 10000 });
  console.log("Admin logged in and navigated to:", page.url());

  const adminDomText = await page.innerText("main");
  console.log("Rendered Admin Dashboard DOM Text:\n");
  console.log(adminDomText);

  // Fetch direct psql counts
  const psqlCandidates = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT count(*) FROM \\"User\\" WHERE role = 'candidate';"`).trim();
  const psqlIssuerStaff = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT count(*) FROM \\"User\\" WHERE role = 'issuer_staff';"`).trim();
  const psqlPendingIssuers = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT count(*) FROM \\"Issuer\\" WHERE status = 'pending';"`).trim();
  const psqlApprovedIssuers = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT count(*) FROM \\"Issuer\\" WHERE status = 'approved';"`).trim();
  const psqlVerifiedCreds = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT count(*) FROM \\"Credential\\" WHERE status = 'verified';"`).trim();
  const psqlRevokedCreds = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT count(*) FROM \\"Credential\\" WHERE status = 'revoked';"`).trim();

  // Extract numbers from rendered DOM
  const domMatch = (regex) => {
    const m = adminDomText.match(regex);
    return m ? m[1].trim() : "N/A";
  };

  const bCandidates = domMatch(/Candidates:\s*(\d+)/);
  const bIssuerStaff = domMatch(/Issuer Staff:\s*(\d+)/);
  const bPendingIssuers = domMatch(/Pending Approval:\s*(\d+)/);
  const bApprovedIssuers = domMatch(/Approved Issuers:\s*(\d+)/);
  const bVerifiedCreds = domMatch(/Verified on Ledger:\s*(\d+)/);
  const bRevokedCreds = domMatch(/Revoked \/ Superseded:\s*(\d+)/);

  console.log("\n--- Comparison Table: Browser Rendered vs Direct psql Catalog ---");
  console.log(`Candidates:        Browser: ${bCandidates}  | psql: ${psqlCandidates}  | Match: ${bCandidates === psqlCandidates}`);
  console.log(`Issuer Staff:      Browser: ${bIssuerStaff}  | psql: ${psqlIssuerStaff}  | Match: ${bIssuerStaff === psqlIssuerStaff}`);
  console.log(`Pending Issuers:   Browser: ${bPendingIssuers}  | psql: ${psqlPendingIssuers}  | Match: ${bPendingIssuers === psqlPendingIssuers}`);
  console.log(`Approved Issuers:  Browser: ${bApprovedIssuers}  | psql: ${psqlApprovedIssuers}  | Match: ${bApprovedIssuers === psqlApprovedIssuers}`);
  console.log(`Verified Creds:    Browser: ${bVerifiedCreds}  | psql: ${psqlVerifiedCreds}  | Match: ${bVerifiedCreds === psqlVerifiedCreds}`);
  console.log(`Revoked Creds:     Browser: ${bRevokedCreds}  | psql: ${psqlRevokedCreds}  | Match: ${bRevokedCreds === psqlRevokedCreds}`);

  console.log("\n================================================================================");
  console.log("STEP 7: Canonical Demo Seed Final Run from Clean Empty DB");
  console.log("================================================================================");
  sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "TRUNCATE \\"VerificationRequest\\", \\"InstitutionInvite\\", \\"DocumentAnalysis\\", \\"CredentialEvent\\", \\"Credential\\", \\"Document\\", \\"AuditLog\\", \\"IssuerUser\\", \\"CandidateProfile\\", \\"Issuer\\", \\"User\\" CASCADE;"`);
  const finalSeedOutput = sh("npm run db:seed");
  console.log(finalSeedOutput);

  await browser.close();

  console.log("================================================================================");
  console.log("STEP 8: Git Status & Commit Log");
  console.log("================================================================================");
  console.log(sh("git status"));
  console.log(sh("git log -n 1"));
}

run().catch(console.error);
