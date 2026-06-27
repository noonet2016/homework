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
      </body>
    </html>
  );
}
