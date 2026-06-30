"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSession, getSession, requireTeacher } from "@/lib/auth";
import {
  DEVICE_AGE_SEC,
  genToken,
  hashValidator,
  setDeviceCookie,
  clearDeviceCookie,
  readDeviceCookie,
  clearDevicePause,
  isDeviceAutoLoginPaused,
} from "@/lib/device";

export async function registerDevice(
  label?: string,
): Promise<{ ok: boolean; error?: string; label?: string }> {
  await requireTeacher();
  const { userId } = await getSession();
  if (!userId) return { ok: false, error: "ไม่พบผู้ใช้" };

  const selector = genToken();
  const validator = genToken();
  const expiresAt = new Date(Date.now() + DEVICE_AGE_SEC * 1000);
  const finalLabel =
    label && label.trim() ? label.trim().slice(0, 60) : "อุปกรณ์นี้";

  await prisma.trustedDevice.create({
    data: {
      userId,
      selector,
      validatorHash: hashValidator(validator),
      label: finalLabel,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  await setDeviceCookie(selector, validator);
  await clearDevicePause();

  return { ok: true, label: finalLabel };
}

export async function tryDeviceLogin(): Promise<{ ok: boolean }> {
  if (await isDeviceAutoLoginPaused()) return { ok: false };

  const parsed = await readDeviceCookie();
  if (!parsed) return { ok: false };

  const row = await prisma.trustedDevice.findUnique({
    where: { selector: parsed.selector },
    include: { user: true },
  });
  if (!row) {
    await clearDeviceCookie();
    return { ok: false };
  }

  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.trustedDevice.delete({ where: { id: row.id } }).catch(() => {});
    await clearDeviceCookie();
    return { ok: false };
  }

  // Constant-time compare of the validator hashes.
  const a = Buffer.from(hashValidator(parsed.validator));
  const b = Buffer.from(row.validatorHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await prisma.trustedDevice.delete({ where: { id: row.id } }).catch(() => {});
    await clearDeviceCookie();
    return { ok: false };
  }

  // Success — rotate the validator (detects token theft on reuse of the old one).
  const newValidator = genToken();
  await prisma.trustedDevice.update({
    where: { id: row.id },
    data: {
      validatorHash: hashValidator(newValidator),
      lastUsedAt: new Date(),
    },
  });
  await setDeviceCookie(row.selector, newValidator);
  await createSession(row.user.role, row.userId, true);

  return { ok: true };
}

export async function listDevices(): Promise<{
  devices: {
    id: string;
    label: string;
    createdAt: string;
    lastUsedAt: string;
    expiresAt: string;
    current: boolean;
  }[];
}> {
  await requireTeacher();
  const { userId } = await getSession();
  if (!userId) return { devices: [] };

  const parsed = await readDeviceCookie();
  const rows = await prisma.trustedDevice.findMany({
    where: { userId },
    orderBy: { lastUsedAt: "desc" },
  });

  return {
    devices: rows.map((r) => ({
      id: r.id,
      label: r.label,
      createdAt: r.createdAt.toISOString(),
      lastUsedAt: r.lastUsedAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
      current: !!parsed && parsed.selector === r.selector,
    })),
  };
}

export async function revokeDevice(id: string): Promise<{ ok: boolean }> {
  await requireTeacher();
  const { userId } = await getSession();
  if (!userId) return { ok: false };

  const row = await prisma.trustedDevice.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return { ok: false };

  const parsed = await readDeviceCookie();
  await prisma.trustedDevice.delete({ where: { id } });
  if (parsed && parsed.selector === row.selector) await clearDeviceCookie();

  return { ok: true };
}
