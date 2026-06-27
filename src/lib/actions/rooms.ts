"use server";

// Server Actions for Room CRUD (Next 16 server functions).
// TODO(M5): every action must verify auth (session.user) before mutating.
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function createRoom(formData: FormData) {
  await requireTeacher();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const icon = String(formData.get("icon") ?? "").trim() || "🧩";

  const last = await prisma.room.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.room.create({
    data: {
      name,
      icon,
      slug: "room-" + randomUUID().slice(0, 8),
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath("/");
}

export async function deleteRoom(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.room.delete({ where: { id } });
  revalidatePath("/");
}

export async function renameRoom(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await prisma.room.update({ where: { id }, data: { name } });
  revalidatePath("/");
}

// M4e — edit room name + icon (icon falls back to existing when blank). (Mejiro/GLM, Rudolf-verified)
export async function updateRoomDetails(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  if (!id || !name) return;
  await prisma.room.update({
    where: { id },
    data: { name, ...(icon ? { icon } : {}) },
  });
  revalidatePath("/");
}

// M4e — duplicate a room with customizable options (students, scores, tasks). (Mejiro/GLM, Rudolf-verified)
export async function duplicateRoom(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const name = String(formData.get("name") ?? "").trim();
  const includeStudents = formData.get("includeStudents") === "true";
  const includeScores = formData.get("includeScores") === "true";
  const includeTasks = formData.get("includeTasks") === "true";

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      tasks: true,
      students: {
        include: {
          scores: true,
        },
      },
    },
  });
  if (!room) return;

  const last = await prisma.room.findFirst({ orderBy: { sortOrder: "desc" } });
  const targetName = name || `${room.name} (สำเนา)`;

  // 1. Create Room
  const newRoom = await prisma.room.create({
    data: {
      name: targetName,
      icon: room.icon,
      slug: "room-" + randomUUID().slice(0, 8),
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  // 2. Create Tasks if includeTasks is true
  const taskMap: Record<string, string> = {};
  if (includeTasks) {
    for (const t of room.tasks) {
      const newTask = await prisma.task.create({
        data: {
          roomId: newRoom.id,
          name: t.name,
          taskIndex: t.taskIndex,
          imageUrl: t.imageUrl,
        },
      });
      taskMap[t.id] = newTask.id;
    }
  }

  // 3. Create Students if includeStudents is true
  if (includeStudents) {
    for (const s of room.students) {
      const newStudent = await prisma.student.create({
        data: {
          roomId: newRoom.id,
          name: s.name,
          nickname: s.nickname,
          number: s.number,
          code: s.code,
        },
      });

      // 4. Create Scores if includeScores and includeTasks are also true
      if (includeScores && includeTasks) {
        for (const sc of s.scores) {
          const newTaskId = taskMap[sc.taskId];
          if (newTaskId) {
            await prisma.score.create({
              data: {
                studentId: newStudent.id,
                taskId: newTaskId,
                value: sc.value,
              },
            });
          }
        }
      }
    }
  }

  revalidatePath("/");
}

// M4e — reorder rooms based on drag-and-drop sorting in the lobby dashboard. (Mejiro/GLM, Rudolf-verified)
export async function reorderRooms(ids: string[]) {
  await requireTeacher();
  for (let i = 0; i < ids.length; i++) {
    await prisma.room.update({
      where: { id: ids[i] },
      data: { sortOrder: i },
    });
  }
  revalidatePath("/");
}
