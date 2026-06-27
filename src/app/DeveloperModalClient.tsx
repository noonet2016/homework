"use client";

import { useState, useEffect } from "react";
import DeveloperModalContent from "./DeveloperModalContent";

/**
 * Single GLOBAL "Developed By" modal. Mount ONCE (in layout).
 * Opens when any trigger dispatches the `open-dev-modal` window event
 * (footer credit, left-rail fa-code, topbar fa-code). Having one listener
 * avoids stacked overlays (previously each trigger mounted its own modal).
 */
export default function DeveloperModalClient() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-dev-modal", handler);
    return () => window.removeEventListener("open-dev-modal", handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000003] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg animate-modal-pop">
        <DeveloperModalContent onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
