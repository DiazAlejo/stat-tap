---
date: 2026-07-03
type: mvp
project: stat-tap
tags:
  - project/stat-tap
---

# StatTap — MVP Scope

## Core Loop

Stat keeper opens web app → enters team names and players (30 seconds) → tracks game events with 2 taps per stat → game ends → shareable read-only link is generated with the full box score.

---

## MVP Features (Must Have)

**Game Setup:**
- [ ] Enter optional team names (Team A / Team B defaults)
- [ ] Add players per team (jersey number + name, both optional)
- [ ] Choose stat tracking mode: Points Only (+1/+2/+3) or Make/Miss (FG/3PT/FT Make & Miss)
- [ ] Max 12 players per team

**Live Game Screen (Core):**
- [ ] Two-column layout (Team A / Team B) — all players visible, no scrolling
- [ ] Live score in header
- [ ] 2-tap stat entry: select player → select action
- [ ] Instant undo (pop last event)
- [ ] End game button with confirmation

**Live Stats Tab:**
- [ ] Read-only view of current stats
- [ ] Two modes: total points per player OR full shooting breakdown

**End Game:**
- [ ] Freezes event log
- [ ] Computes final stats snapshot
- [ ] Generates shareable link

**Game Report (Shareable):**
- [ ] Public route: `/game/{id}`
- [ ] Read-only, no auth required
- [ ] Final box score, immutable

---

## Not in MVP (Explicitly Excluded)

Per CLAUDE.md in the stat-tap project — these are hard boundaries:
- Authentication / user accounts
- Persistent players or teams across games
- Seasons, leagues, or history
- Exports (CSV, PDF, Excel)
- Advanced stats (rebounds, assists, steals, etc.)
- Multi-game management
- Scrolling in the live game screen

---

## Current Build State

**Core architecture implemented:**
- Event-driven system (every stat = an immutable Event)
- Reducer-based state computation
- GameContext for state management
- Supabase integration (db.ts, database.types.ts)
- Core game logic (game.ts, reducer.ts, types.ts)
- Test suite (GameContext, db, game, reducer tests)
- Design system documented (design-system/stattap/MASTER.md)
- Full documentation (PRD, implementation plan, database schema, technical requirements, UI/UX brief, user journey)

**Status:** Architecture and backend are solid. UI implementation status needs verification.

---

## Success Criteria

The MVP is done when:
1. A person can track a 5-on-5 pickup game on an iPad without Alejo's help
2. The live game screen has zero scrolling — all players visible at all times on iPad
3. Every stat entry completes in under 2 seconds
4. The shareable game report link loads correctly on a phone in under 3 seconds
5. Alejo uses it for 3 real pickup games before calling it done

---

## Ship Target

Target: publicly accessible URL within 4 weeks of this date (2026-07-28).

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + React | Deployed as web app, works on all devices |
| State | Reducer + GameContext | Event-driven, undo via event stack |
| Backend | Supabase | Game storage, snapshot persistence, shareable links |
| Deployment | Vercel (free tier) | Fast, free, Next.js native |
| Testing | Vitest | Unit tests for game logic and reducer |

**Architecture principle:** Event log is single source of truth. All UI is derived. Never store computed stats directly.
