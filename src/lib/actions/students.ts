"use server";

// Server Actions for Student CRUD (Next 16 server functions).
// TODO(M5): every action must verify auth (session.user) before mutating.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function createStudent(formData: FormData) {
  await requireTeacher();
  const roomId = String(formData.get("roomId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!roomId || !name) return;
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const code = String(formData.get("code") ?? "").trim() || null;
  const numberRaw = String(formData.get("number") ?? "").trim();
  const number = numberRaw ? Number(numberRaw) : null;

  await prisma.student.create({
    data: { roomId, name, nickname, code, number: Number.isNaN(number) ? null : number },
  });
  revalidatePath(`/rooms/${roomId}`);
}

export async function deleteStudent(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!id) return;
  await prisma.student.delete({ where: { id } });
  revalidatePath(`/rooms/${roomId}`);
}

export async function renameStudent(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await prisma.student.update({ where: { id }, data: { name } });
  revalidatePath(`/rooms/${roomId}`);
}

export async function updateStudent(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !roomId || !name) return;

  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const code = String(formData.get("code") ?? "").trim() || null;
  const numberRaw = String(formData.get("number") ?? "").trim();
  const number = numberRaw ? Number(numberRaw) : null;

  await prisma.student.update({
    where: { id },
    data: {
      name,
      nickname,
      code,
      number: Number.isNaN(number) ? null : number,
    },
  });
  revalidatePath(`/rooms/${roomId}`);
}
