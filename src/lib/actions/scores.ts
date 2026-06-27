"use server";

// Server Action for recording a score (Student × Task cell).
// TODO(M5): every action must verify auth (session.user) before mutating.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Upsert a single grade cell. value=0 means "not done yet".
export async function setScore(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!studentId || !taskId) return;

  const value = Number(String(formData.get("value") ?? "0")) || 0;

  await prisma.score.upsert({
    where: { studentId_taskId: { studentId, taskId } },
    create: { studentId, taskId, value },
    update: { value },
  });
  revalidatePath(`/rooms/${roomId}`);
}
