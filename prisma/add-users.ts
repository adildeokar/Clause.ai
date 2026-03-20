import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      email: "harshad@clauseai.com",
      name: "Harshad Lokhande",
      password: "harshad@123",
      role: "admin",
    },
    {
      email: "adil@clauseai.com",
      name: "Adil Deokar",
      password: "adil@123",
      role: "admin",
    },
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 12);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash: hash, role: user.role, name: user.name },
      create: {
        email: user.email,
        name: user.name,
        passwordHash: hash,
        role: user.role,
        jurisdiction: "IN",
      },
    });
    console.log(`Created: ${created.email} (${created.role})`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
