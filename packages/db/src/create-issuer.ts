import dotenv from "dotenv";
dotenv.config();

import { prisma, hashPassword } from "./index.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log(`
================================================================================
PROVENANCE: REGISTER NEW ISSUER & STAFF ACCOUNT
================================================================================
Usage:
  npx tsx packages/db/src/create-issuer.ts "<Institution Name>" "<domain>" "<staffEmail>" "<staffPassword>" [autoApprove: true|false]

Example:
  npx tsx packages/db/src/create-issuer.ts "MIT" "mit.edu" "registrar@mit.edu" "MitPass123!" true
================================================================================
`);
    process.exit(1);
  }

  const [name, domain, staffEmail, staffPassword, autoApproveArg] = args;
  const autoApprove = autoApproveArg !== "false";

  console.log(`\nRegistering new Issuer: "${name}" (${domain})...`);

  // 1. Create or Find Issuer
  const issuer = await prisma.issuer.upsert({
    where: { domain: domain.toLowerCase().trim() },
    update: {
      name: name.trim(),
      status: autoApprove ? "approved" : "pending",
      approvedAt: autoApprove ? new Date() : null,
    },
    create: {
      name: name.trim(),
      domain: domain.toLowerCase().trim(),
      status: autoApprove ? "approved" : "pending",
      approvedAt: autoApprove ? new Date() : null,
    },
  });

  console.log(`   -> Institution created: ID: ${issuer.id} | Status: ${issuer.status}`);

  // 2. Create Staff User
  const passwordHash = await hashPassword(staffPassword);
  const staffUser = await prisma.user.upsert({
    where: { email: staffEmail.toLowerCase().trim() },
    update: {
      passwordHash,
      role: "issuer_staff",
    },
    create: {
      email: staffEmail.toLowerCase().trim(),
      passwordHash,
      role: "issuer_staff",
    },
  });

  console.log(`   -> Staff User created: ${staffUser.email} (Role: ${staffUser.role})`);

  // 3. Link Staff to Issuer
  const linkId = `${issuer.id}-${staffUser.id}`.slice(0, 36);
  await prisma.issuerUser.upsert({
    where: { id: linkId },
    update: {
      issuerId: issuer.id,
      userId: staffUser.id,
      role: "staff",
    },
    create: {
      id: linkId,
      issuerId: issuer.id,
      userId: staffUser.id,
      role: "staff",
    },
  });

  console.log(`   -> Staff successfully linked to ${issuer.name}`);

  console.log(`
================================================================================
SUCCESSFULLY REGISTERED ISSUER
================================================================================
Institution:   ${issuer.name}
Domain:        ${issuer.domain}
Status:        ${issuer.status}
Staff Email:   ${staffUser.email}
Staff Password:${staffPassword}
Login URL:     http://localhost:3000/login
================================================================================
`);
}

main().catch((err) => {
  console.error("Error creating issuer:", err);
  process.exit(1);
});
