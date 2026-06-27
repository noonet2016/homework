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

// M4e — duplicate a room with its tasks (no students/scores copied). (Mejiro/GLM, Rudolf-verified)
export async function duplicateRoom(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const room = await prisma.room.findUnique({
    where: { id },
    include: { tasks: true },
  });
  if (!room) return;
  const last = await prisma.room.findFirst({ orderBy: { sortOrder: "desc" } });
  const newRoom = await prisma.room.create({
    data: {
      name: `${room.name} (สำเนา)`,
      icon: room.icon,
      slug: "room-" + randomUUID().slice(0, 8),
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  await prisma.task.createMany({
    data: room.tasks.map((t) => ({
      roomId: newRoom.id,
      name: t.name,
      taskIndex: t.taskIndex,
      imageUrl: t.imageUrl,
    })),
  });
  revalidatePath("/");
}
