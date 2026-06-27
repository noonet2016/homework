"use client";

/**
 * TopbarActions — client component for the topbar buttons that require onClick.
 * Matches GAS: fa-code (developer modal) + fa-user-shield (admin login).
 * Both dispatch custom events listened by DeveloperModalClient and TeacherAuthChip.
 */
export default function TopbarActions({ isTeacher }: { isTeacher: boolean }) {
  const openDev = () =>
    window.dispatchEvent(new CustomEvent("open-dev-modal"));

  const openAuth = () =>
    window.dispatchEvent(new CustomEvent("open-teacher-auth"));

  return (
    <div className="flex items-center gap-2">
      {/* Developer button — fa-code (same as GAS) */}
      <button
        type="button"
        onClick={openDev}
        title="ผู้พัฒนา"
        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 fa-btn text-slate-500 transition-colors"
      >
        <i className="fa-solid fa-code" />
      </button>

      {/* Admin / teacher auth button — fa-user-shield (same as GAS) */}
      <button
        type="button"
        onClick={openAuth}
        title={isTeacher ? "ออกจากระบบครู" : "เข้าสู่ระบบครู"}
        className={[
          "px-3 py-2 rounded-xl border fa-btn transition-colors",
          isTeacher
            ? "border-violet-300 bg-violet-600 text-white hover:bg-violet-700"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
        ].join(" ")}
      >
        <i className="fa-solid fa-user-shield" />
      </button>
    </div>
  );
}
