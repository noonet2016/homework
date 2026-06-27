import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type GasBody = {
  fn?: string;
  args?: unknown[];
};

type TaskInput = string | { name?: unknown; imageUrl?: unknown; asset?: unknown };

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isMysqlArg(value: unknown) {
  return value === "mysql";
}

function dropSpreadsheetId(args: unknown[]) {
  return isMysqlArg(args[0]) ? args.slice(1) : args;
}

function taskLabel(index: number) {
  return `งานที่ ${index + 1}`;
}

function normalizeTaskInput(item: TaskInput, index: number) {
  if (typeof item === "string") return { name: item.trim() || taskLabel(index), imageUrl: "" };
  return {
    name: asString(item?.name) || taskLabel(index),
    imageUrl: asString(item?.imageUrl),
  };
}

async function getOrderedRooms() {
  return prisma.room.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

async function getRoomPayload(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      tasks: { orderBy: { taskIndex: "asc" } },
      students: { include: { scores: true }, orderBy: [{ number: "asc" }, { name: "asc" }] },
    },
  });
  if (!room) throw new Error(`ไม่พบห้องเรียน: ${roomId}`);

  const tasks = room.tasks.length
    ? room.tasks
    : await prisma.$transaction(async (tx) => [
        await tx.task.create({ data: { roomId, name: taskLabel(0), taskIndex: 0 } }),
      ]);

  const orderedTasks = [...tasks].sort((a, b) => a.taskIndex - b.taskIndex);
  const taskNames = orderedTasks.map((task, i) => task.name || taskLabel(i));
  const taskItems = orderedTasks.map((task, i) => ({
    name: task.name || taskLabel(i),
    imageUrl: task.imageUrl || "",
    asset: task.imageUrl ? { url: task.imageUrl, name: task.name || taskLabel(i), type: "image/*" } : null,
  }));

  const students = room.students.map((student) => {
    const scores = orderedTasks.map((task) => {
      const score = student.scores.find((s) => s.taskId === task.id);
      return asNumber(score?.value);
    });
    const totalScore = scores.reduce((sum, n) => sum + n, 0);
    return {
      id: student.id,
      studentCode: student.code || "",
      name: student.name,
      nickname: student.nickname || "",
      scores,
      totalScore,
      tasksCompleted: scores.filter((score) => score > 0).length,
    };
  });

  return { students, taskNames, taskItems, totalAssignedTasks: taskNames.length };
}

async function roomStats(roomId: string) {
  const data = await getRoomPayload(roomId);
  const studentCount = data.students.length;
  const submittedCount = data.students.filter((student) =>
    data.totalAssignedTasks > 0 && student.tasksCompleted >= data.totalAssignedTasks
  ).length;
  return {
    sheetName: roomId,
    studentCount,
    submittedCount,
    pendingCount: studentCount - submittedCount,
    submittedPercent: studentCount > 0 ? Math.round((submittedCount / studentCount) * 100) : 0,
    isLazy: false,
  };
}

async function dashboardRooms() {
  const rooms = await getOrderedRooms();
  return rooms.map((room) => ({
    sheetName: room.id,
    displayName: room.name,
    icon: room.icon || "",
    isLazy: true,
  }));
}

