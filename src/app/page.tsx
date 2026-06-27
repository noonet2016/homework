import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createRoom, deleteRoom } from "@/lib/actions/rooms";

export const dynamic = "force-dynamic";

// Card themes copied verbatim from the original GAS app (renderLobby in JS.html).
const CARD_THEMES = [
  { chip: "from-[#67b8ff] to-[#4b9ef2]", bar: "from-[#22c55e] to-[#16a34a]" },
  { chip: "from-[#8b5cf6] to-[#6d28d9]", bar: "from-[#34d399] to-[#10b981]" },
  { chip: "from-[#fb7185] to-[#e11d48]", bar: "from-[#60a5fa] to-[#2563eb]" },
  { chip: "from-[#f59e0b] to-[#d97706]", bar: "from-[#22c55e] to-[#16a34a]" },
  { chip: "from-[#22d3ee] to-[#0891b2]", bar: "from-[#38bdf8] to-[#0ea5e9]" },
  { chip: "from-[#f472b6] to-[#db2777]", bar: "from-[#34d399] to-[#10b981]" },
  { chip: "from-[#a78bfa] to-[#7c3aed]", bar: "from-[#60a5fa] to-[#2563eb]" },
  { chip: "from-[#f97316] to-[#ea580c]", bar: "from-[#22c55e] to-[#16a34a]" },
];

