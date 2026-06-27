"use client";

import { useState, useEffect } from "react";
import DeveloperModalContent from "./DeveloperModalContent";

interface DeveloperModalClientProps {
  buttonContent: React.ReactNode;
}

export default function DeveloperModalClient({
  buttonContent,
}: DeveloperModalClientProps) {
  const [open, setOpen] = useState(false);

  // Listen for the global custom event dispatched by the topbar fa-code button
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-dev-modal", handler);
    return () => window.removeEventListener("open-dev-modal", handler);
  }, []);

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
        {buttonContent}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[1000003] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg animate-modal-pop">
            <DeveloperModalContent onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
