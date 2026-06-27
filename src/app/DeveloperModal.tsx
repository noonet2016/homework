import DeveloperModalClient from "./DeveloperModalClient";

export default function DeveloperModal() {
  const triggerButton = (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/40 backdrop-blur-xl px-4 sm:px-6 py-3 rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group cursor-pointer flex-wrap sm:flex-nowrap"
    >
      <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight whitespace-nowrap">
        Learn Tracking
      </span>
      <span className="hidden sm:inline text-slate-300">|</span>
      <span className="text-[10px] sm:text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
        Developed with <span className="animate-heart mx-0.5">❤️</span> by{" "}
        <span className="underline decoration-indigo-200 underline-offset-4 font-black text-slate-800">
          คุณครูนันทนาภรณ์ ไชยวงศ์คต (ครูตั๊ก)
        </span>
      </span>
    </button>
  );

  return (
    <DeveloperModalClient
      buttonContent={triggerButton}
    />
  );
}
