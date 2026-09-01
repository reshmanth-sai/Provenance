const { execSync } = require("child_process");
const { PNG } = require("pngjs");
const jsQR = require("jsqr");
const fs = require("fs");

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

async function run() {
  console.log("================================================================================");
  console.log("STEP 1: Referential Integrity Migration & Pre-Migration Orphan Check");
  console.log("================================================================================");
  
  console.log("\n[1a] Pre-Migration Orphan Check across all foreign keys:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "
    SELECT 'Document.candidateId' as check, count(*) as orphans FROM \\"Document\\" WHERE \\"candidateId\\" NOT IN (SELECT id FROM \\"User\\")
    UNION ALL
    SELECT 'DocumentAnalysis.documentId', count(*) FROM \\"DocumentAnalysis\\" WHERE \\"documentId\\" NOT IN (SELECT id FROM \\"Document\\")
    UNION ALL
    SELECT 'Credential.candidateId', count(*) FROM \\"Credential\\" WHERE \\"candidateId\\" NOT IN (SELECT id FROM \\"User\\")
    UNION ALL
    SELECT 'Credential.issuerId', count(*) FROM \\"Credential\\" WHERE \\"issuerId\\" IS NOT NULL AND \\"issuerId\\" NOT IN (SELECT id FROM \\"Issuer\\")
    UNION ALL
    SELECT 'Credential.documentId', count(*) FROM \\"Credential\\" WHERE \\"documentId\\" IS NOT NULL AND \\"documentId\\" NOT IN (SELECT id FROM \\"Document\\")
    UNION ALL
    SELECT 'VerificationRequest.credentialId', count(*) FROM \\"VerificationRequest\\" WHERE \\"credentialId\\" NOT IN (SELECT id FROM \\"Credential\\")
    UNION ALL
    SELECT 'VerificationRequest.candidateId', count(*) FROM \\"VerificationRequest\\" WHERE \\"candidateId\\" NOT IN (SELECT id FROM \\"User\\")
    UNION ALL
    SELECT 'VerificationRequest.issuerId', count(*) FROM \\"VerificationRequest\\" WHERE \\"issuerId\\" NOT IN (SELECT id FROM \\"Issuer\\")
    UNION ALL
    SELECT 'CredentialEvent.credentialId', count(*) FROM \\"CredentialEvent\\" WHERE \\"credentialId\\" NOT IN (SELECT id FROM \\"Credential\\")
    UNION ALL
    SELECT 'CredentialEvent.issuerId', count(*) FROM \\"CredentialEvent\\" WHERE \\"issuerId\\" NOT IN (SELECT id FROM \\"Issuer\\")
    UNION ALL
    SELECT 'CredentialEvent.createdBy', count(*) FROM \\"CredentialEvent\\" WHERE \\"createdBy\\" NOT IN (SELECT id FROM \\"User\\")
    UNION ALL
    SELECT 'IssuerUser.issuerId', count(*) FROM \\"IssuerUser\\" WHERE \\"issuerId\\" NOT IN (SELECT id FROM \\"Issuer\\")
    UNION ALL
    SELECT 'IssuerUser.userId', count(*) FROM \\"IssuerUser\\" WHERE \\"userId\\" NOT IN (SELECT id FROM \\"User\\")
    UNION ALL
    SELECT 'CandidateProfile.userId', count(*) FROM \\"CandidateProfile\\" WHERE \\"userId\\" NOT IN (SELECT id FROM \\"User\\")
    UNION ALL
    SELECT 'InstitutionInvite.invitedBy', count(*) FROM \\"InstitutionInvite\\" WHERE \\"invitedBy\\" NOT IN (SELECT id FROM \\"User\\")
    UNION ALL
    SELECT 'AuditLog.actorId', count(*) FROM \\"AuditLog\\" WHERE \\"actorId\\" NOT IN (SELECT id FROM \\"User\\");
  "`));

  console.log("\n[1b] Verified Foreign Key Constraints in PostgreSQL Catalog:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "
    SELECT conname, conrelid::regclass, confrelid::regclass 
    FROM pg_constraint 
    WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    ORDER BY conrelid::regclass::text;
  "`));

  console.log("================================================================================");
  console.log("STEP 2: Setup Fixture Candidate with 4 Credential Statuses");
  console.log("================================================================================");
  
  // Login accounts
  const candToken = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"candidate@provenance.test","password":"CandidatePass123!"}'`)).accessToken;
  const acmeToken = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"issuer@provenance.test","password":"IssuerPass123!"}'`)).accessToken;

  // Set candidate profile
  sh(`curl -s -X PUT http://localhost:4000/candidate/profile -H "Authorization: Bearer ${candToken}" -H "Content-Type: application/json" -d '{"name":"Alex Rivera","publicUsername":"alex_rivera","headline":"Senior Infrastructure Engineer","bio":"Specializing in distributed systems and verifiable computing.","avatarUrl":"https://avatar.example.com/alex.png"}'`);

  // 1. Verified Credential (Directly issued by Acme)
  const cred1Res = JSON.parse(sh(`curl -s -X POST http://localhost:4000/issuer/credentials -H "Authorization: Bearer ${acmeToken}" -H "Content-Type: application/json" -d '{"candidateEmail":"candidate@provenance.test","credentialType":"degree","credentialTitle":"B.S. in Computer Science","issueDate":"2021-05-20","certificateNumber":"ACM-2021-CS-101"}'`));
  const verifiedCredId = cred1Res.credential.id;

  // 2. Revoked Credential (Directly issued by Acme, then revoked)
  const cred2Res = JSON.parse(sh(`curl -s -X POST http://localhost:4000/issuer/credentials -H "Authorization: Bearer ${acmeToken}" -H "Content-Type: application/json" -d '{"candidateEmail":"candidate@provenance.test","credentialType":"certificate","credentialTitle":"AWS Certified Solutions Architect","issueDate":"2022-08-15","certificateNumber":"CERT-2022-REV-09"}'`));
  const revokedCredId = cred2Res.credential.id;
  sh(`curl -s -X POST http://localhost:4000/issuer/credentials/${revokedCredId}/revoke -H "Authorization: Bearer ${acmeToken}" -H "Content-Type: application/json" -d '{"reason":"Credential superseded by newer version"}'`);

  // 3. Pending Credential (Candidate self-upload + verification requested)
  const upload3 = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/self-upload -H "Authorization: Bearer ${candToken}" -F "file=@test-fixtures/clean-degree.pdf;filename=clean-degree.pdf;type=application/pdf" -F "claimedIssuerName=Acme University" -F "credentialType=degree" -F "credentialTitle=M.S. in Software Engineering" -F "issueDate=2023-06-01"`));
  const req3 = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/${upload3.document.id}/request-verification -H "Authorization: Bearer ${candToken}"`));
  const pendingCredId = req3.credential.id;

  // 4. Rejected Credential (Candidate self-upload + rejected by issuer)
  const upload4 = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/self-upload -H "Authorization: Bearer ${candToken}" -F "file=@test-fixtures/clean-degree.pdf;filename=clean-degree.pdf;type=application/pdf" -F "claimedIssuerName=Acme University" -F "credentialType=degree" -F "credentialTitle=Honorary Ph.D." -F "issueDate=2024-01-01"`));
  const req4 = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/${upload4.document.id}/request-verification -H "Authorization: Bearer ${candToken}"`));
  const rejectedCredId = req4.credential.id;
  sh(`curl -s -X POST http://localhost:4000/issuer/verification-requests/${req4.verificationRequest.id}/reject -H "Authorization: Bearer ${acmeToken}"`);

  console.log("Candidate credentials setup:");
  console.log("  1. Verified Credential ID: ", verifiedCredId);
  console.log("  2. Revoked Credential ID:  ", revokedCredId);
  console.log("  3. Pending Credential ID:  ", pendingCredId);
  console.log("  4. Rejected Credential ID: ", rejectedCredId);

  console.log("================================================================================");
  console.log("STEP 3: Public Candidate Profile (GET /u/:username)");
  console.log("================================================================================");
  
  const profileJsonStr = sh(`curl -s -X GET http://localhost:4000/u/alex_rivera`);
  const profileJson = JSON.parse(profileJsonStr);
  console.log("Full Raw JSON Response from GET /u/alex_rivera:\n");
  console.log(JSON.stringify(profileJson, null, 2));

  console.log("\n--- Verification of Business Rules & Isolation in Public Profile ---");
  console.log("Verified group count:   ", profileJson.credentials.verified.length, "credential(s)");
  console.log("Revoked group count:    ", profileJson.credentials.revoked.length, "credential(s) (present & clearly marked revoked)");
  console.log("Unconfirmed group count:", profileJson.credentials.unconfirmed.length, "credential(s) (with pending labeled)");
  const hasRejectedInProfile = profileJsonStr.includes("Honorary Ph.D.") || profileJsonStr.includes(rejectedCredId);
  console.log("Rejected credential in profile: ", hasRejectedInProfile ? "LEAKED! (ERROR)" : "COMPLETELY OMITTED (PASS)");

  console.log("\n--- Data Leakage Check on Public Profile ---");
  const leakFields = ["candidateId", "email", "storageKey", "passwordHash", "canonicalData", "userId"];
  for (const f of leakFields) {
    console.log(`Contains "${f}":`, profileJsonStr.includes(`"${f}"`));
  }

  console.log("================================================================================");
  console.log("STEP 4: Public Profile 404 on Nonexistent Username");
  console.log("================================================================================");
  
  console.log(sh(`curl -i -s -X GET http://localhost:4000/u/nonexistent-username-9999`));

  console.log("================================================================================");
  console.log("STEP 5: Public Credential Verifier for Verified Credential (GET /verify/:id)");
  console.log("================================================================================");
  
  const verifyVerifiedStr = sh(`curl -s -X GET http://localhost:4000/verify/${verifiedCredId}`);
  console.log("Full Raw JSON Response from GET /verify/" + verifiedCredId + ":\n");
  console.log(JSON.stringify(JSON.parse(verifyVerifiedStr), null, 2));

  console.log("================================================================================");
  console.log("STEP 6: Tamper Detection Through Public Verifier");
  console.log("================================================================================");
  
  const acmeIssuerId = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT id FROM \\"Issuer\\" WHERE domain = 'acme.edu';"`).trim();
  const eventToTamper = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT id FROM \\"CredentialEvent\\" WHERE \\"credentialId\\" = '${verifiedCredId}' LIMIT 1;"`).trim();

  console.log(`[6a] Tampering with CredentialEvent row ${eventToTamper} in psql:`);
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "UPDATE \\"CredentialEvent\\" SET \\"canonicalData\\" = jsonb_set(\\"canonicalData\\"::jsonb, '{tampered}', 'true')::json WHERE id = '${eventToTamper}';"`));

  console.log(`\n[6b] Re-hitting public GET /verify/${verifiedCredId} after tampering:`);
  const verifyTamperedStr = sh(`curl -s -X GET http://localhost:4000/verify/${verifiedCredId}`);
  console.log(JSON.stringify(JSON.parse(verifyTamperedStr), null, 2));

  console.log("================================================================================");
  console.log("STEP 7: Public Credential Verifier for Pending / Unverified Credential");
  console.log("================================================================================");
  
  const verifyPendingStr = sh(`curl -s -X GET http://localhost:4000/verify/${pendingCredId}`);
  console.log("Full Raw JSON Response for Pending Credential:\n");
  console.log(JSON.stringify(JSON.parse(verifyPendingStr), null, 2));

  console.log("================================================================================");
  console.log("STEP 8: Rate Limiting Burst Test (429 on /verify/:id)");
  console.log("================================================================================");
  
  console.log("Firing burst of 35 rapid requests at /verify/:id...");
  let rateLimitHit = false;
  let sample429 = "";
  for (let i = 1; i <= 35; i++) {
    const res = sh(`curl -i -s -X GET http://localhost:4000/verify/${verifiedCredId}`);
    if (res.includes("429 Too Many Requests")) {
      rateLimitHit = true;
      sample429 = res;
      console.log(`Request #${i} returned HTTP 429 Too Many Requests`);
      break;
    }
  }
  console.log("\nSample 429 Response Header & Body:\n" + sample429);

  console.log("================================================================================");
  console.log("STEP 9: Programmatic QR Code Generation & Decode Verification");
  console.log("================================================================================");
  
  // Download QR PNG image from endpoint
  sh(`curl -s http://localhost:4000/verify/${verifiedCredId}/qr -o /tmp/test_qr_${verifiedCredId}.png`);
  const imageBuffer = fs.readFileSync(`/tmp/test_qr_${verifiedCredId}.png`);
  fs.unlinkSync(`/tmp/test_qr_${verifiedCredId}.png`);

  const png = PNG.sync.read(imageBuffer);
  const qrCode = jsQR(new Uint8ClampedArray(png.data.buffer), png.width, png.height);

  const expectedUrl = `http://localhost:4000/verify/${verifiedCredId}`;
  console.log("Expected URL: ", expectedUrl);
  console.log("Decoded QR:   ", qrCode ? qrCode.data : "FAILED TO DECODE");
  console.log("Exact Match:  ", qrCode && qrCode.data === expectedUrl);

  console.log("================================================================================");
  console.log("STEP 10: Git Status & Commit History");
  console.log("================================================================================");
  console.log(sh("git status"));
  console.log(sh("git log -n 1"));
}

run().catch(console.error);
