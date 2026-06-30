"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createRoom } from "@/lib/actions/rooms";

const ROOM_ICONS = [
  '🧩', '🚀', '🎯', '📚', '🧪', '🌟', '🎨', '🧮', '🔬', '🛰️', '🎵', '🏅', '🏆', '📘', '💡', '🛠️', '🧭', '🎓', '📈', '📝',
  '📐', '🧬', '🌍', '🗺️', '⚙️', '🔧', '🧰', '🔭', '🪐', '☀️', '🌈', '🌻', '🍀', '⚡', '🔥', '💎', '🏵️', '🎖️', '🏁', '🎬',
  '🎤', '🎧', '🎹', '🥁', '🎸', '🎻', '🏀', '⚽', '🏸', '🏓', '♟️', '📌', '📎', '🗂️', '🧾', '📊', '📋', '🗃️', '🪄'
];

interface RoomCreateCardProps {
  usedIcons: string[];
}

export default function RoomCreateCard({ usedIcons }: RoomCreateCardProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🧩");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = () => {
    setOpen(false);
    setName("");
    setSelectedIcon("🧩");
  };

  // Filter available icons
  const availableIcons = ROOM_ICONS.filter(emoji => !usedIcons.includes(emoji) || emoji === selectedIcon);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-[28px] border-2 border-dashed border-[#c8d6ee] bg-white p-6 text-center text-[#42537c] font-bold hover:bg-slate-50 transition-colors"
      >
        + เพิ่มห้องเรียนใหม่
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[1000003] grid place-items-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm md:max-w-md animate-modal-pop text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 modal-close-btn text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
            <h2 className="text-base font-bold text-slate-700 mb-4">สร้างห้องเรียนใหม่</h2>
            <form action={createRoom} onSubmit={handleSubmit} className="flex flex-col">
              <input type="hidden" name="icon" value={selectedIcon} />

              <label className="text-xs font-bold text-slate-500" htmlFor="new-room-name">
                ชื่อห้องเรียน
              </label>
              <input
                id="new-room-name"
                name="name"
                type="text"
                placeholder="ชื่อห้อง เช่น ป.4/1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mt-1 mb-3"
              />

              <label className="text-xs font-bold text-slate-500">
                ไอคอนห้องเรียน
              </label>
              
              <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded-xl mt-1">
                {availableIcons.map((emoji) => {
                  const active = selectedIcon === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedIcon(emoji)}
                      className={`w-9 h-9 rounded-lg border text-xl grid place-items-center cursor-pointer transition-colors ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-400 mt-1 mb-3">
                {availableIcons.length > 0
                  ? 'ระบบแสดงเฉพาะไอคอนที่ยังไม่ถูกใช้'
                  : 'ไม่มีไอคอนว่างแล้ว กรุณาแก้ไขจากห้องเดิมก่อน'}
              </p>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm"
                >
                  สร้างห้องเรียน
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
