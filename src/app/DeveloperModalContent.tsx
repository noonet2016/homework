"use client";

interface DeveloperModalContentProps {
  onClose: () => void;
}

export default function DeveloperModalContent({ onClose }: DeveloperModalContentProps) {
  return (
    <div className="bg-gradient-to-b from-[#f4ebff] via-[#fbf9fe] to-white rounded-[2.5rem] w-full max-w-lg relative overflow-hidden p-6 sm:p-8 border border-white text-left shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-4xl sm:text-5xl font-black text-[#8d3af7] tracking-tight">
            Developed By
          </h3>
          <p className="text-sm font-extrabold text-[#5c6e8c] tracking-wider mt-1">
            Learn Tracking
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.06)] text-slate-400 hover:text-slate-600 transition-all font-bold"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Main white profile card */}
      <div className="bg-white border border-[#eef2f8] shadow-[0_8px_30px_rgba(92,108,143,0.06)] rounded-[2rem] p-6 mb-4 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        {/* Profile image with rounded-square outline */}
        <div className="w-[110px] h-[110px] shrink-0 rounded-[24px] border-2 border-[#a78bfa] p-0.5 overflow-hidden">
          <div className="w-full h-full rounded-[20px] overflow-hidden">
            <img
              src="/images/developer-taktan.png"
              className="w-full h-full object-cover object-top"
              alt="ครูตั๊ก"
              onError={(e) => {
                e.currentTarget.src =
                  "https://lh3.googleusercontent.com/d/1fbMKjuZYVmaH-T06ASdaaA3fOXhXR-L0=s600";
              }}
            />
          </div>
        </div>

        {/* Profile details */}
        <div className="text-center sm:text-left flex-1 w-full min-w-0">
          <div className="flex flex-nowrap items-center justify-center sm:justify-start gap-2 mb-1.5">
            <h4 className="text-base sm:text-lg font-black text-[#1e2d53] whitespace-nowrap">
              ครูนันทนาภรณ์ ไชยวงศ์คต
            </h4>
            <span className="inline-flex px-2 py-0.5 rounded-lg bg-[#f0e6ff] border border-[#e1ccff] text-[#9333ea] text-xs font-black shadow-sm whitespace-nowrap">
              ครูตั๊ก
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-[#69789d] mb-4">
            ผู้พัฒนาระบบติดตามงานนักเรียน
          </p>

          {/* Phone pill button */}
          <a
            href="tel:0810750101"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#f5f6ff] hover:bg-[#eceeff] text-[#27345b] font-black tracking-wide text-sm transition-all"
          >
            <i className="fa-solid fa-phone text-[#7c3aed]" /> 081-0750101
          </a>
        </div>
      </div>

      {/* LINE + Facebook — two columns */}
      <div className="grid grid-cols-2 gap-4">
        <a
          href="https://line.me/ti/p/234Hq-ydr1"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-3 bg-white border border-[#eef2f8] shadow-[0_4px_15px_rgba(92,108,143,0.04)] rounded-[20px] py-4 px-4 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#e8fbf0] flex items-center justify-center shrink-0">
            <i className="fa-brands fa-line text-[#06C755] text-2xl" />
          </div>
          <span className="text-[#27345b] font-black text-sm tracking-wide">
            TAKTANSRI
          </span>
        </a>
        <a
          href="https://www.facebook.com/taktan.torapic"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-3 bg-white border border-[#eef2f8] shadow-[0_4px_15px_rgba(92,108,143,0.04)] rounded-[20px] py-4 px-4 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#edf4fe] flex items-center justify-center shrink-0">
            <i className="fa-brands fa-facebook text-[#1877F2] text-2xl" />
          </div>
          <span className="text-[#27345b] font-black text-sm tracking-wide">
            Facebook
          </span>
        </a>
      </div>
    </div>
  );
}