export default async function Home() {
  const rooms = await prisma.room.findMany({
    orderBy: { sortOrder: "asc" },
    include: { students: { include: { scores: { select: { value: true } } } } },
  });

  const roomStats = rooms.map((room, i) => {
    const studentCount = room.students.length;
    const submitted = room.students.filter((s) =>
      s.scores.some((sc) => sc.value !== 0)
    ).length;
    const pending = studentCount - submitted;
    const completion =
      studentCount > 0 ? Math.round((submitted / studentCount) * 100) : 0;
    return {
      id: room.id,
      name: room.name,
      icon: room.icon || "🧩",
      theme: CARD_THEMES[i % CARD_THEMES.length],
      studentCount,
      submitted,
      pending,
      completion,
    };
  });

  const leaderboard = [...roomStats].sort(
    (a, b) =>
      b.completion - a.completion ||
      b.submitted - a.submitted ||
      b.studentCount - a.studentCount ||
      a.name.localeCompare(b.name, "th")
  );
  const champion = leaderboard[0];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main id="lobby" className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1720px] mx-auto p-2 md:p-4">
        <div className="lobby-shell">
          <div className="grid grid-cols-1 lg:grid-cols-[84px_1fr_360px] min-h-[880px]">
            {/* ===== Left rail ===== */}
            <aside className="left-rail p-4 hidden lg:flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center text-2xl shadow">
                <i className="fa-solid fa-rocket" />
              </div>
              <span className="rail-btn fa-btn active" title="หน้าหลัก">
                <i className="fa-solid fa-house" />
              </span>
              <span className="rail-btn fa-btn" title="คู่มือการใช้งาน">
                <i className="fa-solid fa-book-open" />
              </span>
              <span className="rail-btn fa-btn" title="เข้าสู่โหมดคุณครู">
                <i className="fa-solid fa-user-shield" />
              </span>
              <span className="rail-btn fa-btn" title="ผู้พัฒนา">
                <i className="fa-solid fa-code" />
              </span>
            </aside>

            {/* ===== Center: rooms ===== */}
            <section className="p-5 md:p-6 border-r border-[#e6ecf6]">
              <div className="content-topbar flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-black text-[#111827] leading-tight">
                    🎓 ห้องเรียนครูตั๊ก
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    className="w-[260px] md:w-[340px] rounded-full border border-slate-300 px-4 py-2.5 text-base bg-white"
                    placeholder="Search"
                  />
                  <span className="px-3 py-2 rounded-xl border border-slate-200 bg-white fa-btn text-slate-500">
                    <i className="fa-solid fa-user-shield" />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-12 pt-8">
                {roomStats.map((room) => (
                  <div
                    key={room.id}
                    className="relative w-full text-left rounded-[24px] bg-white border border-[#e9eef7] pt-14 pb-4 px-4 shadow-[0_10px_25px_rgba(92,108,143,0.12)] hover:shadow-[0_14px_30px_rgba(92,108,143,0.18)] hover:-translate-y-0.5 transition overflow-visible"
                  >
                    {/* delete (admin affordance) */}
                    <form action={deleteRoom} className="absolute right-3 top-3 z-10">
                      <input type="hidden" name="id" value={room.id} />
                      <button
                        type="submit"
                        title="ลบห้อง"
                        className="text-slate-300 hover:text-red-500 text-lg leading-none px-1"
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </form>

                    <Link href={`/rooms/${room.id}`} className="block">
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 -top-7 w-16 h-16 rounded-2xl bg-gradient-to-br ${room.theme.chip} text-white grid place-items-center shadow-[0_10px_18px_rgba(78,158,238,0.35)] text-2xl border-4 border-white`}
                      >
                        {room.icon}
                      </div>
                      <div className="text-center min-w-0">
                        <h4
                          title={room.name}
                          className="text-2xl font-extrabold text-[#1f2e53] leading-tight max-w-full overflow-hidden"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {room.name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          นักเรียนทั้งหมด {room.studentCount} คน
                        </p>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-[#28375d]">Progress</span>
                          <span className="text-sm font-bold text-[#28375d]">
                            {room.completion}%
                          </span>
                        </div>
                        <div className="w-full bg-[#eef2f8] rounded-full h-2.5">
                          <div
                            className={`bg-gradient-to-r ${room.theme.bar} h-2.5 rounded-full`}
                            style={{ width: `${room.completion}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl bg-[#f8fbff] border border-[#edf2fb] px-3 py-2 flex items-center justify-between text-xs text-slate-500">
                        <span>✅ เริ่มส่ง {room.submitted}</span>
                        <span>⏳ ยังไม่ส่ง {room.pending}</span>
                      </div>
                    </Link>
                  </div>
                ))}

                {/* add-room tile */}
                <form
                  action={createRoom}
                  className="w-full rounded-[28px] border-2 border-dashed border-[#c8d6ee] bg-white p-5 flex flex-col gap-3 justify-center"
                >
                  <p className="text-center text-[#42537c] font-bold">+ เพิ่มห้องเรียนใหม่</p>
                  <div className="flex gap-2">
                    <input
                      name="icon"
                      defaultValue="🧩"
                      maxLength={2}
                      aria-label="ไอคอน"
                      className="w-12 rounded-xl border border-slate-200 px-2 text-center text-xl bg-white"
                    />
                    <input
                      name="name"
                      placeholder="ชื่อห้อง เช่น ป.4/1"
                      required
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700"
                  >
                    เพิ่มห้องเรียน
                  </button>
                </form>
              </div>

              {roomStats.length === 0 && (
                <div className="col-span-full glass-panel rounded-2xl p-8 text-center mt-8">
                  <p className="text-slate-500">ไม่พบห้องเรียน</p>
                </div>
              )}
            </section>

            {/* ===== Right: leaderboard widget ===== */}
            <aside
              className="flex flex-col overflow-hidden border-l border-slate-100"
              style={{ background: "#f8fafc" }}
            >
              <div
                className="p-6 shrink-0 flex flex-col items-center gap-3 relative overflow-hidden"
                style={{ background: "linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)" }}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl border border-blue-100/50">
                    🏆
                  </div>
                  <div className="flex flex-col">
                    <h3
                      className="text-xl font-black tracking-tight"
                      style={{
                        background: "linear-gradient(135deg, #1e3a8a, #0d9488)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      อันดับความคืบหน้า
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                      <span className="text-[10px] font-black text-emerald-600 tracking-[0.15em] uppercase">
                        Live Tracking
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-5 -mt-3.5 bg-gradient-to-r from-amber-500 to-orange-500 py-1 px-2 rounded-2xl text-center shadow-lg shadow-orange-200/80 border-2 border-white relative z-20 flex overflow-hidden">
                <span className="flex-1 py-2 text-white font-black text-[10px] tracking-wider uppercase bg-white/20 rounded-xl">
                  Leaderboard
                </span>
              </div>

              <div className="p-5 flex flex-col gap-3 overflow-y-auto">
                {/* Champion card */}
                {champion && champion.studentCount > 0 && (
                  <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/60">
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-90">
                      <span className="animate-bounce">👑</span> Champion Class
                    </div>
                    <p className="text-lg font-black leading-tight mt-1">{champion.name}</p>
                    <div className="mt-2 w-full bg-white/30 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full"
                        style={{ width: `${champion.completion}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold mt-1">{champion.completion}% complete</p>
                  </div>
                )}

                {/* Ranked rows */}
                {leaderboard.slice(0, 10).map((room, idx) => (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className="leader-row flex items-center gap-3 p-2.5 hover:shadow-md transition"
                  >
                    <div className="w-8 h-8 grid place-items-center rounded-full bg-slate-50 font-bold text-slate-600 text-sm shrink-0">
                      {medals[idx] ?? idx + 1}
                    </div>
                    <div className="text-xl shrink-0">{room.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#1f2e53] text-sm truncate">{room.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {room.studentCount} นักเรียน
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400">Progress</p>
                      <p className="font-black text-amber-500 text-sm">{room.completion}%</p>
                    </div>
                  </Link>
                ))}

                {leaderboard.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">
                    ยังไม่มีข้อมูลจัดอันดับ
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
