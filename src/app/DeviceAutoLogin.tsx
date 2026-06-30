"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { tryDeviceLogin } from "@/lib/actions/device";

// Mounts in the root layout. On a guest's first load, asks the server whether
// this browser carries a valid trusted-device token and, if so, logs in
// silently (the cookie/DB do the work; nothing sensitive lives on the client).
export default function DeviceAutoLogin({ isTeacher }: { isTeacher: boolean }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!isTeacher) {
      tryDeviceLogin().then((r) => {
        if (r.ok) router.refresh();
      });
    }
  }, [isTeacher, router]);

  return null;
}
