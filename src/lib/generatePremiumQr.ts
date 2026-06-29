type RoundRadii = number | { tl?: number; tr?: number; br?: number; bl?: number };

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  radius: RoundRadii, fill: boolean, stroke: boolean,
) {
  const r = typeof radius === "number"
    ? { tl: radius, tr: radius, br: radius, bl: radius }
    : { tl: radius.tl ?? 0, tr: radius.tr ?? 0, br: radius.br ?? 0, bl: radius.bl ?? 0 };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Portrait card — 800×1180px (matches GAS design)
export function generatePremiumQrDataUrl(
  qrSrc: string,
  titleText: string,
  roomName: string,
  noText: string,
  codeText: string,
  nameText: string,
  nickText: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 1180;
        const ctx = canvas.getContext("2d")!;
        const bottomSafePadding = 70;

        // Background
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Card shadow + white background
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.1)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        roundRect(ctx, 40, 40, 720, 1085, 40, true, false);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Header
        const isTeacher = (titleText || "").includes("ครู");
        const headerColor = isTeacher ? "#4f46e5" : "#10b981";
        ctx.fillStyle = headerColor;
        roundRect(ctx, 40, 40, 720, 140, { tl: 40, tr: 40, bl: 0, br: 0 }, true, false);

        // Header circle bg
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.arc(100, 110, 45, 0, Math.PI * 2);
        ctx.fill();

        // Header title
        ctx.fillStyle = "#ffffff";
        ctx.font = 'bold 50px "Noto Sans Thai", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(isTeacher ? "🚀 TEACHER" : "🎓 STUDENT", 170, 105);
        ctx.font = '500 24px "Noto Sans Thai", sans-serif';
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(titleText || "Quick Grade System", 170, 145);

        // QR code area
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        roundRect(ctx, 100, 220, 600, 600, 30, true, true);
        ctx.drawImage(qrImg, 140, 260, 520, 520);

        // Info rows
        let infoY = 870;
        ctx.textAlign = "left";

        const lightBg = isTeacher ? "#eef2ff" : "#ecfdf5";
        ctx.fillStyle = lightBg;
        roundRect(ctx, 100, infoY - 35, 600, 50, 12, true, false);
        ctx.fillStyle = headerColor;
        ctx.font = 'bold 24px "Noto Sans Thai", sans-serif';
        ctx.fillText("ห้อง: " + roomName, 125, infoY);

        infoY += 60;
        ctx.fillStyle = "#f1f5f9";
        roundRect(ctx, 100, infoY - 35, 600, 50, 12, true, false);
        ctx.fillStyle = "#475569";
        ctx.font = 'bold 24px "Noto Sans Thai", sans-serif';
        ctx.fillText("เลขที่: " + noText + "  รหัส: " + codeText, 125, infoY);

        // Name
        infoY += 75;
        ctx.fillStyle = "#1e293b";
        ctx.font = '800 38px "Noto Sans Thai", sans-serif';
        ctx.fillText(nameText, 100, infoY);

        // Nickname
        infoY += 55;
        ctx.fillStyle = headerColor;
        ctx.font = 'bold 30px "Noto Sans Thai", sans-serif';
        ctx.fillText("ชื่อเล่น: " + nickText, 100, infoY);

        // Footer
        ctx.fillStyle = "#94a3b8";
        ctx.font = '500 18px "Noto Sans Thai", sans-serif';
        ctx.textAlign = "right";
        ctx.fillText(
          "Learn Tracking System • " + new Date().toLocaleDateString("th-TH"),
          700,
          canvas.height - bottomSafePadding,
        );

        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    qrImg.onerror = () => reject(new Error("โหลดภาพ QR ไม่ได้"));
    qrImg.src = qrSrc.startsWith("data:") ? qrSrc : `${qrSrc}${qrSrc.includes("?") ? "&" : "?"}t=${Date.now()}`;
  });
}
