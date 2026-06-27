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
  if (!roomId || !name) return;

  const last = await prisma.task.findFirst({
    where: { roomId },
    orderBy: { taskIndex: "desc" },
  });
  await prisma.task.create({
    data: { roomId, name, taskIndex: (last?.taskIndex ?? 0) + 1 },
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

export async function renameTask(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await prisma.task.update({ where: { id }, data: { name } });
  revalidatePath(`/rooms/${roomId}`);
}
