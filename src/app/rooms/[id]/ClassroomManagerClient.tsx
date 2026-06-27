"use client";

import { useState } from "react";
import { createStudent, deleteStudent, updateStudent } from "@/lib/actions/students";
import { createTask, deleteTask, renameTask } from "@/lib/actions/tasks";
import type { StudentCardData, TaskData } from "./StudentGridClient";

type ClassroomManagerClientProps = {
  roomId: string;
  students: StudentCardData[];
  tasks: TaskData[];
};

type OpenModal = "sheet" | "tasks" | "addStudent" | "editStudent" | null;

export default function ClassroomManagerClient({
  roomId,
  students,
  tasks,
}: ClassroomManagerClientProps) {
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [editingStudent, setEditingStudent] = useState<StudentCardData | null>(null);

  function openEditStudent(student: StudentCardData) {
    setEditingStudent(student);
    setOpenModal("editStudent");
  }

  function close() {
    setOpenModal(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenModal("sheet")}
        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95"
      >
        <i className="fa-solid fa-wand-magic-sparkles" />
        จัดการห้องเรียน
      </button>

      {openModal === "sheet" ? (
        <div id="student-action-sheet" className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={close}
            aria-label="Close"
          />
          <div className="absolute bottom-0 right-0 left-0 md:left-auto md:top-0 w-full md:w-[400px] h-auto md:h-full bg-white rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl p-5 md:p-8 max-h-[85vh] md:max-h-full overflow-y-auto animate-fade-in border-l border-white/20 flex flex-col">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 md:hidden shrink-0" />
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <span className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-wand-magic-sparkles text-indigo-600" />
                  </span>
                  จัดการห้องเรียน
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 pl-[52px]">
                  เลือกเครื่องมือที่ต้องการใช้งาน
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4 flex-1">
              <button
                type="button"
                onClick={() => setOpenModal("tasks")}
                className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
              >
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-list-check text-4xl" />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <i className="fa-solid fa-list-check text-xl mb-1" />
                  <span className="text-sm font-bold">จัดการงาน</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOpenModal("addStudent")}
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
              >
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-user-plus text-4xl" />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <i className="fa-solid fa-user-plus text-xl mb-1" />
                  <span className="text-sm font-bold">เพิ่มนักเรียน</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOpenModal("editStudent")}
                className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-400 text-white p-4 rounded-2xl shadow-lg shadow-amber-200 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
              >
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-user-pen text-4xl" />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <i className="fa-solid fa-user-pen text-xl mb-1" />
                  <span className="text-sm font-bold">แก้ไข/ลบ</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {openModal === "tasks" ? (
        <div id="task-manager-modal" className="fixed inset-0 z-[63] bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[92dvh] shadow-2xl flex flex-col animate-modal-pop">
            <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">
              ✕
            </button>
            <h3 className="text-2xl font-black text-[#1e2d52] mb-1 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-indigo-500" /> จัดการงานของห้อง
            </h3>
            <p className="text-slate-500 text-sm mb-3">
              เพิ่ม/ลบ/เรียงลำดับงานได้อิสระ และแต่ละห้องกำหนดจำนวนงานไม่เท่ากันได้
            </p>
            <form action={createTask} className="flex items-center gap-2 mb-3">
              <input type="hidden" name="roomId" value={roomId} />
              <input name="name" className="flex-1 border rounded-lg px-3 py-2" placeholder="ชื่องานใหม่" required />
              <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold whitespace-nowrap shrink-0">
                <i className="fa-solid fa-plus mr-1" />เพิ่มงาน
              </button>
            </form>
            <div id="task-manager-list" className="overflow-y-auto min-h-0 space-y-2 pr-1">
              {tasks.length === 0 ? (
                <div className="text-slate-500 text-center py-6">ยังไม่มีงาน</div>
              ) : (
                tasks.map((task, idx) => (
                  <div key={task.id} className="flex items-center gap-2 border rounded-lg p-2 bg-slate-50">
                    <span className="text-slate-400 text-sm px-1" title="ลากเพื่อเรียง">
                      <i className="fa-solid fa-grip-vertical" />
                    </span>
                    <span className="text-xs text-slate-500 w-8 text-center">{idx + 1}</span>
                    <form action={renameTask} className="contents">
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="roomId" value={roomId} />
                      <input name="name" defaultValue={task.name} className="flex-1 border rounded px-3 py-2" required />
                      <button type="submit" className="px-2 py-2 rounded bg-white border" title="บันทึก">
                        <i className="fa-solid fa-floppy-disk" />
                      </button>
                    </form>
                    <form action={deleteTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="roomId" value={roomId} />
                      <button type="submit" className="px-2 py-2 rounded bg-red-50 text-red-600 border border-red-200" title="ลบ">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t pt-3">
              <button type="button" onClick={close} className="px-4 py-2 rounded bg-slate-200 font-semibold">
                <i className="fa-solid fa-xmark mr-1" />ยกเลิก
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {openModal === "addStudent" ? (
        <div className="fixed inset-0 z-[57] bg-black/60 flex items-center justify-center p-4">
          <form action={createStudent} className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop">
            <input type="hidden" name="roomId" value={roomId} />
            <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">
              ✕
            </button>
            <h3 className="text-2xl font-black text-[#1e2d52] mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user-plus text-emerald-500" /> เพิ่มนักเรียน
            </h3>
            <StudentFields />
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={close} className="px-4 py-2 rounded bg-slate-200 font-semibold">
                <i className="fa-solid fa-xmark mr-1" />ยกเลิก
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white font-semibold">
                <i className="fa-solid fa-plus mr-1" />เพิ่มข้อมูล
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {openModal === "editStudent" ? (
        <div className="fixed inset-0 z-[58] bg-black/60 flex items-center justify-center p-4">
          {editingStudent ? (
            <form action={updateStudent} className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop">
              <input type="hidden" name="id" value={editingStudent.id} />
              <input type="hidden" name="roomId" value={roomId} />
              <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">
                ✕
              </button>
              <h3 className="text-2xl font-black text-[#1e2d52] mb-4 flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-amber-500" /> แก้ไขข้อมูลนักเรียน
              </h3>
              <StudentFields student={editingStudent} />
              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="submit"
                  form={`delete-student-${editingStudent.id}`}
                  className="px-4 py-2 rounded bg-red-600 text-white font-semibold mr-auto"
                >
                  <i className="fa-solid fa-trash-can mr-1" />ลบนักเรียน
                </button>
                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 rounded bg-slate-200 font-semibold">
                  <i className="fa-solid fa-xmark mr-1" />ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-amber-500 text-white font-semibold">
                  <i className="fa-solid fa-floppy-disk mr-1" />บันทึก
                </button>
              </div>
            </form>
          ) : (
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop">
              <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">
                ✕
              </button>
              <h3 className="text-2xl font-black text-[#1e2d52] mb-4 flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-amber-500" /> แก้ไข/ลบ
              </h3>
              <div className="max-h-[62vh] overflow-y-auto space-y-2">
                {students.length === 0 ? (
                  <p className="text-center text-slate-500 py-6">ยังไม่มีนักเรียนในห้องนี้</p>
                ) : (
                  students.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => openEditStudent(student)}
                      className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-left hover:bg-amber-50"
                    >
                      <span className="font-bold text-[#1e2d52]">{student.name}</span>
                      <span className="block text-sm text-slate-500">
                        เลขที่ {student.number ?? "-"} · รหัส {student.code || "-"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          {editingStudent ? (
            <form id={`delete-student-${editingStudent.id}`} action={deleteStudent}>
              <input type="hidden" name="id" value={editingStudent.id} />
              <input type="hidden" name="roomId" value={roomId} />
            </form>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function StudentFields({ student }: { student?: StudentCardData }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold mb-1">เลขที่</label>
        <input name="number" defaultValue={student?.number ?? ""} className="w-full border rounded px-3 py-2" placeholder="เช่น 1" />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">รหัสนักเรียน</label>
        <input name="code" defaultValue={student?.code ?? ""} className="w-full border rounded px-3 py-2" placeholder="เช่น 67001" />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">ชื่อ-นามสกุล</label>
        <input name="name" defaultValue={student?.name ?? ""} className="w-full border rounded px-3 py-2" placeholder="เช่น ด.ช.สมชาย ใจดี" required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">ชื่อเล่น</label>
        <input name="nickname" defaultValue={student?.nickname ?? ""} className="w-full border rounded px-3 py-2" placeholder="เช่น ต้นกล้า" />
      </div>
    </div>
  );
}
