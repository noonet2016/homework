const fs = require("fs");
const path = require("path");

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

const CONFIG = "_LearnTrackingConfig";
const ACTIVITY = "_LearnTrackingActivity";

function norm(v) {
  return String(v ?? "").trim();
}

async function main() {
  const sheetsJsonPath = path.join(__dirname, "..", "scratch", "sheets.json");
  if (!fs.existsSync(sheetsJsonPath)) {
    console.error(`Error: sheets.json not found at: ${sheetsJsonPath}`);
    console.error("Please upload sheets.json to the 'scratch' directory using Plesk File Manager first.");
    process.exit(1);
  }

  console.log("Reading sheets.json...");
  const data = JSON.parse(fs.readFileSync(sheetsJsonPath, "utf8"));

  // 1) wipe (cascade)
  console.log("Cleaning existing database tables...");
  await prisma.score.deleteMany();
  await prisma.student.deleteMany();
  await prisma.task.deleteMany();
  await prisma.room.deleteMany();

  // 2) room list from config
  const cfg = data[CONFIG];
  if (!cfg) throw new Error(`missing ${CONFIG} sheet`);
  const roomDefs = cfg.rows
    .slice(1)
    .map((r) => ({ sheetName: norm(r[0]), displayName: norm(r[1]), icon: norm(r[2]) }))
    .filter((r) => r.sheetName);

  let nRooms = 0,
    nTasks = 0,
    nStudents = 0,
    nScores = 0;

  console.log("Importing classrooms, students, assignments, and scores...");
  for (let i = 0; i < roomDefs.length; i++) {
    const def = roomDefs[i];
    const sheet = data[def.sheetName];
    if (!sheet || sheet.rows.length < 1) {
      console.warn(`! room sheet not found, skipping: ${def.sheetName}`);
      continue;
    }
    const header = sheet.rows[0].map(norm);

    const totalIdx = header.findIndex((h) => h === "รวม");
    let nickIdx = header.findIndex((h) => h === "ชื่อเล่น");
    const taskEnd = totalIdx === -1 ? header.length : totalIdx;
    if (nickIdx === -1) nickIdx = header.length - 1;

    const room = await prisma.room.create({
      data: {
        name: def.displayName || def.sheetName,
        icon: def.icon || "🧩",
        slug: `room-${i + 1}`,
        sortOrder: i + 1,
      },
    });
    nRooms++;

    const taskCols = [];
    for (let c = 3; c < taskEnd; c++) {
      const name = header[c];
      if (!name) continue;
      taskCols.push({ idx: c, name });
    }
    
    const taskIdByCol = new Map();
    for (let t = 0; t < taskCols.length; t++) {
      const tk = await prisma.task.create({
        data: { roomId: room.id, name: taskCols[t].name, taskIndex: t + 1 },
      });
      taskIdByCol.set(taskCols[t].idx, tk.id);
      nTasks++;
    }

    for (const row of sheet.rows.slice(1)) {
      const name = norm(row[2]);
      if (!name) continue;
      const numRaw = norm(row[0]);
      const number = /^\d+$/.test(numRaw) ? parseInt(numRaw, 10) : null;
      const code = norm(row[1]) || null;
      const nickname = norm(row[nickIdx]) || null;

      const student = await prisma.student.create({
        data: { roomId: room.id, name, nickname, number, code },
      });
      nStudents++;

      const scoreData = [];
      for (const { idx } of taskCols) {
        const raw = row[idx];
        const value = typeof raw === "number" ? raw : parseFloat(norm(raw));
        if (!value || Number.isNaN(value)) continue;
        scoreData.push({ studentId: student.id, taskId: taskIdByCol.get(idx), value });
      }
      if (scoreData.length) {
        await prisma.score.createMany({ data: scoreData });
        nScores += scoreData.length;
      }
    }
    console.log(
      `✓ ${def.displayName}: ${taskCols.length} tasks, students+scores imported`
    );
  }

  console.log(
    `\nDONE → rooms=${nRooms} tasks=${nTasks} students=${nStudents} scores=${nScores}`
  );
  console.log(`(ignored meta sheet: ${ACTIVITY})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
