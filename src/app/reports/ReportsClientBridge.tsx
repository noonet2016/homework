"use client";

import { useEffect } from "react";

export default function ReportsClientBridge() {
  useEffect(() => {
    const printBtn = document.getElementById("print-btn");
    const handlePrint = () => window.print();
    printBtn?.addEventListener("click", handlePrint);

    const handleCsv = (e: MouseEvent) => {
      const csvBtn = (e.target as Element).closest("[data-action='csv']");
      if (!csvBtn) return;
      try {
        const roomData = JSON.parse(csvBtn.getAttribute("data-room") ?? "{}");
        let csv = "﻿";
        const headers = ["เลขที่", "รหัสนักเรียน", "ชื่อ-นามสกุล", "ชื่อเล่น"];
        roomData.taskNames.forEach((t: string) => headers.push(t));
        headers.push("คะแนนรวม");
        csv += headers.map((h: string) => '"' + h.replace(/"/g, '""') + '"').join(",") + "\r\n";
        roomData.students.forEach((s: any) => {
          const row = [s.number || "", s.code || "", s.name, s.nickname || ""];
          s.scores.forEach((val: number) => row.push(String(val)));
          row.push(String(s.totalScore));
          csv += row.map((v: string) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(",") + "\r\n";
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Report_" + roomData.name + ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("CSV Generation Error:", err);
      }
    };

    document.addEventListener("click", handleCsv as EventListener);
    return () => {
      printBtn?.removeEventListener("click", handlePrint);
      document.removeEventListener("click", handleCsv as EventListener);
    };
  }, []);

  return null;
}
