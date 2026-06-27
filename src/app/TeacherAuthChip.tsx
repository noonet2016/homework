"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { login, logout, type LoginState } from "@/lib/actions/auth";

export default function TeacherAuthChip({ isTeacher }: { isTeacher: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    async (prev, fd) => {
      const res = await login(prev, fd);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
      return res;
    },
    {},
  );

  return (
    <>
      <div className="global-auth-chip fixed right-3 top-3 z-[1000001]">
        <button
          onClick={() =>
            isTeacher
              ? logout().then(() => router.refresh())
              : setOpen(true)
          }
          className="global-auth-btn flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 backdrop-blur px-2.5 py-2 shadow-md hover:shadow-lg transition-all"
        >
          <span
            className={`w-7 h-7 rounded-full grid place-items-center ${
              isTeacher ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
            }`}
          >
            <i
              className={`fa-solid ${
                isTeacher ? "fa-right-from-bracket" : "fa-user-shield"
              } text-xs`}
            />
          </span>
          <span className="global-auth-text text-left leading-tight">
            <span className="block text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              {isTeacher ? "Teacher" : "Guest"}
            </span>
            <span className="block text-xs font-bold text-slate-700">
              {isTeacher ? "ออกจากโหมดคุณครู" : "เข้าสู่โหมดคุณครู"}
            </span>
          </span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[1000002] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">เข้าสู่โหมดคุณครู</h3>
              <button onClick={() => setOpen(false)} className="modal-close-btn">
                ✕
              </button>
            </div>
            <form action={formAction} className="space-y-3">
              <input
                name="username"
                placeholder="ชื่อผู้ใช้"
                autoFocus
                defaultValue="kru"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="password"
                type="password"
                placeholder="รหัสผ่าน"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
              {state.error && (
                <p className="text-sm text-red-500 font-medium">{state.error}</p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-indigo-600 py-2.5 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
