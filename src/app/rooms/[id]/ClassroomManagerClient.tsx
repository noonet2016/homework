"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createStudent, deleteStudent, updateStudent, createStudentsBulk } from "@/lib/actions/students";
import { createTask, deleteTask, deleteTasksBulk, saveTasksBatch, copyTasksFromRoom, clearTaskScores } from "@/lib/actions/tasks";
import { generatePremiumQrDataUrl } from "@/lib/generatePremiumQr";
import type { StudentCardData, TaskData } from "./StudentGridClient";

type RoomSummary = { id: string; name: string; icon: string | null };

type ClassroomManagerClientProps = {
  roomId: string;
  roomName: string;
  students: StudentCardData[];
  tasks: TaskData[];
  rooms: RoomSummary[];
};

type OpenModal = "sheet" | "tasks" | "addStudent" | "editStudent" | "bulkAdd" | "classQr" | null;

export default function ClassroomManagerClient({ roomId, roomName, students, tasks, rooms }: ClassroomManagerClientProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [editingStudent, setEditingStudent] = useState<StudentCardData | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qrUrls, setQrUrls] = useState<Record<string, { teacher: string; student: string }>>({});
  const [localTasks, setLocalTasks] = useState<TaskData[]>(tasks);
  const [sourceRoomId, setSourceRoomId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<{ id: string; name: string } | null>(null);
  const [clearConfirmTask, setClearConfirmTask] = useState<{ id: string; name: string } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imagePickerIdx, setImagePickerIdx] = useState<number | null>(null);
  const [imagePickerUrl, setImagePickerUrl] = useState("");
  const [taskSelectMode, setTaskSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  // ── Task drag (Pointer Events + snap-rect animate — same pattern as RoomsGrid) ──
  const taskCardEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const taskDraggingId = useRef<string | null>(null);
  const taskHoverId = useRef<string | null>(null);
  const taskCloneEl = useRef<HTMLElement | null>(null);
  const taskOffset = useRef({ x: 0, y: 0 });
  const taskSnapRects = useRef<Map<string, DOMRect>>(new Map());
  const taskJustDropped = useRef(false);
  const taskMoveHandler = useRef<((e: PointerEvent) => void) | null>(null);
  const taskUpHandler = useRef<(() => void) | null>(null);
  const localTasksRef = useRef(localTasks);
  useEffect(() => { localTasksRef.current = localTasks; }, [localTasks]);

  // When the tasks modal opens, reset localTasks to the latest tasks prop
  useEffect(() => {
    if (openModal === "tasks") { setLocalTasks(tasks); setTaskSelectMode(false); setSelectedTaskIds([]); }
  }, [openModal, tasks]);

  // After drop: clear inline transforms (cards now sit at their natural positions)
  useLayoutEffect(() => {
    if (!taskJustDropped.current) return;
    taskJustDropped.current = false;
    taskCardEls.current.forEach((el) => { el.style.transition = "none"; el.style.transform = ""; });
  }, [localTasks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (taskMoveHandler.current) window.removeEventListener("pointermove", taskMoveHandler.current);
      if (taskUpHandler.current) window.removeEventListener("pointerup", taskUpHandler.current);
      taskCloneEl.current?.remove();
    };
  }, []);

  const applyTaskTransforms = (dragId: string, hoverTargetId: string) => {
    const list = localTasksRef.current;
    const preview = [...list];
    const fi = preview.findIndex((t) => t.id === dragId);
    const ti = preview.findIndex((t) => t.id === hoverTargetId);
    if (fi === -1 || ti === -1) return;
    const [moved] = preview.splice(fi, 1);
    preview.splice(ti, 0, moved);
    taskCardEls.current.forEach((el, id) => {
      if (id === dragId) return;
      const newIdx = preview.findIndex((t) => t.id === id);
      const occupantId = list[newIdx]?.id;
      if (!occupantId) return;
      const from = taskSnapRects.current.get(id);
      const to = taskSnapRects.current.get(occupantId);
      if (!from || !to) return;
      el.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      el.style.transform = `translateY(${to.top - from.top}px)`;
    });
  };

  const resetTaskTransforms = () => {
    taskCardEls.current.forEach((el, id) => {
      if (id === taskDraggingId.current) return;
      el.style.transition = "transform 180ms ease";
      el.style.transform = "";
    });
  };

  const startTaskDrag = (e: React.PointerEvent<HTMLSpanElement>, id: string) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const card = taskCardEls.current.get(id);
    if (!card) return;
    taskSnapRects.current.clear();
    taskCardEls.current.forEach((el, tid) => taskSnapRects.current.set(tid, el.getBoundingClientRect()));
    taskDraggingId.current = id;
    taskHoverId.current = null;
    const rect = taskSnapRects.current.get(id)!;
    taskOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    card.style.opacity = "0.3";
    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;z-index:9999;pointer-events:none;transition:none;box-shadow:0 8px 30px rgba(0,0,0,0.18);border-radius:12px;opacity:0.96;`;
    document.body.appendChild(clone);
    taskCloneEl.current = clone;
    taskMoveHandler.current = (ev: PointerEvent) => {
      if (taskCloneEl.current) {
        taskCloneEl.current.style.left = `${ev.clientX - taskOffset.current.x}px`;
        taskCloneEl.current.style.top = `${ev.clientY - taskOffset.current.y}px`;
      }
      const dragId = taskDraggingId.current;
      if (!dragId) return;
      const dragRect = taskSnapRects.current.get(dragId);
      if (dragRect && ev.clientX >= dragRect.left && ev.clientX <= dragRect.right &&
          ev.clientY >= dragRect.top && ev.clientY <= dragRect.bottom) {
        if (taskHoverId.current !== null) { taskHoverId.current = null; resetTaskTransforms(); }
        return;
      }
      let newHoverId: string | null = null;
      taskSnapRects.current.forEach((r, tid) => {
        if (tid === dragId) return;
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom)
          newHoverId = tid;
      });
      if (newHoverId === null || newHoverId === taskHoverId.current) return;
      taskHoverId.current = newHoverId;
      applyTaskTransforms(dragId, newHoverId);
    };
    taskUpHandler.current = () => {
      window.removeEventListener("pointermove", taskMoveHandler.current!);
      window.removeEventListener("pointerup", taskUpHandler.current!);
      taskCloneEl.current?.remove(); taskCloneEl.current = null;
      const dragCard = taskCardEls.current.get(taskDraggingId.current!);
      if (dragCard) dragCard.style.opacity = "";
      const dragId = taskDraggingId.current;
      const hoverTargetId = taskHoverId.current;
      taskDraggingId.current = null; taskHoverId.current = null;
      if (!dragId || !hoverTargetId || dragId === hoverTargetId) { resetTaskTransforms(); return; }
      const newTasks = [...localTasksRef.current];
      const fi2 = newTasks.findIndex((t) => t.id === dragId);
      const ti2 = newTasks.findIndex((t) => t.id === hoverTargetId);
      const [item] = newTasks.splice(fi2, 1);
      newTasks.splice(ti2, 0, item);
      taskJustDropped.current = true;
      setLocalTasks(newTasks);
    };
    window.addEventListener("pointermove", taskMoveHandler.current);
    window.addEventListener("pointerup", taskUpHandler.current);
  };

  function handleLocalNameChange(idx: number, value: string) {
    setLocalTasks((prev) => prev.map((t, i) => i === idx ? { ...t, name: value } : t));
  }

  function handleImageUrl(idx: number) {
    setImagePickerIdx(idx);
    setImagePickerUrl(localTasks[idx].imageUrl ?? "");
  }

  function closeImagePicker() {
    setImagePickerIdx(null);
    setImagePickerUrl("");
  }

  function applyImageUrl(url: string) {
    if (imagePickerIdx === null) return;
    setLocalTasks((prev) => prev.map((t, i) => i === imagePickerIdx ? { ...t, imageUrl: url || null } : t));
    closeImagePicker();
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const d = String(ev.target?.result ?? ""); if (d) applyImageUrl(d); };
    reader.readAsDataURL(file);
  }

async function handleSaveTasks() {
    setIsSaving(true);
    try {
      await saveTasksBatch(roomId, localTasks.map((t, i) => ({
        id: t.id, name: t.name, imageUrl: t.imageUrl, visible: t.visible, taskIndex: i + 1,
      })));
      router.refresh();
      close();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyFromRoom() {
    if (!sourceRoomId) return;
    setIsSaving(true);
    try {
      const newTasks = await copyTasksFromRoom(roomId, sourceRoomId);
      if (newTasks && newTasks.length > 0) {
        setLocalTasks((prev) => [...prev, ...newTasks]);
      }
      setSourceRoomId("");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBulkDeleteTasks() {
    if (!selectedTaskIds.length) return;
    setIsSaving(true);
    try {
      await deleteTasksBulk(roomId, selectedTaskIds);
      setLocalTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));
      setSelectedTaskIds([]);
      setTaskSelectMode(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearScores(taskId: string) {
    const task = localTasks.find((t) => t.id === taskId);
    if (task) setClearConfirmTask({ id: taskId, name: task.name });
  }

  async function confirmClearScores() {
    if (!clearConfirmTask) return;
    await clearTaskScores(clearConfirmTask.id, roomId);
    setClearConfirmTask(null);
    router.refresh();
  }

  async function handleDeleteTask(taskId: string) {
    const task = localTasks.find((t) => t.id === taskId);
    if (task) setDeleteConfirmTask({ id: taskId, name: task.name });
  }

  async function confirmDeleteTask() {
    if (!deleteConfirmTask) return;
    const fd = new FormData();
    fd.set("id", deleteConfirmTask.id);
    fd.set("roomId", roomId);
    await deleteTask(fd);
    setLocalTasks((prev) => prev.filter((t) => t.id !== deleteConfirmTask.id));
    setDeleteConfirmTask(null);
  }

  async function handleAddTask(fd: FormData) {
    await createTask(fd);
    router.refresh();
  }

  // Listen for selection-changed events from StudentGridClient
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      setSelectedIds(detail.ids ?? []);
    };
    window.addEventListener("selection-changed", handler);
    return () => window.removeEventListener("selection-changed", handler);
  }, []);

  // Generate teacher+student QR URLs when classQr modal opens
  useEffect(() => {
    if (openModal !== "classQr") return;
    const origin = window.location.origin;
    import("qrcode").then((QRCode) => {
      const opts = { width: 220, margin: 1, color: { dark: "#1e2d52", light: "#ffffff" } };
      const promises = students.map(async (s) => {
        const teacherUrl = `${origin}/grade/${roomId}/${s.id}`;
        const studentUrl = `${origin}/view/${roomId}/${s.id}`;
        const [teacher, student] = await Promise.all([
          QRCode.default.toDataURL(teacherUrl, opts),
          QRCode.default.toDataURL(studentUrl, opts),
        ]);
        return [s.id, { teacher, student }] as [string, { teacher: string; student: string }];
      });
      Promise.all(promises).then((entries) => setQrUrls(Object.fromEntries(entries)));
    });
  }, [openModal, roomId, students]);

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
            <button type="button" onClick={close} className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
            <h3 className="text-2xl font-black text-[#1e2d52] mb-1 flex items-center gap-2">
              <i className="fa-solid fa-bars-staggered text-indigo-500" /> จัดการงานของห้อง
            </h3>
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-500 text-sm">เพิ่ม/ลบ/เรียงลำดับงานได้อิสระ และแต่ละห้องกำหนดจำนวนงานไม่เท่ากันได้</p>
              {localTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setTaskSelectMode((m) => !m); setSelectedTaskIds([]); }}
                  className={"ml-3 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors " + (taskSelectMode ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200")}
                >
                  <i className={"fa-solid " + (taskSelectMode ? "fa-xmark" : "fa-check-square")} />
                  {taskSelectMode ? "ยกเลิกเลือก" : "เลือกลบ"}
                </button>
              )}
            </div>

            {/* Copy from room */}
            <div className="flex items-center gap-2 mb-3">
              <select
                value={sourceRoomId}
                onChange={(e) => setSourceRoomId(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">เลือกห้องต้นทาง</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.icon ? r.icon + " " : ""}{r.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCopyFromRoom}
                disabled={!sourceRoomId || isSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold whitespace-nowrap shrink-0 hover:bg-violet-700 disabled:opacity-40"
              >
                <i className="fa-solid fa-copy" /> คัดลอกจากห้องนี้
              </button>
            </div>

            {/* Add task */}
            <form action={handleAddTask} className="flex items-center gap-2 mb-4">
              <input type="hidden" name="roomId" value={roomId} />
              <input
                name="name"
                className="flex-1 border-2 border-indigo-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
                placeholder="ชื่องานใหม่"
                required
              />
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold whitespace-nowrap shrink-0 hover:bg-indigo-700">
                <i className="fa-solid fa-plus" /> เพิ่มงาน
              </button>
            </form>

            {/* Task list */}
            <div className="overflow-y-auto min-h-0 space-y-2 pr-1 flex-1">
              {localTasks.length === 0 ? (
                <div className="text-slate-500 text-center py-10 text-sm">
                  <i className="fa-solid fa-inbox text-3xl mb-2 block text-slate-300" />
                  ยังไม่มีงาน — เพิ่มได้เลยครับ
                </div>
              ) : localTasks.map((task, idx) => (
                <div
                  key={task.id}
                  ref={(el) => { if (el) taskCardEls.current.set(task.id, el); else taskCardEls.current.delete(task.id); }}
                  className={"flex items-center gap-1.5 border rounded-xl px-2 py-1.5 transition-colors " + (taskSelectMode && selectedTaskIds.includes(task.id) ? "bg-rose-50 border-rose-300" : "bg-slate-50 hover:bg-white")}
                  onClick={taskSelectMode ? () => setSelectedTaskIds((prev) => prev.includes(task.id) ? prev.filter((x) => x !== task.id) : [...prev, task.id]) : undefined}
                >
                  {taskSelectMode ? (
                    <span className="px-1 shrink-0">
                      <i className={"fa-solid text-base " + (selectedTaskIds.includes(task.id) ? "fa-square-check text-rose-500" : "fa-square text-slate-300")} />
                    </span>
                  ) : (
                    <span className="text-slate-300 cursor-grab px-1 shrink-0 touch-none select-none" onPointerDown={(e) => startTaskDrag(e, task.id)}><i className="fa-solid fa-grip-vertical" /></span>
                  )}
                  <span className="text-xs text-slate-400 w-6 text-center shrink-0 font-mono">{idx + 1}</span>
                  <input
                    type="text"
                    value={task.name}
                    onChange={taskSelectMode ? undefined : (e) => handleLocalNameChange(idx, e.target.value)}
                    readOnly={taskSelectMode}
                    className={"flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm min-w-0 focus:outline-none bg-white " + (taskSelectMode ? "cursor-pointer" : "focus:ring-2 focus:ring-indigo-400")}
                  />
                  {!taskSelectMode && (
                    <>
                      <button type="button" title={task.imageUrl ? "แก้ไข URL รูปภาพ" : "ตั้ง URL รูปภาพ"} onClick={() => handleImageUrl(idx)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${task.imageUrl ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-blue-50 border-blue-200 text-blue-400"}`}>
                        <i className="fa-solid fa-image text-xs" />
                      </button>
                      <button type="button" title={task.imageUrl ? "ดูรูปใบงาน" : "ยังไม่มีรูปใบงาน"} onClick={() => task.imageUrl && setPreviewImageUrl(task.imageUrl)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${task.imageUrl ? "bg-green-50 border-green-200 text-green-500 hover:bg-green-100 cursor-pointer" : "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"}`}>
                        <i className="fa-solid fa-eye text-xs" />
                      </button>
                      <button type="button" title="ล้างคะแนนทั้งหมดของงานนี้" onClick={() => handleClearScores(task.id)}
                        className="w-8 h-8 rounded-lg border bg-amber-50 border-amber-200 text-amber-500 flex items-center justify-center shrink-0 hover:bg-amber-100">
                        <i className="fa-solid fa-eraser text-xs" />
                      </button>
                      <button type="button" onClick={() => handleDeleteTask(task.id)}
                        className="w-8 h-8 rounded-lg border bg-red-50 border-red-200 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-100">
                        <i className="fa-solid fa-trash text-xs" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-between gap-2 border-t pt-3">
              <div className="flex items-center gap-2">
                {taskSelectMode && (
                  <button
                    type="button"
                    onClick={() => setSelectedTaskIds(selectedTaskIds.length === localTasks.length ? [] : localTasks.map((t) => t.id))}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200"
                  >
                    <i className="fa-solid fa-check-double" />
                    {selectedTaskIds.length === localTasks.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {taskSelectMode ? (
                  <button
                    type="button"
                    onClick={handleBulkDeleteTasks}
                    disabled={!selectedTaskIds.length || isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-40"
                  >
                    <i className="fa-solid fa-trash" /> {isSaving ? "กำลังลบ..." : `ลบที่เลือก (${selectedTaskIds.length})`}
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={close} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 shadow-sm">
                      <i className="fa-solid fa-xmark" /> ยกเลิก
                    </button>
                    <button type="button" onClick={handleSaveTasks} disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">
                      <i className="fa-solid fa-floppy-disk" /> {isSaving ? "กำลังบันทึก..." : "บันทึกงาน"}
                    </button>
                  </>
                )}
              </div>
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
              <button type="button" onClick={close} className="px-4 py-2 rounded border border-rose-200 bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 shadow-sm">
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
                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 rounded border border-rose-200 bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 shadow-sm">
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

      {/* ===== Image Picker Modal (upload file OR enter URL) ===== */}
      {imagePickerIdx !== null && (
        <div className="fixed inset-0 z-[76] bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop">
            <button type="button" onClick={closeImagePicker} className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
              <i className="fa-solid fa-xmark" />
            </button>
            <h3 className="text-xl font-black text-[#1e2d52] mb-1 flex items-center gap-2">
              <i className="fa-solid fa-image text-blue-500" /> รูปใบงาน
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              &ldquo;{imagePickerIdx !== null ? localTasks[imagePickerIdx]?.name : ""}&rdquo;
            </p>

            {/* Upload from device */}
            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-semibold text-sm cursor-pointer hover:bg-blue-100 transition-colors mb-4">
              <i className="fa-solid fa-upload" /> เลือกไฟล์จากเครื่อง
              <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </label>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-semibold">หรือ</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* URL input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={imagePickerUrl}
                onChange={(e) => setImagePickerUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <button type="button" onClick={() => applyImageUrl(imagePickerUrl.trim())}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shrink-0">
                ตกลง
              </button>
            </div>

            {/* Preview current */}
            {imagePickerUrl && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 max-h-48">
                <img src={imagePickerUrl} alt="preview" className="w-full object-contain max-h-48" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}

            {/* Remove button */}
            {localTasks[imagePickerIdx ?? 0]?.imageUrl && (
              <button type="button" onClick={() => applyImageUrl("")}
                className="mt-3 w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50">
                <i className="fa-solid fa-trash-can mr-1" /> ลบรูปออก
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== Image Preview Modal ===== */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[75] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreviewImageUrl(null)} className="absolute -right-3 -top-3 w-9 h-9 flex items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100 z-10">
              <i className="fa-solid fa-xmark" />
            </button>
            <img src={previewImageUrl} alt="ใบงาน" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* ===== Delete Task Confirm Modal ===== */}
      {deleteConfirmTask && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop">
            <button type="button" onClick={() => setDeleteConfirmTask(null)} className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
            <h3 className="text-2xl font-black text-[#1e2d52] mb-2 flex items-center gap-2">
              <i className="fa-solid fa-trash-can text-red-500" /> ยืนยันการลบงาน
            </h3>
            <p className="text-slate-700 mb-2">ต้องการลบ &ldquo;{deleteConfirmTask.name}&rdquo; ใช่หรือไม่?</p>
            <p className="text-red-500 text-sm font-semibold mb-6">หมายเหตุ: คะแนนของงานนี้จะถูกลบออกจากนักเรียนทุกคนในห้อง</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteConfirmTask(null)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 shadow-sm">
                <i className="fa-solid fa-xmark" /> ยกเลิก
              </button>
              <button type="button" onClick={confirmDeleteTask} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">
                <i className="fa-solid fa-trash-can" /> ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Clear Scores Confirm Modal ===== */}
      {clearConfirmTask && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-pop">
            <button type="button" onClick={() => setClearConfirmTask(null)} className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
            <h3 className="text-2xl font-black text-[#1e2d52] mb-2 flex items-center gap-2">
              <i className="fa-solid fa-eraser text-amber-500" /> ยืนยันการล้างคะแนน
            </h3>
            <p className="text-slate-700 mb-2">ต้องการล้างคะแนนทั้งหมดของ &ldquo;{clearConfirmTask.name}&rdquo; ใช่หรือไม่?</p>
            <p className="text-red-500 text-sm font-semibold mb-6">หมายเหตุ: คะแนนทุกคนในงานนี้จะถูกรีเซ็ตเป็น 0 ไม่สามารถย้อนกลับได้</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setClearConfirmTask(null)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 shadow-sm">
                <i className="fa-solid fa-xmark" /> ยกเลิก
              </button>
              <button type="button" onClick={confirmClearScores} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600">
                <i className="fa-solid fa-eraser" /> ยืนยันล้างคะแนน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Bulk Add Modal ===== */}
      {openModal === "bulkAdd" && (
        <BulkAddModal roomId={roomId} onClose={close} />
      )}

      {/* ===== Class QR Modal ===== */}
      {openModal === "classQr" && (
        <div className="fixed inset-0 z-[59] bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[92dvh] shadow-2xl flex flex-col animate-modal-pop overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#1e2d52] flex items-center gap-2">
                  <i className="fa-solid fa-qrcode text-violet-500" /> QR Code ทั้งห้องเรียน
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">จำนวนนักเรียน {students.length} คน</p>
              </div>
              <button type="button" onClick={close} className="modal-close-btn" aria-label="Close">✕</button>
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {students.length === 0 && (
                <p className="text-center text-slate-500 py-8">ยังไม่มีนักเรียน</p>
              )}
              {[...students].sort((a, b) => (a.number ?? 999) - (b.number ?? 999)).map((s) => {
                const qr = qrUrls[s.id];
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const teacherUrl = `${origin}/grade/${roomId}/${s.id}`;
                const studentUrl = `${origin}/view/${roomId}/${s.id}`;
                return (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                    {/* Student bar */}
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-base font-black text-slate-700 shrink-0">
                        {s.number ?? "-"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 leading-tight text-sm">
                          {s.name}{s.nickname ? <span className="text-indigo-500"> ({s.nickname})</span> : null}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          เลขที่ {s.number ?? "-"} • รหัส {s.code || "-"}
                        </p>
                      </div>
                    </div>
                    {/* QR panels */}
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Teacher */}
                      <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100/50 rounded-3xl p-4 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">สำหรับครู (ให้คะแนนด่วน)</span>
                        </div>
                        <div className="bg-white p-2 rounded-2xl mb-3 border border-indigo-100 shadow-sm">
                          {qr ? (
                            <img src={qr.teacher} alt="teacher QR" className="w-[140px] h-[140px] rounded-lg" />
                          ) : (
                            <div className="w-[140px] h-[140px] rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <i className="fa-solid fa-spinner fa-spin" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col w-full gap-2">
                          {qr && (
                            <a
                              href={qr.teacher}
                              download={`teacher_QR_เลขที่${s.number ?? s.id}_${s.name}.png`}
                              className="w-full py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                              <i className="fa-solid fa-cloud-arrow-down" /> ดาวน์โหลด
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(teacherUrl)}
                            className="w-full py-2 rounded-xl bg-white border border-indigo-200 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fa-solid fa-link" /> คัดลอกลิงก์
                          </button>
                        </div>
                      </div>
                      {/* Student */}
                      <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100/50 rounded-3xl p-4 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">สำหรับนักเรียน (ดูคะแนน)</span>
                        </div>
                        <div className="bg-white p-2 rounded-2xl mb-3 border border-emerald-100 shadow-sm">
                          {qr ? (
                            <img src={qr.student} alt="student QR" className="w-[140px] h-[140px] rounded-lg" />
                          ) : (
                            <div className="w-[140px] h-[140px] rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <i className="fa-solid fa-spinner fa-spin" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col w-full gap-2">
                          {qr && (
                            <a
                              href={qr.student}
                              download={`student_QR_เลขที่${s.number ?? s.id}_${s.name}.png`}
                              className="w-full py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                              <i className="fa-solid fa-cloud-arrow-down" /> ดาวน์โหลด
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(studentUrl)}
                            className="w-full py-2 rounded-xl bg-white border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fa-solid fa-link" /> คัดลอกลิงก์
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Footer */}
            <div className="shrink-0 border-t border-slate-100 px-6 py-3 flex justify-between items-center bg-white gap-3">
              <button
                type="button"
                disabled={Object.keys(qrUrls).length < students.length}
                onClick={async () => {
                  const sorted = [...students].sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
                  const cards: string[] = [];
                  for (const s of sorted) {
                    const qr = qrUrls[s.id];
                    if (!qr) continue;
                    const [tDataUrl, sDataUrl] = await Promise.all([
                      generatePremiumQrDataUrl(qr.teacher, "ครู (ให้คะแนนด่วน)", roomName, String(s.number ?? "-"), s.code ?? "-", s.name, s.nickname ?? "-"),
                      generatePremiumQrDataUrl(qr.student, "นักเรียน (ดูคะแนน)", roomName, String(s.number ?? "-"), s.code ?? "-", s.name, s.nickname ?? "-"),
                    ]);
                    cards.push(`<img src="${tDataUrl}">`, `<img src="${sDataUrl}">`);
                  }
                  const win = window.open("", "_blank");
                  if (!win) return;
                  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
                    <title>QR ทั้งห้องเรียน — ${roomName}</title>
                    <style>
                      body{font-family:"Noto Sans Thai",sans-serif;margin:0;padding:10mm;background:#fff}
                      .page-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5mm;}
                      img{width:100%;max-height:52mm;object-fit:contain;border:1px dashed #bbb;border-radius:5mm;}
                      @media print{
                        @page{size:A4;margin:10mm}
                        body{padding:0}
                        .page-grid{gap:5mm}
                        img{box-shadow:none;page-break-inside:avoid;}
                      }
                    </style></head><body><div class="page-grid">${cards.join("")}</div></body></html>`);
                  win.document.close();
                  setTimeout(() => win.print(), 800);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-print" />
                {Object.keys(qrUrls).length < students.length ? "กำลังสร้าง QR..." : "พิมพ์ทั้งหมด"}
              </button>
              <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 font-semibold text-sm hover:bg-rose-100 shadow-sm">
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
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-rose-200 bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 shadow-sm">
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
