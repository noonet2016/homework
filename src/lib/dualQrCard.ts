// Rich dual-QR student card rendered as scalable SVG (teacher + student QR in one card).
// 1 card = 1 student. Used by the "print whole class" feature.
// SVG scales crisply at any print size and supports gradients / decorations the
// canvas version couldn't easily draw.

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 4-point sparkle star centered at (cx,cy)
function sparkle(cx: number, cy: number, r: number, color: string, opacity = 1): string {
  const d = `M${cx},${cy - r} L${cx + r * 0.28},${cy - r * 0.28} L${cx + r},${cy} L${cx + r * 0.28},${cy + r * 0.28} L${cx},${cy + r} L${cx - r * 0.28},${cy + r * 0.28} L${cx - r},${cy} L${cx - r * 0.28},${cy - r * 0.28} Z`;
  return `<path d="${d}" fill="${color}" opacity="${opacity}"/>`;
}

// Small leaf sprig — a few teardrop leaves around a stem
function leafSprig(x: number, y: number, scale: number, rot: number, color: string, opacity: number): string {
  const leaf = (a: number, len: number) =>
    `<path d="M0,0 C${6 * (len / 30)},${-len * 0.35} ${6 * (len / 30)},${-len * 0.75} 0,${-len} C${-6 * (len / 30)},${-len * 0.75} ${-6 * (len / 30)},${-len * 0.35} 0,0 Z" transform="rotate(${a})"/>`;
  return `<g transform="translate(${x},${y}) scale(${scale}) rotate(${rot})" fill="${color}" opacity="${opacity}">
      <path d="M0,0 C2,-18 4,-34 2,-52" stroke="${color}" stroke-width="2" fill="none"/>
      <g transform="translate(0,-14)">${leaf(-38, 26)}</g>
      <g transform="translate(2,-30)">${leaf(40, 24)}</g>
      <g transform="translate(2,-46)">${leaf(-30, 20)}</g>
    </g>`;
}

export type DualQrCardOpts = {
  teacherQr: string;
  studentQr: string;
  roomName: string;
  no: string;
  code: string;
  name: string;
  nick: string;
  index: number; // unique suffix for gradient ids
};

