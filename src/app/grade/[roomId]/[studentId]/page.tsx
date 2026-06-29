import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import QuickGradeClient from "./QuickGradeClient";

export const dynamic = "force-dynamic";

export default async function GradePage({
  params,
}: {
  params: Promise<{ roomId: string; studentId: string }>;
}) {
  const { roomId, studentId } = await params;
  const { isTeacher } = await getSession();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      room: { select: { id: true, name: true, icon: true } },
      scores: { select: { taskId: true, value: true } },
    },
  });

  if (!student || student.roomId !== roomId) notFound();

  const tasks = await prisma.task.findMany({
    where: { roomId },
    orderBy: { taskIndex: "asc" },
    select: { id: true, name: true, taskIndex: true, imageUrl: true },
  });

  return (
    <main className="flex h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 p-4">
      <QuickGradeClient
        roomId={roomId}
        student={{
          id: student.id,
          name: student.name,
          nickname: student.nickname,
          number: student.number,
          code: student.code,
          roomName: student.room.name,
          roomIcon: student.room.icon,
          scores: student.scores,
        }}
        tasks={tasks}
        isTeacher={isTeacher}
      />
    </main>
  );
}
