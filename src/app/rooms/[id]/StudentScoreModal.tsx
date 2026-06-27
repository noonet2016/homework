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
            {tasks.length === 0 ? (
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
            )}
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
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-semibold"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
