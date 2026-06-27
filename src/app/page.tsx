import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createRoom, deleteRoom } from "@/lib/actions/rooms";

// Reads the DB on every request (no static prerender at build time).
export const dynamic = "force-dynamic";

export default async function Home() {
  const rooms = await prisma.room.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { students: true, tasks: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-10">
      <h1 className="mb-6 text-2xl font-bold">ห้องเรียนของฉัน</h1>

      <form action={createRoom} className="mb-8 flex gap-2">
        <input
          name="icon"
          defaultValue="🧩"
          maxLength={2}
          aria-label="ไอคอน"
          className="w-14 rounded-lg border px-2 text-center text-xl"
        />
        <input
          name="name"
          placeholder="ชื่อห้อง เช่น ป.4/1"
          required
          className="flex-1 rounded-lg border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          เพิ่มห้อง
        </button>
      </form>

      <ul className="space-y-3">
        {rooms.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <Link
              href={`/rooms/${r.id}`}
              className="flex items-center gap-3 hover:underline"
            >
              <span className="text-2xl">{r.icon}</span>
              <span>
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  · {r._count.students} นักเรียน · {r._count.tasks} งาน
                </span>
              </span>
            </Link>
            <form action={deleteRoom}>
              <input type="hidden" name="id" value={r.id} />
              <button
                type="submit"
                className="text-sm text-red-500 hover:underline"
              >
                ลบ
              </button>
            </form>
          </li>
        ))}
        {rooms.length === 0 && (
          <li className="rounded-xl border border-dashed p-6 text-center text-gray-500">
            ยังไม่มีห้องเรียน — เพิ่มห้องแรกได้เลย
          </li>
        )}
      </ul>
    </main>
  );
}
