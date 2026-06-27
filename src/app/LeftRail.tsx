"use client";

import { useState } from "react";
import Link from "next/link";

interface LeftRailProps {
  isTeacher: boolean;
}

export default function LeftRail({ isTeacher }: LeftRailProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  const handleTeacherAuthClick = () => {
    // Select and click the global auth chip button to trigger login/logout
    const btn = document.querySelector(".global-auth-btn") as HTMLButtonElement | null;
    if (btn) {
      btn.click();
    }
  };

  const openDev = () => window.dispatchEvent(new CustomEvent("open-dev-modal"));

  return (
    <>
      <aside className="left-rail p-4 hidden lg:flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center text-2xl shadow">
          <i className="fa-solid fa-rocket" />
        </div>
        <span className="rail-btn fa-btn active" title="หน้าหลัก">
          <i className="fa-solid fa-house" />
        </span>
        {isTeacher && (
          <Link href="/reports" className="rail-btn fa-btn" title="รายงานความก้าวหน้า">
            <i className="fa-solid fa-chart-simple" />
          </Link>
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
          title="เข้าสู่โหมดคุณครู"
          onClick={handleTeacherAuthClick}
        >
          <i className="fa-solid fa-user-shield" />
        </span>
        <span
          className="rail-btn fa-btn cursor-pointer"
          title="ผู้พัฒนา"
          onClick={openDev}
        >
          <i className="fa-solid fa-code" />
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
