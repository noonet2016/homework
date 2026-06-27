"use server";

// Teacher login / logout server actions.
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";

export type LoginState = { error?: string; ok?: boolean };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  if (!username || !password) return { error: "กรอกชื่อผู้ใช้และรหัสผ่าน" };

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

  await createSession(user.role, remember);
  return { ok: true };
}

export async function logout(): Promise<void> {
  await destroySession();
}
