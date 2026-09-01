const { execSync } = require("child_process");

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

async function run() {
  console.log("================================================================================");
  console.log("STEP 1: Issuer Registration (Domain Validation & Pending Status)");
  console.log("================================================================================");
  
  console.log("\n[1a] POST /issuer/register with MISMATCHED domain (registrar@wrongdomain.com vs stanford.edu):");
  try {
    const out = sh(`curl -i -s -X POST http://localhost:4000/issuer/register -H "Content-Type: application/json" -d '{"institutionName":"Stanford University","domain":"stanford.edu","contactEmail":"registrar@wrongdomain.com","password":"StanfordStaff123!"}'`);
    console.log(out);
  } catch (e) {
    console.log(e.stdout || e.message);
  }

  console.log("\n[1b] POST /issuer/register with MATCHING domain (registrar@stanford.edu vs stanford.edu):");
  const regRes = sh(`curl -i -s -X POST http://localhost:4000/issuer/register -H "Content-Type: application/json" -d '{"institutionName":"Stanford University","domain":"stanford.edu","contactEmail":"registrar@stanford.edu","password":"StanfordStaff123!"}'`);
  console.log(regRes);

  console.log("\n[1c] psql verification of freshly registered Issuer row:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, name, domain, status, \\"approvedBy\\", \\"approvedAt\\" FROM \\"Issuer\\" WHERE domain = 'stanford.edu';"`));

  console.log("================================================================================");
  console.log("STEP 2: Authorization Gate Before Admin Approval (403 Forbidden)");
  console.log("================================================================================");
  
  const stanfordLogin = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"registrar@stanford.edu","password":"StanfordStaff123!"}'`));
  const stanfordToken = stanfordLogin.accessToken;
  console.log("Stanford Staff Token:", stanfordToken.substring(0, 35) + "...");

  console.log("\n[2] GET /issuer/verification-requests BEFORE admin approval:");
  console.log(sh(`curl -i -s -X GET http://localhost:4000/issuer/verification-requests -H "Authorization: Bearer ${stanfordToken}"`));

  console.log("================================================================================");
  console.log("STEP 3: Platform Admin Approval & AuditLog");
  console.log("================================================================================");
  
  const adminLogin = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@provenance.test","password":"AdminPass123!"}'`));
  const adminToken = adminLogin.accessToken;
  const stanfordId = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT id FROM \\"Issuer\\" WHERE domain = 'stanford.edu';"`).trim();

  console.log("\n[3a] GET /admin/institutions/pending:");
  console.log(sh(`curl -s -X GET http://localhost:4000/admin/institutions/pending -H "Authorization: Bearer ${adminToken}"`));

  console.log(`\n[3b] POST /admin/institutions/${stanfordId}/approve:`);
  console.log(sh(`curl -i -s -X POST http://localhost:4000/admin/institutions/${stanfordId}/approve -H "Authorization: Bearer ${adminToken}"`));

  console.log("\n[3c] psql verification of Issuer table after approval:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, name, domain, status, \\"approvedBy\\", \\"approvedAt\\" FROM \\"Issuer\\" WHERE id = '${stanfordId}';"`));

  console.log("\n[3d] psql verification of AuditLog table:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, \\"actorId\\", action, \\"targetType\\", \\"targetId\\", metadata FROM \\"AuditLog\\";"`));

  console.log("================================================================================");
  console.log("STEP 4: Authorization Gate After Admin Approval (200 OK)");
  console.log("================================================================================");
  
  console.log("\n[4] GET /issuer/verification-requests AFTER admin approval with same token:");
  console.log(sh(`curl -i -s -X GET http://localhost:4000/issuer/verification-requests -H "Authorization: Bearer ${stanfordToken}"`));

  console.log("================================================================================");
  console.log("STEP 5: Verification Request Approval & Tamper-Evident Chain Event");
  console.log("================================================================================");
  
  const candLogin = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"candidate@provenance.test","password":"CandidatePass123!"}'`));
  const candToken = candLogin.accessToken;
  const acmeLogin = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"issuer@provenance.test","password":"IssuerPass123!"}'`));
  const acmeToken = acmeLogin.accessToken;

  // Create candidate profile
  sh(`curl -s -X PUT http://localhost:4000/candidate/profile -H "Authorization: Bearer ${candToken}" -H "Content-Type: application/json" -d '{"name":"Alice Candidate","publicUsername":"alice","headline":"Software Engineer"}'`);

  console.log("\n[5a] Candidate uploads clean degree claiming Acme University:");
  const uploadRes = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/self-upload -H "Authorization: Bearer ${candToken}" -F "file=@test-fixtures/clean-degree.pdf;filename=clean-degree.pdf;type=application/pdf" -F "claimedIssuerName=Acme University" -F "credentialType=degree" -F "credentialTitle=Bachelor of Science in Computer Science" -F "issueDate=2023-05-15" -F "certificateNumber=ACM-2023-9988"`));
  console.log("Uploaded Document ID:", uploadRes.document.id);

  console.log("\n[5b] Candidate requests verification:");
  const reqRes = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/${uploadRes.document.id}/request-verification -H "Authorization: Bearer ${candToken}"`));
  console.log("Verification Request ID:", reqRes.verificationRequest.id);

  console.log(`\n[5c] Acme Issuer approves verification request ${reqRes.verificationRequest.id}:`);
  console.log(sh(`curl -i -s -X POST http://localhost:4000/issuer/verification-requests/${reqRes.verificationRequest.id}/approve -H "Authorization: Bearer ${acmeToken}"`));

  console.log("\n[5d] psql verification of Credential and CredentialEvent rows:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, \\"candidateId\\", \\"issuerId\\", status FROM \\"Credential\\" WHERE \\"documentId\\" = '${uploadRes.document.id}';"`));
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, \\"issuerId\\", \\"eventType\\", \\"contentHash\\", \\"prevHash\\", \\"createdBy\\" FROM \\"CredentialEvent\\";"`));

  console.log("================================================================================");
  console.log("STEP 6: Verification Request Rejection & Zero Chain Events Guarantee");
  console.log("================================================================================");
  
  const uploadRes2 = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/self-upload -H "Authorization: Bearer ${candToken}" -F "file=@test-fixtures/clean-degree.pdf;filename=clean-degree.pdf;type=application/pdf" -F "claimedIssuerName=Acme University" -F "credentialType=degree" -F "credentialTitle=Bachelor of Science in Physics" -F "issueDate=2023-05-15"`));
  const reqRes2 = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/${uploadRes2.document.id}/request-verification -H "Authorization: Bearer ${candToken}"`));

  console.log("\n[6a] CredentialEvent count BEFORE rejection:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT count(*) FROM \\"CredentialEvent\\";"`));

  console.log(`\n[6b] Acme Issuer rejects request ${reqRes2.verificationRequest.id}:`);
  console.log(sh(`curl -i -s -X POST http://localhost:4000/issuer/verification-requests/${reqRes2.verificationRequest.id}/reject -H "Authorization: Bearer ${acmeToken}"`));

  console.log("\n[6c] CredentialEvent count AFTER rejection (must be identical to 6a):");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT count(*) FROM \\"CredentialEvent\\";"`));
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, status FROM \\"Credential\\" WHERE id = '${reqRes2.credential.id}';"`));

  console.log("================================================================================");
  console.log("STEP 7: Credential Revocation & Immutable Append");
  console.log("================================================================================");
  
  const approvedCredId = uploadRes.credential.id;
  console.log(`\n[7a] POST /issuer/credentials/${approvedCredId}/revoke:`);
  console.log(sh(`curl -i -s -X POST http://localhost:4000/issuer/credentials/${approvedCredId}/revoke -H "Authorization: Bearer ${acmeToken}" -H "Content-Type: application/json" -d '{"reason":"Conferred under administrative error"}'`));

  console.log("\n[7b] psql check of Credential status:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, status FROM \\"Credential\\" WHERE id = '${approvedCredId}';"`));

  console.log("\n[7c] psql check of sequential CredentialEvent chain (showing verified + revoked):");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT id, \\"eventType\\", \\"contentHash\\", \\"prevHash\\", \\"createdAt\\" FROM \\"CredentialEvent\\" ORDER BY \\"createdAt\\" ASC;"`));

  console.log("================================================================================");
  console.log("STEP 8: Concurrency Test (Simultaneous Approvals with Advisory Locking)");
  console.log("================================================================================");
  
  const concurrencyTestScript = `
    import { prisma } from "./packages/db/src/index.ts";
    import { appendChainEvent, verifyChain } from "./apps/api/src/services/hash-chain.ts";
    async function test() {
      const stanford = await prisma.issuer.findUnique({ where: { domain: "stanford.edu" } });
      const admin = await prisma.user.findFirst({ where: { role: "platform_admin" } });

      const c1 = await prisma.credential.create({
        data: { candidateId: admin.id, issuerId: stanford.id, source: "issuer_issued", status: "unverified", credentialType: "degree", credentialTitle: "Concurrent Degree 1" }
      });
      const c2 = await prisma.credential.create({
        data: { candidateId: admin.id, issuerId: stanford.id, source: "issuer_issued", status: "unverified", credentialType: "degree", credentialTitle: "Concurrent Degree 2" }
      });

      console.log("Firing Promise.all concurrent appends for Stanford...");
      const [r1, r2] = await Promise.all([
        appendChainEvent(stanford.id, c1.id, "verified", { cred: c1.id, test: "concurrency_1" }, admin.id),
        appendChainEvent(stanford.id, c2.id, "verified", { cred: c2.id, test: "concurrency_2" }, admin.id)
      ]);

      console.log("Event 1 ID:", r1.id, "prevHash:", r1.prevHash, "contentHash:", r1.contentHash);
      console.log("Event 2 ID:", r2.id, "prevHash:", r2.prevHash, "contentHash:", r2.contentHash);

      const audit = await verifyChain(stanford.id);
      console.log("Chain Audit Result:\\n", JSON.stringify(audit, null, 2));
    }
    test().catch(console.error);
  `;
  console.log(sh(`npx tsx -e '${concurrencyTestScript.replace(/\n/g, " ")}'`));

  console.log("================================================================================");
  console.log("STEP 9: Tamper Detection (Raw psql Mutation -> verifyChain Detection)");
  console.log("================================================================================");
  
  const eventToTamper = sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -t -A -c "SELECT id FROM \\"CredentialEvent\\" WHERE \\"prevHash\\" IS NULL AND \\"issuerId\\" = '${stanfordId}' LIMIT 1;"`).trim();
  console.log("Tampering with event ID:", eventToTamper);

  console.log("\n[9a] Raw SQL UPDATE to mutate canonicalData:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "UPDATE \\"CredentialEvent\\" SET \\"canonicalData\\" = jsonb_set(\\"canonicalData\\"::jsonb, '{test}', '\\"hacked_tampered_value\\"')::json WHERE id = '${eventToTamper}';"`));

  console.log("\n[9b] Running verifyChain on Stanford chain:");
  const tamperAuditScript = `
    import { prisma } from "./packages/db/src/index.ts";
    import { verifyChain } from "./apps/api/src/services/hash-chain.ts";
    async function test() {
      const stanford = await prisma.issuer.findUnique({ where: { domain: "stanford.edu" } });
      const audit = await verifyChain(stanford.id);
      console.log(JSON.stringify(audit, null, 2));
    }
    test().catch(console.error);
  `;
  console.log(sh(`npx tsx -e '${tamperAuditScript.replace(/\n/g, " ")}'`));

  console.log("================================================================================");
  console.log("STEP 10: Serialization Determinism (Shuffled Keys -> Byte-Identical Hashes)");
  console.log("================================================================================");
  
  const determinismScript = `
    import { deterministicSerialize, sha256 } from "./apps/api/src/services/hash-chain.ts";
    const a = { z_field: "end", a_field: 123, nested: { gamma: true, alpha: [1, 2, { inner_z: "z", inner_a: "a" }] }, middle: "hello" };
    const b = { middle: "hello", nested: { alpha: [1, 2, { inner_a: "a", inner_z: "z" }], gamma: true }, a_field: 123, z_field: "end" };
    const sA = deterministicSerialize(a);
    const sB = deterministicSerialize(b);
    const hA = sha256(sA);
    const hB = sha256(sB);
    console.log("Serialized A:", sA);
    console.log("Serialized B:", sB);
    console.log("Hash A:      ", hA);
    console.log("Hash B:      ", hB);
    console.log("Equal Hashes:", hA === hB);
  `;
  console.log(sh(`npx tsx -e '${determinismScript.replace(/\n/g, " ")}'`));

  console.log("================================================================================");
  console.log("STEP 11: Cross-Issuer Isolation");
  console.log("================================================================================");
  
  const uploadRes3 = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/self-upload -H "Authorization: Bearer ${candToken}" -F "file=@test-fixtures/clean-degree.pdf;filename=clean-degree.pdf;type=application/pdf" -F "claimedIssuerName=Acme University" -F "credentialType=degree" -F "credentialTitle=Bachelor of Science in Math"`));
  const reqRes3 = JSON.parse(sh(`curl -s -X POST http://localhost:4000/documents/${uploadRes3.document.id}/request-verification -H "Authorization: Bearer ${candToken}"`));
  const acmeReqId = reqRes3.verificationRequest.id;

  console.log("Created Acme Verification Request ID:", acmeReqId);

  console.log("\n[11a] Stanford staff queries GET /issuer/verification-requests (must NOT list Acme request):");
  console.log(sh(`curl -s -X GET http://localhost:4000/issuer/verification-requests -H "Authorization: Bearer ${stanfordToken}"`));

  console.log("\n[11b] Stanford staff attempts to approve Acme request (expect 404):");
  try {
    console.log(sh(`curl -i -s -X POST http://localhost:4000/issuer/verification-requests/${acmeReqId}/approve -H "Authorization: Bearer ${stanfordToken}"`));
  } catch (e) {
    console.log(e.stdout || e.message);
  }

  console.log("================================================================================");
  console.log("STEP 12: Direct Issuance & Clean Git Status");
  console.log("================================================================================");
  
  console.log("\n[12a] POST /issuer/credentials (Direct Issuance by Acme):");
  console.log(sh(`curl -i -s -X POST http://localhost:4000/issuer/credentials -H "Authorization: Bearer ${acmeToken}" -H "Content-Type: application/json" -d '{"candidateEmail":"direct.student@provenance.test","credentialType":"degree","credentialTitle":"Master of Science in Data Systems","issueDate":"2024-06-15","certificateNumber":"ACM-2024-MS-771"}'`));

  console.log("\n[12b] Git Status & Commit Log:");
  console.log(sh("git status"));
  console.log(sh("git log -n 1"));
}

run().catch(console.error);
