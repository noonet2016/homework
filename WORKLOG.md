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
