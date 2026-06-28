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