async function handleGas(fn: string, rawArgs: unknown[]) {
  const args = dropSpreadsheetId(rawArgs);

  switch (fn) {
    case "getDashboardData": {
      return { rooms: await dashboardRooms() };
    }
    case "getInitialSessionData": {
      const rooms = await dashboardRooms();
      return {
        licenseStatus: { isValid: true, message: "✅ License ถูกต้อง", config: {}, customerName: "mysql" },
        dashboardData: {
          rooms: rooms.map((room) => ({
            ...room,
            studentCount: "...",
            submittedCount: "...",
            pendingCount: "...",
            submittedPercent: 0,
          })),
          summary: { roomCount: rooms.length, studentCount: 0, submittedCount: 0, pendingCount: 0 },
        },
      };
    }
    case "getRoomStats": {
      return roomStats(asString(args[0]));
    }
    case "getRoomStatsBatch": {
      const roomIds = Array.isArray(args[0]) ? args[0].map(asString).filter(Boolean) : [];
      const stats = (await Promise.all(roomIds.map((roomId) => roomStats(roomId).catch(() => null)))).filter(Boolean);
      return { success: true, stats };
    }
    case "fetchStudentData":
    case "fetchStudentDataLite": {
      return getRoomPayload(asString(args[0]));
    }
    case "updateStudentScores": {
      const [roomId, studentId, scoreValues] = args;
      const tasks = await prisma.task.findMany({ where: { roomId: asString(roomId) }, orderBy: { taskIndex: "asc" } });
      const scores = Array.isArray(scoreValues) ? scoreValues : [];
      await Promise.all(
        tasks.map((task, i) =>
          prisma.score.upsert({
            where: { studentId_taskId: { studentId: asString(studentId), taskId: task.id } },
            update: { value: asNumber(scores[i]) },
            create: { studentId: asString(studentId), taskId: task.id, value: asNumber(scores[i]) },
          })
        )
      );
      return { success: true, message: "บันทึกข้อมูลเรียบร้อยแล้ว!" };
    }
    case "createNewRoom": {
      const [displayName, maybeIcon, fallbackIcon] = args;
      const name = asString(displayName);
      if (!name) return { success: false, message: "กรุณากรอกชื่อห้องเรียน" };
      const count = await prisma.room.count();
      const selectedIcon = fallbackIcon ?? maybeIcon;
      const room = await prisma.room.create({
        data: {
          name,
          icon: asString(selectedIcon) || "📚",
          slug: `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sortOrder: count,
          tasks: { create: { name: taskLabel(0), taskIndex: 0 } },
        },
      });
      return { success: true, sheetName: room.id, displayName: room.name, icon: room.icon || "" };
    }
    case "deleteRoom": {
      const roomId = asString(args[0]);
      await prisma.room.delete({ where: { id: roomId } }).catch(() => null);
      return { success: true };
    }
    case "addStudent": {
      const [roomId, studentNo, studentCode, studentName, nickname] = args;
      const name = asString(studentName);
      if (!name) return { success: false, message: "กรุณากรอกชื่อนักเรียน" };
      await prisma.student.create({
        data: {
          roomId: asString(roomId),
          number: asString(studentNo) ? Number(studentNo) : null,
          code: asString(studentCode),
          name,
          nickname: asString(nickname),
        },
      });
      return { success: true, message: "เพิ่มนักเรียนเรียบร้อย" };
    }
    case "deleteStudentsBulk": {
      const [roomId, studentIds] = args;
      const ids = Array.isArray(studentIds) ? studentIds.map(asString).filter(Boolean) : [];
      await prisma.student.deleteMany({ where: { roomId: asString(roomId), id: { in: ids } } });
      return { success: true, message: "ลบเรียบร้อย" };
    }
    case "updateRoomDetails": {
      const [roomId, newDisplayName, newEmoji] = args;
      const name = asString(newDisplayName);
      if (!name) return { success: false, message: "กรุณากรอกชื่อห้องเรียน" };
      await prisma.room.update({ where: { id: asString(roomId) }, data: { name, icon: asString(newEmoji) || undefined } });
      return { success: true };
    }
    case "updateStudentProfile": {
      const [roomId, studentId, studentNo, studentCode, studentName, nickname] = args;
      const name = asString(studentName);
      if (!name) return { success: false, message: "กรุณากรอกชื่อนักเรียน" };
      await prisma.student.update({
        where: { id: asString(studentId), roomId: asString(roomId) },
        data: {
          number: asString(studentNo) ? Number(studentNo) : null,
          code: asString(studentCode),
          name,
          nickname: asString(nickname),
        },
      });
      return { success: true, message: "แก้ไขข้อมูลนักเรียนเรียบร้อย" };
    }
    case "addStudentsBulk": {
      const [roomId, studentsArg] = args;
      const students = Array.isArray(studentsArg) ? studentsArg : [];
      const created = await prisma.$transaction(
        students.map((item, idx) => {
          const row = item as { studentNo?: unknown; studentCode?: unknown; name?: unknown; nickname?: unknown };
          return prisma.student.create({
            data: {
              roomId: asString(roomId),
              number: asString(row.studentNo) ? Number(row.studentNo) : null,
              code: asString(row.studentCode),
              name: asString(row.name) || `Student ${idx + 1}`,
              nickname: asString(row.nickname),
            },
          });
        })
      );
      return {
        success: true,
        summary: { total: students.length, success: created.length, failed: students.length - created.length },
        results: students.map((_, i) => ({ line: i + 1, success: true, message: "เพิ่มสำเร็จ", studentId: created[i]?.id })),
      };
    }
    case "getRoomTasks": {
      const data = await getRoomPayload(asString(args[0]));
      return { success: true, tasks: data.taskNames, taskItems: data.taskItems };
    }
    case "saveRoomTasks": {
      const [roomIdArg, taskInputsArg] = args;
      const roomId = asString(roomIdArg);
      const taskInputs = (Array.isArray(taskInputsArg) ? taskInputsArg : []).map((item, i) =>
        normalizeTaskInput(item as TaskInput, i)
      );
      if (!taskInputs.length) return { success: false, message: "ต้องมีงานอย่างน้อย 1 งาน" };

      const existing = await prisma.task.findMany({ where: { roomId }, include: { scores: true }, orderBy: { taskIndex: "asc" } });
      const byName = new Map(existing.map((task) => [task.name, task]));
      const keepIds: string[] = [];
      for (let i = 0; i < taskInputs.length; i += 1) {
        const input = taskInputs[i];
        const prior = byName.get(input.name) || existing[i];
        const task = prior
          ? await prisma.task.update({ where: { id: prior.id }, data: { name: input.name, imageUrl: input.imageUrl || null, taskIndex: i } })
          : await prisma.task.create({ data: { roomId, name: input.name, imageUrl: input.imageUrl || null, taskIndex: i } });
        keepIds.push(task.id);
      }
      await prisma.task.deleteMany({ where: { roomId, id: { notIn: keepIds } } });
      return { success: true, message: "อัปเดตรายการงานเรียบร้อย", taskCount: taskInputs.length };
    }
    case "reorderRooms": {
      const orderedIds = Array.isArray(args[0]) ? args[0].map(asString).filter(Boolean) : [];
      await prisma.$transaction(
        orderedIds.map((id, sortOrder) => prisma.room.update({ where: { id }, data: { sortOrder } }))
      );
      return { success: true };
    }
    case "getQuickGradeData": {
      const [roomId, studentId] = args;
      const data = await getRoomPayload(asString(roomId));
      const student = data.students.find((item) => String(item.id) === asString(studentId));
      if (!student) return { success: false, message: "ไม่พบนักเรียนตาม QR นี้" };
      return { success: true, student, taskNames: data.taskNames, taskItems: data.taskItems, sheetName: asString(roomId) };
    }
    case "getRoomExportData": {
      const [roomId] = args;
      const data = await getRoomPayload(asString(roomId));
      return {
        success: true,
        sheetName: asString(roomId),
        taskNames: data.taskNames,
        students: data.students.map((student) => ({
          no: "",
          studentId: student.studentCode,
          name: student.name,
          nickname: student.nickname,
          scores: student.scores,
          totalScore: student.totalScore,
        })),
      };
    }
    case "getActivityLog":
      return { success: true, logs: [], activities: [] };
    case "getWebAppUrl":
      return { success: true, url: "" };
    case "getTaskAssets":
      console.warn("TODO gas stub:", fn);
      return {};
    case "uploadTaskImage":
    case "uploadTaskAsset":
      console.warn("TODO gas stub:", fn);
      return { success: true, taskIndex: Number(args[1] ?? args[2] ?? 0), imageUrl: "", asset: null };
    case "clearTaskImage":
      console.warn("TODO gas stub:", fn);
      return { success: true, taskIndex: Number(args[1] ?? 0) };
    case "checkTeacherPassword":
    case "updateTeacherPassword":
    case "activateLicense":
      console.warn("TODO gas stub:", fn);
      return { success: true, isValid: true, message: "OK" };
    case "duplicateRoom":
      console.warn("TODO gas stub:", fn);
      return { success: false, message: "ยังไม่รองรับการทำสำเนาห้องใน MySQL shim" };
    default:
      return { success: false, message: `Unsupported GAS function: ${fn}` };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GasBody;
    if (!body.fn) return NextResponse.json({ success: false, message: "Missing fn" }, { status: 400 });
    return NextResponse.json(await handleGas(body.fn, Array.isArray(body.args) ? body.args : []));
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
