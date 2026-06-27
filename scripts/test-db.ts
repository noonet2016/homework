// Runtime smoke test: prove the Prisma 7 + MariaDB adapter path works
// (create -> read -> delete a Room). Run: npx tsx scripts/test-db.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const slug = "smoke-" + process.pid + "-" + Math.floor(process.hrtime()[1]);
  const room = await prisma.room.create({
    data: { name: "ทดสอบ ป.4/1", slug, icon: "🧪" },
  });
  console.log("✓ created:", room.id, room.name, room.icon);

  const fetched = await prisma.room.findUnique({ where: { id: room.id } });
  console.log("✓ read back:", fetched?.name);

  const count = await prisma.room.count();
  console.log("✓ room count:", count);

  await prisma.room.delete({ where: { id: room.id } });
  console.log("✓ cleaned up. RUNTIME ADAPTER OK");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("✗ FAILED:", e);
    process.exit(1);
  });
