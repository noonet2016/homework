"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StudentScoreModal from "./StudentScoreModal";

export type TaskData = {
  id: string;
  name: string;
  taskIndex: number;
  imageUrl: string | null;
  visible: boolean;
};

export type StudentCardData = {
  id: string;
  name: string;
  nickname: string | null;
  number: number | null;
  code: string | null;
  scores: { taskId: string; value: number }[];
  totalScore: number;
  tasksCompleted: number;
  pending: number;
};

type StudentGridClientProps = {
  roomId: string;
  roomName: string;
  students: StudentCardData[];
  tasks: TaskData[];
  isTeacher: boolean;
};

function getStatusIcon(pending: number) {
  if (pending > 2) return <i className="fa-solid fa-triangle-exclamation mini-icon text-rose-500" />;
  if (pending > 0) return <i className="fa-solid fa-hourglass-half mini-icon text-blue-400" />;
  return <i className="fa-solid fa-circle-check mini-icon text-emerald-500" />;
}

function getRankBadge(index: number) {
  if (index === 0) {
    return (
      <>
        <i className="fa-solid fa-crown mini-icon text-amber-400" /> MVP
      </>
    );
  }
  if (index < 3) {
    return (
      <>
        <i className="fa-solid fa-medal mini-icon text-amber-400" /> Top
      </>
    );
  }
  return (
    <>
      <i className="fa-solid fa-bullseye mini-icon text-blue-500" /> Player
    </>
  );
}

export default function StudentGridClient({
  roomId,
  roomName,
  students,
  tasks,
  isTeacher,
}: StudentGridClientProps) {
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentCardData | null>(null);
  const autoOpenedRef = useRef(false);
  const totalAssignedTasks = tasks.length;
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Listen to select mode toggle event
  useEffect(() => {
    const handler = (e: Event) => {
      const active = (e as CustomEvent).detail?.active ?? false;
      setIsSelectMode(active);
      setSelectedIds([]);
    };
    window.addEventListener("toggle-select-mode", handler);
    return () => window.removeEventListener("toggle-select-mode", handler);
  }, []);

  // Listen to force selection changes from outer components (e.g. Select All)
  useEffect(() => {
    const handler = (e: Event) => {
      const ids = (e as CustomEvent).detail?.ids ?? [];
      setSelectedIds(ids);
    };
    window.addEventListener("force-selection", handler);
    return () => window.removeEventListener("force-selection", handler);
  }, []);

  // Dispatch selection changes to ClassroomManagerClient
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("selection-changed", { detail: { ids: selectedIds } }));
  }, [selectedIds]);

  useEffect(() => {
    const desktop = document.getElementById("student-search-input") as HTMLInputElement | null;
    const mobile = document.getElementById(
      "student-search-input-mobile",
    ) as HTMLInputElement | null;

    function handleInput(event: Event) {
      const target = event.currentTarget as HTMLInputElement;
      setQuery(target.value);
      if (desktop && desktop !== target) desktop.value = target.value;
      if (mobile && mobile !== target) mobile.value = target.value;
    }

    desktop?.addEventListener("input", handleInput);
    mobile?.addEventListener("input", handleInput);

    return () => {
      desktop?.removeEventListener("input", handleInput);
      mobile?.removeEventListener("input", handleInput);
    };
  }, []);

  useEffect(() => {
    if (autoOpenedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const studentId = params.get("studentId");
    if (mode !== "grade" || !studentId) return;

    const student = students.find((item) => String(item.id) === String(studentId));
    if (!student) return;
    autoOpenedRef.current = true;
    setSelectedStudent(student);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;

    return students.filter((student) => {
      const numberText = student.number == null ? "" : String(student.number);
      return [student.name, student.nickname ?? "", numberText]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query, students]);

  if (students.length === 0) {
    return (
      <div
        id="student-grid"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
      >
        <div className="col-span-full bg-white rounded-2xl p-8 text-center text-slate-500">
          ยังไม่มีนักเรียนในห้องนี้
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        id="student-grid"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
      >
        {filteredStudents.map((student, idx) => {
          const pending = Math.max(totalAssignedTasks - Number(student.tasksCompleted || 0), 0);
          const completion =
            totalAssignedTasks > 0
              ? Math.round((Number(student.tasksCompleted || 0) / totalAssignedTasks) * 100)
              : 0;

          return (
            <div
              key={student.id}
              role="button"
              tabIndex={0}
              className={`relative bg-gradient-to-br from-[#ffffff] to-[#f3f5ff] rounded-3xl p-4 shadow cursor-pointer border hover:shadow-lg transition-all hover:-translate-y-1 text-[#27345b] ${selectedIds.includes(student.id) ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-[#e4e9ff]"}`}
              onClick={() => {
                if (isSelectMode) {
                  const isSelected = selectedIds.includes(student.id);
                  setSelectedIds(
                    isSelected
                      ? selectedIds.filter((id) => id !== student.id)
                      : [...selectedIds, student.id]
                  );
                } else {
                  setSelectedStudent(student);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  if (isSelectMode) {
                    const isSelected = selectedIds.includes(student.id);
                    setSelectedIds(
                      isSelected
                        ? selectedIds.filter((id) => id !== student.id)
                        : [...selectedIds, student.id]
                    );
                  } else {
                    setSelectedStudent(student);
                  }
                }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        const isSelected = selectedIds.includes(student.id);
                        setSelectedIds(
                          isSelected
                            ? selectedIds.filter((id) => id !== student.id)
                            : [...selectedIds, student.id]
                        );
                      }}
                      className="w-5 h-5 cursor-pointer accent-indigo-600 shrink-0"
                    />
                  )}
                  <span className="text-xs font-bold bg-[#eef1ff] px-2 py-1 rounded-full">
                    {getRankBadge(idx)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(pending)}
                  {isTeacher && !isSelectMode && (
                    <button
                      type="button"
                      title="แก้ไขข้อมูลนักเรียน"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(
                          new CustomEvent("open-edit-student", {
                            detail: { student },
                          })
                        );
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1 rounded hover:bg-slate-200/50 transition-colors"
                    >
                      <i className="fa-solid fa-ellipsis-vertical" />
                    </button>
                  )}
                </div>
              </div>
              <h3
                title={student.name}
                className="text-center font-bold leading-[1.5] text-[16px] md:text-[17px]"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {student.name}
              </h3>
              {student.nickname ? (
                <p className="text-center text-sm text-indigo-500">
                  ชื่อเล่น: {student.nickname}
                </p>
              ) : null}
              <p className="text-center text-sm text-slate-500">
                เลขที่ {student.number ?? "-"}
              </p>
              <p className="text-center mt-2">
                <span className="text-2xl font-bold text-amber-500">
                  {Number(student.totalScore || 0)}
                </span>{" "}
                คะแนน
              </p>
              <div className="mt-3 border-t border-[#e6eaf7] pt-2 text-sm">
                <p>
                  ส่งแล้ว {Number(student.tasksCompleted || 0)}/{totalAssignedTasks}
                </p>
                <p>ค้าง {pending} งาน</p>
                <div className="mt-2 w-full bg-[#d9dff3] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#60a5fa] to-[#a78bfa] h-2 rounded-full"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-8 text-center text-slate-500">
            ไม่พบนักเรียนที่ค้นหา
          </div>
        ) : null}
      </div>

      {selectedStudent ? (
        <StudentScoreModal
          roomId={roomId}
          student={selectedStudent}
          tasks={tasks}
          isTeacher={isTeacher}
          onClose={() => setSelectedStudent(null)}
        />
      ) : null}
    </>
  );
}
