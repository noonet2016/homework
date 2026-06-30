"use client";

import { useState } from "react";
import Link from "next/link";

interface TaskRow {
  id: string;
  name: string;
  taskIndex: number;
  imageUrl: string | null;
  score: number;
  done: boolean;
}

interface Badge {
  icon: string;
  label: string;
  desc: string;
  earned: boolean;
}

interface StudentStatusClientProps {
  student: {
    name: string;
    nickname: string | null;
    room: {
      id: string;
      name: string;
      icon: string | null;
    };
  };
  taskRows: TaskRow[];
  totalScore: number;
  tasksCompleted: number;
  xpPercent: number;
  avatar: string;
  badges: Badge[];
}

function driveImageCandidates(url: string): string[] {
  const m = url.match(/\/d\/([A-Za-z0-9_-]{20,})/) || url.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
  const id = m?.[1];
  const list = [url];
  if (id) {
    list.push(`https://lh3.googleusercontent.com/d/${id}=w2000`);
    list.push(`https://drive.google.com/thumbnail?id=${id}&sz=w2000`);
    list.push(`https://drive.google.com/uc?export=view&id=${id}`);
  }
  return Array.from(new Set(list));
}

export default function StudentStatusClient({
  student,
  taskRows,
  totalScore,
  tasksCompleted,
  xpPercent,
  avatar,
  badges,
}: StudentStatusClientProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-2xl shadow-indigo-200">
          <div className="absolute -right-6 -top-6 rotate-12 opacity-10">
            <i className="fa-solid fa-graduation-cap text-9xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-4xl shadow-lg backdrop-blur-md">
              {avatar}
            </div>
            <p className="mb-2 text-sm font-bold text-indigo-100">
              {student.room.icon || "🧩"} {student.room.name}
            </p>
            <h1 className="mb-1 text-3xl font-black">{student.name}</h1>
            <p className="mb-4 font-medium text-indigo-100">
              {student.nickname ? `ชื่อเล่น: ${student.nickname}` : "ยังไม่มีชื่อเล่น"}
            </p>
            <div className="mb-2 h-4 w-full overflow-hidden rounded-full border border-white/10 bg-black/20 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex w-full justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-100">
              <span>Progress</span>
              <span>{xpPercent}% COMPLETE</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">คะแนนรวม (XP)</p>
            <p className="text-3xl font-black text-indigo-600">{totalScore}</p>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">เควสที่ผ่านแล้ว</p>
            <p className="text-3xl font-black text-emerald-500">{tasksCompleted}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center justify-between text-sm font-black uppercase tracking-widest text-slate-700">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-trophy text-amber-500" />
              ความสำเร็จ
            </span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {badges.map((badge) => (
              <div key={badge.label} className="flex min-w-[65px] flex-1 flex-col items-center gap-1.5">
                <div
                  className={
                    "relative flex h-11 w-11 items-center justify-center rounded-2xl border-2 text-lg transition-all " +
                    (badge.earned
                      ? "border-emerald-200 bg-emerald-100 text-emerald-700 shadow-sm"
                      : "border-slate-100 bg-slate-50 text-slate-400 opacity-40 grayscale")
                  }
                >
                  <span>{badge.icon}</span>
                  {!badge.earned && (
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-100 bg-white text-[8px] text-slate-400 shadow-sm">
                      <i className="fa-solid fa-lock" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase text-slate-700">{badge.label}</p>
                  <p className="mt-0.5 text-[7px] font-bold leading-tight text-slate-400">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700">
            <i className="fa-solid fa-images text-blue-500" />
            ผลงานสะสม
          </h2>
          <div className="w-full divide-y divide-slate-100">
            {taskRows.length === 0 ? (
              <div className="py-12 text-center text-xs font-medium italic text-slate-400">
                ยังไม่มีรายการงานในห้องนี้
              </div>
            ) : (
              taskRows.map((task) => (
                <div key={task.id} className="flex items-center gap-4 py-4">
                  <div
                    className={
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] " +
                      (task.done ? "bg-emerald-100 text-emerald-600 shadow-sm" : "bg-slate-100 text-slate-300")
                    }
                  >
                    <i className={`fa-solid ${task.done ? "fa-check" : "fa-minus"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight text-slate-700">{task.name}</p>
                    <p className={`text-[10px] font-medium ${task.done ? "text-emerald-500" : "text-slate-400"}`}>
                      {task.done ? "ภารกิจสำเร็จ" : "ยังไม่ส่ง/รอตรวจ"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {task.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(task.imageUrl)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shadow-sm transition-all hover:bg-indigo-600 hover:text-white"
                        title="ดูใบงาน"
                      >
                        <i className="fa-solid fa-image text-[13px]" />
                      </button>
                    )}
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-sm font-black ${task.done ? "text-indigo-600" : "text-slate-300"}`}>
                        {task.score}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-slate-400">pt</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="flex flex-col items-center gap-3 pb-8">
          <Link href="/" className="rounded-full bg-indigo-50 px-6 py-2 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100">
            <i className="fa-solid fa-house mr-1" />
            กลับสู่ห้องโถงหลัก
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Learn Tracking Gamer Profile</p>
        </div>
      </div>

      {/* Lightbox / Popup ใบงาน */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="ใบงาน"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              const img = e.currentTarget;
              const cands = driveImageCandidates(lightboxUrl);
              const next = Number(img.dataset.ci || "0") + 1;
              if (next < cands.length) {
                img.dataset.ci = String(next);
                img.src = cands[next];
              }
            }}
          />
          <div className="flex gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
            <a
              href={lightboxUrl}
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
            >
              <i className="fa-solid fa-download" /> ดาวน์โหลด
            </a>
            <button
              type="button"
              onClick={() => {
                const w = window.open("", "_blank");
                if (!w) return;
                w.document.write(`<!DOCTYPE html><html><head><title>พิมพ์ใบงาน</title><style>*{margin:0;padding:0}body{display:flex;justify-content:center;align-items:flex-start}img{max-width:100%;height:auto}</style></head><body><img src="${lightboxUrl}" referrerpolicy="no-referrer" onload="window.print()"/></body></html>`);
                w.document.close();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
            >
              <i className="fa-solid fa-print" /> พิมพ์
            </button>
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm"
            >
              <i className="fa-solid fa-xmark" /> ปิด
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
