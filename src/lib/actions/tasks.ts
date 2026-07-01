"use server";

// Server Actions for Task CRUD (Next 16 server functions).
// TODO(M5): every action must verify auth (session.user) before mutating.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function createTask(formData: FormData) {
  await requireTeacher();
  const roomId = String(formData.get("roomId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const maxScore = Number(formData.get("maxScore") ?? "0") || 0;
  if (!roomId || !name) return;

  const last = await prisma.task.findFirst({
    where: { roomId },
    orderBy: { taskIndex: "desc" },
  });
  await prisma.task.create({
    data: { roomId, name, maxScore, taskIndex: (last?.taskIndex ?? 0) + 1 },
  });
  revalidatePath(`/rooms/${roomId}`);
}

export async function deleteTask(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!id) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath(`/rooms/${roomId}`);
}

export async function deleteTasksBulk(roomId: string, ids: string[]) {
  await requireTeacher();
  if (!ids.length) return;
  await prisma.task.deleteMany({ where: { id: { in: ids } } });
  revalidatePath(`/rooms/${roomId}`);
}

export async function renameTask(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await prisma.task.update({ where: { id }, data: { name } });
  revalidatePath(`/rooms/${roomId}`);
}

export async function reorderTasks(formData: FormData) {
  await requireTeacher();
  const roomId = String(formData.get("roomId") ?? "");
  const ids = String(formData.get("ids") ?? "").split(",").filter(Boolean);
  if (!ids.length) return;
  await Promise.all(ids.map((id, i) => prisma.task.update({ where: { id }, data: { taskIndex: i + 1 } })));
  revalidatePath("/rooms/" + roomId);
}

// ── Batch save (rename / imageUrl / maxScore / visible / taskIndex) ──────────
export type TaskBatchItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  maxScore: number;
  visible: boolean;
  taskIndex: number;
};

export async function saveTasksBatch(roomId: string, tasks: TaskBatchItem[]) {
  await requireTeacher();
  if (!roomId) return;
  await prisma.$transaction(
    tasks.map((t) =>
      prisma.task.update({
        where: { id: t.id },
        data: {
          name: t.name,
          imageUrl: t.imageUrl,
          maxScore: Number(t.maxScore) || 0,
          visible: t.visible,
          taskIndex: t.taskIndex,
        },
      }),
    ),
  );
  revalidatePath(`/rooms/${roomId}`);
}

// ── Copy all tasks from source room into destination room ────────────────────
export async function copyTasksFromRoom(roomId: string, sourceRoomId: string) {
  await requireTeacher();
  if (!roomId || !sourceRoomId || roomId === sourceRoomId) return;

  const sourceTasks = await prisma.task.findMany({
    where: { roomId: sourceRoomId },
    orderBy: { taskIndex: "asc" },
  });
  if (sourceTasks.length === 0) return;

  const last = await prisma.task.findFirst({
    where: { roomId },
    orderBy: { taskIndex: "desc" },
  });
  let baseIndex = last?.taskIndex ?? 0;

  const created = await prisma.$transaction(
    sourceTasks.map((t) =>
      prisma.task.create({
        data: {
          roomId,
          name: t.name,
          taskIndex: ++baseIndex,
          imageUrl: t.imageUrl,
          maxScore: t.maxScore,
          visible: t.visible,
        },
      }),
    ),
  );

  revalidatePath(`/rooms/${roomId}`);
  return created.map((t) => ({
    id: t.id,
    name: t.name,
    taskIndex: t.taskIndex,
    imageUrl: t.imageUrl,
    maxScore: t.maxScore,
    visible: t.visible,
  }));
}

// ── Clear all scores for one task ────────────────────────────────────────────
export async function clearTaskScores(taskId: string, roomId: string) {
  await requireTeacher();
  if (!taskId) return;
  await prisma.score.deleteMany({ where: { taskId } });
  revalidatePath(`/rooms/${roomId}`);
}
