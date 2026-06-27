// Seed a teacher account for teacher-mode login.
// Usage: npx tsx scripts/seed-teacher.ts [username] [password]
// If password omitted, a random one is generated and printed (set it once, tell the Trainer).
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const username = process.argv[2] || "kru";
  const password =
    process.argv[3] || crypto.randomBytes(6).toString("base64url").slice(0, 10);

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { username },
    create: { username, passwordHash, role: "TEACHER" },
    update: { passwordHash },
  });

  console.log("=== TEACHER ACCOUNT SEEDED ===");
  console.log("username:", username);
  console.log("password:", password);
  console.log("(login at the teacher-mode button; change later if desired)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
