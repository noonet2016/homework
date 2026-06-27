// Lightweight teacher-mode auth (single-role "teacher mode", mirrors the GAS
// admin-password concept). Session = a signed, httpOnly cookie (HMAC-SHA256
// with SESSION_SECRET). No external auth provider.
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "hw_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export type Session = { isTeacher: boolean; role: string | null };

export async function createSession(role = "TEACHER"): Promise<void> {
  const payload = JSON.stringify({ role, exp: Date.now() + MAX_AGE * 1000 });
  const value = Buffer.from(payload).toString("base64url");
  const token = `${value}.${sign(value)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<Session> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return { isTeacher: false, role: null };
  const [value, sig] = token.split(".");
  if (!value || !sig || sign(value) !== sig) return { isTeacher: false, role: null };
  try {
    const data = JSON.parse(Buffer.from(value, "base64url").toString());
    if (!data.exp || Date.now() > data.exp) return { isTeacher: false, role: null };
    return { isTeacher: true, role: data.role ?? "TEACHER" };
  } catch {
    return { isTeacher: false, role: null };
  }
}

// Call at the top of every mutating Server Action.
export async function requireTeacher(): Promise<void> {
  const s = await getSession();
  if (!s.isTeacher) throw new Error("ต้องเข้าสู่โหมดคุณครูก่อน");
}
