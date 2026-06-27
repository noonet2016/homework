# Project: Homework System — Next.js Edition (homework-next)

## Goal
Rebuild the GAS "Learn Tracking" homework/score tracker as a modern Next.js + MySQL web app, self-hosted on the Trainer's Hostatom/Plesk hosting. Primary aims: a real database, a foundation that can later become a real SaaS, and learning Next.js along the way.

## Context / decisions (2026-06-27)
- Current GAS app: used by ONE person (Trainer's wife) for her own work. NOT sold, no customer data yet → PDPA/data-sovereignty concerns are deferred (low risk to rebuild now).
- Old GAS app: **replace entirely** (but keep it live as fallback until the new one is verified — do NOT delete).
- Hosting confirmed: Hostatom "Titan" reseller plan, Plesk panel. 200GB SSD, unlimited DB/subdomain, free Redis, Wildcard SSL, Backup. **Node.js 24.17.0** available, Git + Scheduled Tasks in panel.
- Proven precedent: Trainer already runs a Next.js+Prisma+MySQL app on this exact host — `pr.thatnarai.net` (code at `/Applications/XAMPP/xamppfiles/htdocs/feed`). The hardest risk (Next.js SSR on Plesk/Passenger) is already solved there. Reuse its patterns.

## Stack (LOCKED)
- Next.js (App Router) + TypeScript, `output: 'standalone'`
- Prisma ORM + **MySQL** (`provider = "mysql"`, `DATABASE_URL`)
  - Prisma `binaryTargets = ["native", "debian-openssl-1.1.x", "debian-openssl-3.0.x"]` — REQUIRED for Plesk Linux host (learned from feed project).
- Auth.js / NextAuth v4 + `@auth/prisma-adapter` + bcryptjs (username/password teacher login, role)
- Tailwind (port existing UI styling from the GAS app)
- Redis (available on host) — caching/session later
- Deploy: build LOCALLY → push via Git to a new subdomain (e.g. `homework.thatnarai.net`). Do NOT run `next build` on the shared host (avoid OOM).

## Success criteria
- [ ] Teacher can log in (username/password)
- [ ] CRUD rooms, students, tasks; record scores
- [ ] Dashboard with per-room progress + per-student status (feature-parity with key GAS features)
- [ ] Runs on Plesk subdomain over HTTPS, data in host MySQL
- [ ] Old GAS app retired only AFTER new app verified by the Trainer's wife

## Data model (draft — maps GAS Google Sheet → relational)
- `User`    : id(cuid), username(unique), password_hash, role(TEACHER/ADMIN), timestamps  — teacher login
- `Room`    : id, name, icon, sortOrder, slug(unique), createdAt                          — was 1 sheet per room
- `Student` : id, roomId→Room, name, nickname, number                                     — was 1 row
- `Task`    : id, roomId→Room, name, taskIndex, imageUrl                                   — was 1 column (ใบงาน)
- `Score`   : id, studentId→Student, taskId→Task, value                                    — was 1 cell
- Relations: Room 1-* Student, Room 1-* Task, Score links Student×Task.

## Milestones
- [ ] M0 (Phase 0): project plan + docs (this file) — IN PROGRESS
- [ ] M1: scaffold Next.js app (create-next-app, TS, Tailwind, standalone), Prisma init w/ mysql + binaryTargets
- [ ] M2: finalize Prisma schema + local MySQL (XAMPP) + `prisma db push` + seed
- [ ] M3: core CRUD via API routes/server actions (rooms, students, tasks, scores)
- [ ] M4: port UI (lobby/dashboard/quick-grade) from GAS app to React + Tailwind
- [ ] M5: NextAuth teacher login + role gating
- [ ] M6: deploy to Plesk subdomain (Git, standalone, env, Prisma engine), verify with wife
- [ ] M7: retire GAS app (keep archived)

## Key files / references
- Reference app (proven): `/Applications/XAMPP/xamppfiles/htdocs/feed` (pr.thatnarai.net) — copy its next.config standalone, prisma generator binaryTargets, NextAuth setup.
- Old GAS app: `/Users/kanokkarn/Data/AI Title/projects/homework` — source of feature requirements + UI/Tailwind styling.

## Dependencies / blockers
- Local dev: XAMPP MySQL is available locally; will create a dev DB.
- Need: confirm SSH access on Plesk (eases deploy) — not yet confirmed.
- next-auth v4 vs Auth.js v5 — decide at M5 (feed uses v4; default to v4 for parity).

## Open questions
- Subdomain name for the new app? (proposed: homework.thatnarai.net)
- Keep Thai UI labels identical to GAS app? (assume yes for wife's familiarity)
