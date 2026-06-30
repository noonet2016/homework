// Trusted-device persistent-login helpers (selector:validator pattern).
// Server-only module (uses next/headers cookies + node crypto). The raw
// validator never touches the DB — only its sha256 hash is stored.
import { cookies } from "next/headers";
import crypto from "crypto";

export const DEVICE_COOKIE = "hw_device";
export const PAUSE_COOKIE = "hw_device_pause";
export const DEVICE_AGE_SEC = 60 * 60 * 24 * 90; // 90 days

function cookieOpts() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function genToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashValidator(v: string): string {
  return crypto.createHash("sha256").update(v).digest("hex");
}

export async function setDeviceCookie(
  selector: string,
  validator: string,
): Promise<void> {
  const store = await cookies();
  store.set(DEVICE_COOKIE, `${selector}:${validator}`, {
    ...cookieOpts(),
    maxAge: DEVICE_AGE_SEC,
  });
}

export async function clearDeviceCookie(): Promise<void> {
  const store = await cookies();
  store.delete(DEVICE_COOKIE);
}

export async function readDeviceCookie(): Promise<{
  selector: string;
  validator: string;
} | null> {
  const store = await cookies();
  const raw = store.get(DEVICE_COOKIE)?.value;
  if (!raw) return null;
  const idx = raw.indexOf(":");
  if (idx <= 0) return null;
  const selector = raw.slice(0, idx);
  const validator = raw.slice(idx + 1);
  if (!selector || !validator) return null;
  return { selector, validator };
}

// Session-scoped pause (no maxAge => cleared when the browser closes). Set on
// logout so device auto-login does not immediately re-log the user in.
export async function pauseDeviceAutoLogin(): Promise<void> {
  const store = await cookies();
  store.set(PAUSE_COOKIE, "1", cookieOpts());
}

export async function clearDevicePause(): Promise<void> {
  const store = await cookies();
  store.delete(PAUSE_COOKIE);
}

export async function isDeviceAutoLoginPaused(): Promise<boolean> {
  const store = await cookies();
  return !!store.get(PAUSE_COOKIE)?.value;
}
