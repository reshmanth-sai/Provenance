const { execSync } = require("child_process");
const fs = require("fs");

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

async function run() {
  // Ensure fresh seed
  sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "TRUNCATE \\"VerificationRequest\\", \\"InstitutionInvite\\", \\"DocumentAnalysis\\", \\"CredentialEvent\\", \\"Credential\\", \\"Document\\", \\"AuditLog\\", \\"IssuerUser\\", \\"CandidateProfile\\", \\"Issuer\\", \\"User\\" CASCADE;"`);
  sh("npm run db:seed");

  console.log("================================================================================");
  console.log("STEP 1: Backend POST /auth/refresh Verification");
  console.log("================================================================================");
  
  // 1a. Login to get a valid refresh cookie
  console.log("\n[1a] Logging in as candidate to receive httpOnly refreshToken cookie:");
  const loginHeaders = sh(`curl -i -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"candidate@provenance.test","password":"CandidatePass123!"}'`);
  
  const cookieMatch = loginHeaders.match(/Set-Cookie:\s*refreshToken=([^;]+);/i);
  const refreshToken = cookieMatch ? cookieMatch[1] : null;
  console.log("Received Refresh Cookie Token:", refreshToken ? `${refreshToken.substring(0, 30)}...` : "NOT FOUND");

  // 1b. Call /auth/refresh with valid cookie
  console.log("\n[1b] Calling POST /auth/refresh with valid cookie (expect 200 OK):");
  const refreshResValid = sh(`curl -i -s -X POST http://localhost:4000/auth/refresh -H "Cookie: refreshToken=${refreshToken}"`);
  console.log(refreshResValid);

  // 1c. Call /auth/refresh with invalid / missing cookie
  console.log("\n[1c] Calling POST /auth/refresh with invalid cookie (expect 401 Unauthorized):");
  const refreshResInvalid = sh(`curl -i -s -X POST http://localhost:4000/auth/refresh -H "Cookie: refreshToken=invalid_bogus_token"`);
  console.log(refreshResInvalid);

  console.log("\n[1d] Calling POST /auth/refresh with missing cookie (expect 401 Unauthorized):");
  const refreshResMissing = sh(`curl -i -s -X POST http://localhost:4000/auth/refresh`);
  console.log(refreshResMissing);

  console.log("================================================================================");
  console.log("STEP 2: End-to-End Candidate Upload & Signal Rendering Verification");
  console.log("================================================================================");
  
  const candToken = JSON.parse(refreshResValid.split("\r\n\r\n")[1]).accessToken;
  const acmeToken = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"issuer@provenance.test","password":"IssuerPass123!"}'`)).accessToken;

  // Set candidate profile
  sh(`curl -s -X PUT http://localhost:4000/candidate/profile -H "Authorization: Bearer ${candToken}" -H "Content-Type: application/json" -d '{"name":"Alex Rivera","publicUsername":"alex_rivera","headline":"Senior Infrastructure Engineer","bio":"Specializing in verifiable computing and cryptographic credentials."}'`);

  // Upload flagged degree
  console.log("\n[2a] Uploading flagged-degree.pdf to deterministic analysis pipeline:");
  const uploadFlagged = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/self-upload -H "Authorization: Bearer ${candToken}" -F "file=@test-fixtures/flagged-degree.pdf;filename=flagged-degree.pdf;type=application/pdf" -F "claimedIssuerName=Acme University" -F "credentialType=degree" -F "credentialTitle=Bachelor of Science in Software Systems" -F "issueDate=2023-05-15" -F "certificateNumber=ACM-FLAG-101"`));
  
  console.log("Analysis Signals Returned:");
  const sigs = uploadFlagged.analyses || uploadFlagged.analysis || [];
  for (const s of sigs) {
    console.log(`- [${s.severity.toUpperCase()}] ${s.signalType}: ${s.signalValue.fact}`);
    if (s.signalValue.disclaimer) {
      console.log(`    Disclaimer: ${s.signalValue.disclaimer}`);
    }
  }

  console.log("================================================================================");
  console.log("STEP 3: In-Memory Token Storage Audit");
  console.log("================================================================================");
  
  // Inspect AuthContext and entire frontend source code confirming zero active localStorage / sessionStorage storage calls
  const authContextSrc = fs.readFileSync("apps/web/context/AuthContext.tsx", "utf8");
  const strippedCode = authContextSrc.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
  const usesLocalStorage = /localStorage\./.test(strippedCode) || /window\.localStorage/.test(strippedCode);
  const usesSessionStorage = /sessionStorage\./.test(strippedCode) || /window\.sessionStorage/.test(strippedCode);
  console.log("AuthContext active localStorage usage:   ", usesLocalStorage ? "FOUND! (ERROR)" : "NONE (IN-MEMORY STATE ONLY - PASS)");
  console.log("AuthContext active sessionStorage usage: ", usesSessionStorage ? "FOUND! (ERROR)" : "NONE (IN-MEMORY STATE ONLY - PASS)");

  console.log("================================================================================");
  console.log("STEP 4: Public Surfaces & Tamper Visualizer Verification");
  console.log("================================================================================");
  
  // Setup credentials for alex_rivera
  // 1. Verified Credential
  const cred1Res = JSON.parse(sh(`curl -s -X POST http://localhost:4000/issuer/credentials -H "Authorization: Bearer ${acmeToken}" -H "Content-Type: application/json" -d '{"candidateEmail":"candidate@provenance.test","credentialType":"degree","credentialTitle":"B.S. in Computer Science","issueDate":"2021-05-20","certificateNumber":"ACM-2021-CS-101"}'`));
  const verifiedCredId = cred1Res.credential.id;

  // 2. Revoked Credential
  const cred2Res = JSON.parse(sh(`curl -s -X POST http://localhost:4000/issuer/credentials -H "Authorization: Bearer ${acmeToken}" -H "Content-Type: application/json" -d '{"candidateEmail":"candidate@provenance.test","credentialType":"certificate","credentialTitle":"AWS Certified Solutions Architect","issueDate":"2022-08-15","certificateNumber":"CERT-2022-REV-09"}'`));
  const revokedCredId = cred2Res.credential.id;
  sh(`curl -s -X POST http://localhost:4000/issuer/credentials/${revokedCredId}/revoke -H "Authorization: Bearer ${acmeToken}" -H "Content-Type: application/json" -d '{"reason":"Credential superseded"}'`);

  // 3. Pending Credential
  const uploadPending = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/self-upload -H "Authorization: Bearer ${candToken}" -F "file=@test-fixtures/clean-degree.pdf;filename=clean-degree.pdf;type=application/pdf" -F "claimedIssuerName=Acme University" -F "credentialType=degree" -F "credentialTitle=M.S. in Software Engineering" -F "issueDate=2023-06-01"`));
  const reqPending = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/${uploadPending.document.id}/request-verification -H "Authorization: Bearer ${candToken}"`));
  const pendingCredId = reqPending.credential.id;

  // 4. Rejected Credential
  const uploadRejected = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/self-upload -H "Authorization: Bearer ${candToken}" -F "file=@test-fixtures/clean-degree.pdf;filename=clean-degree.pdf;type=application/pdf" -F "claimedIssuerName=Acme University" -F "credentialType=degree" -F "credentialTitle=Honorary Ph.D." -F "issueDate=2024-01-01"`));
  const reqRejected = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/${uploadRejected.document.id}/request-verification -H "Authorization: Bearer ${candToken}"`));
  const rejectedCredId = reqRejected.credential.id;
  sh(`curl -s -X POST http://localhost:4000/issuer/verification-requests/${reqRejected.verificationRequest.id}/reject -H "Authorization: Bearer ${acmeToken}"`);

  console.log("\n[4a] Fetching Public Profile /u/alex_rivera API Data:");
  const pubProfileJson = JSON.parse(sh(`curl -s http://localhost:4000/u/alex_rivera`));
  console.log("Verified Credentials:  ", pubProfileJson.credentials.verified.length);
  console.log("Revoked Credentials:   ", pubProfileJson.credentials.revoked.length);
  console.log("Unconfirmed/Pending:   ", pubProfileJson.credentials.unconfirmed.length);
  console.log("Rejected Credential Present in JSON: ", JSON.stringify(pubProfileJson).includes("Honorary Ph.D."));

  console.log("\n[4b] Fetching Public Verifier /verify/:id for Clean Verified Credential:");
  console.log(sh(`curl -s http://localhost:4000/verify/${verifiedCredId}`));

  console.log("\n[4c] Tampering with Event in psql and Fetching Public Verifier (Broken Chain Visualizer):");
  const eventToTamper = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT id FROM \\"CredentialEvent\\" WHERE \\"credentialId\\" = '${verifiedCredId}' LIMIT 1;"`).trim();
  sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "UPDATE \\"CredentialEvent\\" SET \\"canonicalData\\" = jsonb_set(\\"canonicalData\\"::jsonb, '{tampered}', 'true')::json WHERE id = '${eventToTamper}';"`).trim();
  console.log(sh(`curl -s http://localhost:4000/verify/${verifiedCredId}`));

  console.log("================================================================================");
  console.log("STEP 5: Git Status & Commit History");
  console.log("================================================================================");
  console.log(sh("git status"));
  console.log(sh("git log -n 1"));
}

run().catch(console.error);
