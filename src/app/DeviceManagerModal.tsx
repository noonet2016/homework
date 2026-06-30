"use client";

import { useEffect, useState } from "react";
import { listDevices, registerDevice, revokeDevice } from "@/lib/actions/device";

type Device = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
};

function notify(msg: string, type: "success" | "info" = "success") {
  if (typeof window !== "undefined") {
    (window as any).notify?.(msg, type);
  }
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Singleton modal opened via the window "open-device-manager" event (teacher only).
export default function DeviceManagerModal() {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const r = await listDevices();
    setDevices(r.devices);
    setLoading(false);
  }

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      load();
    };
    window.addEventListener("open-device-manager", handler);
    return () => window.removeEventListener("open-device-manager", handler);
  }, []);

  const currentRegistered = devices.some((d) => d.current);

  async function handleRegister() {
    setBusy(true);
    try {
      const r = await registerDevice(label || undefined);
      if (r.ok) {
        notify("ลงทะเบียนอุปกรณ์แล้ว", "success");
        setLabel("");
        await load();
      } else {
        notify(r.error || "ลงทะเบียนไม่สำเร็จ", "info");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    setBusy(true);
    try {
      const r = await revokeDevice(id);
      if (r.ok) {
        notify("เพิกถอนอุปกรณ์แล้ว", "success");
        await load();
      } else {
        notify("เพิกถอนไม่สำเร็จ", "info");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000002] bg-black/60 flex items-center justify-center p-4 animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative bg-white rounded-2xl p-6 w-full max-w-md md:max-w-lg shadow-2xl animate-modal-pop text-left max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 modal-close-btn"
          aria-label="Close"
        >
          ✕
        </button>

        <h3 className="text-2xl font-bold mb-1 flex items-center gap-2 text-slate-800">
          <i className="fa-solid fa-shield-halved text-blue-500"></i> อุปกรณ์ที่เชื่อถือ
        </h3>
        <p className="text-slate-500 text-sm mb-4">
          ลงทะเบียนเครื่องที่ใช้ประจำ เพื่อเข้าใช้งานอัตโนมัติโดยไม่ต้องล็อกอิน
        </p>

        {currentRegistered ? (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700 text-sm font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-check"></i> อุปกรณ์นี้ลงทะเบียนแล้ว
          </div>
        ) : (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ชื่ออุปกรณ์ เช่น คอมที่บ้าน"
              maxLength={60}
              className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleRegister}
              disabled={busy}
              className="px-3 py-2 rounded bg-blue-600 text-white font-semibold whitespace-nowrap hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <i className="fa-solid fa-plus mr-1"></i>ลงทะเบียนเครื่องนี้
            </button>
          </div>
        )}

        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">
            อุปกรณ์ที่ลงทะเบียนไว้
          </p>
          {loading ? (
            <p className="text-slate-400 text-sm py-3 text-center">กำลังโหลด…</p>
          ) : devices.length === 0 ? (
            <p className="text-slate-400 text-sm py-3 text-center">
              ยังไม่มีอุปกรณ์ที่ลงทะเบียน
            </p>
          ) : (
            <ul className="space-y-2">
              {devices.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 truncate">
                      {d.label}
                      {d.current && (
                        <span className="ml-1 text-emerald-600 font-semibold">
                          (เครื่องนี้)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">ใช้ล่าสุด: {fmt(d.lastUsedAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(d.id)}
                    disabled={busy}
                    className="shrink-0 px-2.5 py-1.5 rounded text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    <i className="fa-solid fa-trash-can mr-1"></i>เพิกถอน
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
