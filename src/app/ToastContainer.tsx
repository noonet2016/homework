"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  msg: string;
  type: ToastType;
  show: boolean;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const notify = (msg: string, type?: ToastType) => {
      // Infer type if not specified (matching inferToastType_ in GAS)
      let tone: ToastType = "info";
      if (type) {
        tone = type;
      } else {
        const lower = msg.toLowerCase();
        if (
          lower.includes("สำเร็จ") ||
          lower.includes("เรียบร้อย") ||
          lower.includes("success") ||
          lower.includes("ผ่าน")
        ) {
          tone = "success";
        } else if (
          lower.includes("ล้มเหลว") ||
          lower.includes("ผิดพลาด") ||
          lower.includes("error") ||
          lower.includes("ไม่สำเร็จ") ||
          lower.includes("fail")
        ) {
          tone = "error";
        }
      }

      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, msg, type: tone, show: false };

      setToasts((prev) => [...prev, newToast]);

      // Trigger enter transition in next frame
      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, show: true } : t))
        );
      });

      // Auto dismiss after 3 seconds
      setTimeout(() => {
        dismiss(id);
      }, 3000);
    };

    const dismiss = (id: string) => {
      // Start exit transition
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, show: false } : t))
      );
      // Remove element after transition completes
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    };

    (window as any).notify = notify;

    return () => {
      delete (window as any).notify;
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, show: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  };

  return (
    <div
      id="toast-stack"
      className="fixed left-1/2 -translate-x-1/2 top-4 z-[9999999] space-y-2 pointer-events-none flex flex-col items-center"
    >
      {toasts.map((t) => {
        const icon = t.type === "success" ? "✓" : t.type === "error" ? "!" : "i";
        return (
          <div
            key={t.id}
            className={`toast ${t.type} ${t.show ? "show" : ""} pointer-events-auto`}
          >
            <div className="toast-icon">{icon}</div>
            <div className="text-base font-bold leading-snug">{t.msg}</div>
            <button
              onClick={() => dismiss(t.id)}
              className="toast-close"
              aria-label="close"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
