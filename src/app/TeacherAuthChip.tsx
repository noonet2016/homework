"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { login, logout, type LoginState } from "@/lib/actions/auth";

export default function TeacherAuthChip({ isTeacher }: { isTeacher: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const savedPass = localStorage.getItem("LT_ADMIN_PASS_REMEMBER");
    const savedTime = localStorage.getItem("LT_ADMIN_PASS_TIME");
    if (savedPass && savedTime) {
      if (Date.now() - parseInt(savedTime, 10) < 10 * 60 * 1000) {
        setPassword(savedPass);
        setRemember(true);
        // Auto-login ทันทีถ้ายังไม่ได้เป็นครู
        if (!isTeacher) {
          const fd = new FormData();
          fd.append("username", "krutaktan");
          fd.append("password", savedPass);
          fd.append("remember", "on");
          login({}, fd).then((res) => {
            if (res.ok) router.refresh();
          });
        }
      } else {
        localStorage.removeItem("LT_ADMIN_PASS_REMEMBER");
        localStorage.removeItem("LT_ADMIN_PASS_TIME");
      }
    }
  }, []);

  // Allow topbar fa-user-shield button to open the auth modal via custom event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-teacher-auth", handler);
    return () => window.removeEventListener("open-teacher-auth", handler);
  }, []);

  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    async (prev, fd) => {
      const res = await login(prev, fd);
      if (res.ok) {
        const rem = fd.get("remember") === "on";
        const pass = fd.get("password") as string;
        if (rem && pass) {
          localStorage.setItem("LT_ADMIN_PASS_REMEMBER", pass);
          localStorage.setItem("LT_ADMIN_PASS_TIME", Date.now().toString());
        } else {
          localStorage.removeItem("LT_ADMIN_PASS_REMEMBER");
          localStorage.removeItem("LT_ADMIN_PASS_TIME");
        }
        setOpen(false);
        if (typeof window !== "undefined" && (window as any).notify) {
          (window as any).notify("เข้าสู่โหมดคุณครูแล้ว", "success");
        }
        router.refresh();
      } else {
        if (typeof window !== "undefined" && (window as any).notify && res.error) {
          (window as any).notify(res.error, "error");
        }
      }
      return res;
    },
    {},
  );

  return (
    <>
      <div className="global-auth-chip fixed right-3 bottom-4 md:bottom-auto md:top-3 z-[1000001]">
        <button
          onClick={() =>
            isTeacher
              ? setShowLogoutConfirm(true)
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

      {/* Hidden form to trigger browser credentials auto-save and auto-fill */}
      <form className="w-0 h-0 overflow-hidden absolute pointer-events-none" aria-hidden="true">
        <input type="text" name="username" autoComplete="username" defaultValue="krutaktan" readOnly />
        <input type="password" name="password" autoComplete="current-password" value={password} readOnly />
      </form>

      {open && (
        <div
          className="fixed inset-0 z-[1000002] bg-black/60 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 modal-close-btn"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-2 text-center flex items-center justify-center gap-2 text-slate-800">
              <i className="fa-solid fa-chalkboard-user text-blue-500"></i> เข้าสู่โหมดคุณครู
            </h3>
            <p className="text-slate-500 text-sm text-center mb-4">กรุณากรอกชื่อผู้ใช้และรหัสผ่าน</p>
            <form action={formAction} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="username"
                  placeholder="ชื่อผู้ใช้"
                  autoFocus={false}
                  defaultValue="krutaktan"
                  autoComplete="username"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoFocus={true}
                  placeholder="รหัสผ่านครู"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  className="w-full border rounded px-3 py-2 pr-11 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center"
                  aria-label="toggle password"
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-600">จำการเข้าสู่ระบบ 10 นาที</span>
              </label>

              {state.error && (
                <p className="text-sm text-red-500 font-medium">{state.error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded bg-slate-200 font-semibold flex items-center justify-center cursor-pointer hover:bg-slate-300 transition-colors text-slate-700"
                >
                  <i className="fa-solid fa-xmark mr-1"></i>ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[1000002] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute right-3 top-3 modal-close-btn"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-2xl font-black text-[#1e2d52] mb-2 flex items-center gap-2">
              <i className="fa-solid fa-right-from-bracket text-red-500"></i> ยืนยันการออกจากระบบ
            </h3>
            <p className="text-slate-600 mb-5">ต้องการออกจากโหมดคุณครูใช่หรือไม่?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded bg-slate-200 font-semibold flex items-center justify-center cursor-pointer hover:bg-slate-300 transition-colors text-slate-700"
              >
                <i className="fa-solid fa-xmark mr-1"></i>ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout().then(() => {
                    if (typeof window !== "undefined" && (window as any).notify) {
                      (window as any).notify("ออกจากโหมดคุณครูแล้ว", "info");
                    }
                    router.refresh();
                  });
                }}
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors"
              >
                <i className="fa-solid fa-right-from-bracket mr-1"></i>ยืนยันออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
