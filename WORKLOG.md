# Homework System — Next.js Edition (homework-next) — Worklog

> Team-standard worklog. One bullet per meaningful step, newest at the bottom.
> Format: `- <Agent> (<tool>): <action> <object>. <result>. <files>.`
> See PROJECT_PLAN.md for goal/stack/milestones.

## 2026-06-27

- Symboli Rudolf (decision): Trainer chose to rebuild the GAS homework app as Next.js + MySQL. Clarified: single user (Trainer's wife), not sold, no customer data → low-risk rebuild; replace GAS entirely but keep it as fallback until verified.
- Symboli Rudolf (Web/Bash): Confirmed hosting = Hostatom "Titan" + Plesk; Node.js 24.17.0, unlimited DB/subdomain, Redis, Git deploy. Verified Trainer already runs Next.js+Prisma+MySQL on same host (pr.thatnarai.net, code at /Applications/XAMPP/xamppfiles/htdocs/feed) — de-risks Next.js-on-Plesk.
- Symboli Rudolf (Bash/Read): Surveyed the feed reference project. Confirmed stack: Next 16.1.6 + React 19 + output:'standalone', Prisma provider="mysql", NextAuth v4 + prisma-adapter + bcryptjs. KEY: prisma generator binaryTargets includes debian-openssl-* (required to run Prisma on Plesk Linux). (PlanetScale/libSQL deps in package.json are unused leftovers.)
- Symboli Rudolf (Write): Phase 0 — created projects/homework-next/ + PROJECT_PLAN.md (locked stack, draft relational schema mapping GAS Sheet→MySQL, milestones M0-M7) + this WORKLOG.md.

- Symboli Rudolf (Bash): M1 done — scaffolded Next.js 16.2.9 + React 19.2.4 (TS, Tailwind, App Router, src/, standalone). next.config output:'standalone'+poweredByHeader:false. Installed Prisma 7.8.0; `prisma init --datasource-provider mysql` → generator provider="prisma-client" output="../src/generated/prisma", new prisma.config.ts, .env NOT auto-loaded.
- Symboli Rudolf (Web/Codex): Verified Prisma version question. Prisma 7 = WASM + driver adapters (no Rust binary → no binaryTargets/OpenSSL matching, good for unknown Plesk OS) but MySQL needs @prisma/adapter-mariadb. feed = Prisma 5.22.0 (PROVEN on host, binaryTargets debian-openssl-*), Prisma 7 never tried there (UNPROVEN).
- DECISION (Trainer): Prisma 7 + @prisma/adapter-mariadb ("try new"). FALLBACK if deploy fails = feed's Prisma 5.22 + binaryTargets recipe. Installed @prisma/adapter-mariadb@7.8.0 + mariadb@3.5.3.

- Symboli Rudolf (Write/Bash): M2 — wrote prisma/schema.prisma (User/Room/Student/Task/Score; Score has @@unique([studentId,taskId]), FK cascade). prisma.config.ts already had dotenv + datasource url (no edit needed). `prisma generate` OK (Prisma 7 client = pure TS at src/generated/prisma, NO Rust binary — good sign for Plesk).
- Symboli Rudolf (Bash): VERIFIED Prisma 7 works with MySQL. Started XAMPP (Trainer), MariaDB 10.4.28 on 127.0.0.1:3306. Created DB homework_dev (utf8mb4). Set local DATABASE_URL in .env (root no pw; .env is gitignored). `prisma db push` SUCCESS in 173ms — all 5 tables created with correct FK/unique/index. **Prisma 7 + mariadb proven locally.** M2 core done.

- Symboli Rudolf (Write/Bash): M2 DONE — created src/lib/prisma.ts (PrismaClient singleton via PrismaMariaDb adapter; constructor takes DATABASE_URL string directly per adapter d.ts) + scripts/test-db.ts smoke test. `npx tsx scripts/test-db.ts` PASSED: create→read→count→delete a Room, Thai text + emoji preserved (utf8mb4). **Prisma 7 runtime adapter path fully proven** — this is exactly what the deployed app uses. Whole Prisma 7 stack de-risked locally.

- Symboli Rudolf (Bash): git init (own repo, branch master), identity repo-local kanokkarn <unsojp777@gmail.com> (changeable). Added /src/generated to .gitignore (regen via prisma generate). Initial commit a884915 (25 files).
- Symboli Rudolf (Read/Write): M3 start — read Next 16 bundled docs (node_modules/next/dist/docs .../07-mutating-data.md) per AGENTS.md warning. Built first vertical slice = Room CRUD: src/lib/actions/rooms.ts (server actions createRoom/deleteRoom/renameRoom, "use server", revalidatePath) + src/app/page.tsx lobby (force-dynamic, lists rooms w/ counts, add/delete forms). `npm run build` PASSED (route / = ƒ dynamic, TS ok). Ran prod server, curl / = HTTP 200 with Thai heading rendered.
- KEY for M6 deploy: with output:'standalone', start command MUST be `node .next/standalone/server.js` (NOT `next start`). standalone server.js confirmed built.

### Next steps
- M3 continue: replicate the proven slice to Students, Tasks, Scores (server actions + pages). Room slice + UI test via real browser still pending (smoke test proved DB writes).
- M5 (later): NextAuth teacher login; then wire auth checks into every server action (TODOs already marked).

### Open questions
- Subdomain name (proposed homework.thatnarai.net)? SSH on Plesk: tried, "Permission denied" (likely shell not /bin/bash or wrong system-user pw) — deferred to M6.

## ========== CHECKPOINT (Trainer will /clear) — 2026-06-27 ==========
Current task: Rebuilding the GAS homework app as Next.js + MySQL in projects/homework-next/. Paused after M3 first slice.

State:
- Stack PROVEN locally: Next.js 16.2.9 + React 19 + Tailwind, output:'standalone'. Prisma 7.8 + MySQL via @prisma/adapter-mariadb. Schema = User/Room/Student/Task/Score (GAS Sheet→relational). `prisma db push` + runtime smoke test + `npm run build` + prod-server render ALL pass. Thai/emoji ok (utf8mb4).
- Done: M0 docs, M1 scaffold, M2 Prisma 7 (fully verified), M3 Room CRUD slice (server actions + lobby page, build+render verified). NOT yet UI-tested in a real browser.
- Git: own repo at projects/homework-next (branch master), 3 commits, tree CLEAN. Latest 62284e0. Identity repo-local kanokkarn <unsojp777@gmail.com> (changeable).
- Local dev: XAMPP MariaDB 10.4.28, DB homework_dev, DATABASE_URL in .env (gitignored). Must start XAMPP MySQL before `npm run dev`.
- Prisma 5 fallback recipe recorded if Prisma 7 fails on deploy (feed = Prisma 5.22 + binaryTargets debian-openssl-*).

Next steps (resume here):
1. M3 continue: replicate proven slice → Students, Tasks, Scores (server actions + per-room pages).
2. Optionally browser-test the Room slice (npm run dev → localhost:3000, add/delete room).
3. M4 port UI from GAS app; M5 NextAuth teacher login + wire auth into every server action (TODOs marked in rooms.ts); M6 deploy to Plesk subdomain (homework.thatnarai.net) — START CMD = `node .next/standalone/server.js`, build LOCALLY then git-push; M7 retire GAS (keep archived).

Open questions: subdomain name confirm; Plesk SSH access (got Permission denied — enable /bin/bash + set system-user pw, or ask Hostatom).

Reference: proven sibling app feed (pr.thatnarai.net) at /Applications/XAMPP/xamppfiles/htdocs/feed. Old GAS app at projects/homework (KEEP as live fallback, do not delete).
## ====================================================================

## 2026-06-27 (resume)

- Symboli Rudolf (Write/Bash): M3 CONTINUE — replicated proven Room slice to Students/Tasks/Scores. New server actions: src/lib/actions/students.ts (create/delete/rename), tasks.ts (create/delete/rename, auto taskIndex), scores.ts (setScore = upsert on compound key studentId_taskId, value=0 means not-done). New page src/app/rooms/[id]/page.tsx (force-dynamic, Next16 `params: Promise` + await): add/delete students+tasks + editable score grid (Enter to save each cell). Lobby rows now Link→/rooms/[id]. `npm run build` PASSED — route /rooms/[id]=ƒ dynamic, TS ok (confirms studentId_taskId key valid). Committed 8e6c943.

### Next steps
- Browser-test the full flow (npm run dev → add room → open room → add students/tasks → type scores). DB-write path proven by build typecheck; live UI click-through still pending.
- M4: port GAS app UI styling/labels; M5: NextAuth teacher login + wire auth into every action (TODO(M5) markers present in all action files).

- Symboli Rudolf (Drive MCP/Python/Prisma): DATA IMPORT — Trainer shared real GAS sheet (id 1WJMvsvPHqZynXx0mgbErCjLHHA6TiKDhxdopcnWeYkY, "ระบบเก็บคะแนนนักเรียน", owner krootos@tnw.ac.th). Read via Google Drive MCP (connected acct can access shared file). Downloaded as .xlsx (base64 too big for context → saved to scratch/source.xlsx), parsed all 15 sheets w/ openpyxl → scratch/sheets.json (2 meta sheets _LearnTrackingConfig/_LearnTrackingActivity + 13 room sheets). Sheet layout: col0=เลขที่, col1=รหัสนักเรียน, col2=ชื่อ-นามสกุล, col3..=task headers, then รวม + ชื่อเล่น. Added Student.code (รหัสนักเรียน) to schema (nullable, db push). scripts/import-sheet.ts (idempotent: wipe+reinsert; only non-zero score cells). Imported 13 rooms/124 tasks/477 students/1082 scores. Spot-check PASS (เด็กชายณัฐกิตติ์/โฟล์ค/code16445 = 5+10=15, matches source). scratch/ gitignored (student PII). Commit 3df0a4c. NOTE: tsx scripts need `import "dotenv/config"` — tsx doesn't auto-load .env (adapter crashes on undefined DATABASE_URL).

### Next steps
- Browser-test full flow with REAL data (npm run dev → localhost:3000 → open a room → see students/scores grid).
- M4 UI port; M5 NextAuth + auth guards.

- TEAM (Rudolf orchestrating): M4 UI port — split by file so no conflicts, full team engaged. Tokai Teio (codex, edits files直接) → src/app/rooms/[id]/page.tsx (student card grid: rank MVP/Top/Player, total, nickname) + new StudentScoreModal.tsx (client, per-student score entry reusing setScore). Oguri Cap (agy, returned code) → src/app/page.tsx lobby (gamified room cards: gradient icon chip, Progress %, ✅เริ่มส่ง/⏳ยังไม่ส่ง). Mejiro McQueen (glm, returned code) → layout.tsx + globals.css (Noto Sans Thai font + fixed gradient bg, light-only; Rudolf FIXED bug `weights`→`weight` for next/font). Twin Turbo (gemini, returned code) → src/lib/roomThemes.ts (8 gradient themes + themeFor). Rudolf integrated all, `npm run build` PASS, both pages render-verified (HTTP 200, all UI markers present, nickname now shown). Commit 8b6fa8a. Gold Ship (kimi) not engaged — kimi CLI not installed on this Mac.
- NOTE (corrected): team wrappers DO exist on this Mac at ~/my-agent-team/*.sh (codex-run/agy-run/gemini-run + glm-run.py). Prior assumption they were absent was wrong; Trainer corrected it. Delegate heavy work across team by default. Only codex+agy edit files; gemini/glm return text → Rudolf writes files.

### Next steps
- Optional: browser screenshot review by Trainer; tweak visuals.
- M5: NextAuth teacher login + wire auth guards into all server actions (TODO(M5) markers present).

- Symboli Rudolf (port+verify): M4 LOBBY made pixel-faithful to GAS. Built a true reference by rendering the ORIGINAL GAS files (index.html shell + CSS.html + real renderLobby/renderLeaderboard from JS.html) with OUR data mocked (scratch/gas-mock.html via scratch/dump.ts → scratch/gas-real.png). Then matched src/app/page.tsx 1:1: 3-col lobby-shell (left rail + content + right leaderboard widget), real card markup, champion card (#leader-top: bouncing 👑, % overlaid bar), colored rank rows (gold/silver/bronze/cream rowStyles). Copied GAS CSS classes verbatim into globals.css; added Font Awesome 6.5.2 CDN in layout. Screenshot-verified (scratch/shot-lobby3.png ≈ gas-real.png). Commits a962868, 8a66fe8. Verify method = Chrome headless --screenshot (no Playwright needed).

### Next steps
- Room/grading screen still = Teio's reinterpretation; port renderStudentGrid + openStudentModal the same faithful way (build GAS mock ref → match → screenshot-verify).
- M5: NextAuth teacher login + auth guards.

- PIVOT (Trainer-directed): stop reimplementing GAS UI in React; SERVE THE REAL GAS UI on MySQL. Teio (codex) built it: public/legacy/index.html = original index.html + CSS.html + JS.html inlined VERBATIM; google.script.run replaced by a shim -> POST /api/gas {fn,args}; license bypassed. src/app/api/gas/route.ts = Prisma-backed GAS backend fns (sheetName=Room.id). / redirects to /legacy/index.html. Rudolf verified: lobby screenshot (scratch/shot-legacy.png) matches GAS; fetchStudentData = 30 students/10 tasks, โฟล์ค code16445 scores [5,10,0..]=15 (exact); updateStudentScores save+readback ok. Commit 84c62ff. KEY: GAS 'submitted' = ALL tasks complete (Core.getRoomStats), so rooms show low % — that is the faithful/real number (my earlier React used >=1-task and was wrong). Obsolete React pages (rooms/[id], StudentScoreModal, roomThemes) now unused but harmless; can delete later.

### Next steps
- In-browser click test of room grid + score modal (verified via API, not yet via real click). Test admin/teacher mode (toggleAdminLogin) — currently no password backend (checkTeacherPassword stubbed) -> wire a simple teacher login (M5).
- Decide cleanup of dead React pages. Image-upload fns (uploadTaskImage etc.) still stubbed — implement if the wife uses worksheet images.

- Symboli Rudolf (ROOT-CAUSE FIX): reverted verbatim-GAS pivot back to React (Trainer wants clean React, RSC+server actions, that LOOKS like GAS). Found the real bug behind every "not identical" report: **Tailwind v4 silently dropped hand-written custom classes** (.lobby-shell/.left-rail/.rail-btn/.content-topbar/...) from globals.css — they were absent from served _next CSS (body{} survived, deceptive). So the floating shell + rail panel + active highlights never rendered. Fix: moved them to src/app/gas-theme.css (plain CSS, no Tailwind) + import in layout.tsx. Verified by headless-Chrome screenshot + PIL pixel-diff vs GAS reference (scratch/gas-real.png): mean diff 22.8 -> 3.5 (near-identical). Commit ed1eb64. Removed public/legacy + src/app/api/gas (recoverable from 84c62ff). Memory saved: reference-tailwind4-custom-css, feedback-ui-fidelity-verify.

### Next steps (agreed plan)
- Lobby is now pixel-faithful. Next: ROOM/grading screen — refactor renderStudentGrid + openStudentModal (GAS) into clean React (RSC + server actions for setScore/createStudent/...), screenshot+pixel-diff verify before moving on.
- Then M5 teacher login. Clean up obsolete files (rooms/[id] old, roomThemes, StudentScoreModal) when room screen is rebuilt.

## 2026-06-27 (autonomous run — Trainer away)
- POLICY CHANGE (Trainer via คุณเติ้ล + Rudolf live A/B): Mejiro/GLM-5.2 now PRIMARY for scoped code (on par w/ Teio on SWE-bench Pro, ~1/6 cost); Teio reserved for big multi-file refactors. Recorded in governance/team.md + memory policy-mejiro-primary-coder.
- M4e room actions: Mejiro wrote updateRoomDetails + duplicateRoom in src/lib/actions/rooms.ts (Rudolf fixed slug prefix room-). Build green. Commit 183bf3a (bundled w/ Teio's teacher-gating + action-sheet ClassroomManagerClient = M4c task mgr + M4d add/edit/delete student UI).
- M4f Reports: integrated Oguri's draft -> src/app/reports/page.tsx (RSC, summary cards + per-room table + CSV/print; fixed React.CSSProperties import). Added .circle-chart + @media print to gas-theme.css. Verified HTTP 200 + 477 students real data. Commit 3fb0ef9.
- M4e UI in progress: added /reports link to lobby left-rail; added edit/duplicate/delete button group to teacher room cards (page.tsx); duplicateRoom wired as plain form. RoomEditModal.tsx delegated to Mejiro (bg) — pending integration + build.

### State / Next steps
- AWAITING Mejiro RoomEditModal.tsx -> write file -> npm run build -> screenshot-verify lobby teacher controls -> commit M4e.
- Then remaining: M4g QR codes (if feasible), M4h quick-grade/status card. M4b/M4c/M4d already covered by Teio's ClassroomManagerClient (UI present; runtime click-test still pending).
- DEPLOY reminder: build LOCALLY, start node .next/standalone/server.js; keep GAS app (projects/homework) as fallback.

## 2026-06-27 (cont) — FULL-APP FIDELITY AUDIT requested
- Trainer: "ยังมีปัญหาอีกเยอะที่ยังไม่เหมือนเดิม" -> wants Rudolf to audit EVERY screen vs GAS original across the whole app. Chose: Rudolf self-audits all pages.
- Done this session before audit: M4e (room edit/dup + RoomEditModal), M4f (reports), /reports rail link, leaderboard spacing -> space-y-3 (12px), teacher login verified (4-way test pass), teacher acct = krutaktan/taktan888 (test kru deleted), Mejiro budget-watch in glm-run.py (warn 9999N). Heads: 75b... build green.
- AUDIT PLAN: compare React (src/app/*) vs GAS source (../homework/src/{index.html,CSS.html,JS.html} render fns) screen-by-screen: (1) Lobby (2) Room/grading + score modal (3) Reports. Reference render exists: scratch/gas-real.png (lobby). Dev server :3000 up; teacher cookie mintable via SESSION_SECRET in .env. Chrome headless for screenshots.
- NEXT: dispatch audit -> produce punch list -> fix top items -> screenshot-verify -> commit per screen.

## 2026-06-27 (cont) — Developer Modal Refactor & Alignment (Oguri Cap)
- **Developer Modal RSC Refactor & Bugfix**:
  - Refactored `DeveloperModal.tsx` into a Server Component (RSC) to serve static developer profile details directly from the server.
  - Extracted state management to Client Component `DeveloperModalClient.tsx` (handles overlay toggle) and layout to `DeveloperModalContent.tsx`.
  - Added `"use client";` to the top of `DeveloperModalContent.tsx` to safely handle image error triggers (`onError` fallback to Google Drive).
  - Restored original React style (from `22.11.18.png` mock with purple gradient details, white cards with borders, rounded photos) instead of the flat GAS HTML styling.
  - Adjusted `layout.tsx` footer `z-index` from `z-10` to `z-30` so that the modal overlay sits correctly in front of the lobby's `relative z-20` Leaderboard title button.
  - Verified project build compiles cleanly (`npm run build` PASS).

- Oguri Cap (Edit): Wrapped the Reports sidebar link (`/reports` with `fa-chart-simple` icon) in an `isTeacher` session check in [page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/page.tsx) so it is hidden in normal mode and only visible in Teacher mode, matching the original GAS behavior. Verified `npm run build` passes.
- Oguri Cap (Create & Edit): Built [LeftRail.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/LeftRail.tsx) client component to make sidebar buttons fully interactive to match original GAS behavior:
  - **คู่มือการใช้งาน** (Guide): Opens a modal with original guide text.
  - **เข้าสู่โหมดคุณครู** (Teacher Mode): Programmatically clicks the global authentication button to toggle login/logout.
  - **ผู้พัฒนา** (Developer): Reuses `DeveloperModalClient` to open the developer info modal.
  - Integrated [LeftRail.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/LeftRail.tsx) in [page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/page.tsx). Verified `npm run build` passes.

- Oguri Cap (Edit): Restyled the login modal in [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx) to match the layout and design of the original GAS `admin-modal` screen:
  - Aligned title icon (`fa-chalkboard-user text-blue-500`) and subheadings.
  - Formatted the inputs with exact styles (focus ring, blue borders).
  - Added visibility toggle (eye icon) for password field via local state (`showPassword`).
  - Styled cancel/login footer buttons and checkbox exactly to match.
  - Kept both `username` and `password` fields for Next.js database auth compatibility. Verified `npm run build` passes.

- Oguri Cap (Create & Edit): Ported and integrated the animated gaming rocket loader from original GAS app:
  - Appended rocket animations keyframes (`rocket-vibration`, `rocket-float`, `engine-glow`, `dot-blink`) and classes (`.animate-rocket`, `.rocket-engine`, `.loading-dot`) to [gas-theme.css](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/gas-theme.css).
  - Created [Loader.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/Loader.tsx) client component containing the rocket loading UI markup, exposing a global `window.toggleLoader(show)` utility with tuned show/hide delays (`LOADER_SHOW_DELAY_MS` = 50, `LOADER_MIN_VISIBLE_MS` = 2500) to ensure the loader shows up instantly and stays visible long enough to be visible during fast local transitions.
  - Created [loading.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/loading.tsx) root-level loading boundary to automatically display the loader during Next.js routing transitions.
  - Integrated and rendered `<Loader />` inside `RootLayout` in [layout.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/layout.tsx) for global client-side support. Verified `npm run build` passes.

- Oguri Cap (Edit): Added `formatRoomName` helper in [page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/page.tsx) to split the room name at the first space (which always follows the subject name) and render the class/room code on a new line using `<br />`, ensuring clean layout without awkward wrapping on room cards. Verified `npm run build` passes.

- Oguri Cap (Create & Edit): Ported and integrated the Toast notification alert system from original GAS app:
  - Appended toast styling classes (`.toast`, `.toast-icon`, `.toast.success`, `.toast.error`, `.toast.info`, `.toast-close`) to [gas-theme.css](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/gas-theme.css).
  - Created [ToastContainer.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/ToastContainer.tsx) component rendering the `#toast-stack` container, managing toast states (success, error, info), auto-dismissing after 3 seconds, and registering a global `window.notify(msg, type)` function exactly matching GAS API.
  - Integrated `<ToastContainer />` inside `RootLayout` in [layout.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/layout.tsx). Verified `npm run build` passes.
  - Added calls to `window.notify()` inside [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx) to trigger toast alerts exactly like GAS: "เข้าสู่โหมดคุณครูแล้ว" (success) on successful login, the error message (error) on failed login, and "ออกจากโหมดคุณครูแล้ว" (info) on logout. Verified `npm run build` passes.
  - Implemented a logout confirmation modal inside [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx) matching the styling and content of `logout-confirm-modal` in GAS, preventing direct logout and requiring explicit confirmation. Verified `npm run build` passes.
  - Configured conditional autofocus in [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx) to automatically focus the password input instead of the username input when the default username ("krutaktan") is already pre-filled. Verified `npm run build` passes.
  - Implemented the "Remember login for 10 minutes" functionality:
    - Added `name="remember"` to the checkbox in [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx).
    - Updated `login` action in [auth.ts](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/lib/actions/auth.ts) to parse the `remember` checkbox and pass it.
    - Updated `createSession` in [auth.ts](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/lib/auth.ts) to set a cookie with a 10-minute `maxAge` if the checkbox is checked, and session-only (no maxAge) if unchecked. Verified `npm run build` passes.
  - Resolved browser password manager compatibility issues:
    - Updated [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx) to render the login modal in the DOM continuously (hidden/shown using transition classes `opacity-0 pointer-events-none -z-50` vs `opacity-100 pointer-events-auto z-[1000002]`) rather than mounting/unmounting dynamically or using `display: none` (`hidden`), ensuring browsers can detect and autofill credentials on initial page load.
    - Appended `autoComplete="username"` and `autoComplete="current-password"` to the username/password input fields to enable secure browser-based credential saving and automatic autofill. Verified `npm run build` passes.
  - Implemented automatic password pre-fill using `localStorage` matching GAS logic:
    - Updated [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx) to save the password and timestamp (`LT_ADMIN_PASS_REMEMBER`, `LT_ADMIN_PASS_TIME`) in the `useActionState` callback *only* upon a successful server login response, ensuring invalid/incorrect passwords are never stored.
    - Added a client-side `useEffect` hook to check the timestamp on mount and automatically pre-fill the password state if the stored password is less than 10 minutes old. Verified `npm run build` passes.
  - Set `secure: false` in [auth.ts](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/lib/auth.ts) for the session cookie to ensure the browser does not reject the cookie on local HTTP (`http://localhost:3000`) and private networks in production builds. Verified `npm run build` passes.
  - Removed `revalidatePath` from `login` and `logout` server actions in [auth.ts](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/lib/actions/auth.ts) to resolve a Next.js Server Action issue where `revalidatePath` breaks/discards the `Set-Cookie` header in the action response, relying instead on client-side `router.refresh()` to reload page data. Verified `npm run build` passes.
  - Configured inputs in [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx) with explicit `onKeyDown` handlers checking for the "Enter" key and programmatically calling `form.requestSubmit()`, allowing users to press Enter in either input to submit the form instead of manually clicking the button. Verified `npm run build` passes.
  - Increased `z-index` of the toast stack in [ToastContainer.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/ToastContainer.tsx) from `z-[1000000]` to `z-[9999999]` to ensure notifications are always layered on top of the modal overlay backdrops. Verified `npm run build` passes.
  - Refactored login modal mounting and autofill support in [TeacherAuthChip.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/TeacherAuthChip.tsx):
    - Reverted to conditional React mounting `{open && (...)}` for the interactive login modal to ensure the backdrop and form elements are physically destroyed when closed, eliminating fading bugs and stuck mouse-interaction overlays after form submissions.
    - Rendered an invisible static `<form>` containing matching username/password inputs in the DOM at all times (`w-0 h-0 overflow-hidden absolute pointer-events-none`) for secure credentials managers (such as Apple Keychain/Google Autofill) to discover and autofill successfully. Verified `npm run build` passes.
  - Resolved classroom card edit modal positioning glitch:
    - Wrapped the edit modal card in [RoomEditModal.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomEditModal.tsx) using a React Portal (`createPortal`) targeting `document.body`. This decouples the overlay rendering context from the parent card's viewport (which has hover scale and translate transforms that constrain fixed elements), completely preventing layout squishing, screen glitches, and flashing when opening the classroom edit form. Verified `npm run build` passes.
  - Implemented GAS-identical classroom emoji picker grid in [RoomEditModal.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomEditModal.tsx):
    - Added the predefined `ROOM_ICONS` array matching the original GAS project dataset of 59 emojis.
    - Updated [page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/page.tsx) to pass the list of used classroom emojis.
    - Filtered the emoji grid to only display unused icons (while retaining the current room's active emoji), rendering selectable emoji buttons inside a scrollable grid with a status hint. Checked values bind to a hidden form input. Verified `npm run build` passes.
  - Replaced inline classroom creation card with a modal-based emoji picker:
    - Created [RoomCreateCard.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomCreateCard.tsx) to act as the client-side button card for creating rooms.
    - Designed the create modal to use the exact same aesthetic and features as the edit modal, using React Portals to render on `document.body` and displaying the 59 `ROOM_ICONS` dataset filtered to exclude already used emojis.
    - Updated [page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/page.tsx) to mount `<RoomCreateCard usedIcons={roomStats.map((r) => r.icon)} />` inside the dashboard when the teacher role is active. Verified `npm run build` passes.
  - Implemented delete and duplicate classroom confirmation modal popups matching GAS:
    - Created [RoomActionButtons.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomActionButtons.tsx) client component to host the duplicate and delete icon buttons.
    - Added beautiful confirm modal popups (rendered using React Portals) for both actions with customizable text. When confirmed, they invoke the Next.js Server Actions `deleteRoom` and `duplicateRoom` programmatically.
    - Replaced the direct `<form>` action submissions in [page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/page.tsx) with the new `<RoomActionButtons />` tag. Verified `npm run build` passes.
  - Upgraded classroom duplication process to support detailed GAS copying parameters:
    - Updated [RoomActionButtons.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomActionButtons.tsx) to render a detailed option-selection modal displaying checkbox options: "คัดลอกรายชื่อนักเรียน", "คัดลอกคะแนนด้วย", "คัดลอกชื่องาน/รูปงานประกอบ", and text input for the new room's name. Implemented automatic checkbox validation linking students with scores.
    - Updated `duplicateRoom` Server Action in [rooms.ts](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/lib/actions/rooms.ts) to parse these options, duplicate the room, and conditionally copy the list of students, task assignments, and student score values to the newly created database target. Verified `npm run build` passes.
    - Added absolute top-right close (`✕`) buttons to [RoomEditModal.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomEditModal.tsx), [RoomCreateCard.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomCreateCard.tsx), and both the duplicate and delete confirmation modals in [RoomActionButtons.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomActionButtons.tsx), ensuring users can close modals by clicking the standard 'X' icon. Verified `npm run build` passes.
  - Implemented Drag and Drop classroom card sorting in the dashboard:
    - Created [RoomsGrid.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/RoomsGrid.tsx) client component to wrap the classroom cards grid.
    - Used native HTML5 Drag and Drop API to allow teachers to drag and reorder classroom cards. Configured grab cursors, opacity animations (`opacity-30`), and border highlight cues on drag hover.
    - Added `reorderRooms` Server Action in [rooms.ts](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/lib/actions/rooms.ts) to receive the list of sorted classroom IDs and update `sortOrder` index variables in the database.
    - Integrated `<RoomsGrid />` inside [page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/page.tsx). Verified `npm run build` passes.

> [!WARNING]
> **UNRESOLVED ISSUE (Suspended as per Trainer's request):**
> The "Remember login for 10 minutes" feature does not persist the login state reliably upon reloading or closing/re-opening the tab in some browser environments. Despite disabling cookie `secure` flags and client-side transition workarounds, the browser still fails to autofill or preserve the session consistently. This task has been put on hold to avoid further resource wastage.


## 2026-06-28

- Rudolf (Edit): Fixed LeftRail logout icon not changing on teacher login — conditional `fa-right-from-bracket` vs `fa-user-shield`.
- Rudolf (Edit): Fixed rail danger color — added `.rail-btn.rail-danger` CSS class (Tailwind can't dynamic-class); then switched to inner `bg-rose-100` circle span for full-circle display.
- Rudolf (CSS): Fixed `global-auth-chip` collapsed state — 44×44px perfect circle, `padding:0`, `justify-content:center`; expanded state 230px with proper padding.
- Rudolf (Write): Created `AddRoomModal.tsx` — singleton modal (dispatches `open-add-room-modal` event), 59-emoji icon picker matching GAS ROOM_ICONS, filters used icons.
- Rudolf (Edit): `TopbarActions.tsx` — added `fa-circle-plus` button (teacher only), removed duplicate `fa-user-shield`.
- Rudolf (Edit): `LeftRail.tsx` — added `fa-circle-plus` (teacher only), reordered buttons, swapped ผู้พัฒนา↔ออกจากระบบ.
- Rudolf (Edit): `reports/page.tsx` — extracted `<script dangerouslySetInnerHTML>` to `ReportsClientBridge.tsx` (Client Component); fixes React RSC console error.
- Rudolf (Edit): `rooms/[id]/page.tsx` — removed "กลับหน้าโฮม" text from topbar.
- Rudolf (Write+Edit): Full action sheet rebuild — 5 buttons (จัดการงาน, เลือกหลายคน, QR ทั้งห้อง, เพิ่มนักเรียน, เพิ่มหลายคน) matching GAS order; select mode via custom events; bulk add CSV modal; QR codes via `qrcode` npm.
- Rudolf (Edit): `students.ts` — added `createStudentsBulk` and `deleteStudents` Server Actions (both guarded with `requireTeacher()`).
- Rudolf (Edit): Action sheet `z-[1000002]` — above TeacherAuthChip so logout chip hides behind panel when open.
- Commit: 14a964f — feat: action sheet full feature set + UI polish pass

## 2026-06-28 (ช่วงดึก — session นี้)

- Rudolf (Edit/tasks.ts): copyTasksFromRoom เปลี่ยน createMany → $transaction + return created tasks → modal ไม่ปิดหลัง copy แสดงรายการงานที่คัดลอกมาทันที
- Rudolf (Edit/tasks.ts): saveTasksBatch เปลี่ยน Promise.all → $transaction แก้ EPIPE error
- Rudolf (Edit/tasks.ts): เพิ่ม deleteTasksBulk server action (deleteMany by ids)
- Rudolf (Edit/ClassroomManagerClient.tsx): Task modal เพิ่ม bulk-select mode — ปุ่ม "เลือกลบ", checkbox ต่อ row, select-all, ปุ่ม "ลบที่เลือก (N)" สีแดงใน footer; optimistic update localTasks
- Rudolf (Edit/next.config.ts): เพิ่ม serverActions.bodySizeLimit: "10mb" แก้ Body exceeded 1MB error
- Rudolf (Edit/StudentScoreModal.tsx): non-teacher view เปลี่ยนเป็น split panel ส่งแล้ว/ค้างส่ง; แสดงคะแนนข้าง task ที่ส่งแล้ว; ปุ่ม "ใบงาน" ทั้งสองฝั่ง
- Rudolf (Edit/StudentScoreModal.tsx): lightbox ดูภาพใบงานใหญ่ + ปุ่มดาวน์โหลด + ปุ่มพิมพ์ (เขียน HTML+onload ก่อน print ไม่ขาวโพลน)
- Rudolf (Edit/TeacherAuthChip.tsx): auto-login on mount จาก localStorage ถ้า remember ยังไม่หมด 10 นาที; logout ไม่ล้าง localStorage → เปิดใหม่ password ยัง pre-fill
- Commit: f8affa7 — feat: task bulk-delete, copy-from-room fix, student view, auth remember

## ========== CHECKPOINT (Trainer พักผ่อน) — 2026-06-28 ==========
Current task: homework-next project (projects/homework-next/, served :3000)

State:
- Build ✅ clean (Next.js 16.2.9 Turbopack)
- Features completed this session: bulk-delete tasks, copy-from-room stays open, student non-teacher split-panel view (ส่งแล้ว/ค้างส่ง + คะแนน + lightbox ใบงาน + print), auth remember-10min auto-login
- commit f8affa7 on branch master

Known issues / deferred:
- aria-hidden warning บน hidden autofill form (harmless, ควรเปลี่ยน aria-hidden → inert)

Next steps (เมื่อ Trainer กลับมา):
- ทดสอบ remember-login ใน production (Hostatom/Plesk) ว่า cookie persist ได้ไหม
- Deploy ถ้า Trainer พร้อม (build local → node .next/standalone/server.js)

## 2026-06-29

- Tokai Teio (GAS Pull/Edit/Build): Pulled GAS Cloud deployed version `V43` into `../homework/src` with `clasp pull --versionNumber 43` after backing up the previous local source to `../homework/scratch/pre-pull-v43-20260629-203934`. Confirmed V43 QR flow: `mode=grade` routes to `openQuickAuthForGrade()` and requires teacher login, while `mode=view` routes to `renderStudentStatusCard()` for the student-facing status interface. Updated `homework-next` to match: the "สร้าง QR ให้คะแนนด่วน" button opens `QuickGradeQrModal.tsx` with two QR codes, `/grade/<roomId>/<studentId>` for teachers and `/view/<roomId>/<studentId>` for students. Added the quick-grade route and student-status route; teacher quick grade opens the teacher auth modal when not logged in. `npm run build` PASSED.
- Oguri Cap (Edit/Build): Removed the "สร้าง QR ให้คะแนนด่วน" button and its QuickGradeQrModal component from StudentScoreModal.tsx to save space. Removed the redundant "ปิด" button when isTeacher is false, hiding the footer entirely in student view. Re-positioned TeacherAuthChip to fixed right-3 bottom-4 (desktop md:top-3) to prevent overlapping with back/header buttons on mobile. `npm run build` PASSED.


- Symboli Rudolf (Edit/Build): Reworked the "QR ทั้งห้องเรียน" print feature across this session. Iterated print layout: landscape→portrait (GAS V43 parity)→back to portrait with GAS print CSS (img{max-height:52mm;object-fit:contain} 2-col grid = 5 students/A4)→tuned to 48mm/gap 3mm. Then per Trainer request merged teacher+student QR into ONE card (1 card=1 student → 10 students/A4). Replaced canvas rendering with scalable SVG: created `src/lib/dualQrCard.ts` (dualQrCardSvg + dualQrPrintDocument) matching Trainer's reference mockup — header gradient (sky-lavender) with book badge + sparkles, name + ชื่อเล่น/ห้อง line, paper-airplane decoration, เลขที่/รหัส pill (top-right, star removed), teacher panel (purple) + student panel (green) each with dashed labels/sparkles/leaf sprigs, footer pill. Lightened all gradients twice to save printer ink (near-white tints; QR kept navy for scannability). Removed unused canvas generateDualQrDataUrl + loadImage from generatePremiumQr.ts. Changed print trigger from window.open (visible preview tab) to a hidden iframe so the print dialog opens directly (auto-cleanup on afterprint). Print doc loads Google Fonts Noto Sans Thai. `npx tsc --noEmit` PASSED. Files: src/lib/dualQrCard.ts (new), src/app/rooms/[id]/ClassroomManagerClient.tsx, src/lib/generatePremiumQr.ts. Prior commits this session: da459ff (portrait cards + TeacherAuthChip mobile + rose cancel buttons), 61cd5e6 (compact print — superseded), c64f8bd (portrait print CSS).

## 2026-06-29 — migrated from central WORKLOG
- Symboli Rudolf (Claude): added "ใบงาน" worksheet button to TEACHER view rows in StudentScoreModal.tsx (shows when task.imageUrl, opens existing lightbox). CODE BY MEJIRO (GLM-5.2, k1 217N) — first live delegated-coding test, output spec-exact. Rudolf integrated + tsc --noEmit passed. NOT yet committed.
  - Open/next: ใบงาน teacher-view button NOT committed — verify in browser + commit when ready.

## 2026-06-30
- Symboli Rudolf (Claude): Added real favicon (replaced default Next.js logo). Designed app-themed icon — white checkmark + amber star on indigo gradient rounded-square (matches app accent น้ำเงิน/indigo + amber #fbbf24). Wrote src/app/icon.svg (scalable, used by modern browsers) + regenerated src/app/favicon.ico as 6-size multi-res ICO (16/32/48/64/128/256) via Pillow supersample-x4. `npm run build` PASSED — Next emits /favicon.ico + /icon.svg routes, no conflict; both serve 200, `<link rel="icon">` injected. NOT yet committed.
- Symboli Rudolf (Claude): De-hardcoded teacher username (was "krutaktan" in 3 spots in TeacherAuthChip.tsx). Per Trainer: tie username to the "จำการเข้าสู่ระบบ 10 นาที" checkbox — remember BOTH username+password (new localStorage key LT_ADMIN_USER_REMEMBER), auto-login with the saved username, clear BOTH when the 10-min window expires (or remember unchecked). Username field now controlled+empty by default (pre-filled only from remembered value); autofocus username when empty else password. Supports other/renamed teacher accounts now. `npm run build` PASSED, no krutaktan left in src. NOT yet committed.
- Symboli Rudolf (Claude): Fixed login pre-filling username+password even when "จำ 10 นาที" unchecked — root cause was BROWSER autofill (Chrome saved creds), not our localStorage. Removed the hidden credential-autosave form (which invited browser save/fill AND was the source of the deferred aria-hidden warning). Set autoComplete: form="off", username="off", password="new-password" (strongest Chrome don't-autofill signal). Now only our 10-min remember logic pre-fills. `npm run build` PASSED. NOT yet committed.
- Symboli Rudolf (Claude): Chrome STILL autofilled login despite autoComplete (Chrome ignores it on known login forms). Stronger fix = readOnly-until-focus: new state fieldsLocked (true on modal open), inputs readOnly={fieldsLocked} + onFocus unlock, removed autoFocus (it would unlock instantly). Chrome won't autofill readOnly fields on load; our remember-logic pre-fill still works (sets state, not DOM). Also: logout now fully forgets — clears LT_ADMIN_USER/PASS_REMEMBER + PASS_TIME and resets username/password/remember state. `npm run build` PASSED. NOT yet committed.
- Symboli Rudolf (Claude): Redesigned "Remember me" to the standard/OWASP cookie pattern (Trainer chose this over the localStorage hack). REMOVED all client-side credential storage from TeacherAuthChip.tsx (LT_ADMIN_USER/PASS_REMEMBER + PASS_TIME), client auto-login, and the readOnly-autofill-lock — these were a security anti-pattern (raw password in localStorage, JS-readable). Now: httpOnly session cookie is the single source of truth (getSession server-side -> isTeacher). "จำการเข้าสู่ระบบไว้ (7 วัน)" checkbox only controls cookie lifetime: checked => persistent maxAge=7d, unchecked => session cookie (no maxAge, dies on browser close). Login form inputs are plain/uncontrolled with standard autoComplete=username/current-password so the BROWSER password manager handles save+prefill. Logout destroys the cookie (remember-me does not survive explicit logout). auth.ts: REMEMBER_AGE=7d / SESSION_AGE=12h, maxAge set only when remember. Backups: TeacherAuthChip.tsx.bak + auth.ts.bak in scratchpad. `npm run build` PASSED, no localStorage in src. Ref: OWASP Session Management Cheat Sheet. NOT yet committed.
- Symboli Rudolf (Claude) + Mejiro (GLM-5.2): Added "trusted device" persistent-login feature (Trainer's request: register frequent devices, auto-login without password). Design = OWASP-style selector:validator token in httpOnly cookie (NOT localStorage), DB stores only sha256(validator); rotated each use; 90-day expiry; revocable. Rudolf built the critical core (prisma TrustedDevice model + db push; auth.ts session now carries userId; login passes user.id; logout sets session-scoped pause cookie so logout = out-now but device still trusted on next browser open). Mejiro drafted the bulk (device helpers + server actions + client components) per Rudolf's tight spec; Rudolf assembled + verified + fixed (timingSafeEqual compare, ownership checks on revoke, border-slate-150→200). Files: src/lib/device.ts (cookie/token helpers), src/lib/actions/device.ts (registerDevice/tryDeviceLogin/listDevices/revokeDevice), src/app/DeviceAutoLogin.tsx (guest mount → silent auto-login), src/app/DeviceManagerModal.tsx (register/list/revoke UI, opened via open-device-manager event), wired into layout + LeftRail + TopbarActions (fa-shield-halved, teacher only). `npm run build` PASSED; MySQL TrustedDevice table verified (selector UNIQUE, userId index). NOT yet committed. Tested DB schema only; full cookie flow pending browser test.
- Symboli Rudolf (Claude): Migrated real data from Google Sheet (GAS source "ระบบเก็บคะแนนนักเรียน", id 1WJMvsvPHqZynXx0mgbErCjLHHA6TiKDhxdopcnWeYkY) into homework_dev. Pulled via Google Drive MCP export→xlsx, parsed with openpyxl (ground-truth values + correct emoji icons; read_file_content had mojibake). Structure: _LearnTrackingConfig index tab (icons) + 14 room tabs (เลขที่|รหัสนักเรียน|ชื่อ-นามสกุล|<tasks>|รวม|ชื่อเล่น). Backed up DB first → scratch/homework_dev_backup_20260630_123637.sql (480KB). Full reload in a transaction (DELETE Score/Task/Student/Room, keep User; 1811 statements, app-generated opaque ids, slug=room-<hex8>, only value>0 scores stored). Verified: 14 rooms / 507 students / 134 tasks / 1149 scores — matches Sheet; spot-check ป.4-MEP #1 โฟล์ค total=15 OK. Rollback = restore the .sql backup.
- Symboli Rudolf (Claude): Migrated ใบงาน worksheet images (Task.imageUrl) — these live in GAS Script Properties (LT_TASK_ASSETS_<room>), NOT the sheet, so the xlsx import missed them. Had Trainer run a one-off dumpTaskAssets() GAS fn that wrote all LT_TASK_ASSETS_* into a _TaskAssetsDump sheet tab; re-exported xlsx, parsed it (10 rooms, 22 task-images). Extracted Drive file ids, normalized every URL to https://lh3.googleusercontent.com/d/<id>=s2000, UPDATE Task SET imageUrl matched by room name + trimmed task name (22/22 matched, 0 skipped). Verified one URL loads: HTTP 200 image/jpeg 187KB (Drive files already shared public). Trainer can delete the _TaskAssetsDump tab now. NOT committed.
- Symboli Rudolf (Claude): StudentScoreModal responsive width — max-w-md → md:max-w-3xl lg:max-w-5xl so ส่งแล้ว/ค้างส่ง panels are wide on iPad/desktop and task names mostly stay on one line. Also fixed student code ".0" suffix bug (openpyxl read codes as floats during the sheet import) — UPDATE Student stripped trailing ".0" on 507 rows (e.g. 17575.0 → 17575). `npm run build` PASSED. NOT committed.
- Tokai Teio (Codex) + Rudolf: Responsive sweep of ALL popups/modals (Rudolf dispatched, Teio executed + built). Mobile unchanged; added md:/lg: width variants per tier — content modals widen (StudentScoreModal lg:max-w-5xl, ClassroomManagerClient task-manager lg:max-w-5xl, image/QR lg:max-w-4xl, QuickGradeQrModal lg:max-w-4xl), simple forms modest bump (login/add-room/edit-student/confirms md:max-w-md/lg). 9 files changed, build passed. Rudolf correction: Teio split student name into 2 block spans (still 2 lines on desktop) — Rudolf replaced with single name + whitespace-normal md:whitespace-nowrap md:truncate so the name sits on ONE line on iPad/desktop (Trainer's actual ask); removed now-unused firstName/lastName. Meta line (เลขที่/รหัส) + nickname already md:whitespace-nowrap. `npm run build` PASSED. NOT committed.
- Symboli Rudolf (Claude): Fixed ใบงาน worksheet image not displaying in browser (broken-image icon) though curl returned 200 — Google Drive lh3 images 403 in-browser based on the Referer header. Added referrerPolicy="no-referrer" to the lightbox <img> in StudentScoreModal.tsx + QuickGradeClient.tsx (and referrerpolicy on the print-window img). Also added driveImageCandidates() onError fallback in StudentScoreModal that cycles alternate Drive URL formats (lh3 =w2000 → thumbnail?sz=w2000 → uc?export=view) if the first fails. `npm run build` PASSED. NOT committed.
- Symboli Rudolf (Claude): Fixed mobile header overlap on room page — the fixed TeacherAuthChip (logout, top-3 right-3) overlapped the จัดการห้องเรียน button. Added pr-14 md:pr-0 to the room header row so actions clear the chip on mobile, and made the จัดการห้องเรียน trigger icon-only on mobile (text hidden sm:inline, px-3 sm:px-4) for a cleaner compact mobile topbar. `npm run build` PASSED. NOT committed.
- Symboli Rudolf (Claude): Room title auto-scroll on mobile — created RoomTitle.tsx client component that measures text vs container (ResizeObserver) and applies a gentle marquee (drag.css @keyframes room-title-marquee, 7s ease-in-out alternate, holds at both ends) ONLY when the name overflows; short names stay still; long names (mobile) scroll to reveal full text. Respects prefers-reduced-motion. Replaced the truncating <h2> in rooms/[id]/page.tsx. `npm run build` PASSED. NOT committed.

## ========== CHECKPOINT (2026-06-30, end of Rudolf's session — handoff to Oguri) ==========
Context: Rudolf near quota limit. Trainer continues with Oguri Cap. All work below is COMMITTED this session. App = homework-next (Next.js 16.2.9 + Prisma 7 + MySQL local XAMPP `homework_dev`). Dev server: `npm run dev` on :3000 (force-dynamic pages read DB live). Build command: `npm run build`. Single teacher account; login = httpOnly cookie session.

WHAT WAS DONE TODAY (all verified by build; Trainer browser-tested most):
1. WORKLOG reorg (team root): tora/TEDET + homework-next entries split out of central /AI Title/WORKLOG.md into each project's own worklog. (separate repo / done earlier.)
2. Favicon: replaced default Next logo — src/app/icon.svg + regenerated src/app/favicon.ico (themed: white check + amber star on indigo gradient).
3. "Remember me" REDESIGN to OWASP standard: removed the insecure localStorage-password + client auto-login hack. Now httpOnly session cookie is the single source of truth (lib/auth.ts: createSession(role,userId,remember); checked = persistent 7-day cookie, unchecked = session cookie). Login form uses plain autoComplete username/current-password (browser password manager handles prefill). Logout destroys cookie. Files: src/app/TeacherAuthChip.tsx (rewritten, much shorter), src/lib/auth.ts, src/lib/actions/auth.ts.
4. TRUSTED DEVICE feature (NEW — auto-login without password on registered devices). OWASP selector:validator pattern. Token in httpOnly cookie `hw_device` (NOT localStorage); DB stores only sha256(validator); rotated each use; 90-day expiry; revocable; ownership-checked. Logout sets session-scoped pause cookie `hw_device_pause` (logout = out now, but device still trusted on next browser open). Files: prisma schema model TrustedDevice (db push done), src/lib/device.ts (cookie/token helpers), src/lib/actions/device.ts (registerDevice/tryDeviceLogin/listDevices/revokeDevice), src/app/DeviceAutoLogin.tsx (guest mount → silent auto-login), src/app/DeviceManagerModal.tsx (register/list/revoke UI, opened via window event "open-device-manager"), wired in layout + LeftRail + TopbarActions (fa-shield-halved, teacher only). NOTE for team: after any change to session shape, existing logged-in users must re-login (old cookie lacks new fields). Mejiro drafted the bulk, Rudolf assembled+verified.
5. DATA MIGRATION from Google Sheet → MySQL (made DB current). Source sheet id 1WJMvsvPHqZynXx0mgbErCjLHHA6TiKDhxdopcnWeYkY ("ระบบเก็บคะแนนนักเรียน"). Pulled via Google Drive MCP export→xlsx, parsed with openpyxl. Full reload (kept User): 14 rooms / 507 students / 134 tasks / 1149 scores (value>0 only). DB backup before reload: scratch/homework_dev_backup_20260630_123637.sql (rollback = restore it). Helper scripts in session scratchpad (parse_sheet.py, gen_sql.py).
6. ใบงาน worksheet images (Task.imageUrl): these live in GAS Script Properties (LT_TASK_ASSETS_<room>), not the sheet. Trainer ran a one-off dumpTaskAssets() GAS fn → wrote them to a _TaskAssetsDump sheet tab → Rudolf re-exported + parsed (10 rooms, 22 images). Normalized to https://lh3.googleusercontent.com/d/<id>=s2000 and UPDATE Task.imageUrl matched by room+task name (22/22). Trainer can delete the _TaskAssetsDump tab + the GAS fn now.
7. Image display fix: Google Drive (lh3) images 403 in-browser on Referer → added referrerPolicy="no-referrer" to worksheet <img> in StudentScoreModal.tsx + QuickGradeClient.tsx (+ print window), plus driveImageCandidates() onError fallback cycling alternate Drive URL formats.
8. Student code ".0" bug fixed (openpyxl read codes as float during import): UPDATE Student stripped trailing ".0" on 507 rows (17575.0 → 17575).
9. RESPONSIVE pass on ALL popups/modals (Teio executed, Rudolf corrected): mobile unchanged, added md:/lg: width variants — content modals widen (StudentScoreModal lg:max-w-5xl etc.), simple forms modest bump. StudentScoreModal student name now ONE line on iPad/desktop (whitespace-normal md:whitespace-nowrap), meta + nickname md:whitespace-nowrap. 9 files.
10. Mobile room-page header overlap fix: fixed TeacherAuthChip overlapped จัดการห้องเรียน button → header pr-14 md:pr-0 + จัดการห้องเรียน trigger is icon-only on mobile (text hidden sm:inline).
11. Room title auto-scroll on mobile: RoomTitle.tsx client component marquees the title ONLY when it overflows (drag.css @keyframes room-title-marquee, respects prefers-reduced-motion).

CURRENT STATE: build PASSES, all committed on branch master. App feature-complete + data current (rooms/students/tasks/scores/worksheet-images). NOT yet deployed.

NEXT STEPS (per Trainer's earlier choice = polish then deploy):
- M6 DEPLOY to Plesk subdomain homework.thatnarai.net via Plesk-panel Git deploy (SSH not yet available). Build LOCALLY (output:'standalone' → `node .next/standalone/server.js`), push, set env (DATABASE_URL to host MySQL, SESSION_SECRET), run prisma migrate/db push + generate on host, seed/import the teacher User + data. Prisma 5.22 + binaryTargets recipe is the fallback if Prisma 7 fails on host (see feed project pr.thatnarai.net).
- Verify trusted-device + worksheet images work over HTTPS in prod.
- Re-import note: production DB needs the same Sheet data load + Task.imageUrl update + code ".0" cleanup (or just dump/restore homework_dev once schema matches).
OPEN ITEMS: confirm Plesk SSH/Git access; SESSION_SECRET must be set in prod (else dev-insecure default).

## 2026-06-30 (ช่วงค่ำ — Oguri Cap)

- **Student View Lightbox (ใบงานป๊อปอัปฝั่งนักเรียน)**: 
  - ทำการแยกส่วนแสดงผลหน้า Gamer Profile ฝั่งนักเรียนออกเป็น Client Component ที่ไฟล์ [src/app/view/[roomId]/[studentId]/StudentStatusClient.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/view/%5BroomId%5D/%5BstudentId%5D/StudentStatusClient.tsx) เพื่อรองรับการเปิดรูปใบงานเป็น Popup (Lightbox) ในหน้าเพจ แทนการเปิดแท็บเบราว์เซอร์ใหม่แบบเดิม
  - นำเข้าความสามารถแสดงผล Lightbox เต็มระบบเหมือนฝั่งครู: ปุ่มสั่งพิมพ์รูปภาพทันที, ปุ่มดาวน์โหลด, และตัวดักจับความผิดพลาดลิงก์ Google Drive (Drive Image Fallback) พร้อม Referrer Policy ป้องกันปัญหา 403
  - อัปเดตไฟล์หน้าหลัก [src/app/view/[roomId]/[studentId]/page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/view/%5BroomId%5D/%5BstudentId%5D/page.tsx) ให้เรียกใช้งานตัว Client Component ดังกล่าว
- **สะพานเชื่อมลิงก์ QR Code (Redirect Bridge Route)**:
  - สร้างหน้าเว็บตัวกลาง [src/app/redirect/page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/redirect/page.tsx) (เส้นทาง `/redirect`) เพื่อรองรับพารามิเตอร์ของ QR Code แบบเก่าบนสมุดจากระบบ GAS (`?sheet=ชื่อห้อง&studentId=เลขที่`) 
  - ตัวสคริปต์จะแปลงค่าเป็นรหัส CUID จริงของระบบใหม่ และสั่งย้ายผู้ใช้ (Redirect) ไปยังห้องเรียนปลายทางที่ถูกต้องโดยอัตโนมัติ (เช่น หน้าให้คะแนนด่วนครู `/grade/...` หรือหน้านักเรียน `/view/...`) ช่วยประหยัดงบประมาณไม่ต้องจัดพิมพ์และติด QR Code ใหม่ให้เด็กๆ
- **อัปเดตสเปรดชีตข้อมูลนักเรียนล่าสุด (Google Sheet Update)**:
  - สั่งดึงข้อมูลสเปรดชีตล่าสุดที่มีการบันทึกคะแนนเพิ่มเติมจากครูผู้ช่วยมาลงฝั่ง Local เป็นไฟล์ `scratch/source.xlsx`
  - สร้างสคริปต์ [scripts/parse-xlsx.py](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/scripts/parse-xlsx.py) แปลงไฟล์ Excel ออกมาเป็นไฟล์ `scratch/sheets.json` (แก้ไขระบบจัดการ DateTime ล้มเหลวระหว่างแปลง และบันทึกคะแนนใหม่ล่าสุดเข้าระบบเรียบร้อยแล้ว)
- **การติดตั้งระบบบนเซิร์ฟเวอร์ Plesk (Plesk NodeJS/MariaDB Deployment)**:
  - **การตั้งค่า Standalone**: ยืนยันโครงสร้างบิลด์ `output: "standalone"` ใน `next.config.ts` สำเร็จ
  - **สคริปต์สะพานเชื่อม CWD (CWD-independent scripts)**: เนื่องจาก Plesk มักสลับตำแหน่งโฟลเดอร์ทำงานชั่วคราวจนทำให้ Prisma CLI หาตำแหน่งไฟล์ไม่เจอ จึงเขียนสคริปต์ตัวช่วยเป็น Javascript สองไฟล์:
    - [scripts/db-push.js](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/scripts/db-push.js): สแกนหาไฟล์ `.env` ด้วยเส้นทางสัมบูรณ์ (Absolute Path) และยิงตัวแปรแบบ Inline เพื่อสั่งรัน `prisma db push`
    - [scripts/seed-teacher.js](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/scripts/seed-teacher.js) และ [scripts/import-sheet.js](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/scripts/import-sheet.js): เรียกใช้แพ็กเกจ `tsx` ที่เพิ่มเข้าไปใน dependencies ของ [package.json](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/package.json) เพื่อรันสคริปต์ TypeScript ของระบบได้เสถียรบน Plesk โดยไม่ต้องติดตั้งระบบ Global
  - **ปัญหา Prisma 7 Build-time Validation**: พบว่า Prisma 7 ยกเลิกการเขียนระบุคีย์ `url` ในไฟล์ `schema.prisma` แล้ว และบังคับให้เขียนลงใน `prisma.config.ts` แทน ส่งผลให้ระบบล้มเหลวขณะคอมไพล์ Next.js (เพราะยังไม่มี DATABASE_URL ในเครื่องบิลด์)
    - *แนวทางแก้ไข*: ทำการสร้างไฟล์ `prisma.config.ts` ใหม่พร้อมระบุทางเลือกสำรอง `process.env.DATABASE_URL || "mysql://localhost:3306/placeholder"` ช่วยให้ระบบตรวจผ่านตอนคอมไพล์ และดึงข้อมูลจริงมาใช้ในขั้นตอนสั่งรัน
  - **อักขระพิเศษในฐานข้อมูล**: พบปัญหาเครื่องหมาย `@` ในรหัสผ่าน MySQL ทำลายรูปแบบโครงสร้าง URL
    - *แนวทางแก้ไข*: ทำการแปลงรหัส (URL Encode) จากอักขระ `@` ให้เป็น `%40` ในไฟล์คอนฟิก `.env`
  - **การซิงค์ข้อมูลสมบูรณ์ (Database Parity)**: เพื่อให้ฐานข้อมูลฝั่ง Local และ Production ตรงกัน 100% ได้สั่งใช้ชุดคำสั่ง XAMPP ทำการดัมป์ฐานข้อมูลในเครื่องออกมาเป็นไฟล์ [scratch/db_dump.sql](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/scratch/db_dump.sql) (236KB) และให้เทรนเนอร์นำเข้าไปติดตั้งผ่าน phpMyAdmin บน Plesk สำเร็จลุล่วง
  - บันทึกความพยายามทดสอบ: โครงสร้างฐานข้อมูลสร้างขึ้นเรียบร้อย ตารางครบถ้วน ข้อมูลนักเรียนและบัญชีคุณครู `krutaktan` ติดตั้งเสร็จสิ้น สมบูรณ์แบบ!

- **การแก้ไขตัวนำเข้าสเปรดชีตเพิ่มเติม (Import Sheet Images)**:
  - แก้ไขสคริปต์ [scripts/import-sheet.ts](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/scripts/import-sheet.ts) ให้ดึงข้อมูลลิงก์รูปใบงานจากแท็บพิเศษ `_TaskAssetsDump` (ที่ดัมป์จาก GAS Script Properties) มารันจับคู่เข้ากับรหัสงานของนักเรียนในฐานข้อมูลโดยอัตโนมัติ ทำให้หมดปัญหารูปภาพใบงานกลายเป็นค่าว่าง (null) ระหว่างนำเข้าข้อมูล
  - สั่งดัมป์ฐานข้อมูลฉบับสมบูรณ์ที่มีลิงก์ภาพครบถ้วนเป็น [scratch/db_dump.sql](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/scratch/db_dump.sql) (241KB) เพื่อนำไปทับใน Plesk phpMyAdmin
- **การปรับแต่งสะพานเชื่อมต่อหน้าเว็บ (Next.js Client-Side Redirection)**:
  - พบปัญหาการใช้งานฟังก์ชัน `redirect()` ของ Next.js หลังบ้าน ส่งข้อยกเว้นภายในออกมาก่อการประท้วงจนเว็บล่มบน Phusion Passenger ของ Plesk
  - ทำการปรับปรุงโค้ดที่ [src/app/redirect/page.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/redirect/page.tsx) ให้ทำการคืนหน้าเว็บปกติสถานะ 200 แล้วใช้ JavaScript ฝั่งไคลเอนต์ (`window.location.replace`) เป็นผู้เปลี่ยนเส้นทางไปยังหน้า `/view/...` หรือ `/grade/...` แทน ป้องกันการตรวจจับที่ผิดพลาดของ Plesk ได้ 100%
- **ระบบแก้รูปภาพใบงานล่มบนหน้าให้คะแนนด่วน (Quick Grade Image Fallback)**:
  - ตรวจพบปัญหารูปภาพใน Popup Lightbox แสดงสัญลักษณ์รูปเสียเมื่อกดดูบนหน้าให้คะแนนด่วนสำหรับคุณครู
  - ทำการอัปเกรดความสามารถที่คอมโพเนนต์ [src/app/grade/[roomId]/[studentId]/QuickGradeClient.tsx](file:///Users/kanokkarn/Data/AI%20Title/projects/homework-next/src/app/grade/%5BroomId%5D/%5BstudentId%5D/QuickGradeClient.tsx) โดยบรรจุกลไกการสลับลิงก์รูปสำรอง (driveImageCandidates กับ onError fallback) ทำให้ลิงก์ Google Drive ในหน้านี้แสดงผลได้ลื่นไหลสมบูรณ์แบบ
- **การปรับปรุงความสวยงามฝั่ง Google Apps Script**:
  - เปลี่ยนจากตัวควบคุมเวลาหมุนถอยหลัง 3-2-1 เป็นหน้าการ์ดพรีเมียมสีเข้ม (Premium Transition Card) ที่สามารถกดคลิกต่อได้ทันทีโดยไม่มีดีเลย์ ช่วยให้ผู้ใช้งานสามารถแตะเปลี่ยนหน้ากระโดดข้ามขอบข่าย Iframe ของ Google ได้สะดวกยิ่งขึ้น

- **ระบบกล่องเลือกคะแนนด่วน (Quick-Grade Checkbox)**:
  - เพิ่มฟังก์ชันช่วยเหลือครูผู้สอนในการตรวจงานบนสมาร์ทโฟนที่หน้าให้คะแนนด่วน (`/grade/...`)
  - หน้าจอจะไปสืบค้นหาคะแนนเต็มสูงสุดที่บันทึกไว้ของใบงานชิ้นนั้นๆ ในห้องเรียนโดยอัตโนมัติ (Prisma `groupBy` หาค่า `_max`) เพื่อนำมาแสดงไว้บนชื่อใบงานในหน้าจอตรวจคะแนน
  - บรรจุ Checkbox ขนาดใหญ่ที่เอื้อต่อการกดบนมือถือ:
    - หากกดติ๊กเลือก: ระบบจะป้อนค่าคะแนนเต็มสูงสุดลงในช่องกรอกคะแนนให้ทันทีโดยไม่ต้องพิมพ์
    - หากยกเลิกการติ๊ก: ระบบจะเคลียร์คะแนนให้กลายเป็น 0 ทันที
- **ระบบสแกนรับสมุดด่วน (Notebook Quick Check-in)**:
  - เพิ่มโหมด "สแกนรับสมุดด่วน" ในหน้าตรวจคะแนนครู (`QuickGradeClient`) เก็บค่าเปิด/ปิดโหมดและใบงานที่ต้องการจะรับสมุดผ่าน `localStorage` ของอุปกรณ์ครู
  - เมื่อเปิดโหมดนี้และทำการสแกน QR Code หน้าจอจะทำการบันทึกสถานะรับสมุด (คะแนนพิเศษ `-1`) และแสดงผลหน้าจอสีเขียวเต็มจอทันทีโดยไม่ต้องสัมผัสหน้าจอ
  - ปรับการคำนวณคะแนนรวมและหน้าประวัตินักเรียนให้รับรู้คะแนน `-1` เป็นสถานะสีส้มสวยงาม `📖 ตรวจสมุดแล้ว (รอคะแนน)` โดยไม่นำค่าติดลบไปคำนวณหักคะแนนรวมจริง

- **Commit**: `dc4f043` (เพิ่มตัวซิงค์โคลอน), `0dbd464` (อัปเกรด dependencies tsx), `ea78774` (ย้ายสิทธิ์ config), `0b56b85` (ลบ config เก่า), `e78bde9` (สร้าง config คืนชีพ Prisma 7), `cce44e6` (สคริปต์คู่ขนาน), `b1f67fa` (Inline db URL), `5d222d9` (Placeholder fallback), `f1e5bb9` (นำเข้าไฟล์รูปใบงาน), `5e84800` (คืนค่า redirect คิวรี่จริง), `31c1f8b` (สลับหน้าฝั่ง Client), `6efe324` (เพิ่ม Image Fallback ในหน้าตรวจงานด่วน), `ba1b175` (Checkbox คะแนนด่วน) และ `8b4b3f1` (ระบบสแกนรับสมุดด่วน & แก้ลำดับประกาศ useEffect).

## ========== CHECKPOINT (2026-07-01, จบภารกิจสแกนรับสมุดด่วน — Hand-off to Rudolf) ==========
แอปพลิเคชัน Next.js `homework-next` มีคุณสมบัติสแกนรับสมุดด่วน (เช็คอินสถานะส่งสมุดด้วยคะแนนพิเศษ -1) และอัปเดตสถานะของเด็กนักเรียนสำเร็จเรียบร้อย


### รายการสรุปสถานะการ Deploy และหน้าจอสำคัญ:
1. **Lobby / หน้าแรก**: ใช้งานได้เรียบร้อย, ค้นหาห้องเรียน และสืบค้นคะแนนนักเรียนได้รวดเร็ว
2. **หน้าห้องเรียนฝั่งครู**: จัดการใบงาน, คัดลอก, จัดการนักเรียน, สั่งพิมพ์การ์ด QR Code พรีเมียมแบบรวมการ์ดได้ไม่มีติดขัด
3. **หน้าแสดงผลของเด็ก (Student View)**: ระบบแบ่งฝั่งเควสส่งแล้ว/ค้างส่งชัดเจน, กดเปิดดูรูปใบงานด้วยป๊อปอัป Lightbox แถบเครื่องมือดาวน์โหลด/สั่งพิมพ์ได้ครบถ้วน
4. **สะพานเชื่อม QR Code**: หน้าลิงก์เปลี่ยนผ่าน `/redirect` รองรับการสแกนด้วย QR บนสมุดแบบเดิมได้อย่างแม่นยำ ปลอดภัยจากปัญหา Passenger ล่มด้วยระบบ Client-side Redirect
5. **ระบบ Google Apps Script**: ได้รับการปรับแต่งโค้ด `doGet(e)` เป็นหน้าจอย้ายหน้า (Premium Transition Card) หลุดพ้นจากระบบ Sandbox เด้งเข้าเว็บใหม่ได้ทันทีผ่านการคลิก
6. **การป้องกันลิงก์รูปกูเกิลไดรฟ์ล่ม**: ปลั๊กอินตัวสลับลิงก์สำรอง (Image Fallback) ได้รับการบรรจุเข้าสู่หน้าหลักของระบบ ทั้งฝั่งห้องเรียนนักเรียน หน้ารายงาน และหน้าให้คะแนนด่วนของครูทั้งหมดแล้ว
7. **ระบบกล่องเลือกคะแนนด่วน (Quick-Grade Checkbox)**: ทำงานประสานกับการดึงคะแนนเต็มอัตโนมัติ ช่วยให้คุณครูสแกน QR Code แล้วติ๊กรับคะแนนเต็ม 10 หรือ 5 ได้ทันทีในสัมผัสเดียว
8. **ความสอดคล้องข้อมูล**: ข้อมูลเกรดใหม่ของภรรยาเทรนเนอร์ ซิงค์เข้าระบบทั้ง Local (เครื่องส่วนตัว) และ Production (Plesk) ตรงกันเรียบร้อย


