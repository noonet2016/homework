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

### Next steps
- M3: core CRUD (rooms/students/tasks/scores) via API routes/server actions. Per Next 16 AGENTS.md warning, consult node_modules/next/dist/docs before writing route/server-action code (breaking changes).
- git init for homework-next (own repo) — structure is now stable, good point to init.

### Open questions
- Subdomain name (proposed homework.thatnarai.net)? SSH on Plesk: tried, "Permission denied" (likely shell not /bin/bash or wrong system-user pw) — deferred to M6.
