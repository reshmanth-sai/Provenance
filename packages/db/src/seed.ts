import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma, hashPassword } from "./index.js";

function deterministicSerialize(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => deterministicSerialize(item)).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const keyValPairs = sortedKeys.map((key) => {
    return JSON.stringify(key) + ":" + deterministicSerialize(obj[key]);
  });
  return "{" + keyValPairs.join(",") + "}";
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function sha256Buffer(data: Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function computeContentHash(canonicalData: any): string {
  return sha256(deterministicSerialize(canonicalData));
}

async function main() {
  console.log("🌱 Starting Canonical Provenance Database Seed...");

  // 1. Platform Admin User
  const adminEmail = "admin@provenance.test";
  const adminPassword = "AdminPass123!";
  const adminHash = await hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: "platform_admin" },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      role: "platform_admin",
    },
  });

  // 2. Approved Issuer: Acme University
  const acmeStaffEmail = "issuer@provenance.test";
  const acmeStaffPass = "IssuerPass123!";
  const acmeStaffHash = await hashPassword(acmeStaffPass);

  const acmeStaffUser = await prisma.user.upsert({
    where: { email: acmeStaffEmail },
    update: { passwordHash: acmeStaffHash, role: "issuer_staff" },
    create: {
      email: acmeStaffEmail,
      passwordHash: acmeStaffHash,
      role: "issuer_staff",
    },
  });

  const acmeIssuer = await prisma.issuer.upsert({
    where: { domain: "acme.edu" },
    update: {
      name: "Acme University",
      status: "approved",
      approvedBy: adminUser.id,
      approvedAt: new Date("2026-01-15T10:00:00Z"),
    },
    create: {
      name: "Acme University",
      domain: "acme.edu",
      status: "approved",
      approvedBy: adminUser.id,
      approvedAt: new Date("2026-01-15T10:00:00Z"),
    },
  });

  await prisma.issuerUser.upsert({
    where: { id: "acme-staff-link" },
    update: {},
    create: {
      id: "acme-staff-link",
      issuerId: acmeIssuer.id,
      userId: acmeStaffUser.id,
      role: "staff",
    },
  });

  // 3. Approved Issuer: Stanford University
  const stanfordStaffEmail = "registrar@stanford.edu";
  const stanfordStaffPass = "StanfordStaff123!";
  const stanfordStaffHash = await hashPassword(stanfordStaffPass);

  const stanfordStaffUser = await prisma.user.upsert({
    where: { email: stanfordStaffEmail },
    update: { passwordHash: stanfordStaffHash, role: "issuer_staff" },
    create: {
      email: stanfordStaffEmail,
      passwordHash: stanfordStaffHash,
      role: "issuer_staff",
    },
  });

  const stanfordIssuer = await prisma.issuer.upsert({
    where: { domain: "stanford.edu" },
    update: {
      name: "Stanford University",
      status: "approved",
      approvedBy: adminUser.id,
      approvedAt: new Date("2026-02-01T14:30:00Z"),
    },
    create: {
      name: "Stanford University",
      domain: "stanford.edu",
      status: "approved",
      approvedBy: adminUser.id,
      approvedAt: new Date("2026-02-01T14:30:00Z"),
    },
  });

  await prisma.issuerUser.upsert({
    where: { id: "stanford-staff-link" },
    update: {},
    create: {
      id: "stanford-staff-link",
      issuerId: stanfordIssuer.id,
      userId: stanfordStaffUser.id,
      role: "staff",
    },
  });

  // 4. Pending Issuer: Apex Institute of Technology
  const apexStaffEmail = "dean@apex.edu";
  const apexStaffPass = "ApexStaff123!";
  const apexStaffHash = await hashPassword(apexStaffPass);

  const apexStaffUser = await prisma.user.upsert({
    where: { email: apexStaffEmail },
    update: { passwordHash: apexStaffHash, role: "issuer_staff" },
    create: {
      email: apexStaffEmail,
      passwordHash: apexStaffHash,
      role: "issuer_staff",
    },
  });

  const apexIssuer = await prisma.issuer.upsert({
    where: { domain: "apex.edu" },
    update: {
      name: "Apex Institute of Technology",
      status: "pending",
      approvedBy: null,
      approvedAt: null,
    },
    create: {
      name: "Apex Institute of Technology",
      domain: "apex.edu",
      status: "pending",
      approvedBy: null,
      approvedAt: null,
    },
  });

  await prisma.issuerUser.upsert({
    where: { id: "apex-staff-link" },
    update: {},
    create: {
      id: "apex-staff-link",
      issuerId: apexIssuer.id,
      userId: apexStaffUser.id,
      role: "staff",
    },
  });

  // 5. Candidate 1: Alex Rivera (@alex_rivera)
  const alexEmail = "candidate@provenance.test";
  const candidatePass = "CandidatePass123!";
  const candidateHash = await hashPassword(candidatePass);

  const alexUser = await prisma.user.upsert({
    where: { email: alexEmail },
    update: { passwordHash: candidateHash, role: "candidate" },
    create: {
      email: alexEmail,
      passwordHash: candidateHash,
      role: "candidate",
    },
  });

  await prisma.candidateProfile.upsert({
    where: { userId: alexUser.id },
    update: {
      name: "Alex Rivera",
      publicUsername: "alex_rivera",
      headline: "Senior Infrastructure Engineer",
      bio: "Specializing in distributed computing, cryptographic ledgers, and zero-trust credentials.",
    },
    create: {
      userId: alexUser.id,
      name: "Alex Rivera",
      publicUsername: "alex_rivera",
      headline: "Senior Infrastructure Engineer",
      bio: "Specializing in distributed computing, cryptographic ledgers, and zero-trust credentials.",
    },
  });

  // 6. Candidate 2: Clara Oswald (@clara_o)
  const claraEmail = "clara.oswald@example.com";
  const claraUser = await prisma.user.upsert({
    where: { email: claraEmail },
    update: { passwordHash: candidateHash, role: "candidate" },
    create: {
      email: claraEmail,
      passwordHash: candidateHash,
      role: "candidate",
    },
  });

  await prisma.candidateProfile.upsert({
    where: { userId: claraUser.id },
    update: {
      name: "Clara Oswald",
      publicUsername: "clara_o",
      headline: "Quantum Systems Researcher",
      bio: "Focusing on applied quantum computing and mathematical verification algorithms.",
    },
    create: {
      userId: claraUser.id,
      name: "Clara Oswald",
      publicUsername: "clara_o",
      headline: "Quantum Systems Researcher",
      bio: "Focusing on applied quantum computing and mathematical verification algorithms.",
    },
  });

  // 7. Candidate 3: Devon Miles (@devon_m)
  const devonEmail = "devon.miles@example.com";
  const devonUser = await prisma.user.upsert({
    where: { email: devonEmail },
    update: { passwordHash: candidateHash, role: "candidate" },
    create: {
      email: devonEmail,
      passwordHash: candidateHash,
      role: "candidate",
    },
  });

  await prisma.candidateProfile.upsert({
    where: { userId: devonUser.id },
    update: {
      name: "Devon Miles",
      publicUsername: "devon_m",
      headline: "Data Platform Architect",
    },
    create: {
      userId: devonUser.id,
      name: "Devon Miles",
      publicUsername: "devon_m",
      headline: "Data Platform Architect",
    },
  });

  // 8. Ensure test files exist in storage/uploads
  const candidates = [
    path.resolve(process.cwd(), "storage/uploads"),
    path.resolve(process.cwd(), "../../storage/uploads"),
  ];
  const uploadsDir = candidates.find((c) => fs.existsSync(path.dirname(c))) || candidates[0];
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Seed real, structurally valid PDFs. A stub buffer starting with "%PDF-1.4" passes
  // magic-byte validation but has no xref table, objects, or trailer, so the issuer's
  // document preview fails to render it -- which broke the most important review screen.
  const fixtureCandidates = [
    path.resolve(process.cwd(), "test-fixtures"),
    path.resolve(process.cwd(), "../../test-fixtures"),
  ];
  const fixturesDir = fixtureCandidates.find((c) => fs.existsSync(c));

  const readFixturePdf = (name: string): Buffer => {
    if (fixturesDir) {
      const fixturePath = path.join(fixturesDir, name);
      if (fs.existsSync(fixturePath)) return fs.readFileSync(fixturePath);
    }
    console.warn(
      `WARNING: fixture ${name} not found. Writing a placeholder; the issuer document preview will not render.`
    );
    return Buffer.from(`%PDF-1.4 placeholder for ${name}`, "utf8");
  };

  const docKey1 = "acme-sample-doc-1.pdf";
  const docKey2 = "acme-flagged-doc-2.pdf";
  const doc1Content = readFixturePdf("clean-degree.pdf");
  const doc2Content = readFixturePdf("flagged-degree.pdf");
  fs.writeFileSync(path.join(uploadsDir, docKey1), doc1Content);
  fs.writeFileSync(path.join(uploadsDir, docKey2), doc2Content);

  // 9. Create Documents & Analyses
  const doc1 = await prisma.document.upsert({
    where: { id: "doc-seed-alex-bs" },
    update: { storageKey: docKey1, rawFileHash: sha256Buffer(doc1Content) },
    create: {
      id: "doc-seed-alex-bs",
      candidateId: alexUser.id,
      storageKey: docKey1,
      originalMimeType: "application/pdf",
      rawFileHash: sha256Buffer(doc1Content),
      canonicalContentHash: sha256("canonical-alex-bs"),
      uploadedAt: new Date("2026-02-10T09:00:00Z"),
    },
  });

  const doc2 = await prisma.document.upsert({
    where: { id: "doc-seed-clara-cert" },
    update: { storageKey: docKey2, rawFileHash: sha256Buffer(doc2Content) },
    create: {
      id: "doc-seed-clara-cert",
      candidateId: claraUser.id,
      storageKey: docKey2,
      originalMimeType: "application/pdf",
      rawFileHash: sha256Buffer(doc2Content),
      canonicalContentHash: sha256("canonical-clara-cert"),
      uploadedAt: new Date("2026-03-01T11:00:00Z"),
    },
  });

  await prisma.documentAnalysis.deleteMany({ where: { documentId: doc2.id } });
  await prisma.documentAnalysis.createMany({
    data: [
      {
        documentId: doc2.id,
        signalType: "editing_software_detected",
        signalValue: {
          fact: "Metadata indicates document was prepared using PHOTOSHOP",
          disclaimer: "Editing software presence does not by itself prove fraudulent alteration.",
        },
        severity: "review_recommended",
      },
      {
        documentId: doc2.id,
        signalType: "modification_time_gap",
        signalValue: {
          fact: "Modification timestamp is 5200 hours after initial creation",
          disclaimer: "Time gaps can legitimately occur during administrative workflows.",
        },
        severity: "review_recommended",
      },
    ],
  });

  // 10. Populate Credentials across all 5 statuses
  // Status A: Verified Credential on Acme (Alex B.S.)
  const credVerified = await prisma.credential.upsert({
    where: { id: "cred-alex-cs-verified" },
    update: { status: "verified" },
    create: {
      id: "cred-alex-cs-verified",
      candidateId: alexUser.id,
      issuerId: acmeIssuer.id,
      documentId: doc1.id,
      source: "self_submitted",
      status: "verified",
      credentialType: "degree",
      credentialTitle: "B.S. in Computer Science",
      issueDate: new Date("2021-05-20T00:00:00Z"),
      certificateNumber: "ACM-2021-CS-101",
    },
  });

  // Status B: Revoked Credential on Acme (Alex AWS Certificate)
  const credRevoked = await prisma.credential.upsert({
    where: { id: "cred-alex-aws-revoked" },
    update: { status: "revoked" },
    create: {
      id: "cred-alex-aws-revoked",
      candidateId: alexUser.id,
      issuerId: acmeIssuer.id,
      source: "issuer_issued",
      status: "revoked",
      credentialType: "certificate",
      credentialTitle: "AWS Certified Solutions Architect",
      issueDate: new Date("2022-08-15T00:00:00Z"),
      certificateNumber: "CERT-2022-REV-09",
    },
  });

  // Status C: Unverified Credential (Alex CKA)
  await prisma.credential.upsert({
    where: { id: "cred-alex-cka-unverified" },
    update: { status: "unverified", claimedIssuerName: "Cloud Native Computing Foundation" },
    create: {
      id: "cred-alex-cka-unverified",
      candidateId: alexUser.id,
      source: "self_submitted",
      status: "unverified",
      credentialType: "certificate",
      credentialTitle: "Certified Kubernetes Administrator (CKA)",
      claimedIssuerName: "Cloud Native Computing Foundation",
      issueDate: new Date("2023-11-01T00:00:00Z"),
    },
  });

  // Status D: Pending Verification Request (Clara Certificate on Acme)
  const credPending = await prisma.credential.upsert({
    where: { id: "cred-clara-cloud-pending" },
    update: { status: "pending" },
    create: {
      id: "cred-clara-cloud-pending",
      candidateId: claraUser.id,
      issuerId: acmeIssuer.id,
      documentId: doc2.id,
      source: "self_submitted",
      status: "pending",
      credentialType: "certificate",
      credentialTitle: "Certificate in Cloud Architecture",
      issueDate: new Date("2023-09-15T00:00:00Z"),
      certificateNumber: "ACM-CLOUD-2023",
    },
  });

  await prisma.verificationRequest.upsert({
    where: { id: "req-clara-cloud-pending" },
    update: { status: "pending" },
    create: {
      id: "req-clara-cloud-pending",
      credentialId: credPending.id,
      candidateId: claraUser.id,
      issuerId: acmeIssuer.id,
      status: "pending",
      requestedAt: new Date("2026-03-01T11:05:00Z"),
    },
  });

  // Status E: Rejected Verification Request (Devon Honorary PhD)
  const credRejected = await prisma.credential.upsert({
    where: { id: "cred-devon-phd-rejected" },
    update: { status: "rejected" },
    create: {
      id: "cred-devon-phd-rejected",
      candidateId: devonUser.id,
      issuerId: acmeIssuer.id,
      source: "self_submitted",
      status: "rejected",
      credentialType: "degree",
      credentialTitle: "Honorary Doctorate in Engineering",
      issueDate: new Date("2024-01-01T00:00:00Z"),
    },
  });

  await prisma.verificationRequest.upsert({
    where: { id: "req-devon-phd-rejected" },
    update: { status: "rejected", resolvedBy: acmeStaffUser.id },
    create: {
      id: "req-devon-phd-rejected",
      credentialId: credRejected.id,
      candidateId: devonUser.id,
      issuerId: acmeIssuer.id,
      status: "rejected",
      requestedAt: new Date("2026-02-15T10:00:00Z"),
      resolvedAt: new Date("2026-02-16T14:00:00Z"),
      resolvedBy: acmeStaffUser.id,
    },
  });

  // Status F: Stanford Verified Credential (Clara M.S.)
  const credStanford = await prisma.credential.upsert({
    where: { id: "cred-clara-stanford-ms" },
    update: { status: "verified" },
    create: {
      id: "cred-clara-stanford-ms",
      candidateId: claraUser.id,
      issuerId: stanfordIssuer.id,
      source: "issuer_issued",
      status: "verified",
      credentialType: "degree",
      credentialTitle: "Master of Science in Applied Physics",
      issueDate: new Date("2023-06-18T00:00:00Z"),
      certificateNumber: "STAN-2023-MS-402",
    },
  });

  // 11. Construct Mathematically Linked Per-Issuer Hash Chains
  // --- ACME UNIVERSITY HASH CHAIN ---
  await prisma.credentialEvent.deleteMany({ where: { issuerId: acmeIssuer.id } });

  // Event 1: Genesis Block - Direct Issue Alex AWS
  const acmeData1 = {
    credentialId: credRevoked.id,
    issuerId: acmeIssuer.id,
    candidateId: alexUser.id,
    credentialType: "certificate",
    credentialTitle: "AWS Certified Solutions Architect",
    issuedAt: "2026-01-20T10:00:00Z",
    issuedBy: acmeStaffUser.id,
  };
  const acmeHash1 = computeContentHash(acmeData1);
  const eventAcme1 = await prisma.credentialEvent.create({
    data: {
      issuerId: acmeIssuer.id,
      credentialId: credRevoked.id,
      eventType: "issued",
      canonicalData: acmeData1,
      contentHash: acmeHash1,
      prevHash: null,
      createdAt: new Date("2026-01-20T10:00:00Z"),
      createdBy: acmeStaffUser.id,
    },
  });

  // Event 2: Verify Alex B.S.
  const acmeData2 = {
    credentialId: credVerified.id,
    issuerId: acmeIssuer.id,
    candidateId: alexUser.id,
    credentialType: "degree",
    credentialTitle: "B.S. in Computer Science",
    verifiedAt: "2026-02-12T14:00:00Z",
    verifiedBy: acmeStaffUser.id,
  };
  const acmeHash2 = computeContentHash(acmeData2);
  const eventAcme2 = await prisma.credentialEvent.create({
    data: {
      issuerId: acmeIssuer.id,
      credentialId: credVerified.id,
      eventType: "verified",
      canonicalData: acmeData2,
      contentHash: acmeHash2,
      prevHash: acmeHash1,
      createdAt: new Date("2026-02-12T14:00:00Z"),
      createdBy: acmeStaffUser.id,
    },
  });

  // Event 3: Revoke Alex AWS (Completing realistic issue -> verify -> revoke lifecycle)
  const acmeData3 = {
    credentialId: credRevoked.id,
    issuerId: acmeIssuer.id,
    candidateId: alexUser.id,
    revokedAt: "2026-02-25T16:00:00Z",
    revokedBy: acmeStaffUser.id,
    reason: "Credential superseded by professional recertification",
  };
  const acmeHash3 = computeContentHash(acmeData3);
  await prisma.credentialEvent.create({
    data: {
      issuerId: acmeIssuer.id,
      credentialId: credRevoked.id,
      eventType: "revoked",
      canonicalData: acmeData3,
      contentHash: acmeHash3,
      prevHash: acmeHash2,
      createdAt: new Date("2026-02-25T16:00:00Z"),
      createdBy: acmeStaffUser.id,
    },
  });

  // --- STANFORD UNIVERSITY HASH CHAIN ---
  await prisma.credentialEvent.deleteMany({ where: { issuerId: stanfordIssuer.id } });

  const stanfordData1 = {
    credentialId: credStanford.id,
    issuerId: stanfordIssuer.id,
    candidateId: claraUser.id,
    credentialType: "degree",
    credentialTitle: "Master of Science in Applied Physics",
    issuedAt: "2026-02-05T09:30:00Z",
    issuedBy: stanfordStaffUser.id,
  };
  const stanfordHash1 = computeContentHash(stanfordData1);
  await prisma.credentialEvent.create({
    data: {
      issuerId: stanfordIssuer.id,
      credentialId: credStanford.id,
      eventType: "issued",
      canonicalData: stanfordData1,
      contentHash: stanfordHash1,
      prevHash: null,
      createdAt: new Date("2026-02-05T09:30:00Z"),
      createdBy: stanfordStaffUser.id,
    },
  });

  // 12. Create Audit Log entries for platform oversight
  await prisma.auditLog.deleteMany({});
  await prisma.auditLog.createMany({
    data: [
      {
        action: "institution_approved",
        actorId: adminUser.id,
        targetType: "institution",
        targetId: acmeIssuer.id,
        metadata: { institutionName: acmeIssuer.name, domain: acmeIssuer.domain },
        createdAt: new Date("2026-01-15T10:00:00Z"),
      },
      {
        action: "institution_approved",
        actorId: adminUser.id,
        targetType: "institution",
        targetId: stanfordIssuer.id,
        metadata: { institutionName: stanfordIssuer.name, domain: stanfordIssuer.domain },
        createdAt: new Date("2026-02-01T14:30:00Z"),
      },
    ],
  });

  console.log("\n================================================================================");
  console.log("CANONICAL PROVENANCE SEED COMPLETE");
  console.log("================================================================================");
  console.log("Platform Accounts Created:");
  console.log("  1. Platform Admin:      admin@provenance.test          (Password: AdminPass123!)");
  console.log("  2. Acme Staff:          issuer@provenance.test         (Password: IssuerPass123!)");
  console.log("  3. Stanford Staff:      registrar@stanford.edu         (Password: StanfordStaff123!)");
  console.log("  4. Apex Staff (Pending):dean@apex.edu                  (Password: ApexStaff123!)");
  console.log("  5. Candidate (Alex):    candidate@provenance.test      (Password: CandidatePass123!)");
  console.log("  6. Candidate (Clara):   clara.oswald@example.com       (Password: CandidatePass123!)");
  console.log("  7. Candidate (Devon):   devon.miles@example.com        (Password: CandidatePass123!)");
  console.log("--------------------------------------------------------------------------------");
  console.log("Realistic Data Spread:");
  console.log("  - Issuers:     2 Approved (Acme, Stanford), 1 Pending (Apex)");
  console.log("  - Credentials: Spread across verified, revoked, unverified, pending, rejected");
  console.log("  - Hash Chains: Acme (3 mathematically linked blocks), Stanford (1 block)");
  console.log("  - Queue:       1 pending verification request in Acme's queue with document & signals");
  console.log("================================================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
