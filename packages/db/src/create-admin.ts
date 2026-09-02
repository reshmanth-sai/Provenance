import dotenv from "dotenv";
dotenv.config();

import { prisma, hashPassword } from "./index.js";

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || "admin@provenance.test";
  const password = args[1] || "AdminPass123!";

  console.log(`\nProvisioning Platform Admin account for: ${email}...`);

  const passwordHash = await hashPassword(password);

  const adminUser = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: {
      passwordHash,
      role: "platform_admin",
    },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "platform_admin",
    },
  });

  console.log(`
================================================================================
PLATFORM ADMIN ACCOUNT READY
================================================================================
Email:     ${adminUser.email}
Password:  ${password}
Role:      ${adminUser.role}
Login URL: http://localhost:3000/login
Admin URL: http://localhost:3000/admin
================================================================================
`);
}

main().catch((err) => {
  console.error("Error creating admin user:", err);
  process.exit(1);
});
