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
