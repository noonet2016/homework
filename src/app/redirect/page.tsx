import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RedirectPageProps {
  searchParams: Promise<{
    mode?: string;
    roomName?: string;
    studentNumber?: string;
    // Also support 'sheet' and 'studentId' from the original GAS query parameters directly
    sheet?: string;
    studentId?: string;
  }>;
}

export default async function RedirectBridgePage({ searchParams }: RedirectPageProps) {
  const resolvedParams = await searchParams;
  
  // Accept both GAS original keys (sheet, studentId) and our bridge keys (roomName, studentNumber)
  const roomName = (resolvedParams.roomName || resolvedParams.sheet || "").trim();
  const studentNumberStr = (resolvedParams.studentNumber || resolvedParams.studentId || "").trim();
  const mode = (resolvedParams.mode || "").trim();

  if (!roomName || !studentNumberStr) {
    redirect("/");
  }

  const numberVal = parseInt(studentNumberStr, 10);
  if (isNaN(numberVal)) {
    redirect("/");
  }

  // 1. Find the classroom (Room) in MySQL matching the room name (Google Sheet tab name)
  const room = await prisma.room.findFirst({
    where: {
      name: roomName,
    },
    select: {
      id: true,
    },
  });

  if (!room) {
    return notFound();
  }

  // 2. Find the student in this classroom having this roll number
  const student = await prisma.student.findFirst({
    where: {
      roomId: room.id,
      number: numberVal,
    },
    select: {
      id: true,
    },
  });

  if (!student) {
    return notFound();
  }

  // 3. Redirect to the correct Next.js route:
  const targetUrl = mode === "grade"
    ? `/grade/${room.id}/${student.id}`
    : `/view/${room.id}/${student.id}`;

  return (
    <html lang="th">
      <head>
        <title>กำลังเปลี่ยนเส้นทาง...</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace("${targetUrl}");`,
          }}
        />
      </head>
      <body style={{ background: "#0f172a", color: "#94a3b8", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem", animation: "spin 2s linear infinite" }}>⏳</div>
          <p>กำลังเตรียมพร้อมข้อมูลปลายทาง...</p>
        </div>
      </body>
    </html>
  );
}
