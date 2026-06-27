import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createStudent } from "@/lib/actions/students";
import { createTask } from "@/lib/actions/tasks";
import StudentScoreModal from "./StudentScoreModal";

export const dynamic = "force-dynamic";

type RoomStudent = {
  id: string;
  name: string;
  nickname: string | null;
  number: number | null;
  code: string | null;
  scores: { taskId: string; value: number }[];
};

type StudentSummary = RoomStudent & {
  total: number;
  done: number;
  pending: number;
};

function getStatusIcon(pending: number) {
  if (pending === 0) return "✅";
  if (pending <= 2) return "⏳";
  return "⚠️";
}

function getRankBadge(index: number) {
  if (index === 0) return "👑 MVP";
  if (index < 3) return "🏅 Top";
  return "🎯 Player";
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
        },
      },
    },
  });

  if (!room) notFound();

  const taskCount = room.tasks.length;
  const students: StudentSummary[] = room.students
    .map((student) => {
      const total = student.scores.reduce((sum, score) => sum + score.value, 0);
      const done = student.scores.filter((score) => score.value > 0).length;

      return {
        ...student,
        total,
        done,
        pending: Math.max(taskCount - done, 0),
      };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER);
    });

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f0f9ff_0%,#e0f2fe_50%,#bae6fd_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-indigo-600 shadow-[0_10px_25px_rgba(92,108,143,0.12)] ring-1 ring-[#e9eef7] transition hover:-translate-y-0.5 hover:text-indigo-700"
            >
              <span aria-hidden="true">←</span>
              กลับหน้าโฮม
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-[#1f2e53]">
              <span className="mr-2">{room.icon}</span>
              {room.name}
            </h1>
          </div>

          <div className="w-full max-w-md">
            <input
              type="search"
              placeholder="ค้นหาชื่อ, ชื่อเล่น หรือเลขที่..."
              className="w-full rounded-2xl border border-[#e4e9ff] bg-white/90 px-4 py-3 text-sm font-medium shadow-[0_10px_25px_rgba(92,108,143,0.12)] outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </header>

        <section className="mb-8 grid gap-3 rounded-3xl border border-[#e9eef7] bg-white/75 p-4 shadow-[0_10px_25px_rgba(92,108,143,0.12)] md:grid-cols-2">
          <form action={createStudent} className="flex flex-wrap gap-2">
            <input type="hidden" name="roomId" value={room.id} />
            <input
              name="number"
              placeholder="เลขที่"
              inputMode="numeric"
              className="w-20 rounded-2xl border border-[#e4e9ff] bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
            <input
              name="name"
              placeholder="ชื่อนักเรียน"
              required
              className="min-w-40 flex-1 rounded-2xl border border-[#e4e9ff] bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
            <input
              name="nickname"
              placeholder="ชื่อเล่น"
              className="min-w-28 flex-1 rounded-2xl border border-[#e4e9ff] bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-600 active:scale-95"
            >
              เพิ่มนักเรียน
            </button>
          </form>

          <form action={createTask} className="flex flex-wrap gap-2">
            <input type="hidden" name="roomId" value={room.id} />
            <input
              name="name"
              placeholder="ชื่อใบงาน/ภาระงาน"
              required
              className="min-w-48 flex-1 rounded-2xl border border-[#e4e9ff] bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="submit"
              className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-95"
            >
              เพิ่มงาน
            </button>
          </form>
        </section>

        {students.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#e4e9ff] bg-white/75 p-10 text-center text-slate-500 shadow-[0_10px_25px_rgba(92,108,143,0.12)]">
            ยังไม่มีนักเรียนในห้องนี้
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {students.map((student, index) => {
              const progress = taskCount > 0 ? Math.round((student.done / taskCount) * 100) : 0;

              return (
                <StudentScoreModal
                  key={student.id}
                  roomId={room.id}
                  student={student}
                  tasks={room.tasks}
                  trigger={
                    <article className="h-full cursor-pointer rounded-3xl border border-[#e4e9ff] bg-gradient-to-br from-white to-[#f3f5ff] p-4 shadow-[0_10px_25px_rgba(92,108,143,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(92,108,143,0.18)]">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1f2e53] shadow-sm ring-1 ring-[#e9eef7]">
                          {getRankBadge(index)}
                        </span>
                        <span className="text-lg" aria-hidden="true">
                          {getStatusIcon(student.pending)}
                        </span>
                      </div>

                      <h2 className="line-clamp-2 min-h-12 text-center text-base font-bold leading-6 text-[#1f2e53]">
                        {student.name}
                      </h2>
                      <p className="mt-3 truncate text-center text-sm font-bold text-indigo-500">
                        ชื่อเล่น: {student.nickname || "-"}
                      </p>
                      <p className="mt-1 text-center text-sm font-medium text-slate-500">
                        เลขที่ {student.number ?? "-"}
                      </p>

                      <div className="my-5 text-center">
                        <span className="text-2xl font-bold text-amber-500">
                          {student.total}
                        </span>
                        <span className="ml-1 text-sm font-bold text-amber-500">คะแนน</span>
                      </div>

                      <div className="border-t border-[#e4e9ff] pt-3">
                        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
                          <span>
                            ส่งแล้ว {student.done}/{taskCount}
                          </span>
                          <span>ค้าง {student.pending} งาน</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#d9dff3]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#60a5fa] to-[#a78bfa]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </article>
                  }
                />
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
