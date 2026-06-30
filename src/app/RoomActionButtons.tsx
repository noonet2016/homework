"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { deleteRoom, duplicateRoom } from "@/lib/actions/rooms";

interface RoomActionButtonsProps {
  id: string;
  name: string;
}

export default function RoomActionButtons({ id, name }: RoomActionButtonsProps) {
  const [mounted, setMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Duplication States
  const [dupName, setDupName] = useState(`${name} (สำเนา)`);
  const [includeStudents, setIncludeStudents] = useState(true);
  const [includeScores, setIncludeScores] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(true);

  // Reset duplicate states when name changes or modal opens
  useEffect(() => {
    setDupName(`${name} (สำเนา)`);
  }, [name]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("id", id);
      await deleteRoom(formData);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("name", dupName.trim());
      formData.append("includeStudents", String(includeStudents));
      formData.append("includeScores", String(includeScores));
      formData.append("includeTasks", String(includeTasks));
      await duplicateRoom(formData);
      setShowDuplicateConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  const handleStudentsChange = (checked: boolean) => {
    setIncludeStudents(checked);
    if (!checked) {
      setIncludeScores(false);
    }
  };

  const handleScoresChange = (checked: boolean) => {
    setIncludeScores(checked);
    if (checked) {
      setIncludeStudents(true);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDuplicateConfirm(true)}
        title="ทำสำเนาห้อง"
        className="text-slate-300 hover:text-teal-500 text-lg leading-none px-1 cursor-pointer"
        type="button"
      >
        <i className="fa-solid fa-copy" />
      </button>

      <button
        onClick={() => setShowDeleteConfirm(true)}
        title="ลบห้อง"
        className="text-slate-300 hover:text-red-500 text-lg leading-none px-1 cursor-pointer"
        type="button"
      >
        <i className="fa-solid fa-trash-can" />
      </button>

      {showDuplicateConfirm && mounted && createPortal(
        <div
          className="fixed inset-0 z-[1000003] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDuplicateConfirm(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 w-full max-w-md md:max-w-lg shadow-2xl animate-modal-pop text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDuplicateConfirm(false)}
              className="absolute right-3 top-3 modal-close-btn text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-copy text-indigo-600 text-xl" />
              <h3 className="text-xl font-extrabold text-slate-800">ทำสำเนาห้องเรียน</h3>
            </div>
            <p className="text-slate-500 text-xs mb-4">เลือกรูปแบบการคัดลอกข้อมูลจากห้องเดิมไปห้องใหม่</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500" htmlFor="dup-room-name">
                  ชื่อห้องใหม่
                </label>
                <input
                  id="dup-room-name"
                  type="text"
                  value={dupName}
                  onChange={(e) => setDupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mt-1 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStudents}
                    onChange={(e) => handleStudentsChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">คัดลอกรายชื่อนักเรียน</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeScores}
                    onChange={(e) => handleScoresChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 font-semibold text-slate-600">คัดลอกคะแนนด้วย</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTasks}
                    onChange={(e) => setIncludeTasks(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">คัดลอกชื่องาน/รูปงานประกอบ</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDuplicateConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200"
                disabled={isPending}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDuplicate}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1.5"
                disabled={isPending}
              >
                <i className="fa-solid fa-copy text-xs" />
                {isPending ? "กำลังทำสำเนา..." : "สร้างสำเนา"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showDeleteConfirm && mounted && createPortal(
        <div
          className="fixed inset-0 z-[1000003] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 w-full max-w-sm md:max-w-md shadow-2xl animate-modal-pop text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute right-3 top-3 modal-close-btn text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-2 text-red-600">ลบห้องเรียน</h3>
            <p className="text-slate-600 text-sm mb-6">
              ต้องการลบห้อง "{name}" ใช่หรือไม่? ระบบจะลบข้อมูลห้องนี้ออกทั้งหมด
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200"
                disabled={isPending}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-60"
                disabled={isPending}
              >
                {isPending ? "กำลังลบ..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
