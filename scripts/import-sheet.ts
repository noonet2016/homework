// One-off importer: GAS Google Sheet (exported xlsx → scratch/sheets.json) → MySQL.
// Idempotent: wipes Room/Student/Task/Score (cascade) then re-inserts from the sheet.
// Source of truth = the _LearnTrackingConfig sheet (room list) + one sheet per room.
// Run: npx tsx scripts/import-sheet.ts
import "dotenv/config"; // load DATABASE_URL from .env (tsx doesn't auto-load it)
import { readFileSync } from "fs";
import { prisma } from "../src/lib/prisma";

type Sheet = { rows: (string | number)[][]; nrows: number; ncols: number };
type Sheets = Record<string, Sheet>;

const CONFIG = "_LearnTrackingConfig";
const ACTIVITY = "_LearnTrackingActivity";

function norm(v: unknown): string {
  return String(v ?? "").trim();
}

async function main() {
  const data: Sheets = JSON.parse(
    readFileSync(new URL("../scratch/sheets.json", import.meta.url), "utf8")
  );

  // 1) wipe (children first; FK cascade would handle it but be explicit)
  await prisma.score.deleteMany();
  await prisma.student.deleteMany();
  await prisma.task.deleteMany();
  await prisma.room.deleteMany();

  // 2) room list from config sheet (skip header row)
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

  for (let i = 0; i < roomDefs.length; i++) {
    const def = roomDefs[i];
    const sheet = data[def.sheetName];
    if (!sheet || sheet.rows.length < 1) {
      console.warn(`! room sheet not found, skipping: ${def.sheetName}`);
      continue;
    }
    const header = sheet.rows[0].map(norm);

    // layout: col0=เลขที่, col1=รหัสนักเรียน, col2=ชื่อ-นามสกุล, col3..=tasks, then รวม, ชื่อเล่น
    const totalIdx = header.findIndex((h) => h === "รวม");
    let nickIdx = header.findIndex((h) => h === "ชื่อเล่น");
    const taskEnd = totalIdx === -1 ? header.length : totalIdx; // exclusive
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

    // tasks = columns 3..taskEnd with a non-empty header
    const taskCols: { idx: number; name: string }[] = [];
    for (let c = 3; c < taskEnd; c++) {
      const name = header[c];
      if (!name) continue;
      taskCols.push({ idx: c, name });
    }
    const taskIdByCol = new Map<number, string>();
    for (let t = 0; t < taskCols.length; t++) {
      const tk = await prisma.task.create({
        data: { roomId: room.id, name: taskCols[t].name, taskIndex: t + 1 },
      });
      taskIdByCol.set(taskCols[t].idx, tk.id);
      nTasks++;
    }

    // students = data rows with a non-empty name (col2)
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

      // scores: only persist non-zero cells (missing = 0 in the UI)
      const scoreData: { studentId: string; taskId: string; value: number }[] = [];
      for (const { idx } of taskCols) {
        const raw = row[idx];
        const value = typeof raw === "number" ? raw : parseFloat(norm(raw));
        if (!value || Number.isNaN(value)) continue;
        scoreData.push({ studentId: student.id, taskId: taskIdByCol.get(idx)!, value });
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

  // 3) Import Task Images / Assets from _TaskAssetsDump if available
  const assetsSheet = data["_TaskAssetsDump"];
  if (assetsSheet) {
    console.log("\nImporting task assets/images...");
    let nImages = 0;
    for (const row of assetsSheet.rows.slice(1)) {
      const key = norm(row[0]);
      const jsonStr = norm(row[1]);
      if (!key.startsWith("LT_TASK_ASSETS_") || !jsonStr) continue;

      const roomName = key.replace("LT_TASK_ASSETS_", "").trim();
      const room = await prisma.room.findFirst({
        where: { name: roomName },
      });
      if (!room) continue;

      try {
        const assets = JSON.parse(jsonStr);
        for (const asset of assets) {
          if (!asset.imageUrl) continue;
          
          const task = await prisma.task.findFirst({
            where: {
              roomId: room.id,
              name: asset.name.trim(),
            },
          });
          if (task) {
            await prisma.task.update({
              where: { id: task.id },
              data: { imageUrl: asset.imageUrl },
            });
            nImages++;
          }
        }
      } catch (err) {
        console.error(`Failed to parse assets JSON for ${roomName}:`, err);
      }
    }
    console.log(`✓ Imported ${nImages} task images/worksheets`);
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
