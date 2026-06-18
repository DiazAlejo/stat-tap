# CLAUDE.md — StatTap MVP

This file defines how Claude Code should work inside the StatTap project.

---

# PROJECT OVERVIEW

StatTap is a real-time basketball pickup game stat tracking web app.

It is used live during informal basketball games where a single stat keeper tracks all events from the sideline.

Core goals:
- ultra-fast 2-tap stat entry
- live scoreboard
- live box score
- instant undo
- end-game snapshot
- shareable read-only game link

---

# NON-NEGOTIABLE PRODUCT CONSTRAINTS

This is a strict MVP. Do NOT expand scope.

You must NOT add:
- authentication
- user accounts
- persistent players or teams across games
- seasons, leagues, or history
- exports (CSV, PDF, Excel)
- advanced stats (rebounds, assists, steals, etc.)
- multi-game management
- scrolling in live game screen
- complex backend systems

Only build what is required for a single-game live stat tracker.

---

# PRIMARY DEVICE TARGET

Design priority order:
1. iPad (primary sideline device)
2. Laptop
3. Mobile phone

All UX decisions must prioritize:
- large touch targets
- minimal friction
- zero scrolling during gameplay
- fast stat entry speed

---

# REQUIRED WORKFLOW (MANDATORY)

All major work must follow this sequence:

1. /brainstorming
   - clarify scope strictly within MVP
   - no feature expansion

2. /writing-plans
   - generate structured docs and system design

3. /subagent-driven-development
   - implement step-by-step tasks
   - include review gates before progressing

---

# REQUIRED UI/UX SKILL

When designing UI or interaction flows, always use:

/ui-ux-pro-max

---

# CORE DOMAIN MODEL

## Event (single source of truth)

Every stat action is stored as an immutable event:

- playerId OR jerseyNumber
- team (A | B)
- actionType:
  - FG_MAKE
  - FG_MISS
  - 3PT_MAKE
  - 3PT_MISS
  - FT_MAKE
  - FT_MISS
- points
- timestamp

---

## Game State (derived only)

All UI is derived from event log:

- teams
- players
- event log
- computed score
- computed stats

No duplicated derived persistence.

---

# CORE ARCHITECTURE PRINCIPLES

- event-driven system
- reducer-based state computation
- undo implemented via event stack (pop last event)
- deterministic state rebuild from events
- snapshot generated on game end
- stateless UI derived from state

---

# CORE GAME FLOW

## 1. Create Game
- optional team names
- player list per team:
  - jersey number (optional)
  - name (optional)

No saved rosters.

---

## 2. Live Game Screen (MAIN)

Layout constraints:
- two columns (Team A / Team B)
- all players must fit on screen
- NO scrolling allowed
- iPad-first grid layout

Header:
- live score
- undo button
- end game button (confirmation required)

Interaction rule:
- every event = 2 taps
  1. select player
  2. select action

Bottom action bar:
- +1 FT
- +2 FG
- +3 3PT
or
- FT/FG/3PT Make & Miss mode

---

## 3. Live Stats Tab (READ ONLY)

Two modes:
- total points per player
- full shooting breakdown:
  - FG makes/attempts
  - 3PT makes/attempts
  - FT makes/attempts

No editing allowed.

---

## 4. End Game
- freezes event log
- computes final stats snapshot
- locks game state

---

## 5. Shareable Game Report
Route:
- /game/{id}

Rules:
- public
- read-only
- no authentication
- immutable snapshot

---

# STATE MANAGEMENT RULES

- all updates go through reducer
- event log is single source of truth
- undo = pop last event
- derived selectors compute:
  - score
  - stats
  - shooting breakdown

Never store computed stats directly.

---

# API DESIGN (MINIMAL)

Only if needed:

- POST /game → create game
- POST /game/:id/event → add event
- POST /game/:id/undo → remove last event
- POST /game/:id/end → finalize snapshot
- GET /game/:id → fetch snapshot

Keep backend minimal and optional (can be local-first).

---

# SHARE STRATEGY

- game ends generate immutable snapshot
- snapshot stored with unique ID
- public route /game/{id} serves snapshot only

---

# FRONTEND STRUCTURE (GUIDELINE)

- GameSetupScreen
- LiveGameScreen (core)
- PlayerGrid (A / B columns)
- ActionBar
- ScoreHeader
- LiveStatsPanel
- EndGameModal
- GameReportScreen

All components must be optimized for fast interaction.

---

# PERFORMANCE GOAL

- instant UI updates (<50ms feel)
- zero lag stat entry
- minimal re-renders
- optimized event reducer

---

# REVIEW RULE

Before implementing any feature:
- verify it matches MVP constraints
- reject any feature expansion
- prioritize speed and simplicity over completeness

---

# FINAL PRINCIPLE

StatTap must feel like:

"two taps → instant stat → zero friction"

Everything else is secondary.