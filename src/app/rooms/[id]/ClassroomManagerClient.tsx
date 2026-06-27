"use client";

import { useState, useEffect } from "react";
import { createStudent, deleteStudent, updateStudent, createStudentsBulk } from "@/lib/actions/students";
import { createTask, deleteTask, renameTask } from "@/lib/actions/tasks";
import type { StudentCardData, TaskData } from "./StudentGridClient";

type ClassroomManagerClientProps = {
  roomId: string;
  students: StudentCardData[];
  tasks: TaskData[];
};

type OpenModal = "sheet" | "tasks" | "addStudent" | "editStudent" | "bulkAdd" | "classQr" | null;

export default function ClassroomManagerClient({ roomId, students, tasks }: ClassroomManagerClientProps) {
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [editingStudent, setEditingStudent] = useState<StudentCardData | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});

  // Listen for selection-changed events from StudentGridClient
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      setSelectedIds(detail.ids ?? []);
    };
    window.addEventListener("selection-changed", handler);
    return () => window.removeEventListener("selection-changed", handler);
  }, []);

  // Generate QR codes when classQr modal opens
  useEffect(() => {
    if (openModal !== "classQr") return;
    import("qrcode").then((QRCode) => {
      const promises = students.map(async (s) => {
        const text = [s.name, s.code ? `รหัส: ${s.code}` : "", s.number ? `เลขที่: ${s.number}` : ""]
          .filter(Boolean)
          .join(" | ");
        const url = await QRCode.default.toDataURL(text, { width: 180, margin: 1, color: { dark: "#1e2d52", light: "#ffffff" } });
        return [s.id, url] as [string, string];
      });
      Promise.all(promises).then((entries) => setQrUrls(Object.fromEntries(entries)));
    });
  }, [openModal, students]);

  function close() {
    setOpenModal(null);
    setEditingStudent(null);
  }

  function toggleSelectMode() {
    const next = !isSelectMode;
    setIsSelectMode(next);
    setSelectedIds([]);
    window.dispatchEvent(new CustomEvent("toggle-select-mode", { detail: { active: next } }));
    close();
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`ลบนักเรียน ${selectedIds.length} คนที่เลือก?`)) return;
    const fd = new FormData();
    fd.set("roomId", roomId);
    fd.set("ids", selectedIds.join(","));
    const { deleteStudents } = await import("@/lib/actions/students");
    await deleteStudents(fd);
    setIsSelectMode(false);
    setSelectedIds([]);
    window.dispatchEvent(new CustomEvent("toggle-select-mode", { detail: { active: false } }));
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpenModal("sheet")}
        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95"
      >
        <i className="fa-solid fa-wand-magic-sparkles" />
        จัดการห้องเรียน
      </button>

      {/* Delete selected banner */}
      {isSelectMode && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 disabled:opacity-40"
          >
            <i className="fa-solid fa-user-minus" />
            ลบที่เลือก ({selectedIds.length})
          </button>
          <button
            type="button"
            onClick={toggleSelectMode}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-300 active:scale-95"
          >
            <i className="fa-solid fa-xmark" />
            ยกเลิก
          </button>
        </div>
      )}

      {/* ===== Action Sheet ===== */}
      {openModal === "sheet" && (
        <div id="student-action-sheet" className="fixed inset-0 z-[1000002]">
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
                <p className="text-[11px] text-slate-500 mt-1 pl-[52px]">เลือกเครื่องมือที่ต้องการใช้งาน</p>
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
              {/* 1. จัดการงาน */}
              <SheetBtn
                onClick={() => setOpenModal("tasks")}
                gradient="from-indigo-600 to-blue-500"
                shadow="shadow-indigo-200"
                icon="fa-list-check"
                label="จัดการงาน"
              />
              {/* 2. เลือกหลายคน */}
              <SheetBtn
                onClick={toggleSelectMode}
                gradient="from-amber-500 to-orange-400"
                shadow="shadow-amber-200"
                icon="fa-check-double"
                label="เลือกหลายคน"
              />
              {/* 3. QR ทั้งห้อง */}
              <SheetBtn
                onClick={() => setOpenModal("classQr")}
                gradient="from-violet-600 to-fuchsia-500"
                shadow="shadow-violet-200"
                icon="fa-qrcode"
                label="QR ทั้งห้อง"
              />
              {/* 4. เพิ่มนักเรียน */}
              <SheetBtn
                onClick={() => setOpenModal("addStudent")}
                gradient="from-emerald-600 to-teal-500"
                shadow="shadow-emerald-200"
                icon="fa-user-plus"
                label="เพิ่มนักเรียน"
              />
              {/* 5. เพิ่มหลายคน */}
              <SheetBtn
                onClick={() => setOpenModal("bulkAdd")}
                gradient="from-cyan-600 to-sky-500"
                shadow="shadow-cyan-200"
                icon="fa-file-arrow-up"
                label="เพิ่มหลายคน"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== Task Manager Modal ===== */}
      {openModal === "tasks" && (
        <div id="task-manager-modal" className="fixed inset-0 z-[63] bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[92dvh] shadow-2xl flex flex-col animate-modal-pop">
            <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">✕</button>
            <h3 className="text-2xl font-black text-[#1e2d52] mb-1 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-indigo-500" /> จัดการงานของห้อง
            </h3>
            <p className="text-slate-500 text-sm mb-3">เพิ่ม/ลบ/เรียงลำดับงานได้อิสระ และแต่ละห้องกำหนดจำนวนงานไม่เท่ากันได้</p>
            <form action={createTask} className="flex items-center gap-2 mb-3">
              <input type="hidden" name="roomId" value={roomId} />
              <input name="name" className="flex-1 border rounded-lg px-3 py-2" placeholder="ชื่องานใหม่" required />
              <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold whitespace-nowrap shrink-0">
                <i className="fa-solid fa-plus mr-1" />เพิ่มงาน
              </button>
            </form>
            <div className="overflow-y-auto min-h-0 space-y-2 pr-1">
              {tasks.length === 0 ? (
                <div className="text-slate-500 text-center py-6">ยังไม่มีงาน</div>
              ) : tasks.map((task, idx) => (
                <div key={task.id} className="flex items-center gap-2 border rounded-lg p-2 bg-slate-50">
                  <span className="text-slate-400 text-sm px-1"><i className="fa-solid fa-grip-vertical" /></span>
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
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t pt-3">
              <button type="button" onClick={close} className="px-4 py-2 rounded bg-slate-200 font-semibold">
                <i className="fa-solid fa-xmark mr-1" />ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Add Student Modal ===== */}
      {openModal === "addStudent" && (
        <div className="fixed inset-0 z-[57] bg-black/60 flex items-center justify-center p-4">
          <form action={createStudent} className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop">
            <input type="hidden" name="roomId" value={roomId} />
            <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">✕</button>
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
      )}

      {/* ===== Edit Student Modal ===== */}
      {openModal === "editStudent" && (
        <div className="fixed inset-0 z-[58] bg-black/60 flex items-center justify-center p-4">
          {editingStudent ? (
            <form action={updateStudent} className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop">
              <input type="hidden" name="id" value={editingStudent.id} />
              <input type="hidden" name="roomId" value={roomId} />
              <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">✕</button>
              <h3 className="text-2xl font-black text-[#1e2d52] mb-4 flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-amber-500" /> แก้ไขข้อมูลนักเรียน
              </h3>
              <StudentFields student={editingStudent} />
              <div className="flex justify-end gap-2 mt-5">
                <button type="submit" form={`delete-student-${editingStudent.id}`} className="px-4 py-2 rounded bg-red-600 text-white font-semibold mr-auto">
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
              <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">✕</button>
              <h3 className="text-2xl font-black text-[#1e2d52] mb-4 flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-amber-500" /> เลือกนักเรียนที่ต้องการแก้ไข
              </h3>
              <div className="max-h-[62vh] overflow-y-auto space-y-2">
                {students.length === 0 ? (
                  <p className="text-center text-slate-500 py-6">ยังไม่มีนักเรียนในห้องนี้</p>
                ) : students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setEditingStudent(student)}
                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-left hover:bg-amber-50"
                  >
                    <span className="font-bold text-[#1e2d52]">{student.name}</span>
                    <span className="block text-sm text-slate-500">เลขที่ {student.number ?? "-"} · รหัส {student.code || "-"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {editingStudent && (
            <form id={`delete-student-${editingStudent.id}`} action={deleteStudent}>
              <input type="hidden" name="id" value={editingStudent.id} />
              <input type="hidden" name="roomId" value={roomId} />
            </form>
          )}
        </div>
      )}

      {/* ===== Bulk Add Modal ===== */}
      {openModal === "bulkAdd" && (
        <BulkAddModal roomId={roomId} onClose={close} />
      )}

      {/* ===== Class QR Modal ===== */}
      {openModal === "classQr" && (
        <div className="fixed inset-0 z-[59] bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[92dvh] shadow-2xl flex flex-col animate-modal-pop">
            <button type="button" onClick={close} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">✕</button>
            <h3 className="text-2xl font-black text-[#1e2d52] mb-1 flex items-center gap-2">
              <i className="fa-solid fa-qrcode text-violet-500" /> QR Code ทั้งห้องเรียน
            </h3>
            <p className="text-slate-500 text-sm mb-4">จำนวนนักเรียน {students.length} คน</p>
            <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pr-1">
              {students.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-1 border rounded-xl p-3 bg-slate-50">
                  {qrUrls[s.id] ? (
                    <img src={qrUrls[s.id]} alt={s.name} className="w-24 h-24 rounded" />
                  ) : (
                    <div className="w-24 h-24 rounded bg-slate-200 flex items-center justify-center text-slate-400">
                      <i className="fa-solid fa-spinner fa-spin" />
                    </div>
                  )}
                  <p className="text-xs font-bold text-center text-slate-700 leading-tight">{s.name}</p>
                  {s.number && <p className="text-[10px] text-slate-400">เลขที่ {s.number}</p>}
                </div>
              ))}
              {students.length === 0 && (
                <p className="col-span-full text-center text-slate-500 py-8">ยังไม่มีนักเรียน</p>
              )}
            </div>
            <div className="mt-4 flex justify-end border-t pt-3">
              <button type="button" onClick={close} className="px-4 py-2 rounded bg-slate-200 font-semibold">
                <i className="fa-solid fa-xmark mr-1" />ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ===== Sub-components =====

function SheetBtn({
  onClick,
  gradient,
  shadow,
  icon,
  label,
}: {
  onClick: () => void;
  gradient: string;
  shadow: string;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden bg-gradient-to-br ${gradient} text-white p-4 rounded-2xl shadow-lg ${shadow} hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95`}
    >
      <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
        <i className={`fa-solid ${icon} text-4xl`} />
      </div>
      <div className="flex flex-col items-start gap-1">
        <i className={`fa-solid ${icon} text-xl mb-1`} />
        <span className="text-sm font-bold">{label}</span>
      </div>
    </button>
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

function BulkAddModal({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<{ number: number | null; code: string | null; name: string; nickname: string | null }[]>([]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState("");

  function parseLines(raw: string) {
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        const numberRaw = parts[0] && /^\d+$/.test(parts[0]) ? Number(parts[0]) : null;
        if (numberRaw !== null && parts.length >= 3) {
          return { number: numberRaw, code: parts[1] || null, name: parts[2], nickname: parts[3] || null };
        }
        return { number: null, code: null, name: parts[0], nickname: parts[1] || null };
      })
      .filter((r) => r.name);
  }

  function handleChange(val: string) {
    setText(val);
    setPreview(parseLines(val));
    setResult("");
  }

  function downloadTemplate() {
    const csv = "เลขที่,รหัสนักเรียน,ชื่อ-นามสกุล,ชื่อเล่น\n1,67001,ด.ช.สมชาย ใจดี,ต้นกล้า\n2,67002,ด.ญ.กัญญา ศรีสุข,น้ำหวาน";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_students.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(fd: FormData) {
    fd.set("lines", text);
    setPending(true);
    try {
      await createStudentsBulk(fd);
      setResult(`เพิ่มนักเรียน ${preview.length} คนสำเร็จ`);
      setText("");
      setPreview([]);
      if ((window as unknown as Record<string, unknown>).notify) {
        ((window as unknown as Record<string, unknown>).notify as (msg: string, type: string) => void)(
          `เพิ่มนักเรียน ${preview.length} คนสำเร็จ`,
          "success"
        );
      }
    } finally {
      setPending(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = String(ev.target?.result ?? "");
      handleChange(raw);
    };
    reader.readAsText(file, "UTF-8");
  }

  return (
    <div className="fixed inset-0 z-[57] bg-black/60 flex items-center justify-center p-4">
      <form action={handleSubmit} className="relative bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[92dvh] shadow-2xl flex flex-col animate-modal-pop overflow-y-auto">
        <input type="hidden" name="roomId" value={roomId} />
        <button type="button" onClick={onClose} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">✕</button>
        <h3 className="text-2xl font-black text-[#1e2d52] mb-1 flex items-center gap-2">
          <i className="fa-solid fa-file-arrow-up text-cyan-500" /> เพิ่มนักเรียนหลายคน
        </h3>
        <p className="text-slate-500 text-sm mb-4">วางรายชื่อ หรืออัปโหลดไฟล์ CSV (รูปแบบ: เลขที่,รหัส,ชื่อ,ชื่อเล่น หรือแค่ชื่อ)</p>

        <div className="flex items-center gap-2 mb-3">
          <label className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold cursor-pointer hover:bg-slate-100">
            <i className="fa-solid fa-file-csv mr-1 text-emerald-600" /> อัปโหลด CSV
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
          </label>
          <button type="button" onClick={downloadTemplate} className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold hover:bg-slate-100">
            <i className="fa-solid fa-download mr-1 text-indigo-500" /> ดาวน์โหลด Template
          </button>
        </div>

        <textarea
          className="w-full border rounded-lg px-3 py-2 font-mono text-sm min-h-[150px] mb-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          placeholder={"1,67001,ด.ช.สมชาย ใจดี,ต้นกล้า\n2,67002,ด.ญ.กัญญา ศรีสุข,น้ำหวาน\nหรือวางชื่อเปล่า ๆ ทีละบรรทัด"}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
        />

        {preview.length > 0 && (
          <div className="mb-3 rounded-lg border bg-slate-50 p-3 max-h-40 overflow-y-auto">
            <p className="text-xs font-bold text-slate-500 mb-2">ตัวอย่างข้อมูลที่จะเพิ่ม ({preview.length} คน)</p>
            {preview.map((r, i) => (
              <p key={i} className="text-sm text-slate-700 leading-6">
                {r.number ? `${r.number}. ` : `${i + 1}. `}
                <span className="font-semibold">{r.name}</span>
                {r.nickname ? ` (${r.nickname})` : ""}
                {r.code ? ` [${r.code}]` : ""}
              </p>
            ))}
          </div>
        )}

        {result && <p className="text-emerald-600 text-sm font-semibold mb-3">{result}</p>}

        <div className="flex justify-end gap-2 mt-auto border-t pt-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-200 font-semibold">
            <i className="fa-solid fa-xmark mr-1" />ปิด
          </button>
          <button
            type="submit"
            disabled={pending || preview.length === 0}
            className="px-4 py-2 rounded bg-cyan-600 text-white font-semibold hover:bg-cyan-700 disabled:opacity-50"
          >
            <i className="fa-solid fa-plus mr-1" />เพิ่ม {preview.length} คน
          </button>
        </div>
      </form>
    </div>
  );
}
