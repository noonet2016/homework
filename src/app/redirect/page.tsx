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
      name: true,
    },
  });

  let student = null;
  if (room) {
    student = await prisma.student.findFirst({
      where: {
        roomId: room.id,
        number: numberVal,
      },
      select: {
        id: true,
        name: true,
        number: true,
      },
    });
  }

  // Debug response to see what's happening
  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", background: "#111", color: "#eee" }}>
      <h1>Redirect Debug Mode</h1>
      <pre>{JSON.stringify({
        input: {
          rawRoomName: resolvedParams.roomName,
          rawStudentNumber: resolvedParams.studentNumber,
          rawSheet: resolvedParams.sheet,
          rawStudentId: resolvedParams.studentId,
          parsedRoomName: roomName,
          parsedStudentNumber: studentNumberStr,
          numberVal
        },
        dbResult: {
          roomFound: room,
          studentFound: student
        }
      }, null, 2)}</pre>
    </div>
  );
}
