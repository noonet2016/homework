import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ClassroomManagerClient from "./ClassroomManagerClient";
import StudentGridClient, { type StudentCardData, type TaskData } from "./StudentGridClient";
import RoomTitle from "./RoomTitle";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isTeacher } = await getSession();

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      students: {
        include: {
          scores: {
            select: {
              taskId: true,
              value: true,
            },
          },
        },
      },
      tasks: {
        orderBy: { taskIndex: "asc" },
        select: {
          id: true,
          name: true,
          taskIndex: true,
          imageUrl: true,
          visible: true,
        },
      },
    },
  });

  if (!room) notFound();

  const allRooms = await prisma.room.findMany({
    where: { id: { not: id } },
    select: { id: true, name: true, icon: true },
    orderBy: { sortOrder: "asc" },
  });

  const tasks: TaskData[] = room.tasks.map((task) => ({
    id: task.id,
    name: task.name,
    taskIndex: task.taskIndex,
    imageUrl: task.imageUrl,
    visible: task.visible,
  }));
  const taskCount = tasks.length;

  const students: StudentCardData[] = room.students
    .map((student) => {
      const scores = tasks.map((task) => {
        const score = student.scores.find((item) => item.taskId === task.id);
        return {
          taskId: task.id,
          value: score ? Number(score.value) : 0,
        };
      });
      const totalScore = scores.reduce((sum, s) => {
        const val = Number(s.value);
        return sum + (val === -1 ? 0 : val);
      }, 0);
      const tasksCompleted = scores.filter((s) => {
        const val = Number(s.value);
        return val > 0 || val === -1;
      }).length;

      return {
        id: student.id,
        name: student.name,
        nickname: student.nickname,
        number: student.number,
        code: student.code,
        scores,
        totalScore,
        tasksCompleted,
        pending: Math.max(taskCount - tasksCompleted, 0),
      };
    })
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER);
    });

  return (
    <section id="student-grid-container" className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5 gap-2 flex-wrap pr-14 md:pr-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href="/"
              className="w-11 h-11 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm fa-btn shrink-0 grid place-items-center"
              title="กลับหน้าโฮม"
            >
              <i className="fa-solid fa-arrow-left" />
            </Link>
            <RoomTitle icon={room.icon} name={room.name} />
          </div>

          <div className="hidden md:flex flex-1 max-w-sm mr-4 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              id="student-search-input"
              className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="ค้นหาชื่อ, ชื่อเล่น หรือเลขที่..."
              form="student-grid-search-form"
              name="studentSearch"
            />
          </div>

          <div className="flex items-center gap-2">
            {isTeacher ? (
              <ClassroomManagerClient roomId={room.id} roomName={room.name} students={students} tasks={tasks} rooms={allRooms} />
            ) : null}
          </div>
        </div>

        <div className="md:hidden mb-5 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            id="student-search-input-mobile"
            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-lg shadow-slate-100"
            placeholder="ค้นหาชื่อ, ชื่อเล่น หรือเลขที่..."
            form="student-grid-search-form"
            name="studentSearchMobile"
          />
        </div>

        <StudentGridClient
          roomId={room.id}
          roomName={room.name}
          students={students}
          tasks={tasks}
          isTeacher={isTeacher}
        />
      </div>
    </section>
  );
}
