import type { CSSProperties } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// M4f Reports — summary cards + per-room progress table + print/CSV/PDF export.
// (Oguri/agy draft, Rudolf-integrated & verified.)
export default async function ReportsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      students: {
        orderBy: [{ number: "asc" }, { name: "asc" }],
        include: { scores: true },
      },
      tasks: { orderBy: { taskIndex: "asc" } },
    },
  });

  const roomStats = rooms.map((room) => {
    const studentCount = room.students.length;
    const taskIds = room.tasks.map((t) => t.id);

    // GAS definition: submitted = completed ALL tasks (each score value > 0)
    let submittedCount = 0;
    if (studentCount > 0 && taskIds.length > 0) {
      submittedCount = room.students.filter((student) =>
        taskIds.every((taskId) => {
          const score = student.scores.find((s) => s.taskId === taskId);
          return score && score.value > 0;
        })
      ).length;
    }

    const pending = studentCount - submittedCount;
    const percent =
      studentCount > 0 ? Math.round((submittedCount / studentCount) * 100) : 0;

    const studentsData = room.students.map((s) => {
      const scoresArray = room.tasks.map((t) => {
        const scoreObj = s.scores.find((sc) => sc.taskId === t.id);
        return scoreObj ? scoreObj.value : 0;
      });
      const totalScore = scoresArray.reduce((a, b) => a + b, 0);
      return {
        number: s.number,
        code: s.code,
        name: s.name,
        nickname: s.nickname,
        scores: scoresArray,
        totalScore,
      };
    });

    return {
      id: room.id,
      name: room.name,
      icon: room.icon || "🧩",
      studentCount,
      submittedCount,
      pending,
      percent,
      exportData: {
        name: room.name,
        taskNames: room.tasks.map((t) => t.name),
        students: studentsData,
      },
    };
  });

  const totalStudents = roomStats.reduce((sum, r) => sum + r.studentCount, 0);
  const totalRooms = roomStats.length;
  const avgProgress =
    totalRooms > 0
      ? Math.round(roomStats.reduce((sum, r) => sum + r.percent, 0) / totalRooms)
      : 0;

  let topRoom = roomStats.length > 0 ? roomStats[0] : null;
  for (const r of roomStats) {
    if (r.percent > (topRoom?.percent ?? -1)) topRoom = r;
  }

  return (
    <main id="report-view" className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap print:mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-12 h-12 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center text-lg transition-all active:scale-95 print:hidden"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                รายงานวิเคราะห์ความก้าวหน้า
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                สรุปผลการเรียนรู้รายห้องเรียนแบบ Real-time
              </p>
            </div>
          </div>
          <button
            id="print-btn"
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-sm flex items-center gap-2 hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all active:scale-95 print:hidden cursor-pointer"
          >
            <i className="fa-solid fa-print"></i> พิมพ์รายงาน
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-blue-100/50 border border-blue-50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mb-4 text-blue-600 shadow-inner">👥</div>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">นักเรียนทั้งหมด</p>
            <h4 className="text-3xl font-black text-slate-800">{totalStudents}</h4>
            <p className="text-blue-500 text-[10px] font-bold mt-1">ในระบบปัจจุบัน</p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-teal-100/50 border border-teal-50">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-2xl mb-4 text-teal-600 shadow-inner">🏫</div>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">จำนวนห้องเรียน</p>
            <h4 className="text-3xl font-black text-slate-800">{totalRooms}</h4>
            <p className="text-teal-500 text-[10px] font-bold mt-1">เปิดใช้งานอยู่</p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-emerald-100/50 border border-emerald-50 flex items-center gap-6">
            <div className="circle-chart shrink-0" style={{ "--progress": `${avgProgress * 3.6}deg` } as CSSProperties}>
              <div className="circle-chart-content">
                <h4 className="text-2xl font-black text-slate-800">{avgProgress}%</h4>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">ความคืบหน้าเฉลี่ย</p>
              <p className="text-emerald-500 text-[10px] font-bold">ของทุกห้องเรียน</p>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-amber-100/50 border border-amber-50">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl mb-4 text-amber-600 shadow-inner">🏆</div>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">ห้องที่มีความเพียรสูงสุด</p>
            <h4 className="text-xl font-black text-slate-800 truncate">{topRoom ? `${topRoom.icon} ${topRoom.name}` : "ยังไม่มีข้อมูล"}</h4>
            <p className="text-amber-500 text-[10px] font-black mt-1">{topRoom ? `ความก้าวหน้า: ${topRoom.percent}%` : "—"}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h3 className="text-xl font-black text-slate-800">ตารางวิเคราะห์ความก้าวหน้าแต่ละห้อง</h3>
            <p className="text-slate-500 text-sm mt-1">จัดเรียงตามสถิติการส่งงานของนักเรียน</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ห้องเรียน</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">นักเรียน</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ความก้าวหน้า</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">สถานะ</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right report-action-col print:hidden">แอคชั่น</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {roomStats.map((room) => {
                  const statusLabel = room.percent >= 80 ? "ยอดเยี่ยม" : room.percent >= 50 ? "ดี" : "ต้องปรับปรุง";
                  const statusBadgeClass =
                    room.percent >= 80
                      ? "bg-emerald-100 text-emerald-600"
                      : room.percent >= 50
                      ? "bg-amber-100 text-amber-600"
                      : "bg-rose-100 text-rose-600";
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-xl">{room.icon}</div>
                          <p className="font-bold text-slate-800">{room.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-slate-600">{room.studentCount}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 w-full max-w-[180px]">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-700" style={{ width: `${room.percent}%` }}></div>
                          </div>
                          <span className="text-xs font-black text-slate-700">{room.percent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadgeClass}`}>{statusLabel}</span>
                      </td>
                      <td className="px-8 py-5 text-right report-action-col print:hidden">
                        <div className="flex items-center justify-end gap-2">
                          <button data-action="csv" data-room={JSON.stringify(room.exportData)} title="Export CSV" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-center shadow-sm cursor-pointer">
                            <i className="fa-solid fa-file-csv text-sm"></i>
                          </button>
                          <Link href={`/rooms/${room.id}`} title="จัดการห้อง" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm cursor-pointer">
                            <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Client bridge for print + CSV download */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', () => window.print());
            document.addEventListener('click', function(e) {
              const csvBtn = e.target.closest('[data-action="csv"]');
              if (!csvBtn) return;
              try {
                const roomData = JSON.parse(csvBtn.getAttribute('data-room'));
                let csv = '\\uFEFF';
                const headers = ['เลขที่','รหัสนักเรียน','ชื่อ-นามสกุล','ชื่อเล่น'];
                roomData.taskNames.forEach(t => headers.push(t));
                headers.push('คะแนนรวม');
                csv += headers.map(h => '"' + h.replace(/"/g,'""') + '"').join(',') + '\\r\\n';
                roomData.students.forEach(s => {
                  const row = [s.number || '', s.code || '', s.name, s.nickname || ''];
                  s.scores.forEach(val => row.push(val));
                  row.push(s.totalScore);
                  csv += row.map(v => '"' + String(v == null ? '' : v).replace(/"/g,'""') + '"').join(',') + '\\r\\n';
                });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', 'Report_' + roomData.name + '.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } catch (err) { console.error('CSV Generation Error:', err); }
            });
          `,
        }}
      />
    </main>
  );
}
