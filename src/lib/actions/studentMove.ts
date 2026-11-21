"use server";

// Move a student to another room, carrying their scores along.
//
// Why this is not just `student.roomId = X`: tasks (ใบงาน) belong to a room, and a Score
// points at a Task. Parallel rooms (e.g. หุ่นยนต์ 4-1 / 4-3) have similar but not identical
// task lists — names differ in spacing and some slots are different work entirely — so every
// score must be re-pointed at a task in the destination room, chosen by the teacher.
//
// A student who studies several subjects exists once per subject room, linked by `code`
// (รหัสนักเรียน). The teacher can move just this subject or every subject at once; each
// subject is its own "leg" with its own destination room, roll number and task mapping.
//
// The Student row keeps its id, so id-based QR links (/grade|/view/<room>/<student>) still
// work: those pages resolve the student's current room (see their page.tsx).
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export type MoveTask = { id: string; name: string; taskIndex: number; maxScore: number };
export type MoveRoom = { id: string; name: string; icon: string | null; subject: string; tasks: MoveTask[] };
export type MoveScore = { taskId: string; taskName: string; taskIndex: number; value: number };
export type MoveEnrollment = {
  studentId: string;
  roomId: string;
  roomName: string;
  number: number | null;
  scores: MoveScore[]; // only non-zero scores — a 0 is the same as "not submitted"
};
export type MovePlan = {
  name: string;
  code: string | null;
  enrollments: MoveEnrollment[]; // first = the room the teacher opened
  rooms: MoveRoom[];
};

/** Strip the class part of a room name so parallel rooms share a key: "หุ่นยนต์ 4-3" → "หุ่นยนต์". */
function subjectKey(roomName: string): string {
  return roomName.replace(/\s*\d+\s*[-/]\s*\d+\s*$/, "").trim();
}

export async function getMovePlan(studentId: string): Promise<MovePlan | null> {
  await requireTeacher();
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  // Same person in other subject rooms = same school-wide code. No code → this room only.
  const siblings = student.code
    ? await prisma.student.findMany({ where: { code: student.code, NOT: { id: student.id } } })
    : [];
  const people = [student, ...siblings];

  const [rooms, scores] = await Promise.all([
    prisma.room.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        icon: true,
        tasks: {
          orderBy: { taskIndex: "asc" },
          select: { id: true, name: true, taskIndex: true, maxScore: true },
        },
      },
    }),
    prisma.score.findMany({
      where: { studentId: { in: people.map((p) => p.id) }, value: { not: 0 } },
      select: { studentId: true, value: true, task: { select: { id: true, name: true, taskIndex: true } } },
    }),
  ]);
  const roomName = new Map(rooms.map((r) => [r.id, r.name]));
  const roomsOut: MoveRoom[] = rooms.map((r) => ({ ...r, subject: subjectKey(r.name) }));

  const enrollments: MoveEnrollment[] = people.map((p) => ({
    studentId: p.id,
    roomId: p.roomId,
    roomName: roomName.get(p.roomId) ?? "",
    number: p.number,
    scores: scores
      .filter((s) => s.studentId === p.id)
      .map((s) => ({ taskId: s.task.id, taskName: s.task.name, taskIndex: s.task.taskIndex, value: s.value }))
      .sort((a, b) => a.taskIndex - b.taskIndex),
  }));

  return { name: student.name, code: student.code, enrollments, rooms: roomsOut };
}

/** For each score: an existing destination task id, "new" (copy the task over), or "drop". */
export type TaskChoice = string; // task id | "new" | "drop"
export type MoveLeg = {
  studentId: string;
  toRoomId: string;
  number: number;
  choices: Record<string, TaskChoice>; // source taskId → choice
};
export type MoveResult = { ok: true } | { ok: false; error: string };

export async function moveStudent(legs: MoveLeg[]): Promise<MoveResult> {
  await requireTeacher();
  if (!legs.length) return { ok: false, error: "ไม่ได้เลือกวิชาที่จะย้าย" };

  try {
    const touched = new Set<string>();
    await prisma.$transaction(async (tx) => {
      for (const leg of legs) {
        const student = await tx.student.findUnique({ where: { id: leg.studentId } });
        if (!student) throw new UserError("ไม่พบนักเรียน (อาจถูกลบไปแล้ว)");
        if (student.roomId === leg.toRoomId) throw new UserError("ห้องปลายทางต้องไม่ใช่ห้องเดิม");
        if (!Number.isInteger(leg.number) || leg.number < 1) throw new UserError("กรุณากรอกเลขที่ให้ถูกต้อง");

        const dest = await tx.room.findUnique({
          where: { id: leg.toRoomId },
          include: { tasks: true },
        });
        if (!dest) throw new UserError("ไม่พบห้องปลายทาง");

        if (student.code) {
          const dup = await tx.student.findFirst({ where: { roomId: dest.id, code: student.code } });
          if (dup) throw new UserError(`ห้อง ${dest.name} มีนักเรียนรหัส ${student.code} อยู่แล้ว`);
        }
        const numberTaken = await tx.student.findFirst({ where: { roomId: dest.id, number: leg.number } });
        if (numberTaken) throw new UserError(`ห้อง ${dest.name} มีเลขที่ ${leg.number} แล้ว (${numberTaken.name})`);

        const scores = await tx.score.findMany({ where: { studentId: student.id }, include: { task: true } });
        const destTaskIds = new Set(dest.tasks.map((t) => t.id));
        const used = new Set<string>();
        let nextIndex = dest.tasks.reduce((m, t) => Math.max(m, t.taskIndex), 0);

        for (const s of scores) {
          // 0 = not submitted; nothing worth carrying.
          if (s.value === 0) {
            await tx.score.delete({ where: { id: s.id } });
            continue;
          }
          const choice = leg.choices[s.taskId];
          if (!choice) throw new UserError(`ยังไม่ได้เลือกปลายทางของงาน "${s.task.name}"`);
          if (choice === "drop") {
            await tx.score.delete({ where: { id: s.id } });
            continue;
          }
          let targetId = choice;
          if (choice === "new") {
            const created = await tx.task.create({
              data: {
                roomId: dest.id,
                name: s.task.name,
                maxScore: s.task.maxScore,
                imageUrl: s.task.imageUrl,
                visible: s.task.visible,
                taskIndex: ++nextIndex,
              },
            });
            targetId = created.id;
          } else if (!destTaskIds.has(choice)) {
            throw new UserError(`งานปลายทางของ "${s.task.name}" ไม่ได้อยู่ในห้อง ${dest.name}`);
          }
          if (used.has(targetId)) throw new UserError(`มีงานสองชิ้นถูกจับคู่ไปที่งานเดียวกันในห้อง ${dest.name}`);
          used.add(targetId);
          await tx.score.update({ where: { id: s.id }, data: { taskId: targetId } });
        }

        await tx.student.update({ where: { id: student.id }, data: { roomId: dest.id, number: leg.number } });
        touched.add(student.roomId);
        touched.add(dest.id);
      }
    });
    for (const id of touched) revalidatePath(`/rooms/${id}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error("moveStudent failed", e);
    return { ok: false, error: "ย้ายไม่สำเร็จ ข้อมูลยังอยู่ที่เดิมทั้งหมด ลองใหม่อีกครั้ง" };
  }
}

class UserError extends Error {}
