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
  if (mode === "grade") {
    // Teacher quick grading mode
    redirect(`/grade/${room.id}/${student.id}`);
  } else {
    // Student gamer profile status view mode
    redirect(`/view/${room.id}/${student.id}`);
  }
}
