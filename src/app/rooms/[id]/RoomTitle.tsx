"use client";

import { useEffect, useRef, useState } from "react";

// Room title that auto-scrolls (marquee) ONLY when the name overflows its
// container — e.g. long names on mobile. Short names stay still; respects
// prefers-reduced-motion via CSS (.room-title-marquee).
export default function RoomTitle({
  icon,
  name,
}: {
  icon: string | null;
  name: string;
}) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      const vp = viewportRef.current;
      const txt = textRef.current;
      if (!vp || !txt) return;
      const overflow = txt.scrollWidth - vp.clientWidth;
      setShift(overflow > 4 ? overflow + 8 : 0); // small tail padding
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [name]);

  return (
    <h2
      id="class-title"
      className="flex min-w-0 items-center text-2xl font-bold sm:text-3xl"
    >
      <span className="mr-2 shrink-0">{icon || "🧩"}</span>
      <span ref={viewportRef} className="min-w-0 flex-1 overflow-hidden">
        <span
          ref={textRef}
          title={name}
          className={`inline-block whitespace-nowrap ${shift > 0 ? "room-title-marquee" : ""}`}
          style={shift > 0 ? ({ ["--marquee-shift" as string]: `-${shift}px` } as React.CSSProperties) : undefined}
        >
          {name}
        </span>
      </span>
    </h2>
  );
}
