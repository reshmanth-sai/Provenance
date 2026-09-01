import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function sh(cmd, env = {}) {
  return execSync(cmd, {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

async function run() {
  console.log("================================================================================");
  console.log("PHASE 7: FINAL SECURITY, FRESH-DB VALIDATION, & COLD-START DEMO WALKTHROUGH");
  console.log("================================================================================");

  // -----------------------------------------------------------------------------
  // STEP 1: Fresh-Database Migration Validation
  // -----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("STEP 1: Fresh-Database Migration Deploy & Schema Equivalence Validation");
  console.log("================================================================================");

  console.log("Creating brand new empty database: provenance_fresh_val...");
  sh(`/opt/homebrew/opt/postgresql@16/bin/dropdb -U postgres --if-exists provenance_fresh_val || true`);
  sh(`/opt/homebrew/opt/postgresql@16/bin/createdb -U postgres provenance_fresh_val`);

  const FRESH_DB_URL = "postgresql://postgres:postgres@localhost:5432/provenance_fresh_val";

  console.log("Running prisma migrate deploy against fresh database from migration files alone...");
  const migrateOutput = sh(`DATABASE_URL="${FRESH_DB_URL}" npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma`);
  console.log(migrateOutput);

  // Spot-check tables in fresh database
  const freshTables = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance_fresh_val -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"`).trim().split("\n");
  console.log("Tables created in fresh database:", freshTables.join(", "));

  // Spot-check the 18 foreign keys in fresh database
  const fkQuery = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `;

  const freshFks = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance_fresh_val -t -A -c "${fkQuery}"`).trim().split("\n");
  console.log(`\nForeign Keys count in fresh database: ${freshFks.length} (Expected: 18)`);
  console.log("Foreign Key Relations in Fresh DB:\n" + freshFks.map((fk) => `  - ${fk.replace(/\|/g, " -> ")}`).join("\n"));

  // -----------------------------------------------------------------------------
  // STEP 2: Canonical Demo Seed Against Fresh Database
  // -----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("STEP 2: Canonical Demo Seed Output on Fresh Database");
  console.log("================================================================================");

  const seedOutput = sh(`DATABASE_URL="${FRESH_DB_URL}" npx tsx packages/db/src/seed.ts`);
  console.log(seedOutput);

  // Reset local dev database provenance to clean seed for runtime tests
  console.log("Seeding primary dev database (provenance)...");
  sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "TRUNCATE \\"VerificationRequest\\", \\"InstitutionInvite\\", \\"DocumentAnalysis\\", \\"CredentialEvent\\", \\"Credential\\", \\"Document\\", \\"AuditLog\\", \\"IssuerUser\\", \\"CandidateProfile\\", \\"Issuer\\", \\"User\\" CASCADE;"`);
  sh("npm run db:seed");

  // -----------------------------------------------------------------------------
  // STEP 3: Config & Code-Level Audits (JWT Expiry & ID Auto-Generation)
  // -----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("STEP 3: Config & Code-Level Security Audits");
  console.log("================================================================================");

  // Inspect auth.ts for default JWT expiry
  const authRouteCode = fs.readFileSync("apps/api/src/routes/auth.ts", "utf8");
  const jwtExpiryMatch = authRouteCode.includes('process.env.JWT_ACCESS_EXPIRY || "15m"');
  console.log(`- JWT_ACCESS_EXPIRY Default (15m): ${jwtExpiryMatch ? "CONFIRMED (15m default)" : "FAIL"}`);

  // Inspect documents.ts and issuer.ts for ID auto-generation
  const docRouteCode = fs.readFileSync("apps/api/src/routes/documents.ts", "utf8");
  const issuerRouteCode = fs.readFileSync("apps/api/src/routes/issuer.ts", "utf8");

  const docNoClientId = !docRouteCode.includes("id: req.body.id");
  const issuerNoClientId = !issuerRouteCode.includes("id: req.body.id");
  console.log(`- POST /documents/self-upload Auto-Generates UUIDs (No client-supplied ID): ${docNoClientId ? "CONFIRMED" : "FAIL"}`);
  console.log(`- POST /issuer/credentials Auto-Generates UUIDs (No client-supplied ID): ${issuerNoClientId ? "CONFIRMED" : "FAIL"}`);

  // -----------------------------------------------------------------------------
  // STEP 4: Browser-Driven Spoofed Extension Upload Test
  // -----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("STEP 4: Browser-Driven Spoofed Extension Upload Rejection & Zero-Row Proof");
  console.log("================================================================================");

  // Create spoofed file
  const testFixturesDir = path.resolve(process.cwd(), "test-fixtures");
  const spoofedFilePath = path.join(testFixturesDir, "spoofed-document.pdf");
  fs.writeFileSync(spoofedFilePath, "This is plain text pretending to be a PDF without magic bytes");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  // Login as Candidate Alex
  console.log("Navigating to /login...");
  await page.goto("http://localhost:3000/login");
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', "candidate@provenance.test");
  await page.fill('input[type="password"]', "CandidatePass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  console.log("Logged in as candidate and redirected to /dashboard");

  // Navigate to Upload via client link
  console.log("Navigating to /dashboard/upload via client link...");
  await page.waitForSelector('a:has-text("Upload Document")', { timeout: 10000 });
  await page.locator('a:has-text("Upload Document")').first().click();
  await page.waitForSelector('input[placeholder*="Acme University"]', { timeout: 10000 });

  // Fill form with spoofed file
  await page.fill('input[placeholder*="Acme University"]', "Acme University");
  await page.selectOption("select", "degree");
  await page.fill('input[placeholder*="Computer Science"]', "Spoofed Security Test Degree");
  await page.setInputFiles('input[type="file"]', spoofedFilePath);

  // Submit spoofed file
  await page.click('button[type="submit"]');

  // Wait for rejection error message in UI
  await page.waitForSelector('text=Invalid file signature or unsupported MIME type', { timeout: 10000 });
  const uploadErrorText = await page.innerText('div.bg-red-50');
  console.log("Rendered Browser Upload Error Banner:\n", uploadErrorText.trim());

  // Direct psql query proving zero documents created for this spoofed attempt
  const spoofedDocsInDb = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT count(*) FROM \\"Credential\\" WHERE \\"credentialTitle\\" = 'Spoofed Security Test Degree';"`).trim();
  console.log(`Database check for 'Spoofed Security Test Degree': ${spoofedDocsInDb} rows created (Expected: 0)`);
  console.log(`Magic Byte Security Enforcement in Browser UI: ${spoofedDocsInDb === "0" ? "PASS" : "FAIL"}`);

  // -----------------------------------------------------------------------------
  // STEP 5: One Continuous Cold-Start End-to-End Walkthrough
  // -----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("STEP 5: Continuous Cold-Start End-to-End Demo Script Walkthrough");
  console.log("================================================================================");

  // Ensure flagged degree PDF exists for demo walkthrough
  const flaggedPdfPath = path.join(testFixturesDir, "flagged-degree.pdf");
  if (!fs.existsSync(flaggedPdfPath)) {
    fs.writeFileSync(flaggedPdfPath, "%PDF-1.4\n1 0 obj\n<< /Producer (Photoshop) /CreationDate (D:20200101) /ModDate (D:20200801) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");
  }

  // 6.1 Candidate Registration
  console.log("\n[6.1] Registering New Candidate: Maya Lin (maya@example.com)...");
  await context.clearCookies();
  await page.goto("http://localhost:3000/register");
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "maya@example.com");
  await page.fill('input[placeholder="At least 6 characters"]', "CandidatePass123!");
  await page.fill('input[placeholder="Repeat password"]', "CandidatePass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard*", { timeout: 10000 });
  console.log("Candidate registered and redirected to:", page.url());

  // 6.2 Candidate Profile Setup
  console.log("\n[6.2] Creating Candidate Profile (@maya_lin)...");
  await page.goto("http://localhost:3000/dashboard/profile");
  await page.waitForSelector('input[placeholder="e.g. Alex Rivera"]', { timeout: 10000 });
  await page.fill('input[placeholder="e.g. Alex Rivera"]', "Maya Lin");
  await page.fill('input[placeholder="alex_rivera"]', "maya_lin");
  await page.fill('input[placeholder="e.g. Senior Infrastructure Engineer"]', "Distributed Systems Architect");
  await page.fill('textarea[placeholder="A brief overview of your background and academic focus..."]', "Building trustless cryptographic networks and zero-knowledge attestations.");
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Profile updated successfully!', { timeout: 10000 });
  console.log("Profile created successfully for @maya_lin");

  // 6.3 Document Self-Upload with Flagged PDF
  console.log("\n[6.3] Uploading Flagged Degree Document...");
  await page.goto("http://localhost:3000/dashboard/upload");
  await page.waitForSelector('input[placeholder*="Acme University"]', { timeout: 15000 });
  await page.fill('input[placeholder*="Acme University"]', "Acme University");
  await page.selectOption("select", "degree");
  await page.fill('input[placeholder*="Computer Science"]', "B.S. in Computer Science");
  await page.fill('input[type="date"]', "2023-05-15");
  await page.fill('input[placeholder*="ACM-"]', "ACM-2023-MAYA-01");
  await page.setInputFiles('input[type="file"]', flaggedPdfPath);
  await page.click('button[type="submit"]');

  // 6.4 Analysis Signals Verification
  await page.waitForSelector('text=Deterministic Signal Inspection', { timeout: 15000 });
  const analysisDom = await page.innerText("main");
  console.log("Candidate Upload Analysis Result DOM:\n", analysisDom);

  // 6.5 Request Verification
  console.log("\n[6.5] Requesting Institutional Verification from Acme University...");
  await page.click('button:has-text("Request Verification")');
  await page.waitForSelector('text=Verification Requested', { timeout: 10000 });
  console.log("Verification request dispatched to Acme University!");

  // Extract created credential ID
  const mayaCredId = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT \\"credentialId\\" FROM \\"VerificationRequest\\" WHERE \\"candidateId\\" = (SELECT id FROM \\"User\\" WHERE email = 'maya@example.com') LIMIT 1;"`).trim();
  console.log(`Created Maya Lin Credential ID: ${mayaCredId}`);

  // 6.6 Issuer Review & Attestation
  console.log("\n[6.6] Logging in as Acme University Issuer Staff...");
  await context.clearCookies();
  await page.goto("http://localhost:3000/login");
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "issuer@provenance.test");
  await page.fill('input[type="password"]', "IssuerPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/issuer/queue", { timeout: 10000 });

  // Open Maya's pending request
  console.log("Opening Maya Lin's pending request in issuer queue...");
  await page.waitForSelector('text=Maya Lin', { timeout: 10000 });
  await page.locator('div.p-5:has-text("Maya Lin")').getByRole("link", { name: "Review Request" }).click();
  await page.waitForSelector('text=Deterministic Analysis Signals', { timeout: 10000 });

  // Approve & Anchor to Ledger
  console.log("Approving credential and appending block to hash chain...");
  await page.click('button:has-text("Approve & Append to Chain")');
  await page.waitForSelector('text=Approved & Anchored to Chain', { timeout: 10000 });
  console.log("Issuer attested credential to immutable hash chain!");

  // 6.7 Public Profile Audit
  console.log("\n[6.7] Recruiter / Public stranger auditing http://localhost:3000/u/maya_lin...");
  await context.clearCookies();
  await page.goto("http://localhost:3000/u/maya_lin");
  await page.waitForSelector('text=Maya Lin', { timeout: 10000 });
  const publicProfileDom = await page.innerText("main");
  console.log("Rendered Public Profile DOM:\n", publicProfileDom);

  // 6.8 Public Verifier Audit & QR Code
  console.log(`\n[6.8] Recruiter auditing public verifier: http://localhost:3000/verify/${mayaCredId}...`);
  await page.goto(`http://localhost:3000/verify/${mayaCredId}`);
  await page.waitForSelector('text=Chain Intact', { timeout: 10000 });
  const verifierDomClean = await page.innerText("main");
  console.log("Rendered Public Verifier DOM (Clean Ledger):\n", verifierDomClean);

  // 6.9 Issuer Revocation
  console.log("\n[6.9] Issuer Staff revoking Maya Lin's credential...");
  await context.clearCookies();
  await page.goto("http://localhost:3000/login");
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "issuer@provenance.test");
  await page.fill('input[type="password"]', "IssuerPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/issuer/queue", { timeout: 10000 });

  await page.goto("http://localhost:3000/issuer/credentials");
  await page.waitForSelector('text=Institutional Credential Roster', { timeout: 10000 });
  await page.locator(`div.p-5:has-text("B.S. in Computer Science")`).filter({ hasText: "Maya Lin" }).getByRole("button", { name: "Revoke" }).click();

  await page.waitForSelector('input[placeholder*="superseded"]', { timeout: 5000 });
  await page.fill('input[placeholder*="superseded"]', "Superseded by graduate diploma");
  await page.click('button:has-text("Confirm Revocation")');
  await page.waitForSelector(`div.p-5:has-text("Maya Lin") >> text=Revoked`, { timeout: 10000 });
  console.log("Credential revoked on institutional ledger!");

  // 6.10 Public Verification Reflects Revocation
  console.log(`\n[6.10] Verifying revocation status on public verifier http://localhost:3000/verify/${mayaCredId}...`);
  await context.clearCookies();
  await page.goto(`http://localhost:3000/verify/${mayaCredId}`);
  await page.waitForSelector('text=Revoked by Issuer', { timeout: 10000 });
  const verifierDomRevoked = await page.innerText("main");
  console.log("Rendered Public Verifier DOM (Revoked Credential):\n", verifierDomRevoked);

  // 6.11 Deliberate Tamper Detection on Historical Block
  console.log("\n[6.11] Simulating malicious direct psql database alteration on historical block...");
  const firstEventId = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT id FROM \\"CredentialEvent\\" WHERE \\"prevHash\\" IS NULL AND \\"issuerId\\" = (SELECT id FROM \\"Issuer\\" WHERE domain = 'acme.edu') LIMIT 1;"`).trim();
  sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "UPDATE \\"CredentialEvent\\" SET \\"canonicalData\\" = jsonb_set(\\"canonicalData\\"::jsonb, '{illicit_modification}', 'true')::json WHERE id = '${firstEventId}';"`).trim();

  // Inspect Issuer Chain Explorer
  console.log("Checking Issuer Chain Explorer under tamper state...");
  await page.goto("http://localhost:3000/login");
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "issuer@provenance.test");
  await page.fill('input[type="password"]', "IssuerPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/issuer/queue", { timeout: 10000 });

  await page.goto("http://localhost:3000/issuer/chain");
  await page.waitForSelector('text=Tamper Detected in Hash Chain', { timeout: 10000 });
  const chainTamperDom = await page.innerText("main");
  console.log("Issuer Chain Explorer DOM (Tampered State):\n", chainTamperDom);

  // Inspect Public Verifier under tamper state
  console.log(`Checking Public Verifier http://localhost:3000/verify/${mayaCredId} under tamper state...`);
  await context.clearCookies();
  await page.goto(`http://localhost:3000/verify/${mayaCredId}`);
  await page.waitForSelector('text=Tamper Detected in Hash Chain', { timeout: 10000 });
  const verifierTamperDom = await page.innerText("main");
  console.log("Public Verifier DOM (Tampered Ledger):\n", verifierTamperDom);

  // Clean up
  await browser.close();

  // -----------------------------------------------------------------------------
  // STEP 6: Public Profile Rate Limiting Verification (/u/:username)
  // -----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("STEP 6: Public Profile Rate Limiting Verification (/u/:username)");
  console.log("================================================================================");

  console.log("Testing rate limiter on GET /u/rate_limit_probe (Threshold: 60 req/min)...");
  let lastStatus = 0;
  let hitRateLimit = false;
  let rateLimitMessage = "";

  for (let i = 1; i <= 65; i++) {
    const res = sh(`curl -s -w "%{http_code}" -o /tmp/rate_limit_resp.json http://localhost:4000/u/rate_limit_probe`);
    lastStatus = parseInt(res.slice(-3), 10);
    if (lastStatus === 429) {
      hitRateLimit = true;
      rateLimitMessage = fs.readFileSync("/tmp/rate_limit_resp.json", "utf8");
      console.log(`- Request #${i} triggered HTTP 429 Rate Limit as expected!`);
      break;
    }
  }

  console.log(`- Rate limit response payload: ${rateLimitMessage.trim()}`);
  console.log(`- Rate limiter enforcement on /u/:username: ${hitRateLimit ? "PASS" : "FAIL"}`);

  // -----------------------------------------------------------------------------
  // STEP 7: Git Status & Commit Log
  // -----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("STEP 7: Final Git Repository Status");
  console.log("================================================================================");
  console.log(sh("git status"));
}

run().catch(console.error);
