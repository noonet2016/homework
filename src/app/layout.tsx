import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import "./gas-theme.css";
import "./drag.css";
import { getSession } from "@/lib/auth";
import TeacherAuthChip from "./TeacherAuthChip";
import DeveloperModal from "./DeveloperModal";
import DeveloperModalClient from "./DeveloperModalClient";
import Loader from "./Loader";
import ToastContainer from "./ToastContainer";


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
        <Loader />
        <ToastContainer />
        <DeveloperModalClient />
        {children}
        {/* Global footer credit (ported verbatim from GAS index.html) */}
        <footer className="py-10 px-4 text-center relative z-30 print:hidden mt-auto">
          <div className="max-w-7xl mx-auto">
            <DeveloperModal />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6 opacity-50">
              © 2026 Learn Tracking Homework System. All Rights Reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
