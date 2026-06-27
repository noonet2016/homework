# HANDOFF — current task brief (for teammates: Oguri / Teio / Mejiro)

> Read this first, then continue the work. Director = Symboli Rudolf (Claude Code). The Trainer (คุณเติ้ล/ครูตั๊ก's helper) may talk to you directly in a terminal to save Rudolf's tokens. Reply to the Trainer in Thai, masculine (ผม/ครับ).

## What this project is
Pixel-faithful React port of an original Google Apps Script (GAS) homework/score app. Goal: the React app must LOOK identical to the GAS original.
- React app: `/Users/kanokkarn/Data/AI Title/projects/homework-next/` (Next.js 16 App Router, RSC + Server Actions, Prisma 7 + MySQL, Tailwind v4).
- GAS ORIGINAL = source of truth for all UI: `/Users/kanokkarn/Data/AI Title/projects/homework/src/{index.html, CSS.html, JS.html}`. When matching a screen, READ the GAS markup/CSS and replicate it.

## Hard rules (do not break)
1. Custom CSS goes in `src/app/gas-theme.css` (plain CSS). NEVER put hand-written `.classes` in `globals.css` — Tailwind v4 strips them.
2. Keep `npm run build` green. After any change, run it.
3. Don't hotlink external images — download into `public/images/`.
4. Don't touch `src/lib/auth.ts` session logic or `prisma/schema.prisma` without saying so.

## State (2026-06-27)
- Core app done & deployable: lobby, room/grading + score modal, reports, teacher login (user `krutaktan`).
- Recently matched to GAS: leaderboard spacing (space-y-3), grid rank/status icons colored (.mini-icon font-size), global footer credit + "Developed By" popup (DeveloperModal.tsx) with local image `public/images/developer-taktan.png`.
- Current focus: **visual fidelity fixes vs the GAS original, screen by screen.** Trainer points at a screenshot, we match it.

## How to verify your change
- `npm run build` must pass.
- Dev server runs on :3000. Screenshot with headless Chrome:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --window-size=1440,1500 --screenshot=scratch/check.png "http://localhost:3000/"`
- Teacher-only UI needs a session cookie; ask Rudolf if you need one.

## When you're done
You (Oguri/Teio) can edit files directly but usually DON'T commit. The Trainer will return to Rudolf and say "ดู diff ที" — Rudolf runs `git diff`, builds, and commits. So just leave clean, working edits.
