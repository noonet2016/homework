"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import RoomEditModal from "./RoomEditModal";
import RoomActionButtons from "./RoomActionButtons";
import RoomCreateCard from "./RoomCreateCard";
import { reorderRooms } from "@/lib/actions/rooms";

interface Room {
  id: string;
  name: string;
  icon: string;
  theme: { chip: string; bar: string };
  studentCount: number;
  completion: number;
  submitted: number;
  pending: number;
}

interface RoomsGridProps {
  initialRooms: Room[];
  isTeacher: boolean;
}

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

export default function RoomsGrid({ initialRooms, isTeacher }: RoomsGridProps) {
  const [rooms, setRooms] = useState(initialRooms);

  // Keep a ref in sync so event handlers can read latest rooms without stale closure
  const roomsRef = useRef(rooms);
  useEffect(() => {
    setRooms(initialRooms);
    roomsRef.current = initialRooms;
  }, [initialRooms]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // DOM refs keyed by room ID
  const cardEls = useRef<Map<string, HTMLDivElement>>(new Map());

  // Drag state — all refs, NO React state, so zero re-renders during drag
  const draggingId = useRef<string | null>(null);
  const hoverId = useRef<string | null>(null);
  const cloneEl = useRef<HTMLElement | null>(null);
  const offset = useRef({ x: 0, y: 0 });

  // Positions snapshotted at drag-start (stable reference for transforms)
  const snapRects = useRef<Map<string, DOMRect>>(new Map());

  // Flag: tell useLayoutEffect to clear transforms after drop
  const justDropped = useRef(false);

  // After rooms state updates (only happens on drop), clear inline transforms
  useLayoutEffect(() => {
    if (!justDropped.current) return;
    justDropped.current = false;
    cardEls.current.forEach((el) => {
      el.style.transition = "none";
      el.style.transform = "";
    });
  }, [rooms]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  // (no-op: drop-target highlight removed — card shift animation is self-explanatory)
  const clearHighlights = () => {};

  /**
   * For a given (draggingId, hoverId) pair, compute each card's visual
   * offset from its snap position and apply it with a CSS transition.
   * No React state is touched here.
   */
  const applyTransforms = (dragId: string, hoverTargetId: string) => {
    const list = roomsRef.current;

    // Build preview order
    const preview = [...list];
    const fromIdx = preview.findIndex((r) => r.id === dragId);
    const toIdx = preview.findIndex((r) => r.id === hoverTargetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = preview.splice(fromIdx, 1);
    preview.splice(toIdx, 0, moved);

    // Each non-dragging card moves from its snap position to
    // wherever its preview-order slot is (= the snap position of the
    // card that originally occupied that slot).
    cardEls.current.forEach((el, id) => {
      if (id === dragId) return;

      const newIdx = preview.findIndex((r) => r.id === id);
      const occupantId = list[newIdx]?.id;
      if (!occupantId) return;

      const from = snapRects.current.get(id);
      const to = snapRects.current.get(occupantId);
      if (!from || !to) return;

      const dx = to.left - from.left;
      const dy = to.top - from.top;
      el.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  };

  const resetTransforms = () => {
    cardEls.current.forEach((el, id) => {
      if (id === draggingId.current) return;
      el.style.transition = "transform 180ms ease";
      el.style.transform = "";
    });
  };

  // ── Event handlers stored in refs to keep stable identity ─────────────────
  const moveHandler = useRef<((e: PointerEvent) => void) | null>(null);
  const upHandler = useRef<(() => Promise<void>) | null>(null);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (!isTeacher) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("[data-no-drag]")
    )
      return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const card = cardEls.current.get(id);
    if (!card) return;

    // Snapshot all card rects at drag-start (stable reference)
    snapRects.current.clear();
    cardEls.current.forEach((el, roomId) => {
      snapRects.current.set(roomId, el.getBoundingClientRect());
    });

    draggingId.current = id;
    hoverId.current = null;

    const rect = snapRects.current.get(id)!;
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Ghost
    card.classList.add("lobby-room-dragging");
    document.body.classList.add("is-dragging");

    // Floating clone
    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      margin: 0;
      z-index: 9999;
      pointer-events: none;
      transition: none;
    `;
    clone.classList.remove("lobby-room-dragging");
    clone.classList.add("lobby-room-floating");
    document.body.appendChild(clone);
    cloneEl.current = clone;

    // ── pointermove ─────────────────────────────────────────────────────────
    moveHandler.current = (ev: PointerEvent) => {
      // Move clone
      if (cloneEl.current) {
        cloneEl.current.style.left = `${ev.clientX - offset.current.x}px`;
        cloneEl.current.style.top = `${ev.clientY - offset.current.y}px`;
      }

      const dragId = draggingId.current;
      if (!dragId) return;

      // ── Hit-test against SNAP rects (original positions, unaffected by CSS transforms) ──
      // elementFromPoint uses VISUAL (post-transform) positions, so transformed cards
      // block detection of the dragging card's ghost → causes drag-back to fail.
      // Snap rects are stable: snapshotted once at drag-start, never change during drag.
      const dragSnapRect = snapRects.current.get(dragId);

      // Case: cursor is over the dragging card's original slot (own ghost) → RESET
      if (
        dragSnapRect &&
        ev.clientX >= dragSnapRect.left && ev.clientX <= dragSnapRect.right &&
        ev.clientY >= dragSnapRect.top  && ev.clientY <= dragSnapRect.bottom
      ) {
        if (hoverId.current !== null) {
          clearHighlights();
          hoverId.current = null;
          resetTransforms();
        }
        return;
      }

      // Case: cursor is over another card's original slot → apply transforms
      let newHoverId: string | null = null;
      snapRects.current.forEach((rect, id) => {
        if (id === dragId) return;
        if (
          ev.clientX >= rect.left && ev.clientX <= rect.right &&
          ev.clientY >= rect.top  && ev.clientY <= rect.bottom
        ) {
          newHoverId = id;
        }
      });

      if (newHoverId === null) return;           // gap between cards → maintain state
      if (newHoverId === hoverId.current) return; // same target → no change

      clearHighlights();
      hoverId.current = newHoverId;
      applyTransforms(dragId, newHoverId);
    };

    // ── pointerup ───────────────────────────────────────────────────────────
    upHandler.current = async () => {
      window.removeEventListener("pointermove", moveHandler.current!);
      window.removeEventListener("pointerup", upHandler.current!);

      cloneEl.current?.remove();
      cloneEl.current = null;

      document.body.classList.remove("is-dragging");
      cardEls.current.get(draggingId.current!)?.classList.remove("lobby-room-dragging");
      clearHighlights();

      const dragId = draggingId.current;
      const hoverTargetId = hoverId.current;
      draggingId.current = null;
      hoverId.current = null;

      if (!dragId || !hoverTargetId || dragId === hoverTargetId) {
        resetTransforms();
        return;
      }

      // Compute new order
      const newRooms = [...roomsRef.current];
      const fromIdx = newRooms.findIndex((r) => r.id === dragId);
      const toIdx = newRooms.findIndex((r) => r.id === hoverTargetId);
      const [item] = newRooms.splice(fromIdx, 1);
      newRooms.splice(toIdx, 0, item);

      // Tell useLayoutEffect to clear transforms right after the re-render
      // (cards will be at their new natural positions = same as where transforms placed them)
      justDropped.current = true;
      setRooms(newRooms);

      try {
        await reorderRooms(newRooms.map((r) => r.id));
      } catch (err) {
        console.error("Failed to persist room order:", err);
      }
    };

    window.addEventListener("pointermove", moveHandler.current);
    window.addEventListener("pointerup", upHandler.current);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove("is-dragging");
      if (moveHandler.current) window.removeEventListener("pointermove", moveHandler.current);
      if (upHandler.current) window.removeEventListener("pointerup", upHandler.current);
      cloneEl.current?.remove();
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-12 pt-8">
      {rooms.map((room) => (
        <div
          key={room.id}
          data-room-id={room.id}
          ref={(el) => {
            if (el) cardEls.current.set(room.id, el);
            else cardEls.current.delete(room.id);
          }}
          onPointerDown={(e) => startDrag(e, room.id)}
          className={[
            "lobby-room-draggable",
            "relative w-full text-left rounded-[24px] bg-white border border-[#e9eef7]",
            "pt-14 pb-4 px-4 shadow-[0_10px_25px_rgba(92,108,143,0.12)]",
            "overflow-visible select-none",
            isTeacher ? "cursor-grab" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {isTeacher && (
            <div
              className="absolute right-3 top-3 z-10 flex items-center gap-1"
              data-no-drag
            >
              <RoomEditModal
                id={room.id}
                name={room.name}
                icon={room.icon}
                usedIcons={rooms.map((r) => r.icon)}
              />
              <RoomActionButtons id={room.id} name={room.name} />
            </div>
          )}

          <Link href={`/rooms/${room.id}`} className="block" draggable={false}>
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
                {formatRoomName(room.name)}
              </h4>
              <p className="text-sm text-slate-500">
                นักเรียนทั้งหมด {room.studentCount} คน
              </p>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-[#28375d]">Progress</span>
                <span className="text-sm font-bold text-[#28375d]">{room.completion}%</span>
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

      {isTeacher && <RoomCreateCard usedIcons={rooms.map((r) => r.icon)} />}
    </div>
  );
}
