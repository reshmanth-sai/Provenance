import dotenv from "dotenv";
dotenv.config();

import { prisma, hashPassword } from "./index.js";

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Platform Admin User (Created first so admin ID can be referenced in relations)
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

  // 2. Candidate Test User
  const candidateEmail = "candidate@provenance.test";
  const candidatePassword = "CandidatePass123!";
  const candidateHash = await hashPassword(candidatePassword);

  const candidateUser = await prisma.user.upsert({
    where: { email: candidateEmail },
    update: { passwordHash: candidateHash, role: "candidate" },
    create: {
      email: candidateEmail,
      passwordHash: candidateHash,
      role: "candidate",
    },
  });

  // 3. Issuer & Issuer Staff User
  const issuerEmail = "issuer@provenance.test";
  const issuerPassword = "IssuerPass123!";
  const issuerHash = await hashPassword(issuerPassword);

  const issuerStaffUser = await prisma.user.upsert({
    where: { email: issuerEmail },
    update: { passwordHash: issuerHash, role: "issuer_staff" },
    create: {
      email: issuerEmail,
      passwordHash: issuerHash,
      role: "issuer_staff",
    },
  });

  const issuer = await prisma.issuer.upsert({
    where: { domain: "acme.edu" },
    update: {
      name: "Acme University",
      status: "approved",
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
    create: {
      name: "Acme University",
      domain: "acme.edu",
      status: "approved",
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
  });

  const existingIssuerUser = await prisma.issuerUser.findFirst({
    where: { issuerId: issuer.id, userId: issuerStaffUser.id },
  });

  if (!existingIssuerUser) {
    await prisma.issuerUser.create({
      data: {
        issuerId: issuer.id,
        userId: issuerStaffUser.id,
        role: "staff",
      },
    });
  }

  console.log("Seeding complete! Test accounts created:\n");
  console.log("--------------------------------------------------");
  console.log("1. Platform Admin Account:");
  console.log(`   Email:    ${adminUser.email}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role:     ${adminUser.role}`);
  console.log(`   ID:       ${adminUser.id}`);
  console.log("--------------------------------------------------");
  console.log("2. Candidate Account:");
  console.log(`   Email:    ${candidateUser.email}`);
  console.log(`   Password: ${candidatePassword}`);
  console.log(`   Role:     ${candidateUser.role}`);
  console.log("--------------------------------------------------");
  console.log("3. Issuer Staff Account:");
  console.log(`   Email:    ${issuerStaffUser.email}`);
  console.log(`   Password: ${issuerPassword}`);
  console.log(`   Role:     ${issuerStaffUser.role}`);
  console.log(`   Issuer:   ${issuer.name} (${issuer.domain}, status: ${issuer.status})`);
  console.log(`   Approved By: ${issuer.approvedBy}`);
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
