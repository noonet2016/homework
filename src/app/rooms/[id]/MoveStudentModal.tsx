"use client";

// "ย้ายห้อง" — move a student (one subject or several) to another room with their scores.
// Server side + the reasoning behind the task mapping: src/lib/actions/studentMove.ts
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMovePlan, moveStudent } from "@/lib/actions/studentMove";
import type { MovePlan, MoveRoom, MoveEnrollment, TaskChoice } from "@/lib/actions/studentMove";

type LegState = {
  selected: boolean;
  toRoomId: string;
  number: string;
  showAllRooms: boolean;
  choices: Record<string, TaskChoice | "">; // source taskId → choice ("" = not decided)
};

/** "Mission 2" ≈ "Mission2", "Bumper Senser" ≈ "bumper senser". */
function norm(s: string) {
  return s.toLowerCase().replace(/[\s.\-_'"()]+/g, "");
}

function autoChoices(e: MoveEnrollment, dest: MoveRoom | undefined): Record<string, TaskChoice | ""> {
  const out: Record<string, TaskChoice | ""> = {};
  const used = new Set<string>();
  for (const s of e.scores) {
    const hit = dest?.tasks.find((t) => !used.has(t.id) && norm(t.name) === norm(s.taskName));
    if (hit) used.add(hit.id);
    out[s.taskId] = hit ? hit.id : "";
  }
  return out;
}

export default function MoveStudentModal({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<MovePlan | null>(null);
  const [loadError, setLoadError] = useState("");
  const [legs, setLegs] = useState<Record<string, LegState>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ roomId: string; roomName: string } | null>(null);

  useEffect(() => {
    getMovePlan(studentId)
      .then((p) => {
        if (!p) return setLoadError("ไม่พบนักเรียนคนนี้");
        setPlan(p);
        const init: Record<string, LegState> = {};
        p.enrollments.forEach((e, i) => {
          init[e.studentId] = { selected: i === 0, toRoomId: "", number: "", showAllRooms: false, choices: {} };
        });
        setLegs(init);
      })
      .catch(() => setLoadError("โหลดข้อมูลไม่สำเร็จ"));
  }, [studentId]);

  const roomById = useMemo(() => new Map((plan?.rooms ?? []).map((r) => [r.id, r])), [plan]);

  function patch(id: string, p: Partial<LegState>) {
    setLegs((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
    setError("");
  }

  function pickRoom(e: MoveEnrollment, toRoomId: string) {
    patch(e.studentId, { toRoomId, choices: autoChoices(e, roomById.get(toRoomId)) });
  }

  const selected = plan ? plan.enrollments.filter((e) => legs[e.studentId]?.selected) : [];

  // Problems that block the confirm button, per leg.
  function problems(e: MoveEnrollment): string[] {
    const l = legs[e.studentId];
    const out: string[] = [];
    if (!l.toRoomId) out.push("เลือกห้องปลายทาง");
    const n = Number(l.number);
    if (!l.number || !Number.isInteger(n) || n < 1) out.push("กรอกเลขที่ในห้องใหม่");
    if (l.toRoomId) {
      const undecided = e.scores.filter((s) => !l.choices[s.taskId]).length;
      if (undecided) out.push(`เลือกปลายทางของงานอีก ${undecided} ชิ้น`);
      const picked = Object.values(l.choices).filter((c) => c && c !== "new" && c !== "drop");
      if (new Set(picked).size !== picked.length) out.push("มีงานสองชิ้นจับคู่ไปงานเดียวกัน");
    }
    return out;
  }
  const allProblems = selected.flatMap(problems);
  const canSubmit = selected.length > 0 && allProblems.length === 0 && !saving;

  async function submit() {
    if (!plan || !canSubmit) return;
    setSaving(true);
    setError("");
    const res = await moveStudent(
      selected.map((e) => {
        const l = legs[e.studentId];
        return {
          studentId: e.studentId,
          toRoomId: l.toRoomId,
          number: Number(l.number),
          choices: l.choices as Record<string, TaskChoice>,
        };
      }),
    );
    setSaving(false);
    if (!res.ok) return setError(res.error);
    const first = selected[0];
    const toId = legs[first.studentId].toRoomId;
    setDone({ roomId: toId, roomName: roomById.get(toId)?.name ?? "" });
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end md:items-center justify-center md:p-4">
      <div className="relative bg-white rounded-t-3xl md:rounded-2xl w-full max-w-2xl shadow-2xl animate-modal-pop flex flex-col max-h-[92vh]">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 modal-close-btn" aria-label="Close">✕</button>

        <div className="p-5 md:p-6 pb-3 shrink-0">
          <h3 className="text-2xl font-black text-[#1e2d52] flex items-center gap-2">
            <i className="fa-solid fa-right-left text-violet-500" /> ย้ายห้องเรียน
          </h3>
          {plan && (
            <p className="text-slate-600 mt-1">
              <span className="font-bold text-[#1e2d52]">{plan.name}</span>
              {plan.code && <span className="text-slate-400"> · รหัส {plan.code}</span>}
            </p>
          )}
        </div>

        <div className="px-5 md:px-6 overflow-y-auto flex-1 space-y-4 pb-4">
          {loadError && <p className="text-red-600 font-semibold">{loadError}</p>}
          {!plan && !loadError && <p className="text-slate-500 py-8 text-center">กำลังโหลด...</p>}

          {done && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
              <i className="fa-solid fa-circle-check text-emerald-500 text-4xl" />
              <p className="font-black text-emerald-700 text-lg mt-2">ย้ายเรียบร้อย</p>
              <p className="text-emerald-700 text-sm">คะแนนที่เลือกไว้ย้ายตามไปแล้ว · QR ที่สร้างจากระบบใหม่ยังใช้ได้</p>
              <p className="text-amber-700 text-xs mt-2">
                QR แบบเก่า (ลิงก์ Google Apps Script) อ้างชื่อห้อง+เลขที่เดิม ต้องพิมพ์ QR ใหม่ให้เด็กคนนี้
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-600 text-white font-semibold">ปิด</button>
                <button
                  type="button"
                  onClick={() => router.push(`/rooms/${done.roomId}`)}
                  className="px-4 py-2 rounded bg-violet-600 text-white font-semibold"
                >
                  ไปห้อง {done.roomName} <i className="fa-solid fa-arrow-right ml-1" />
                </button>
              </div>
            </div>
          )}

          {plan && !done && plan.enrollments.length > 1 && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <p className="text-sm font-bold text-violet-800">
                  เด็กคนนี้เรียน {plan.enrollments.length} วิชา — เลือกวิชาที่จะย้าย
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => plan.enrollments.forEach((e) => patch(e.studentId, { selected: true }))}
                    className="text-xs px-2 py-1 rounded bg-violet-600 text-white font-semibold"
                  >
                    ย้ายทุกวิชา
                  </button>
                  <button
                    type="button"
                    onClick={() => plan.enrollments.forEach((e, i) => patch(e.studentId, { selected: i === 0 }))}
                    className="text-xs px-2 py-1 rounded bg-white border border-violet-300 text-violet-700 font-semibold"
                  >
                    เฉพาะวิชานี้
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.enrollments.map((e) => (
                  <label key={e.studentId} className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!legs[e.studentId]?.selected}
                      onChange={(ev) => patch(e.studentId, { selected: ev.target.checked })}
                    />
                    {e.roomName}
                  </label>
                ))}
              </div>
            </div>
          )}

          {plan && !done && selected.map((e) => {
            const l = legs[e.studentId];
            const from = roomById.get(e.roomId);
            const candidates = plan.rooms.filter(
              (r) => r.id !== e.roomId && (l.showAllRooms || r.subject === from?.subject),
            );
            const dest = roomById.get(l.toRoomId);
            return (
              <div key={e.studentId} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="text-sm text-slate-500">
                  จาก <span className="font-bold text-[#1e2d52]">{e.roomName}</span> · เลขที่ {e.number ?? "-"} · คะแนน {e.scores.length} งาน
                </p>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_8rem] gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">ย้ายไปห้อง</span>
                    <select
                      value={l.toRoomId}
                      onChange={(ev) => pickRoom(e, ev.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-semibold text-slate-700"
                    >
                      <option value="">— เลือกห้อง —</option>
                      {candidates.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    {candidates.length === 0 && !l.showAllRooms && (
                      <span className="block text-xs text-amber-700 mt-1">ไม่มีห้องวิชาเดียวกันให้ย้าย</span>
                    )}
                    <label className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={l.showAllRooms}
                        onChange={(ev) => patch(e.studentId, { showAllRooms: ev.target.checked })}
                      />
                      แสดงทุกห้อง (รวมวิชาอื่น)
                    </label>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">เลขที่ในห้องใหม่</span>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={l.number}
                      onChange={(ev) => patch(e.studentId, { number: ev.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-semibold"
                      placeholder="เช่น 31"
                    />
                  </label>
                </div>

                {dest && e.scores.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1">คะแนนที่จะย้ายไปด้วย — เลือกงานในห้องใหม่</p>
                    <div className="space-y-2">
                      {e.scores.map((s) => {
                        const c = l.choices[s.taskId] ?? "";
                        return (
                          <div
                            key={s.taskId}
                            className={`rounded-lg border p-2 grid grid-cols-1 md:grid-cols-2 gap-2 items-center ${
                              c ? "border-slate-200 bg-slate-50" : "border-amber-300 bg-amber-50"
                            }`}
                          >
                            <div className="text-sm">
                              <span className="font-semibold text-[#1e2d52]">{s.taskName}</span>
                              <span className="ml-2 inline-block rounded bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5">
                                {s.value === -1 ? "ส่งแล้ว" : `${s.value} คะแนน`}
                              </span>
                            </div>
                            <select
                              value={c}
                              onChange={(ev) =>
                                patch(e.studentId, { choices: { ...l.choices, [s.taskId]: ev.target.value } })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-sm"
                            >
                              <option value="">— เลือก —</option>
                              {dest.tasks.map((t) => (
                                <option key={t.id} value={t.id}>→ {t.name}</option>
                              ))}
                              <option value="new">＋ สร้างงาน &quot;{s.taskName}&quot; ในห้องใหม่</option>
                              <option value="drop">✕ ไม่ย้ายคะแนนนี้ (ลบทิ้ง)</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {dest && e.scores.length === 0 && (
                  <p className="text-sm text-slate-500">ยังไม่มีคะแนนในวิชานี้ — ย้ายแค่ชื่อ</p>
                )}
              </div>
            );
          })}
        </div>

        {plan && !done && (
          <div className="border-t border-slate-100 p-4 md:px-6 shrink-0">
            {error && <p className="text-red-600 font-semibold text-sm mb-2">{error}</p>}
            {!error && allProblems.length > 0 && (
              <p className="text-amber-700 text-xs mb-2">ยังขาด: {Array.from(new Set(allProblems)).join(" · ")}</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-rose-200 bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100">
                <i className="fa-solid fa-xmark mr-1" />ยกเลิก
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="px-4 py-2 rounded bg-violet-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-right-left mr-1" />
                {saving ? "กำลังย้าย..." : `ยืนยันย้าย${selected.length > 1 ? ` ${selected.length} วิชา` : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
