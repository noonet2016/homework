"use client";

// "Developed By" credit box + popup — ported verbatim from GAS openDeveloperModal().
import { useState } from "react";

export default function DeveloperModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Clickable credit box (the footer glass chip) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      {open && (
        <div
          className="fixed inset-0 z-[1000003] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl animate-modal-pop relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative animated blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-[64px] opacity-40 animate-pulse" />
            <div
              className="absolute -bottom-20 -left-20 w-64 h-64 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-[64px] opacity-40 animate-pulse"
              style={{ animationDelay: "1s" }}
            />

            <div className="p-5 sm:p-8 overflow-y-auto max-h-[85vh] relative z-10">
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div>
                  <h3 className="text-[clamp(26px,6.4vw,46px)] leading-none whitespace-nowrap font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-fuchsia-600 drop-shadow-sm">
                    Developed By
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 font-medium tracking-wide">
                    Learn Tracking
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white border border-white/80 shadow-sm text-slate-500 hover:text-rose-500 transition-all backdrop-blur-md"
                >
                  ✕
                </button>
              </div>

              {/* Profile card */}
              <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-5 sm:p-6 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 transition-transform hover:scale-[1.01] duration-300">
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-[2rem] bg-gradient-to-br from-violet-500 to-fuchsia-500 p-1 shadow-lg shadow-violet-500/20">
                  <div className="w-full h-full bg-white/90 backdrop-blur-sm rounded-[1.8rem] flex items-center justify-center overflow-hidden shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/developer-taktan.png"
                      className="w-full h-full object-cover object-top transition-transform"
                      alt="ครูตั๊ก"
                    />
                  </div>
                </div>

                <div className="text-left flex-1 w-full pt-1 max-w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 mb-1 min-w-0">
                    <h4 className="text-[clamp(13px,3.2vw,15px)] sm:text-[clamp(11px,2.5vw,20px)] leading-tight font-bold text-slate-800 whitespace-nowrap max-w-full">
                      คุณครูนันทนาภรณ์ ไชยวงศ์คต
                    </h4>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-[10px] shadow-sm whitespace-nowrap">
                      ครูตั๊ก
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-4">
                    ผู้พัฒนาระบบติดตามงานนักเรียน
                  </p>

                  {/* Phone — full-width button under the name (inside the card) */}
                  <a
                    href="tel:0810750101"
                    className="flex items-center justify-center gap-2 w-full px-3.5 py-3 rounded-2xl bg-white/80 hover:bg-violet-50 border border-white/80 shadow-sm text-base text-slate-700 hover:text-violet-700 font-bold transition-all"
                  >
                    <i className="fa-solid fa-phone text-violet-500" /> 081-0750101
                  </a>
                </div>
              </div>

              {/* LINE + Facebook — two columns below the card */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <a
                  href="https://line.me/ti/p/234Hq-ydr1"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-3.5 py-4 rounded-2xl bg-white/80 hover:bg-[#06C755]/10 border border-white/80 shadow-sm text-sm text-slate-700 hover:text-[#06C755] font-bold transition-all"
                >
                  <i className="fa-brands fa-line text-[#06C755] text-lg" /> TAKTANSRI
                </a>
                <a
                  href="https://www.facebook.com/taktan.torapic"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-3.5 py-4 rounded-2xl bg-white/80 hover:bg-[#1877F2]/10 border border-white/80 shadow-sm text-sm text-slate-700 hover:text-[#1877F2] font-bold transition-all"
                >
                  <i className="fa-brands fa-facebook text-[#1877F2] text-lg" /> Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
