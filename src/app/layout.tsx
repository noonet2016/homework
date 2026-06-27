import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import "./gas-theme.css";
import { getSession } from "@/lib/auth";
import TeacherAuthChip from "./TeacherAuthChip";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ระบบเก็บคะแนนนักเรียน",
  description: "ระบบสำหรับบันทึกและติดตามคะแนนนักเรียนอย่างง่ายดาย",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isTeacher } = await getSession();
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TeacherAuthChip isTeacher={isTeacher} />
        {children}
        {/* Global footer credit (ported verbatim from GAS index.html) */}
        <footer className="py-10 px-4 text-center relative z-10 print:hidden mt-auto">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/40 backdrop-blur-xl px-4 sm:px-6 py-3 rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group flex-wrap sm:flex-nowrap">
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
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6 opacity-50">
              © 2026 Learn Tracking Homework System. All Rights Reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
