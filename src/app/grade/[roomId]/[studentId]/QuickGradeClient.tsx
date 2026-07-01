"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { saveStudentScores } from "@/lib/actions/scores";

type Task = { id: string; name: string; taskIndex: number; imageUrl: string | null; maxScore?: number };
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [quickCheckActive, setQuickCheckActive] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [hasAutoChecked, setHasAutoChecked] = useState("");

  useEffect(() => {
    if (isTeacher) return;
    window.dispatchEvent(new CustomEvent("open-teacher-auth"));
  }, [isTeacher]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [lightboxUrl]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const mode = localStorage.getItem(`quick-mode-enabled-${roomId}`) === "true";
    let taskId = localStorage.getItem(`active-quick-task-${roomId}`);
    const isValidTask = tasks.some((t) => t.id === taskId);
    if (!isValidTask) {
      taskId = tasks[0]?.id || null;
    }
    setQuickCheckActive(mode);
    setActiveTaskId(taskId);
  }, [roomId, tasks]);

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

  // Auto-save check-in when mode is active
  useEffect(() => {
    if (!quickCheckActive || !activeTaskId || !isTeacher) return;
    if (hasAutoChecked === student.id) return; // already processed for this student
    
    // We wait until values are populated
    const currentVal = Number(values[activeTaskId] || "0");
    if (Number.isNaN(currentVal)) return;

    setHasAutoChecked(student.id);

    if (currentVal === -1 || currentVal > 0) {
      setAutoSaved(true);
      return;
    }

    startTransition(async () => {
      try {
        const byTaskId = Object.fromEntries(
          tasks.map((t) => [t.id, t.id === activeTaskId ? -1 : (Number(values[t.id] || "0") || 0)]),
        );
        await saveStudentScores(roomId, student.id, byTaskId);
        setValues((v) => ({ ...v, [activeTaskId]: "-1" }));
        setAutoSaved(true);
      } catch (err) {
        setAutoSaveError("ไม่สามารถบันทึกตรวจสมุดด่วนได้");
      }
    });
  }, [quickCheckActive, activeTaskId, isTeacher, roomId, student.id, tasks, hasAutoChecked, values]);

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
          {/* Quick-check Active Banner */}
          {isTeacher && quickCheckActive && activeTaskId && (
            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2 animate-fade-in">
              <span className="flex items-center gap-1.5">
                <span className="animate-pulse">🟢</span>
                <span>โหมดตรวจสมุดด่วนทำงานอยู่: <span className="font-black underline">{tasks.find((t) => t.id === activeTaskId)?.name}</span></span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">(แก้ไขค่านี้ได้ที่หน้าห้องเรียนหลัก)</span>
            </div>
          )}

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
            tasks.map((task, index) => {
              const maxVal = task.maxScore ?? 10;
              const currentValue = Number(values[task.id] || "0");
              const isChecked = currentValue > 0 || currentValue === -1;

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-white p-2.5 mb-2 focus-within:ring-2 focus-within:ring-indigo-100"
                >
                  {/* Quick-grade checkbox */}
                  <div className="flex items-center pl-1 shrink-0">
                    <input
                      type="checkbox"
                      id={`check-${index}`}
                      checked={isChecked}
                      onChange={(e) => {
                        const nextVal = e.target.checked ? String(maxVal) : "0";
                        setValues((v) => ({ ...v, [task.id]: nextVal }));
                      }}
                      className="h-6 w-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`check-${index}`}
                      className="block text-sm font-semibold leading-snug text-slate-800 md:text-base line-clamp-2 cursor-pointer select-none"
                    >
                      {task.name}
                      <span className="ml-1.5 text-xs text-indigo-500/80 font-normal bg-indigo-50 px-1.5 py-0.5 rounded-md">เต็ม {maxVal}</span>
                    </label>
                    {task.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(task.imageUrl!)}
                        className="mt-1.5 inline-flex items-center rounded-full border border-indigo-300 px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                      >
                        <i className="fa-solid fa-image mr-1 text-[10px]" />ใบงาน
                      </button>
                    )}
                  </div>

                  <div className="flex items-center shrink-0">
                    <input
                      type="number"
                      id={`score-${index}`}
                      value={values[task.id] === "-1" ? "" : (values[task.id] ?? "0")}
                      placeholder={values[task.id] === "-1" ? "📖 ตรวจแล้ว" : "0"}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setValues((v) => ({ ...v, [task.id]: e.target.value }))}
                      className="w-16 rounded-lg border p-1 text-center text-lg font-black md:w-20 md:text-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-amber-600 placeholder:text-[10px] placeholder:font-black"
                    />
                    
                    {/* Small book icon button to manually set to Checked-only (-1) */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = values[task.id] === "-1" ? "0" : "-1";
                        setValues((v) => ({ ...v, [task.id]: nextVal }));
                      }}
                      className={`ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm transition ${
                        values[task.id] === "-1"
                          ? "bg-amber-100 border-amber-300 text-amber-600 font-bold"
                          : "border-slate-200 text-slate-400 hover:bg-slate-50"
                      }`}
                      title="บันทึกตรวจสมุดแล้ว (ยังไม่ให้คะแนน)"
                    >
                      📖
                    </button>
                  </div>
                </div>
              );
            })
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
      {lightboxUrl && (() => {
        const candidates = driveImageCandidates(lightboxUrl);
        return (
          <div
            className="fixed inset-0 z-[9999] bg-black/85 flex flex-col items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <img
              src={candidates[activeImageIndex]}
              alt="ใบงาน"
              referrerPolicy="no-referrer"
              onError={() => {
                if (activeImageIndex < candidates.length - 1) {
                  setActiveImageIndex((prev) => prev + 1);
                }
              }}
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
        );
      })()}

      {/* Fullscreen Success Overlay for Quick-check */}
      {autoSaved && (
        <div className="fixed inset-0 z-[10000] bg-emerald-600 flex flex-col items-center justify-center p-6 text-white text-center animate-modal-pop">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white text-emerald-600 text-5xl shadow-2xl animate-bounce">
            📖
          </div>
          <h2 className="text-3xl font-black mb-2">เช็คชื่อส่งสมุดสำเร็จ!</h2>
          <p className="text-xl font-bold opacity-90 mb-4">{student.name} {student.number ? `เลขที่ ${student.number}` : ""}</p>
          <div className="bg-white/10 px-5 py-4 rounded-2xl max-w-sm mb-8 border border-white/10">
            <p className="text-xs opacity-75">ใบงานที่ตรวจรับด่วน</p>
            <p className="text-lg font-bold mt-1">{tasks.find((t) => t.id === activeTaskId)?.name}</p>
          </div>
          <p className="text-sm animate-pulse opacity-85 font-black uppercase tracking-wider">พร้อมนำเล่มต่อไปมาสแกนได้ทันที ➔</p>
          
          <button 
            onClick={() => setAutoSaved(false)}
            className="mt-12 px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition"
          >
            แก้ไขหรือดูคะแนนวิชาอื่นๆ ด้วยมือ
          </button>
        </div>
      )}

      {autoSaveError && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000] bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-sm animate-modal-pop">
          <span>⚠️ {autoSaveError}</span>
          <button onClick={() => setAutoSaveError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}
    </div>
  );
}
