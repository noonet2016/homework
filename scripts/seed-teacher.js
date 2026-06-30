const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// 1. Load environment variables from .env
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("#")) return;
    const hasEquals = trimmedLine.includes("=");
    const hasColon = trimmedLine.includes(":");
    if (!hasEquals && !hasColon) return;
    const separator = hasEquals ? "=" : ":";
    const [key, ...valueParts] = trimmedLine.split(separator);
    const trimmedKey = key.trim();
    let value = valueParts.join(separator).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[trimmedKey] = value;
  });
}

// 2. Initialize Prisma Client
const { PrismaClient } = require("../src/generated/prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL is not set!");
  process.exit(1);
}

const adapter = new PrismaMariaDb(dbUrl);
const prisma = new PrismaClient({ adapter });

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