export function dualQrCardSvg(o: DualQrCardOpts): string {
  const W = 1040, H = 548;
  const id = o.index;

  // name font-size shrink for long names
  const nameLen = o.name.length;
  const nameSize = nameLen > 26 ? 30 : nameLen > 20 ? 34 : 40;

  // ---- panels geometry ----
  const panelY = 156, panelH = 322;
  const innerL = 24, innerR = W - 24;
  const gap = 22;
  const panelW = (innerR - innerL - gap) / 2;
  const leftX = innerL;
  const rightX = innerL + panelW + gap;

  const panel = (
    px: number, qr: string, label: string, color: string, gradId: string,
    leafColor: string,
  ) => {
    const labelY = panelY + 44;
    const qrBox = Math.min(panelW - 96, panelH - 92);
    const qrX = px + (panelW - qrBox) / 2;
    const qrY = labelY + 22;
    // side dashes for the label
    const labelCx = px + panelW / 2;
    return `
      <rect x="${px}" y="${panelY}" width="${panelW}" height="${panelH}" rx="22" fill="url(#${gradId})" stroke="${color}" stroke-opacity="0.15"/>
      ${sparkle(px + 26, panelY + 40, 9, color, 0.55)}
      ${sparkle(px + 44, panelY + 64, 5, color, 0.4)}
      ${sparkle(px + panelW - 26, panelY + 40, 9, color, 0.55)}
      ${sparkle(px + panelW - 44, panelY + 64, 5, color, 0.4)}
      <line x1="${px + 40}" y1="${labelY - 6}" x2="${labelCx - 130}" y2="${labelY - 6}" stroke="${color}" stroke-width="2" stroke-opacity="0.5" stroke-dasharray="3 5"/>
      <line x1="${labelCx + 130}" y1="${labelY - 6}" x2="${px + panelW - 40}" y2="${labelY - 6}" stroke="${color}" stroke-width="2" stroke-opacity="0.5" stroke-dasharray="3 5"/>
      <text x="${labelCx}" y="${labelY}" text-anchor="middle" font-size="24" font-weight="800" fill="${color}">${esc(label)}</text>
      ${leafSprig(px + 30, panelY + panelH - 16, 0.85, -8, leafColor, 0.55)}
      ${leafSprig(px + panelW - 34, panelY + panelH - 12, 0.95, 12, leafColor, 0.5)}
      <rect x="${qrX}" y="${qrY}" width="${qrBox}" height="${qrBox}" rx="14" fill="#ffffff" stroke="${color}" stroke-opacity="0.12"/>
      <image href="${qr}" x="${qrX + 12}" y="${qrY + 12}" width="${qrBox - 24}" height="${qrBox - 24}" preserveAspectRatio="xMidYMid meet"/>`;
  };

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="'Noto Sans Thai', sans-serif" class="qr-card">
    <defs>
      <linearGradient id="hdr${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fafbff"/>
        <stop offset="0.55" stop-color="#f9fbff"/>
        <stop offset="1" stop-color="#f6fcff"/>
      </linearGradient>
      <linearGradient id="book${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c7d2fe"/>
        <stop offset="0.5" stop-color="#ddd6fe"/>
        <stop offset="1" stop-color="#d8eefd"/>
      </linearGradient>
      <linearGradient id="tp${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fefdff"/>
        <stop offset="1" stop-color="#fbf7ff"/>
      </linearGradient>
      <linearGradient id="sp${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fdfffe"/>
        <stop offset="1" stop-color="#f3fcf6"/>
      </linearGradient>
    </defs>

    <!-- card -->
    <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="30" fill="#ffffff" stroke="#e2e8f0"/>

    <!-- header -->
    <path d="M3,33 a30,30 0 0 1 30,-30 H${W - 33} a30,30 0 0 1 30,30 V150 H3 Z" fill="url(#hdr${id})"/>
    <circle cx="${W - 150}" cy="40" r="60" fill="#c7d2fe" opacity="0.25"/>
    <circle cx="220" cy="150" r="70" fill="#bae6fd" opacity="0.25"/>

    <!-- book badge -->
    <rect x="26" y="22" width="96" height="96" rx="24" fill="url(#book${id})"/>
    <text x="74" y="92" text-anchor="middle" font-size="48">📖</text>
    ${sparkle(108, 38, 7, "#fef08a", 0.95)}
    ${sparkle(40, 100, 5, "#fde68a", 0.9)}

    <!-- name + info -->
    <text x="142" y="68" font-size="${nameSize}" font-weight="800" fill="#1e293b">${esc(o.name)}</text>
    <text x="142" y="112" font-size="23" font-weight="600" fill="#475569">👤 ชื่อเล่น: ${esc(o.nick)}   |   🏠 ห้อง: ${esc(o.roomName)}</text>

    <!-- paper airplane decoration -->
    <path d="M700,118 C740,96 786,92 820,70" stroke="#fbbf24" stroke-width="3" fill="none" stroke-dasharray="2 7" stroke-linecap="round" opacity="0.8"/>
    <text x="852" y="92" font-size="46" transform="rotate(-8 852 92)">🛩️</text>

    <!-- badge (เลขที่ / รหัส) -->
    <rect x="${W - 320}" y="30" width="290" height="60" rx="30" fill="#fffbeb" stroke="#fcd34d" stroke-width="2"/>
    <text x="${W - 175}" y="68" text-anchor="middle" font-size="25" font-weight="800" fill="#b45309">เลขที่ ${esc(o.no)} • รหัส ${esc(o.code)}</text>

    <!-- panels -->
    ${panel(leftX, o.teacherQr, "🚀 ครู — ให้คะแนนด่วน", "#7c3aed", `tp${id}`, "#c4b5fd")}
    ${panel(rightX, o.studentQr, "🎓 นักเรียน — ดูคะแนน", "#059669", `sp${id}`, "#86efac")}

    <!-- footer pill -->
    <rect x="${W / 2 - 170}" y="${H - 42}" width="340" height="34" rx="17" fill="#f1f5f9" stroke="#e2e8f0"/>
    <text x="${W / 2}" y="${H - 19}" text-anchor="middle" font-size="20" font-weight="700" fill="#64748b">♡ สแกน QR Code เพื่อใช้งาน</text>
  </svg>`;
}

export function dualQrPrintDocument(cardsSvg: string[], roomName: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
    <title>QR ทั้งห้องเรียน — ${esc(roomName)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Noto Sans Thai',sans-serif;background:#fff;padding:8mm}
      .page-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:4mm;align-items:start;}
      .qr-card{width:100%;height:auto;display:block;break-inside:avoid;page-break-inside:avoid;}
      @media print{
        @page{size:A4 portrait;margin:8mm}
        body{padding:0}
      }
    </style></head><body><div class="page-grid">${cardsSvg.join("")}</div></body></html>`;
}
