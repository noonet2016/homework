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

export async function createStudentsBulk(formData: FormData) {
  await requireTeacher();
  const roomId = String(formData.get("roomId") ?? "");
  const raw = String(formData.get("lines") ?? "");
  if (!roomId || !raw) return;

  const rows = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      const numberRaw = parts[0] && /^\d+$/.test(parts[0]) ? Number(parts[0]) : null;
      // detect format: if first col is a number → number,code,name,nickname
      if (numberRaw !== null && parts.length >= 3) {
        return {
          number: numberRaw,
          code: parts[1] || null,
          name: parts[2],
          nickname: parts[3] || null,
        };
      }
      // simple: just a name (or name,nickname)
      return {
        number: null,
        code: null,
        name: parts[0],
        nickname: parts[1] || null,
      };
    })
    .filter((r) => r.name);

  if (rows.length === 0) return;

  await prisma.student.createMany({
    data: rows.map((r) => ({ roomId, ...r })),
    skipDuplicates: true,
  });
  revalidatePath(`/rooms/${roomId}`);
}

export async function deleteStudents(formData: FormData) {
  await requireTeacher();
  const roomId = String(formData.get("roomId") ?? "");
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!roomId || ids.length === 0) return;
  await prisma.student.deleteMany({ where: { id: { in: ids } } });
  revalidatePath(`/rooms/${roomId}`);
}
