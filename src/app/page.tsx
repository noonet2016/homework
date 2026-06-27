import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createRoom, deleteRoom } from "@/lib/actions/rooms";
import { ROOM_THEMES } from "@/lib/roomThemes";

export const dynamic = "force-dynamic";

const FALLBACK_ROOM_THEMES = [
  { chip: "bg-gradient-to-br from-[#67b8ff] to-[#4b9ef2]", bar: "from-[#67b8ff] to-[#4b9ef2]" },
  { chip: "bg-gradient-to-br from-[#ff758c] to-[#ff7eb3]", bar: "from-[#ff758c] to-[#ff7eb3]" },
  { chip: "bg-gradient-to-br from-[#86e3ce] to-[#d0e6a5]", bar: "from-[#86e3ce] to-[#d0e6a5]" },
  { chip: "bg-gradient-to-br from-[#fccb90] to-[#d57eeb]", bar: "from-[#fccb90] to-[#d57eeb]" },
  { chip: "bg-gradient-to-br from-[#2af598] to-[#009efd]", bar: "from-[#2af598] to-[#009efd]" },
  { chip: "bg-gradient-to-br from-[#f857a6] to-[#ff5858]", bar: "from-[#f857a6] to-[#ff5858]" },
];

export default async function Home() {
  const rooms = await prisma.room.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      students: {
        include: {
          scores: {
            select: {
              value: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  const getRoomTheme = (index: number) => {
    const themes = (typeof ROOM_THEMES !== "undefined" && ROOM_THEMES && ROOM_THEMES.length > 0)
      ? ROOM_THEMES
      : FALLBACK_ROOM_THEMES;
    return themes[index % themes.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd] bg-fixed py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-black text-[#1f2e53]">
            🎓 ห้องเรียนครูตั๊ก
          </h1>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-12 pt-8">
          {rooms.map((room, index) => {
            const studentCount = room.students.length;
            const submitted = room.students.filter((student) =>
              student.scores.some((score) => score.value !== 0)
            ).length;
            const pending = studentCount - submitted;
            const completionPercent = studentCount > 0 ? Math.round((submitted / studentCount) * 100) : 0;
            const theme = getRoomTheme(index);

            return (
              <div
                key={room.id}
                className="relative group rounded-[24px] border border-[#e9eef7] bg-white pt-14 pb-4 px-4 shadow-[0_10px_25px_rgba(92,108,143,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[220px]"
              >
                {/* Floating gradient icon chip */}
                <div
                  className={`absolute -top-7 left-6 w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-white shadow-md text-2xl text-white ${theme.chip}`}
                >
                  {room.icon || "🧩"}
                </div>

                {/* Main Link Area */}
                <Link href={`/rooms/${room.id}`} className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-2xl font-extrabold text-[#1f2e53] line-clamp-2 mb-1">
                      {room.name}
                    </h4>
                    <p className="text-sm text-slate-500 mb-4">
                      นักเรียนทั้งหมด {studentCount} คน
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-xs font-bold text-[#1f2e53] mb-1">
                        <span>Progress</span>
                        <span>{completionPercent}%</span>
                      </div>
                      <div className="w-full bg-[#eef2f8] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all duration-300"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats Footer Box */}
                  <div className="bg-[#f8fbff] rounded-xl p-3 flex justify-between text-xs font-semibold text-[#1f2e53]">
                    <span>✅ เริ่มส่ง {submitted}</span>
                    <span>⏳ ยังไม่ส่ง {pending}</span>
                  </div>
                </Link>

                {/* Delete Button */}
                <div className="absolute top-4 right-4 z-10">
                  <form action={deleteRoom}>
                    <input type="hidden" name="id" value={room.id} />
                    <button
                      type="submit"
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition duration-150"
                      title="ลบห้องเรียน"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            );
          })}

          {/* Add-room tile */}
          <div className="rounded-[24px] border-2 border-dashed border-[#e9eef7] bg-white/50 p-6 flex flex-col justify-between min-h-[220px]">
            <form action={createRoom} className="flex flex-col h-full justify-between gap-4">
              <div className="text-center font-extrabold text-[#1f2e53] text-lg">
                + เพิ่มห้องเรียนใหม่
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    name="icon"
                    defaultValue="🧩"
                    maxLength={2}
                    aria-label="ไอคอน"
                    className="w-12 rounded-xl border border-gray-200 px-2 text-center text-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    name="name"
                    placeholder="ชื่อห้อง เช่น ป.4/1"
                    required
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                เพิ่มห้องเรียน
              </button>
            </form>
          </div>
        </div>

        {/* Empty state */}
        {rooms.length === 0 && (
          <div className="mt-12 text-center text-slate-500 text-lg font-medium">
            ไม่พบห้องเรียน
          </div>
        )}
      </div>
    </div>
  );
}
