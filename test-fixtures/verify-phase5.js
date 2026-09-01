const { execSync } = require("child_process");

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

async function run() {
  console.log("================================================================================");
  console.log("FIXTURE SETUP: Register Institutions, Approve Stanford, and Issue Credentials");
  console.log("================================================================================");
  
  const adminToken = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@provenance.test","password":"AdminPass123!"}'`)).accessToken;
  const candToken = JSON.parse(sh(`curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"candidate@provenance.test","password":"CandidatePass123!"}'`)).accessToken;

  // 1. Register Stanford University (pending) and approve it via admin
  const stanfordReg = JSON.parse(sh(`curl -s -X POST http://localhost:4000/issuer/register -H "Content-Type: application/json" -d '{"institutionName":"Stanford University","domain":"stanford.edu","contactEmail":"registrar@stanford.edu","password":"StanfordStaff123!"}'`));
  const stanfordIssuerId = stanfordReg.issuerId;
  sh(`curl -s -X POST http://localhost:4000/admin/institutions/${stanfordIssuerId}/approve -H "Authorization: Bearer ${adminToken}"`);

  // 2. Register MIT (pending) and reject it via admin
  const mitReg = JSON.parse(sh(`curl -s -X POST http://localhost:4000/issuer/register -H "Content-Type: application/json" -d '{"institutionName":"MIT","domain":"mit.edu","contactEmail":"admissions@mit.edu","password":"MitStaff123!"}'`));
  const mitIssuerId = mitReg.issuerId;
  sh(`curl -s -X POST http://localhost:4000/admin/institutions/${mitIssuerId}/reject -H "Authorization: Bearer ${adminToken}"`);

  // 3. Register Caltech (remains pending)
  const caltechReg = JSON.parse(sh(`curl -s -X POST http://localhost:4000/issuer/register -H "Content-Type: application/json" -d '{"institutionName":"Caltech","domain":"caltech.edu","contactEmail":"registrar@caltech.edu","password":"CaltechStaff123!"}'`));
  const caltechIssuerId = caltechReg.issuerId;

  console.log("Institutions configured:");
  console.log("  - Acme University:     Approved (via seed)");
  console.log("  - Stanford University: Approved (via admin approve -> AuditLog written)");
  console.log("  - MIT:                 Rejected (via admin reject -> AuditLog written)");
  console.log("  - Caltech:             Pending");

  console.log("\n================================================================================");
  console.log("STEP 1: Role Enforcement on All /admin/* Routes (403 with Candidate Token)");
  console.log("================================================================================");

  const adminRoutes = [
    "/admin/institutions",
    "/admin/users",
    "/admin/audit-log",
    "/admin/stats",
  ];

  for (const route of adminRoutes) {
    console.log(`\n[1] Testing GET ${route} with Candidate Token (expect 403):`);
    const res = sh(`curl -i -s -X GET http://localhost:4000${route} -H "Authorization: Bearer ${candToken}"`);
    console.log(res);
  }

  console.log("================================================================================");
  console.log("STEP 2: Admin Institutions Oversight (GET /admin/institutions)");
  console.log("================================================================================");
  
  console.log("\n[2a] Full institutions list (all statuses):");
  const allInstJson = JSON.parse(sh(`curl -s -X GET http://localhost:4000/admin/institutions -H "Authorization: Bearer ${adminToken}"`));
  console.log(JSON.stringify(allInstJson, null, 2));

  console.log("\n[2b] Filtered list by status (GET /admin/institutions?status=approved):");
  const approvedInstJson = JSON.parse(sh(`curl -s -X GET "http://localhost:4000/admin/institutions?status=approved" -H "Authorization: Bearer ${adminToken}"`));
  console.log(JSON.stringify(approvedInstJson, null, 2));

  console.log("================================================================================");
  console.log("STEP 3: Admin Users List (GET /admin/users) & Zero passwordHash Leakage Check");
  console.log("================================================================================");
  
  const usersRawStr = sh(`curl -s -X GET http://localhost:4000/admin/users -H "Authorization: Bearer ${adminToken}"`);
  const usersJson = JSON.parse(usersRawStr);
  console.log("Users List Output:\n", JSON.stringify(usersJson, null, 2));

  const hasPasswordHash = usersRawStr.toLowerCase().includes("passwordhash");
  console.log("\n--- Password Hash Leakage Check ---");
  console.log("Contains 'passwordHash' in raw JSON:", hasPasswordHash ? "LEAKED! (ERROR)" : "CLEAN (PASS)");

  console.log("================================================================================");
  console.log("STEP 4: Admin Audit Log (GET /admin/audit-log)");
  console.log("================================================================================");
  
  const auditJson = JSON.parse(sh(`curl -s -X GET http://localhost:4000/admin/audit-log -H "Authorization: Bearer ${adminToken}"`));
  console.log("Audit Log Output:\n", JSON.stringify(auditJson, null, 2));

  const stanfordApproval = auditJson.auditLogs.find(l => l.action === "approve_institution" && l.metadata?.institutionName === "Stanford University");
  console.log("\n--- Specific Event Check in Audit Log ---");
  console.log("Stanford approval entry found:", stanfordApproval ? "YES (PASS)" : "NOT FOUND (FAIL)");
  if (stanfordApproval) {
    console.log("Details:", JSON.stringify(stanfordApproval, null, 2));
  }

  console.log("================================================================================");
  console.log("STEP 5: Platform Aggregate Stats (GET /admin/stats) vs PostgreSQL Cross-Check");
  console.log("================================================================================");
  
  const statsJson = JSON.parse(sh(`curl -s -X GET http://localhost:4000/admin/stats -H "Authorization: Bearer ${adminToken}"`));
  console.log("GET /admin/stats API Response:\n", JSON.stringify(statsJson, null, 2));

  console.log("\n--- Direct PostgreSQL Counts for Verification ---");
  console.log("\n1. Credentials count by status in PostgreSQL:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT status, count(*) FROM \\"Credential\\" GROUP BY status ORDER BY status;"`));

  console.log("\n2. Users count by role in PostgreSQL:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT role, count(*) FROM \\"User\\" GROUP BY role ORDER BY role;"`));

  console.log("\n3. Issuers count by status in PostgreSQL:");
  console.log(sh(`/opt/homebrew/opt/postgresql@16/bin/psql -U postgres -d provenance -c "SELECT status, count(*) FROM \\"Issuer\\" GROUP BY status ORDER BY status;"`));

  console.log("================================================================================");
  console.log("STEP 6: Removed Diagnostic Routes Return 404");
  console.log("================================================================================");
  
  console.log("\n[6a] GET /auth/test-issuer-only (expect 404):");
  console.log(sh(`curl -i -s -X GET http://localhost:4000/auth/test-issuer-only`));

  console.log("\n[6b] GET /auth/test-admin-only (expect 404):");
  console.log(sh(`curl -i -s -X GET http://localhost:4000/auth/test-admin-only`));

  console.log("================================================================================");
  console.log("STEP 7: Git Status & Commit History");
  console.log("================================================================================");
  console.log(sh("git status"));
  console.log(sh("git log -n 1"));
}

run().catch(console.error);
