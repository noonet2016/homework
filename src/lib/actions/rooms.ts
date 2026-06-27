"use server";

// Server Actions for Room CRUD (Next 16 server functions).
// TODO(M5): every action must verify auth (session.user) before mutating.
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createRoom(formData: FormData) {
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
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.room.delete({ where: { id } });
  revalidatePath("/");
}

export async function renameRoom(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await prisma.room.update({ where: { id }, data: { name } });
  revalidatePath("/");
}
