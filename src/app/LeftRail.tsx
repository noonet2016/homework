"use client";

import { useState } from "react";
import Link from "next/link";

interface LeftRailProps {
  isTeacher: boolean;
  usedIcons?: string[];
}

export default function LeftRail({ isTeacher, usedIcons = [] }: LeftRailProps) {
  const [guideOpen, setGuideOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleAddRoom = () =>
    window.dispatchEvent(new CustomEvent("open-add-room-modal", { detail: { usedIcons } }));

  const handleTeacherAuthClick = () => {
    // Select and click the global auth chip button to trigger login/logout
    const btn = document.querySelector(".global-auth-btn") as HTMLButtonElement | null;
    if (btn) {
      btn.click();
    }
  };

  const openDev = () => window.dispatchEvent(new CustomEvent("open-dev-modal"));

  const openDeviceManager = () =>
    window.dispatchEvent(new CustomEvent("open-device-manager"));

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideRight {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            .animate-slide-right {
              animation: slideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `,
        }}
      />

      {/* Hamburger Toggle Button (Mobile Only) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-600 hover:bg-slate-50 focus:outline-none"
        title="เปิดเมนู"
      >
        <i className="fa-solid fa-bars text-lg" />
      </button>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-[100000] lg:hidden animate-fade-in"
          style={{ display: 'block' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
            onClick={() => setMobileOpen(false)}
          />
          
          {/* Drawer Content */}
          <div 
            className="absolute inset-y-0 left-0 w-64 p-5 flex flex-col gap-6 shadow-2xl animate-slide-right"
            style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center text-lg shadow">
                  <i className="fa-solid fa-rocket" />
                </div>
                <span className="font-black text-base tracking-tight text-white">Learn Tracking</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                style={{ backgroundColor: "#1e293b" }}
              >
                ✕
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
              <span
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white font-bold cursor-pointer"
                style={{ backgroundColor: "#1e293b" }}
              >
                <i className="fa-solid fa-house w-5 text-center text-indigo-400" />
                หน้าหลัก
              </span>

              {isTeacher && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleAddRoom();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white font-semibold cursor-pointer w-full text-left transition hover:bg-slate-800"
                  style={{ backgroundColor: "transparent" }}
                >
                  <i className="fa-solid fa-circle-plus w-5 text-center text-emerald-400" />
                  เพิ่มห้องเรียน
                </button>
              )}

              {isTeacher && (
                <Link
                  href="/reports"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white font-semibold cursor-pointer transition hover:bg-slate-800"
                  style={{ backgroundColor: "transparent" }}
                >
                  <i className="fa-solid fa-chart-simple w-5 text-center text-amber-400" />
                  รายงานความก้าวหน้า
                </Link>
              )}

              {isTeacher && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openDeviceManager();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white font-semibold cursor-pointer w-full text-left transition hover:bg-slate-800"
                  style={{ backgroundColor: "transparent" }}
                >
                  <i className="fa-solid fa-shield-halved w-5 text-center text-blue-400" />
                  อุปกรณ์ที่เชื่อถือ
                </button>
              )}

              <button
                onClick={() => {
                  setMobileOpen(false);
                  setGuideOpen(true);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white font-semibold cursor-pointer w-full text-left transition hover:bg-slate-800"
                style={{ backgroundColor: "transparent" }}
              >
                <i className="fa-solid fa-book-open w-5 text-center text-sky-400" />
                คู่มือการใช้งาน
              </button>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  openDev();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white font-semibold cursor-pointer w-full text-left transition hover:bg-slate-800"
                style={{ backgroundColor: "transparent" }}
              >
                <i className="fa-solid fa-code w-5 text-center text-pink-400" />
                ผู้พัฒนา
              </button>
            </nav>

            {/* Footer (Teacher Auth Toggle) */}
            <div className="border-t border-slate-800 pt-4">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleTeacherAuthClick();
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition shadow-lg"
                style={{ 
                  backgroundColor: isTeacher ? "rgba(244, 63, 94, 0.15)" : "#4f46e5", 
                  color: isTeacher ? "#f43f5e" : "#ffffff",
                  border: isTeacher ? "1px solid rgba(244, 63, 94, 0.3)" : "none"
                }}
              >
                <i className={`fa-solid ${isTeacher ? "fa-right-from-bracket" : "fa-user-shield"}`} />
                {isTeacher ? "ออกจากโหมดครู" : "เข้าสู่โหมดครู"}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="left-rail p-4 hidden lg:flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center text-2xl shadow">
          <i className="fa-solid fa-rocket" />
        </div>
        <span className="rail-btn fa-btn active" title="หน้าหลัก">
          <i className="fa-solid fa-house" />
        </span>
        {isTeacher && (
          <span
            className="rail-btn fa-btn cursor-pointer"
            title="เพิ่มห้องเรียน"
            onClick={handleAddRoom}
          >
            <i className="fa-solid fa-circle-plus" />
          </span>
        )}
        {isTeacher && (
          <Link href="/reports" className="rail-btn fa-btn" title="รายงานความก้าวหน้า">
            <i className="fa-solid fa-chart-simple" />
          </Link>
        )}
        {isTeacher && (
          <span
            className="rail-btn fa-btn cursor-pointer"
            title="อุปกรณ์ที่เชื่อถือ"
            onClick={openDeviceManager}
          >
            <i className="fa-solid fa-shield-halved" />
          </span>
        )}
        <span
          className="rail-btn fa-btn cursor-pointer"
          title="คู่มือการใช้งาน"
          onClick={() => setGuideOpen(true)}
        >
          <i className="fa-solid fa-book-open" />
        </span>
        <span
          className="rail-btn fa-btn cursor-pointer"
          title="ผู้พัฒนา"
          onClick={openDev}
        >
          <i className="fa-solid fa-code" />
        </span>
        <span
          className="rail-btn fa-btn cursor-pointer"
          title={isTeacher ? "ออกจากโหมดคุณครู" : "เข้าสู่โหมดคุณครู"}
          onClick={handleTeacherAuthClick}
        >
          {isTeacher ? (
            <span className="w-8 h-8 rounded-full bg-rose-100 grid place-items-center text-red-600">
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 16 }} />
            </span>
          ) : (
            <i className="fa-solid fa-user-shield" />
          )}
        </span>
      </aside>

      {/* Guide Modal */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-[1000003] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 w-full max-w-xl animate-modal-pop shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setGuideOpen(false)}
              className="absolute right-3 top-3 modal-close-btn"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2 text-slate-800">
              <i className="fa-solid fa-book-open text-blue-500"></i> คู่มือ Learn Tracking
            </h3>
            <p className="text-slate-600 text-base leading-relaxed">
              คลิกห้องเรียนเพื่อดูรายชื่อนักเรียนและคะแนน, โหมดคุณครูใช้สำหรับแก้ไขคะแนน/จัดการห้อง
            </p>
          </div>
        </div>
      )}
    </>
  );
}
