import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StudentStatusClient from "./StudentStatusClient";

export const dynamic = "force-dynamic";

export default async function StudentStatusPage({
  params,
}: {
  params: Promise<{ roomId: string; studentId: string }>;
}) {
  const { roomId, studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      room: { select: { id: true, name: true, icon: true } },
      scores: { select: { taskId: true, value: true } },
    },
  });

  if (!student || student.roomId !== roomId) notFound();

  const tasks = await prisma.task.findMany({
    where: { roomId, visible: true },
    orderBy: { taskIndex: "asc" },
    select: { id: true, name: true, taskIndex: true, imageUrl: true },
  });

  const scoreByTask = new Map(student.scores.map((score) => [score.taskId, score.value]));
  const taskRows = tasks.map((task) => {
    const score = scoreByTask.get(task.id) ?? 0;
    return {
      ...task,
      score,
      done: score > 0,
    };
  });
  const totalScore = taskRows.reduce((sum, task) => sum + task.score, 0);
  const tasksCompleted = taskRows.filter((task) => task.done).length;
  const xpPercent = tasks.length > 0 ? Math.min(Math.round((tasksCompleted / tasks.length) * 100), 100) : 0;
  const avatar = (student.nickname || student.name || "👤").trim().charAt(0) || "👤";
  const badges = [
    { icon: "🎯", label: "Hunter", desc: "เริ่มภารกิจแรกสำเร็จ", earned: tasksCompleted > 0 },
    { icon: "⚡", label: "Active", desc: "สำเร็จ 3 ภารกิจ", earned: tasksCompleted >= 3 },
    { icon: "🎨", label: "Creative", desc: "XP รวมเกิน 50%", earned: xpPercent >= 50 },
    { icon: "🌟", label: "Rising", desc: "XP รวมเกิน 70%", earned: xpPercent >= 70 },
    { icon: "🏆", label: "Master", desc: "ส่งงานครบ 100%", earned: tasks.length > 0 && tasksCompleted >= tasks.length },
  ];

  return (
    <StudentStatusClient
      student={student}
      taskRows={taskRows}
      totalScore={totalScore}
      tasksCompleted={tasksCompleted}
      xpPercent={xpPercent}
      avatar={avatar}
      badges={badges}
    />
  );
}
