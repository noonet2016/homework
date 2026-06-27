"use client";

import { type ReactNode, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setScore } from "@/lib/actions/scores";

type Task = {
  id: string;
  name: string;
  taskIndex: number;
};

type Student = {
  id: string;
  name: string;
  nickname: string | null;
  number: number | null;
  code: string | null;
  scores: { taskId: string; value: number }[];
};

type StudentScoreModalProps = {
  roomId: string;
  student: Student;
  tasks: Task[];
  trigger: ReactNode;
};

export default function StudentScoreModal({
  roomId,
  student,
  tasks,
  trigger,
}: StudentScoreModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialValues = useMemo(() => {
    return Object.fromEntries(
      tasks.map((task) => {
        const score = student.scores.find((item) => item.taskId === task.id);
        return [task.id, String(score?.value ?? "")];
      }),
    );
  }, [student.scores, tasks]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const total = tasks.reduce((sum, task) => {
    const value = Number(values[task.id] || "0");
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  function openModal() {
    setValues(initialValues);
    setIsOpen(true);
  }

  function closeModal() {
    if (!isPending) setIsOpen(false);
  }

  function saveScores() {
    startTransition(async () => {
      for (const task of tasks) {
        const formData = new FormData();
        formData.set("studentId", student.id);
        formData.set("taskId", task.id);
        formData.set("roomId", roomId);
        formData.set("value", values[task.id] || "0");
        await setScore(formData);
      }

      router.refresh();
      setIsOpen(false);
    });
  }

  return (
    <>
      <button type="button" className="block h-full text-left" onClick={openModal}>
        {trigger}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
          <section className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e9eef7] bg-white shadow-[0_24px_60px_rgba(31,46,83,0.22)]">
            <header className="border-b border-[#e9eef7] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="line-clamp-2 text-xl font-black text-[#1f2e53]">
                    {student.name}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    เลขที่ {student.number ?? "-"} · รหัส {student.code ?? "-"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-indigo-500">
                    ชื่อเล่น: {student.nickname || "-"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-center">
                <p className="text-sm font-bold text-slate-500">คะแนนรวมปัจจุบัน</p>
                <p className="text-3xl font-black text-amber-500">{total} คะแนน</p>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {tasks.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#e4e9ff] p-6 text-center text-slate-500">
                  เพิ่มงาน
                </p>
              ) : (
                tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#e4e9ff] bg-[#f8fbff] px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#1f2e53]">
                      {task.name}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={values[task.id] ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [task.id]: event.target.value,
                        }))
                      }
                      className="w-20 rounded-xl border border-[#d9dff3] bg-white px-3 py-2 text-center text-sm font-bold text-[#1f2e53] outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 sm:w-24"
                    />
                  </label>
                ))
              )}
            </div>

            <footer className="flex justify-end gap-3 border-t border-[#e9eef7] p-5">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={saveScores}
                disabled={isPending || tasks.length === 0}
                className="rounded-2xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "บันทึก..." : "บันทึก"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
