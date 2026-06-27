"use client";

import { useState, useEffect, useRef } from "react";
import { createRoom } from "@/lib/actions/rooms";

const ROOM_ICONS = [
  "🧩","🚀","🎯","📚","🧪","🌟","🎨","🧮","🔬","🛰️","🎵","🏅","🏆","📘","💡","🛠️","🧭","🎓","📈","📝",
  "📐","🧬","🌍","🗺️","⚙️","🔧","🧰","🔭","🪐","☀️","🌈","🌻","🍀","⚡","🔥","💎","🏵️","🎖️","🏁","🎬",
  "🎤","🎧","🎹","🥁","🎸","🎻","🏀","⚽","🏸","🏓","♟️","📌","📎","🗂️","🧾","📊","📋","🗃️","🪄",
];

export default function AddRoomModal() {
  const [open, setOpen] = useState(false);
  const [usedIcons, setUsedIcons] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState("");
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      setUsedIcons(detail.usedIcons ?? []);
      const available = ROOM_ICONS.filter((ic) => !(detail.usedIcons ?? []).includes(ic));
      setSelectedIcon(available[0] ?? ROOM_ICONS[0]);
      setOpen(true);
    };
    window.addEventListener("open-add-room-modal", handler);
    return () => window.removeEventListener("open-add-room-modal", handler);
  }, []);

  if (!open) return null;

  const available = ROOM_ICONS.filter((ic) => !usedIcons.includes(ic));
  if (selectedIcon && available.indexOf(selectedIcon) === -1) available.unshift(selectedIcon);

  async function handleSubmit(fd: FormData) {
    fd.set("icon", selectedIcon);
    setPending(true);
    try {
      await createRoom(fd);
      setOpen(false);
      formRef.current?.reset();
      if ((window as any).notify) (window as any).notify("เพิ่มห้องเรียนสำเร็จ", "success");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000003] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 modal-close-btn"
          aria-label="Close"
        >
          ✕
        </button>

        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-slate-800">
          <i className="fa-solid fa-chalkboard-user text-violet-500" /> จัดการห้องเรียน
        </h3>

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">ชื่อห้องเรียน</label>
            <input
              name="name"
              autoFocus
              required
              maxLength={90}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="เช่น ห้องเรียนครูตั๊ก"
            />
            <p className="text-xs text-slate-500 mt-1">แนะนำไม่เกิน 40 ตัวอักษร</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">ไอคอนห้องเรียน</label>
            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
              {available.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-9 h-9 rounded-lg border text-xl grid place-items-center transition-colors ${
                    selectedIcon === icon
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {available.length
                ? "ระบบแสดงเฉพาะไอคอนที่ยังไม่ถูกใช้"
                : "ไม่มีไอคอนว่างแล้ว"}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded bg-slate-200 font-semibold hover:bg-slate-300 transition-colors text-slate-700 flex items-center gap-1"
            >
              <i className="fa-solid fa-xmark" /> ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-1"
            >
              <i className="fa-solid fa-floppy-disk" /> บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
