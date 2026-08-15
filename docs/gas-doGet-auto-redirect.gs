/**
 * QR Redirect Bridge — Auto (Smart Hybrid)
 * วางฟังก์ชันนี้ทับ doGet เดิม ใน Apps Script project ที่ QR ของนักเรียนชี้มา (…/exec)
 *
 * ตรรกะ (จบที่ top-level เสมอ — ล็อกอินได้เสมอ):
 *   1) โหลดปุ๊บ พยายามเด้ง window.top.location.replace(url)  → best case: auto + URL bar สะอาด
 *   2) จับการแตะจอครั้งแรก (touch/click/keydown ที่ไหนก็ได้) แล้วเด้ง top ทันที
 *   3) ปุ่มใหญ่ target="_top" ให้กดชัดเจน — คลิกครั้งเดียว = เด้งสะอาด ล็อกอินได้
 *
 * สำคัญ: ห้ามใช้ window.location.replace เด้ง iframe ตัวเอง (framed) เป็น fallback —
 * เพราะแอปจะรันใน cross-origin iframe ของ Google → cookie/session ถูกบล็อก → ล็อกอินไม่ได้.
 * top-level auto แบบ "ไม่แตะจอเลย" เป็นข้อจำกัด browser (sandbox allow-top-navigation-BY-USER-ACTIVATION)
 * แก้ด้วยโค้ดล้วนไม่ได้ — กรณีที่ browser บล็อก จึงเหลือ "แตะครั้งเดียว" เป็นเพดานที่ทำได้.
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var sheet = params.sheet || '';
  var studentId = params.studentId || '';   // ในระบบเดิม = "เลขที่"
  var mode = params.mode || '';             // 'grade' = โหมดตรวจงานครู, ว่าง = ดูคะแนน

  var NEW_SERVER = 'https://homework.thatnarai.net';

  var targetUrl = NEW_SERVER + '/';
  if (sheet && studentId) {
    targetUrl = NEW_SERVER + '/redirect?mode=' + encodeURIComponent(mode) +
                '&roomName=' + encodeURIComponent(sheet) +
                '&studentNumber=' + encodeURIComponent(studentId);
  }

  var hrefAttr = targetUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  var jsUrl = JSON.stringify(targetUrl); // ปลอดภัยสำหรับฝังใน <script>

  var html =
    '<!DOCTYPE html>' +
    '<html lang="th"><head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<base target="_top">' +
    '<title>กำลังเข้าสู่ระบบใหม่...</title>' +
    '<style>' +
    '*{box-sizing:border-box}' +
    'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Sarabun",sans-serif;' +
    'background:#f1f3fb;color:#1e293b;padding:24px}' +
    '.card{max-width:360px;width:100%;text-align:center;background:#fff;' +
    'border-radius:26px;padding:36px 28px 30px;' +
    'box-shadow:0 24px 60px rgba(79,70,229,.14),0 4px 14px rgba(15,23,42,.05)}' +
    '.art{width:150px;height:130px;margin:0 auto 22px;display:block;overflow:visible}' +
    '.rocket{transform-origin:75px 66px;' +
    'animation:rk-vib .12s infinite,rk-float 1.6s ease-in-out infinite}' +
    '.flame{transform-origin:75px 92px;animation:rk-glow .8s ease-in-out infinite}' +
    '@keyframes rk-vib{0%{transform:translate(0,0)}25%{transform:translate(.6px,.6px)}' +
    '50%{transform:translate(-.6px,-.6px)}75%{transform:translate(.6px,-.6px)}100%{transform:translate(0,0)}}' +
    '@keyframes rk-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}' +
    '@keyframes rk-glow{0%,100%{filter:drop-shadow(0 0 5px #f59e0b);opacity:.85}' +
    '50%{filter:drop-shadow(0 0 16px #fbbf24);opacity:1}}' +
    'h1{font-size:1.35rem;margin:0 0 10px;font-weight:800;color:#1e293b}' +
    'p{margin:0 0 24px;font-size:.95rem;color:#94a3b8;line-height:1.6}' +
    '.btn{display:block;width:100%;padding:15px 18px;border-radius:16px;font-size:1.05rem;' +
    'font-weight:800;text-decoration:none;color:#fff;letter-spacing:.3px;' +
    'background:linear-gradient(100deg,#3b82f6,#6366f1 45%,#8b5cf6);' +
    'box-shadow:0 12px 24px rgba(99,102,241,.35)}' +
    '.btn:active{transform:translateY(1px)}' +
    '</style></head><body>' +
    '<div class="card">' +
    // ---- ภาพประกอบ: หน้าต่างเบราว์เซอร์ + ลูกศรรีเฟรช (gradient) + คอนเฟตตี ----
    '<svg class="art" viewBox="0 0 150 130" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#818cf8"/><stop offset="1" stop-color="#6366f1"/></linearGradient>' +
    '<linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs>' +
    // confetti dots / sparkles
    '<circle cx="26" cy="40" r="4" fill="#c7d2fe"/>' +
    '<circle cx="20" cy="66" r="3" fill="#a5b4fc"/>' +
    '<circle cx="126" cy="36" r="3.5" fill="#fbbf24"/>' +
    '<circle cx="130" cy="60" r="3" fill="#f9a8d4"/>' +
    '<circle cx="112" cy="22" r="2.5" fill="#6ee7b7"/>' +
    '<path d="M34 26 l2 2 l-2 2 l-2-2 z" fill="#f472b6"/>' +
    '<path d="M118 78 l2 2 l-2 2 l-2-2 z" fill="#818cf8"/>' +
    '<path d="M100 14 l1.6 1.6 l-1.6 1.6 l-1.6-1.6 z" fill="#fcd34d"/>' +
    // rocket (float + vibrate) — same identity as the app loader
    '<g class="rocket">' +
    // exhaust flame (amber, glowing)
    '<path class="flame" d="M68 84 Q75 112 82 84 Q75 92 68 84 z" fill="url(#gf)"/>' +
    // body
    '<path d="M75 26 C88 38 88 66 82 84 L68 84 C62 66 62 38 75 26 z" fill="url(#g1)"/>' +
    // nose highlight
    '<path d="M75 26 C81 32 83 42 83 52 L75 50 z" fill="#a5b4fc" opacity=".55"/>' +
    // window
    '<circle cx="75" cy="50" r="7" fill="#dbeafe" stroke="#3b82f6" stroke-width="2.5"/>' +
    // fins
    '<path d="M68 72 L57 86 L68 82 z" fill="#8b5cf6"/>' +
    '<path d="M82 72 L93 86 L82 82 z" fill="#7c3aed"/>' +
    '</g>' +
    '</svg>' +
    '<h1>กำลังเข้าสู่ระบบใหม่</h1>' +
    '<p>กำลังพาไปยังหน้าข้อมูลอัตโนมัติ...<br>หากหน้าไม่เปลี่ยนใน 2–3 วินาที กดปุ่มด้านล่าง</p>' +
    '<a id="go" class="btn" href="' + hrefAttr + '" target="_top" rel="noopener">เข้าสู่ระบบ →</a>' +
    '</div>' +
    '<script>' +
    '(function(){' +
    'var url=' + jsUrl + ';' +
    // เด้งออก top-level เท่านั้น (URL สะอาด, ล็อกอินได้). ห้าม window.location เด้ง iframe ตัวเอง (framed=cookie พัง)
    'function topJump(){try{(window.top||window).location.replace(url);}catch(err){try{(window.top||window).location.href=url;}catch(e2){}}}' +
    // 1) ลองทันทีตอนโหลด (บาง in-app browser มี activation ติดมา → auto สำเร็จ)
    'topJump();' +
    // 2) ดักการแตะ/คลิก/กดปุ่มครั้งแรกที่ไหนก็ได้ = มี user-activation → เด้ง top สำเร็จ
    'var opt={once:true,capture:true};' +
    "['pointerdown','touchstart','click','keydown'].forEach(function(ev){document.addEventListener(ev,topJump,opt);});" +
    '})();' +
    '</script>' +
    '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('กำลังเข้าสู่ระบบใหม่...')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
