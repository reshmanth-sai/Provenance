import fs from "fs";

const API = "http://localhost:4000";

async function run() {
  console.log("Seeding test data for dark/light mode audits...");

  // 1. Register candidate if not exists
  let candToken = "";
  try {
    const regRes = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "candidate@provenance.test",
        password: "CandidatePass123!",
        role: "candidate",
      }),
    });
    const regData = await regRes.json();
    candToken = regData.accessToken;
  } catch (e) {}

  if (!candToken) {
    const loginRes = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "candidate@provenance.test",
        password: "CandidatePass123!",
      }),
    });
    const loginData = await loginRes.json();
    candToken = loginData.accessToken;
  }

  // 2. Candidate profile
  await fetch(`${API}/candidate/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${candToken}`,
    },
    body: JSON.stringify({
      name: "Alex Rivera",
      publicUsername: "alex_rivera",
      headline: "Senior Cryptographic Engineer",
      bio: "Building decentralized protocols, verifiable compute, and post-quantum zero-knowledge proof systems.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    }),
  });

  // 3. Admin login to approve institution
  const adminRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@provenance.test",
      password: "AdminPass123!",
    }),
  });
  const adminToken = (await adminRes.json()).accessToken;

  // 4. Register Stanford University issuer
  let issuerToken = "";
  try {
    await fetch(`${API}/issuer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institutionName: "Stanford University",
        domain: "stanford.edu",
        contactEmail: "registrar@stanford.edu",
        password: "StanfordPass123!",
      }),
    });
  } catch (e) {}

  // 5. Approve Stanford institution
  const pendingRes = await fetch(`${API}/admin/institutions/pending`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const pendingData = await pendingRes.json();
  const stanford = (pendingData.institutions || []).find((i) => i.domain === "stanford.edu");
  if (stanford) {
    await fetch(`${API}/admin/institutions/${stanford.id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // Login as Stanford
  const issuerRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "registrar@stanford.edu",
      password: "StanfordPass123!",
    }),
  });
  const issuerData = await issuerRes.json();
  issuerToken = issuerData.accessToken;

  // 6. Direct issue a verified credential from Stanford to candidate
  let verifiedCredId = "";
  const issueRes = await fetch(`${API}/issuer/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${issuerToken}`,
    },
    body: JSON.stringify({
      candidateEmail: "candidate@provenance.test",
      credentialType: "degree",
      credentialTitle: "M.S. in Computer Science & Distributed Systems",
      issueDate: "2024-06-12",
      certificateNumber: "STAN-2024-CS-9402",
    }),
  });
  const issueData = await issueRes.json();
  if (issueData?.credential) {
    verifiedCredId = issueData.credential.id;
    console.log("Verified Credential Created:", verifiedCredId);
  }

  // 7. Self-upload a document as candidate and request verification
  const pdfBytes = fs.readFileSync("test-fixtures/clean-degree.pdf");
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const form = new FormData();
  form.append("file", blob, "clean-degree.pdf");
  form.append("claimedIssuerName", "Stanford University");
  form.append("credentialType", "certificate");
  form.append("credentialTitle", "Advanced Cryptographic Engineering");
  form.append("certificateNumber", "STAN-ADV-CRYPT-2024");
  form.append("issueDate", "2024-01-15");

  const uploadRes = await fetch(`${API}/documents/self-upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${candToken}` },
    body: form,
  });
  const uploadData = await uploadRes.json();
  if (uploadData?.document?.id) {
    await fetch(`${API}/documents/${uploadData.document.id}/request-verification`, {
      method: "POST",
      headers: { Authorization: `Bearer ${candToken}` },
    });
    console.log("Uploaded self-credential and requested verification!");
  }

  console.log("Seed finished! Verified Credential ID:", verifiedCredId);
  fs.writeFileSync("test-fixtures/seeded-ids.json", JSON.stringify({ verifiedCredId }));
}

run().catch(console.error);
