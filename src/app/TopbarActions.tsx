"use client";

/**
 * TopbarActions — client component for the topbar buttons that require onClick.
 * Matches GAS: fa-circle-plus (add room, teacher only) + fa-code (developer modal) + fa-user-shield (admin login).
 */
export default function TopbarActions({
  isTeacher,
  usedIcons = [],
}: {
  isTeacher: boolean;
  usedIcons?: string[];
}) {
  const openAddRoom = () =>
    window.dispatchEvent(new CustomEvent("open-add-room-modal", { detail: { usedIcons } }));

  const openDev = () =>
    window.dispatchEvent(new CustomEvent("open-dev-modal"));

  const openAuth = () =>
    window.dispatchEvent(new CustomEvent("open-teacher-auth"));

  const openDeviceManager = () =>
    window.dispatchEvent(new CustomEvent("open-device-manager"));

  return (
    <div className="flex items-center gap-2">
      {/* Add room button — only visible when teacher (matches GAS #topbar-add-room-btn) */}
      {isTeacher && (
        <button
          type="button"
          onClick={openAddRoom}
          title="เพิ่มห้องเรียน"
          className="h-11 px-3 rounded-xl border border-violet-200 bg-violet-600 text-white hover:bg-violet-700 transition-colors inline-flex items-center justify-center gap-1"
        >
          <i className="fa-solid fa-circle-plus sm:mr-1" />
          <span className="hidden sm:inline text-sm font-semibold">ห้องเรียน</span>
        </button>
      )}

      {/* Trusted-device manager — teacher only */}
      {isTeacher && (
        <button
          type="button"
          onClick={openDeviceManager}
          title="อุปกรณ์ที่เชื่อถือ"
          className="h-11 w-11 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 fa-btn text-blue-600 transition-colors inline-flex items-center justify-center"
        >
          <i className="fa-solid fa-shield-halved" />
        </button>
      )}

      {/* Developer button — fa-code (same as GAS) */}
      <button
        type="button"
        onClick={openDev}
        title="ผู้พัฒนา"
        className="h-11 w-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 fa-btn text-slate-500 transition-colors inline-flex items-center justify-center"
      >
        <i className="fa-solid fa-code" />
      </button>

    </div>
  );
}
