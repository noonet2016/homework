"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  roomId: string;
  studentId: string;
  studentName: string;
  studentNumber: number | null;
  studentCode: string | null;
  roomName: string;
  onClose: () => void;
};

export default function QuickGradeQrModal({
  roomId,
  studentId,
  studentName,
  studentNumber,
  studentCode,
  roomName,
  onClose,
}: Props) {
  const [teacherQr, setTeacherQr] = useState({ url: "", dataUrl: "" });
  const [studentQr, setStudentQr] = useState({ url: "", dataUrl: "" });
  const [copied, setCopied] = useState<"teacher" | "student" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      const QRCode = await import("qrcode");
      const teacherUrl = `${window.location.origin}/grade/${roomId}/${studentId}`;
      const studentUrl = `${window.location.origin}/view/${roomId}/${studentId}`;
      const options = { width: 240, margin: 1, color: { dark: "#1e2d52", light: "#ffffff" } };
      const [teacherDataUrl, studentDataUrl] = await Promise.all([
        QRCode.default.toDataURL(teacherUrl, options),
        QRCode.default.toDataURL(studentUrl, options),
      ]);
      if (cancelled) return;
      setTeacherQr({ url: teacherUrl, dataUrl: teacherDataUrl });
      setStudentQr({ url: studentUrl, dataUrl: studentDataUrl });
    }
    generate();
    return () => {
      cancelled = true;
    };
  }, [roomId, studentId]);

  function download(kind: "teacher" | "student") {
    const data = kind === "teacher" ? teacherQr : studentQr;
    if (!data.dataUrl) return;
    const a = document.createElement("a");
    a.href = data.dataUrl;
    a.download = `${kind}_QR_${roomName}_${studentNumber ?? studentId}_${studentName}.png`;
    a.click();
  }

  function copyUrl(kind: "teacher" | "student") {
    const data = kind === "teacher" ? teacherQr : studentQr;
    navigator.clipboard.writeText(data.url).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    });
  }

  const infoText = [
    roomName,
    studentNumber != null ? `เลขที่ ${studentNumber}` : null,
    studentCode ? `รหัส: ${studentCode}` : null,
    studentName,
  ]
    .filter(Boolean)
    .join(" | ");

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-3xl lg:max-w-4xl p-6 flex flex-col gap-4 max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">
            <i className="fa-solid fa-qrcode mr-2 text-indigo-500" />
            QR Code รายบุคคล
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-600 bg-slate-50 border rounded-lg px-3 py-2 w-full text-center">
          {infoText}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QrPanel
            title="สำหรับครู"
            subtitle="ให้คะแนนด่วน"
            tone="indigo"
            qr={teacherQr}
            copied={copied === "teacher"}
            onCopy={() => copyUrl("teacher")}
            onDownload={() => download("teacher")}
          />
          <QrPanel
            title="สำหรับนักเรียน"
            subtitle="ดูคะแนนและงานค้าง"
            tone="emerald"
            qr={studentQr}
            copied={copied === "student"}
            onCopy={() => copyUrl("student")}
            onDownload={() => download("student")}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function QrPanel({
  title,
  subtitle,
  tone,
  qr,
  copied,
  onCopy,
  onDownload,
}: {
  title: string;
  subtitle: string;
  tone: "indigo" | "emerald";
  qr: { url: string; dataUrl: string };
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const color =
    tone === "indigo"
      ? {
          box: "from-indigo-50 to-white border-indigo-100",
          dot: "bg-indigo-500",
          title: "text-indigo-700",
          button: "bg-indigo-600 hover:bg-indigo-700",
          copy: "border-indigo-200 text-indigo-600 hover:bg-indigo-50",
        }
      : {
          box: "from-emerald-50 to-white border-emerald-100",
          dot: "bg-emerald-500",
          title: "text-emerald-700",
          button: "bg-emerald-600 hover:bg-emerald-700",
          copy: "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
        };

  return (
    <div className={`rounded-3xl border-2 bg-gradient-to-br ${color.box} p-4 text-center`}>
      <div className="mb-3 flex items-center justify-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color.dot}`} />
        <span className={`text-[11px] font-black uppercase tracking-widest ${color.title}`}>
          {title} ({subtitle})
        </span>
      </div>
      <div className="mx-auto mb-3 w-fit rounded-2xl border bg-white p-2 shadow-sm">
        {qr.dataUrl ? (
          <img src={qr.dataUrl} alt={`${title} QR`} className="h-40 w-40 rounded-lg" />
        ) : (
          <div className="grid h-40 w-40 place-items-center rounded-lg bg-slate-100 text-slate-400">
            <i className="fa-solid fa-spinner fa-spin" />
          </div>
        )}
      </div>
      <input
        readOnly
        value={qr.url}
        className="mb-2 w-full select-all rounded border p-2 text-xs text-slate-500"
        onClick={(e) => (e.target as HTMLInputElement).select()}
      />
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={onCopy}
          disabled={!qr.url}
          className={`rounded-xl border bg-white px-3 py-2 text-xs font-black disabled:opacity-40 ${color.copy}`}
        >
          <i className="fa-regular fa-copy mr-1" />
          {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={!qr.dataUrl}
          className={`rounded-xl px-3 py-2 text-xs font-black text-white disabled:opacity-40 ${color.button}`}
        >
          <i className="fa-solid fa-download mr-1" />
          ดาวน์โหลด
        </button>
      </div>
    </div>
  );
}
