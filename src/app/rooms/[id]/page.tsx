import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createStudent, deleteStudent } from "@/lib/actions/students";
import { createTask, deleteTask } from "@/lib/actions/tasks";
import { setScore } from "@/lib/actions/scores";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      students: { orderBy: [{ number: "asc" }, { name: "asc" }] },
      tasks: { orderBy: { taskIndex: "asc" } },
    },
  });
  if (!room) notFound();

  const scores = await prisma.score.findMany({
    where: { task: { roomId: id } },
  });
  // key = `${studentId}:${taskId}` → value
  const scoreMap = new Map<string, number>();
  for (const s of scores) scoreMap.set(`${s.studentId}:${s.taskId}`, s.value);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← กลับหน้าห้องเรียน
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">
        <span className="mr-2">{room.icon}</span>
        {room.name}
      </h1>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        {/* Add student */}
        <form action={createStudent} className="flex flex-wrap gap-2">
          <input type="hidden" name="roomId" value={room.id} />
          <input
            name="number"
            placeholder="เลขที่"
            inputMode="numeric"
            className="w-20 rounded-lg border px-2 py-2"
          />
          <input
            name="name"
            placeholder="ชื่อนักเรียน"
            required
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            เพิ่มนักเรียน
          </button>
        </form>

        {/* Add task */}
        <form action={createTask} className="flex gap-2">
          <input type="hidden" name="roomId" value={room.id} />
          <input
            name="name"
            placeholder="ชื่อใบงาน/ภาระงาน"
            required
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            เพิ่มงาน
          </button>
        </form>
      </div>

      {room.students.length === 0 || room.tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-gray-500">
          เพิ่มนักเรียนและงานอย่างน้อยอย่างละ 1 รายการเพื่อเริ่มให้คะแนน
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white p-2 text-left">นักเรียน</th>
                {room.tasks.map((t) => (
                  <th key={t.id} className="min-w-24 p-2 align-bottom">
                    <div className="font-medium">{t.name}</div>
                    <form action={deleteTask}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="roomId" value={room.id} />
                      <button className="text-xs text-red-400 hover:underline">
                        ลบงาน
                      </button>
                    </form>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {room.students.map((st) => (
                <tr key={st.id} className="border-t">
                  <td className="sticky left-0 bg-white p-2">
                    <span className="text-gray-400">{st.number ?? "·"}</span>{" "}
                    {st.name}
                    <form action={deleteStudent} className="inline">
                      <input type="hidden" name="id" value={st.id} />
                      <input type="hidden" name="roomId" value={room.id} />
                      <button className="ml-2 text-xs text-red-400 hover:underline">
                        ลบ
                      </button>
                    </form>
                  </td>
                  {room.tasks.map((t) => {
                    const val = scoreMap.get(`${st.id}:${t.id}`) ?? 0;
                    return (
                      <td key={t.id} className="p-1 text-center">
                        <form action={setScore}>
                          <input type="hidden" name="studentId" value={st.id} />
                          <input type="hidden" name="taskId" value={t.id} />
                          <input type="hidden" name="roomId" value={room.id} />
                          <input
                            name="value"
                            defaultValue={val || ""}
                            placeholder="-"
                            inputMode="numeric"
                            className="w-14 rounded border px-1 py-1 text-center"
                          />
                        </form>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-400">
            พิมพ์คะแนนแล้วกด Enter เพื่อบันทึกแต่ละช่อง
          </p>
        </div>
      )}
    </main>
  );
}
