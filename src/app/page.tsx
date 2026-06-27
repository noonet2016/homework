import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createRoom, deleteRoom, duplicateRoom } from "@/lib/actions/rooms";
import RoomEditModal from "./RoomEditModal";
import RoomCreateCard from "./RoomCreateCard";
import RoomActionButtons from "./RoomActionButtons";
import RoomsGrid from "./RoomsGrid";
import LeftRail from "./LeftRail";
import TopbarActions from "./TopbarActions";

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

// Leaderboard row styles copied verbatim from GAS renderLeaderboard (rowStyles).
const ROW_STYLES = [
  { bg: "linear-gradient(to bottom, #ffeb3b, #fbc02d)", border: "#f9a825", rankIcon: "🥇", nameColor: "#5d4037" },
  { bg: "linear-gradient(to bottom, #e3f2fd, #bbdefb)", border: "#90caf9", rankIcon: "🥈", nameColor: "#1e3a5f" },
  { bg: "linear-gradient(to bottom, #fff3e0, #ffccbc)", border: "#ffab91", rankIcon: "🥉", nameColor: "#7c2d12" },
  { bg: "#fffaf0", border: "#ffe0b2", rankIcon: "", nameColor: "#1e3a5f" },
];

function formatRoomName(name: string) {
  const index = name.indexOf(" ");
  if (index !== -1) {
    return (
      <>
        {name.substring(0, index).trim()}
        <br />
        {name.substring(index + 1).trim()}
      </>
    );
  }
  return name;
}

export default async function Home() {
  const { isTeacher } = await getSession();
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

  return (
    <main id="lobby" className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1720px] mx-auto p-2 md:p-4">
        <div className="lobby-shell">
          <div className="grid grid-cols-1 lg:grid-cols-[84px_1fr_360px] min-h-[880px]">
            {/* ===== Left rail ===== */}
            <LeftRail isTeacher={isTeacher} usedIcons={roomStats.map((r) => r.icon)} />

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
                  <TopbarActions isTeacher={isTeacher} usedIcons={roomStats.map((r) => r.icon)} />
                </div>
              </div>

              <RoomsGrid
                initialRooms={roomStats}
                isTeacher={isTeacher}
              />

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

              <div className="p-4 md:p-5 flex flex-col gap-3 flex-1 overflow-y-auto bg-[#f8fafc]">
                {/* Champion card (verbatim from GAS #leader-top) */}
                {champion && (
                  <div
                    className="flex flex-col items-center p-4 rounded-[2rem] mb-2 border-2 border-amber-200 shadow-lg shadow-amber-100/50"
                    style={{ background: "linear-gradient(180deg,#fffbeb, #fff7ed)" }}
                  >
                    <div className="text-5xl mb-1 drop-shadow-md animate-bounce">👑</div>
                    <div className="text-[10px] font-black text-amber-600 tracking-[0.2em] mb-1">
                      CHAMPION CLASS
                    </div>
                    <div className="text-lg font-black text-slate-800 text-center leading-tight mb-2">
                      {champion.icon} {champion.name}
                    </div>
                    <div className="w-full relative h-5 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-1000 bg-gradient-to-r from-blue-500 via-teal-400 to-amber-400"
                        style={{ width: `${Math.min(champion.completion, 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">
                        {champion.completion}% complete
                      </div>
                    </div>
                  </div>
                )}

                {/* Ranked rows (verbatim styling from GAS renderLeaderboard) */}
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((room, idx) => {
                    const s = ROW_STYLES[idx] ?? ROW_STYLES[3];
                    return (
                      <Link
                        key={room.id}
                        href={`/rooms/${room.id}`}
                        className="w-full flex items-center gap-3 p-2 rounded-2xl transition-transform active:scale-95 shadow-[0_4px_0_rgba(0,0,0,0.2)]"
                        style={{ background: s.bg, border: `2px solid ${s.border}` }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-lg border-2 border-white shadow-sm"
                          style={{
                            background: idx < 3 ? "transparent" : "#fff",
                            color: idx < 3 ? "#fff" : "#1e3a5f",
                          }}
                        >
                          {idx < 3 ? s.rankIcon : idx + 1}
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center shrink-0 text-2xl drop-shadow-sm">
                          {room.icon}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p
                            title={room.name}
                            className="font-black text-sm leading-tight max-w-full overflow-hidden"
                            style={{
                              color: s.nameColor,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {room.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0 px-2 border-l border-black/10">
                          <p
                            className="text-[9px] font-black uppercase opacity-60"
                            style={{ color: s.nameColor }}
                          >
                            Progress
                          </p>
                          <p className="text-sm font-black" style={{ color: s.nameColor }}>
                            {room.completion}%
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {leaderboard.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-8">
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
