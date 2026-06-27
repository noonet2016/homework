# homework-next — module completion tracker (autonomous build while Trainer at lunch)

Approach (LOCKED): clean React (Next 16 App Router, RSC + Server Actions) that LOOKS identical to the GAS app. Refactor from the REAL GAS markup/CSS/render templates (do not reinterpret, do not dump verbatim). Custom CSS classes live in src/app/gas-theme.css (Tailwind v4 drops them from globals.css). Screenshot + pixel-diff verify every screen vs a GAS reference render. Keep `npm run build` green at every commit. Director = Rudolf (orchestrate + integrate + verify). Teammates: Teio (codex, edits files), Oguri (agy), Mejiro (glm), Twin (gemini).

GAS source: /Users/kanokkarn/Data/AI Title/projects/homework/src/{index.html,CSS.html,JS.html} + CoreLibrary/Core.js

## Modules
- [x] M0 docs / plan
- [x] M1 scaffold (Next 16 + Prisma 7 + MySQL)
- [x] M2 schema + data import (13 rooms / 477 students / 1082 scores, verified)
- [x] M4a Lobby — pixel-faithful React (diff 3.5), gas-theme.css fix
- [ ] M4b Room/grading screen — student card grid (renderStudentGrid) + score modal (openStudentModal); reuse server actions; faithful + verify
- [ ] M4c Task manager — add/edit/reorder tasks (renderTaskManagerList) + room actions
- [ ] M4d Add/Edit student + bulk CSV import (addStudent/updateStudentProfile/addStudentsBulk)
- [ ] M4e Room edit / duplicate / delete modals (updateRoomDetails)
- [ ] M5 Teacher login (admin mode) — User table + bcrypt; gate all mutating server actions
- [ ] M4f Reports view (report-view) — summary cards + per-room table + print
- [ ] M4g QR codes (per-student grade link + whole-room) — if feasible
- [ ] M4h Quick-grade + student status card (public view)

## Decisions (Rudolf, on Trainer's behalf — safe defaults)
- Teacher login: store teacher in User table (already in schema), bcryptjs hash; simple session cookie (no external auth provider). Seed one teacher account; surface credentials to Trainer (do NOT hardcode/commit secrets).
- QR/images: implement if low-risk; otherwise leave clean stubs and note for Trainer.
- Never touch ~/Data work files; keep GAS app (projects/homework) as live fallback.

## Status log
- (start) Lobby done + verified. Beginning M4b room screen via Teio.
