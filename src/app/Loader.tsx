"use client";

import { useEffect, useState } from "react";

const LOADER_SHOW_DELAY_MS = 50;
const LOADER_MIN_VISIBLE_MS = 2500;

let loaderDelayTimer: NodeJS.Timeout | null = null;
let loaderHideTimer: NodeJS.Timeout | null = null;
let loaderVisibleAt = 0;

export default function Loader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleLoader = (show: boolean) => {
      if (show) {
        if (loaderHideTimer) {
          clearTimeout(loaderHideTimer);
          loaderHideTimer = null;
        }
        if (visible) return;
        if (loaderDelayTimer) return;
        loaderDelayTimer = setTimeout(() => {
          loaderDelayTimer = null;
          loaderVisibleAt = Date.now();
          setVisible(true);
        }, LOADER_SHOW_DELAY_MS);
      } else {
        if (loaderDelayTimer) {
          clearTimeout(loaderDelayTimer);
          loaderDelayTimer = null;
        }
        if (!visible) return;
        const elapsed = Date.now() - loaderVisibleAt;
        const wait = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);
        if (loaderHideTimer) clearTimeout(loaderHideTimer);
        loaderHideTimer = setTimeout(() => {
          loaderHideTimer = null;
          setVisible(false);
        }, wait);
      }
    };

    // Attach to window so we can trigger it globally
    (window as any).toggleLoader = toggleLoader;

    // Listen to custom events too
    const handleShow = () => toggleLoader(true);
    const handleHide = () => toggleLoader(false);
    window.addEventListener("show-loader", handleShow);
    window.addEventListener("hide-loader", handleHide);

    return () => {
      delete (window as any).toggleLoader;
      window.removeEventListener("show-loader", handleShow);
      window.removeEventListener("hide-loader", handleHide);
      if (loaderDelayTimer) clearTimeout(loaderDelayTimer);
      if (loaderHideTimer) clearTimeout(loaderHideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="relative flex flex-col items-center">
        {/* Glow Effect Behind */}
        <div className="absolute w-32 h-32 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>

        {/* Rocket Icon */}
        <div className="animate-rocket relative z-10 mb-6">
          <i className="fa-solid fa-rocket text-6xl text-white rocket-engine"></i>
        </div>

        {/* Loading Text */}
        <div className="text-center relative z-10">
          <p className="text-xl font-black text-white uppercase tracking-[0.3em] flex items-center justify-center">
            Loading
            <span className="flex ml-2">
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
            </span>
          </p>
          <p className="text-[10px] text-amber-300 font-bold uppercase tracking-widest mt-1 animate-pulse">
            Preparing for Mission
          </p>
        </div>
      </div>
    </div>
  );
}
