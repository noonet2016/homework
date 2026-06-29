"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { saveStudentScores } from "@/lib/actions/scores";

type Task = { id: string; name: string; taskIndex: number; imageUrl: string | null };
type StudentInfo = {
  id: string;
  name: string;
  nickname: string | null;
  number: number | null;
  code: string | null;
  roomName: string;
  roomIcon: string | null;
  scores: { taskId: string; value: number }[];
};

export default function QuickGradeClient({
  roomId,
  student,
  tasks,
  isTeacher,
}: {
  roomId: string;
  student: StudentInfo;
  tasks: Task[];
  isTeacher: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isTeacher) return;
    window.dispatchEvent(new CustomEvent("open-teacher-auth"));
  }, [isTeacher]);

  const initial = Object.fromEntries(
    tasks.map((t) => {
      const s = student.scores.find((sc) => sc.taskId === t.id);
      return [t.id, String(s?.value ?? 0)];
    }),
  );
  const [values, setValues] = useState<Record<string, string>>(initial);

  const total = tasks.reduce((sum, t) => {
    const v = Number(values[t.id] || "0");
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  const spaceIdx = student.name.indexOf(" ");
  const firstName = spaceIdx >= 0 ? student.name.slice(0, spaceIdx) : student.name;
  const lastName = spaceIdx >= 0 ? student.name.slice(spaceIdx + 1) : "";

  function save() {
    if (!isTeacher) return;
    startTransition(async () => {
      const byTaskId = Object.fromEntries(
        tasks.map((t) => [t.id, Number(values[t.id] || "0") || 0]),
      );
      await saveStudentScores(roomId, student.id, byTaskId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="px-1">
        <Link
          href={`/rooms/${roomId}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-sm font-black text-indigo-600 shadow-sm hover:bg-white hover:text-indigo-800"
        >
          <i className="fa-solid fa-chevron-left text-xs" />
          กลับหน้าห้องเรียน
        </Link>
      </div>

      {/* Card */}
      <div className="flex h-[calc(92dvh-52px)] max-h-[860px] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-modal-pop">

        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-[minmax(0,1fr)_112px] items-start gap-3 md:grid-cols-[minmax(0,1fr)_132px]">
            <div className="min-w-0">
              <h3
                title={student.name}
                className="font-bold leading-tight text-xl md:text-2xl"
              >
                <span className="block truncate">{firstName || student.name}</span>
                {lastName ? <span className="block truncate">{lastName}</span> : null}
              </h3>
              <p className="text-slate-500 text-sm mt-1 flex flex-wrap gap-x-3">
                <span className="whitespace-nowrap">เลขที่ {student.number ?? "-"}</span>
                <span className="whitespace-nowrap">รหัส {student.code || "-"}</span>
              </p>
              {student.nickname && (
                <p className="text-indigo-500 text-sm">ชื่อเล่น: {student.nickname}</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-3 text-center text-white shadow-lg">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">คะแนนรวม</p>
              <p className="text-4xl font-black leading-none">{total}</p>
              <p className="text-[9px] opacity-70 mt-0.5">คะแนน</p>
            </div>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="p-4 md:p-5 overflow-y-auto min-h-0 bg-slate-50/60 flex-1">
          {!isTeacher ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                <i className="fa-solid fa-lock text-2xl" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-lg">ต้องเข้าสู่ระบบคุณครูก่อน</p>
                <p className="text-slate-500 text-sm mt-1">ลิงก์นี้ใช้สำหรับครูผู้สอนให้คะแนนด่วน</p>
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-teacher-auth"))}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-black text-white hover:bg-indigo-700"
              >
                <i className="fa-solid fa-chalkboard-user mr-2" />
                เข้าสู่โหมดคุณครู
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="border rounded-xl p-2.5 bg-white text-center text-slate-500">
              เพิ่มงาน
            </div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-white p-2.5 mb-2"
              >
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`score-${index}`}
                    className="block text-sm font-medium leading-snug text-slate-800 md:text-base line-clamp-2"
                  >
                    {task.name}
                  </label>
                  {task.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setLightboxUrl(task.imageUrl!)}
                      className="mt-1 inline-flex items-center rounded-full border border-indigo-300 px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      <i className="fa-solid fa-image mr-1 text-[10px]" />ใบงาน
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  id={`score-${index}`}
                  value={values[task.id] ?? "0"}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setValues((v) => ({ ...v, [task.id]: e.target.value }))}
                  className="w-20 shrink-0 rounded-lg border p-1.5 text-center text-xl font-semibold md:w-24 md:text-2xl"
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={save}
            disabled={!isTeacher || isPending || tasks.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-floppy-disk mr-2" />
            {saved ? "บันทึกแล้ว ✓" : isPending ? "บันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="ใบงาน"
            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none"
            onClick={() => setLightboxUrl(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
