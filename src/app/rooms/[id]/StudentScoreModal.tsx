"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveStudentScores } from "@/lib/actions/scores";
import type { StudentCardData, TaskData } from "./StudentGridClient";

type StudentScoreModalProps = {
  roomId: string;
  student: StudentCardData;
  tasks: TaskData[];
  isTeacher: boolean;
  onClose: () => void;
};

export default function StudentScoreModal({
  roomId,
  student,
  tasks,
  isTeacher,
  onClose,
}: StudentScoreModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        tasks.map((task) => {
          const score = student.scores.find((item) => item.taskId === task.id);
          return [task.id, String(score?.value ?? 0)];
        }),
      ),
    [student.scores, tasks],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const total = tasks.reduce((sum, task) => {
    const value = Number(values[task.id] || "0");
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  function closeModal() {
    if (!isPending) onClose();
  }

  function saveScores() {
    if (!isTeacher) return;
    startTransition(async () => {
      const valuesByTaskId = Object.fromEntries(
        tasks.map((task) => [task.id, Number(values[task.id] || "0") || 0]),
      );

      await saveStudentScores(roomId, student.id, valuesByTaskId);
      router.refresh();
      onClose();
    });
  }

  return (
    <>
    <div
      id="modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
    >
      <div
        id="modal-content"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-modal-pop"
      >
        <div className="flex flex-col h-[92vh] max-h-[92vh] md:h-auto md:max-h-[92vh]">
          <div className="p-4 md:p-5 border-b border-slate-200 shrink-0">
            <div className="flex justify-between items-start gap-2 mb-1">
              <h3
                title={student.name}
                className="font-bold leading-[1.5] text-xl md:text-2xl"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {student.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">คะแนนรวมปัจจุบัน</p>
                  <p
                    id="student-modal-total-score"
                    className="text-xl md:text-2xl font-black text-amber-600 leading-tight"
                  >
                    {total}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="modal-close-btn"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-1 flex flex-wrap gap-x-3">
              <span className="whitespace-nowrap">เลขที่ {student.number ?? "-"}</span>
              <span className="whitespace-nowrap">รหัส {student.code || "-"}</span>
            </p>
            <p className="text-indigo-500 text-sm mb-1">
              {student.nickname ? `ชื่อเล่น: ${student.nickname}` : ""}
            </p>
          </div>

          <div className="p-4 md:p-5 overflow-y-auto min-h-0 bg-slate-50/60">
            {isTeacher ? (
              tasks.length === 0 ? (
                <div className="border rounded-xl p-2.5 mb-2 bg-white text-center text-slate-500">
                  เพิ่มงาน
                </div>
              ) : (
                tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex justify-between items-center gap-2 border rounded-xl p-2.5 mb-2 bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`score-input-${index}`}
                        className="text-sm md:text-base font-medium"
                      >
                        {task.name}
                      </label>
                      {task.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(task.imageUrl)}
                          className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-300 text-indigo-600 text-xs font-semibold hover:bg-indigo-50"
                        >
                          <i className="fa-solid fa-image mr-1 text-[10px]" />ใบงาน
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      id={`score-input-${index}`}
                      value={values[task.id] ?? "0"}
                      disabled={!isTeacher}
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [task.id]: event.target.value,
                        }))
                      }
                      className="w-20 sm:w-24 border rounded-lg p-1.5 text-center text-xl md:text-2xl font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                ))
              )
            ) : (() => {
              const scoreMap = Object.fromEntries(student.scores.map((s) => [s.taskId, s.value]));
              const submitted = tasks.filter((t) => (scoreMap[t.id] ?? 0) > 0);
              const pending = tasks.filter((t) => (scoreMap[t.id] ?? 0) === 0);
              return (
                <div className="flex flex-row gap-3">
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-2xl p-4">
                    <h3 className="font-bold mb-2">ส่งแล้ว ({submitted.length})</h3>
                    {submitted.length === 0 ? (
                      <p className="text-slate-400 text-sm">-</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {submitted.map((task) => (
                          <li key={task.id} className="text-sm flex items-center flex-wrap gap-1">
                            ✅ {task.name} <span className="text-green-700 font-bold">({scoreMap[task.id]})</span>
                            {task.imageUrl && (
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(task.imageUrl)}
                                className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-300 text-indigo-600 text-xs font-semibold hover:bg-indigo-50"
                              >
                                <i className="fa-solid fa-image mr-1 text-[10px]" />ใบงาน
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex-1 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                    <h3 className="font-bold mb-2">ค้างส่ง ({pending.length})</h3>
                    {pending.length === 0 ? (
                      <p className="text-slate-400 text-sm">-</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {pending.map((task) => (
                          <li key={task.id} className="text-sm flex items-center flex-wrap gap-1">
                            ⬜ {task.name}
                            {task.imageUrl && (
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(task.imageUrl)}
                                className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-300 text-indigo-600 text-xs font-semibold hover:bg-indigo-50"
                              >
                                <i className="fa-solid fa-image mr-1 text-[10px]" />ใบงาน
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="p-4 md:p-5 border-t border-slate-200 bg-white shrink-0">
            <div className={`grid grid-cols-1 ${isTeacher ? "sm:grid-cols-2" : ""} gap-2`}>
              {isTeacher ? (
                <button
                  type="button"
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-semibold opacity-60"
                  disabled
                >
                  <i className="fa-solid fa-qrcode mr-2" />
                  สร้าง QR ให้คะแนนด่วน
                </button>
              ) : null}
              {isTeacher ? (
                <button
                  type="button"
                  onClick={saveScores}
                  disabled={isPending || tasks.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <i className="fa-solid fa-floppy-disk mr-2" />
                  {isPending ? "บันทึก..." : "บันทึก"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

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
                w.document.write(`<!DOCTYPE html><html><head><title>พิมพ์ใบงาน</title><style>*{margin:0;padding:0}body{display:flex;justify-content:center;align-items:flex-start}img{max-width:100%;height:auto}</style></head><body><img src="${lightboxUrl}" onload="window.print()"/></body></html>`);
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
    </>
  );
}
