"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveStudentScores } from "@/lib/actions/scores";
import type { StudentCardData, TaskData } from "./StudentGridClient";
import QuickGradeQrModal from "./QuickGradeQrModal";

type StudentScoreModalProps = {
  roomId: string;
  student: StudentCardData;
  tasks: TaskData[];
  isTeacher: boolean;
  onClose: () => void;
};

// Google Drive images can 403 in-browser based on the Referer header (curl works
// because it sends none). We strip the referrer and, on error, fall through
// alternate Drive image URL formats — same idea as the old GAS app.
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
  const [showQr, setShowQr] = useState(false);
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
        className="flex h-[92dvh] w-full max-w-md md:max-w-3xl lg:max-w-5xl flex-col gap-2 animate-modal-pop"
      >
        <div className="flex justify-end shrink-0">
          <button
            type="button"
            onClick={closeModal}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-lg transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:opacity-60"
            disabled={isPending}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="shrink-0 border-b border-slate-200 p-4 md:p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_112px] items-start gap-3 md:grid-cols-[minmax(0,1fr)_132px]">
              <div className="min-w-0">
                <h3
                  title={student.name}
                  className="font-bold leading-tight text-xl md:text-2xl whitespace-normal md:whitespace-nowrap md:truncate"
                >
                  {student.name}
                </h3>
                <p className="text-slate-500 text-sm mt-1 flex flex-wrap gap-x-3 md:flex-nowrap md:whitespace-nowrap">
                  <span className="whitespace-nowrap">เลขที่ {student.number ?? "-"}</span>
                  <span className="whitespace-nowrap">รหัส {student.code || "-"}</span>
                </p>
                {student.nickname ? (
                  <p className="text-indigo-500 text-sm md:whitespace-nowrap">{`ชื่อเล่น: ${student.nickname}`}</p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] font-bold leading-tight text-slate-500">คะแนนรวม</p>
                <p className="text-[10px] font-bold leading-tight text-slate-400">ปัจจุบัน</p>
                <p
                  id="student-modal-total-score"
                  className="mt-1 text-3xl font-black leading-none text-amber-600"
                >
                  {total}
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-4 md:p-5">
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

          {isTeacher && (
            <div className="shrink-0 border-t border-slate-200 bg-white p-4 md:p-5">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="button"
                  onClick={saveScores}
                  disabled={isPending || tasks.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <i className="fa-solid fa-floppy-disk mr-2" />
                  {isPending ? "บันทึก..." : "บันทึก"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className="h-full px-4 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold text-sm"
                  title="QR Code รายบุคคล"
                >
                  <i className="fa-solid fa-qrcode text-lg" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {showQr && (
        <QuickGradeQrModal
          roomId={roomId}
          studentId={student.id}
          studentName={student.name}
          studentNumber={student.number ?? null}
          studentCode={student.code ?? null}
          roomName=""
          onClose={() => setShowQr(false)}
        />
      )}

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

    </>
  );
}
