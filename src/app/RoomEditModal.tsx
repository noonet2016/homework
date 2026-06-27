'use client';

// M4e — teacher-only inline edit modal for a classroom card. (Mejiro/GLM, Rudolf-verified)
import { useState } from 'react';
import { updateRoomDetails } from '@/lib/actions/rooms';

interface RoomEditModalProps {
  id: string;
  name: string;
  icon: string;
}

export default function RoomEditModal({ id, name, icon }: RoomEditModalProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        title="แก้ไขห้อง"
        className="text-slate-300 hover:text-indigo-500 text-lg leading-none px-1"
        onClick={() => setOpen(true)}
      >
        <i className="fa-solid fa-pen" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-slate-700 mb-4">แก้ไขห้องเรียน</h2>
            <form action={updateRoomDetails} onSubmit={handleSubmit} className="flex flex-col">
              <input type="hidden" name="id" value={id} />

              <label className="text-xs font-bold text-slate-500" htmlFor={`name-${id}`}>
                ชื่อห้องเรียน
              </label>
              <input
                id={`name-${id}`}
                name="name"
                type="text"
                defaultValue={name}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mt-1 mb-3"
              />

              <label className="text-xs font-bold text-slate-500" htmlFor={`icon-${id}`}>
                ไอคอน (emoji)
              </label>
              <input
                id={`icon-${id}`}
                name="icon"
                type="text"
                defaultValue={icon}
                maxLength={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mt-1 mb-3"
              />

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
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
