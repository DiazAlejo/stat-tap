# Product Requirements Document — StatTap MVP

**Version:** 1.0  
**Date:** 2026-06-18  
**Status:** Approved

---

## 1. Product Overview

StatTap is a real-time basketball pickup game stat tracking web app. It is used live during informal basketball games where a single stat keeper tracks all events from the sideline on an iPad.

**Core promise:** Two taps → instant stat → zero friction.

---

## 2. Problem Statement

Pickup basketball games have no scorekeeper infrastructure. Friends want to track who scored what, but existing solutions are:
- Too complex (full sports apps require accounts, rosters, leagues)
- Too slow (typing player names mid-game breaks flow)
- Not shareable (no link to show everyone the final stats)

StatTap solves this with a minimal, fast, single-game tool that anyone can use in 30 seconds.

---

## 3. Target Users

| User | Description |
|---|---|
| Stat keeper | One person on the sideline tracking all events live |
| Players | Pickup basketball players who want to see their stats |
| Spectators | Friends who want to follow the game remotely |

---

## 4. Device Priority

1. **iPad** — primary sideline device (all UX decisions must work here first)
2. **Laptop** — secondary (game setup may happen here)
3. **Mobile phone** — tertiary (read-only game report access)

---

## 5. Core Features (MVP Only)

### 5.1 Game Setup
- Enter optional team names (Team A, Team B defaults)
- Add players per team:
  - Jersey number (optional)
  - Name (optional)
  - If neither provided: auto-label as "Player 1", "Player 2", etc.
- Choose stat tracking mode:
  - **Points Only**: +1 FT / +2 FG / +3 3PT
  - **Make/Miss**: FG Make/Miss, 3PT Make/Miss, FT Make/Miss
- Mode is fixed for the entire game (chosen at setup)
- Max 12 players per team

### 5.2 Live Game Screen
- Fixed header: live score, Undo button, End Game button
- Two-column player grid (Team A / Team B)
- All players visible on one screen — no scrolling ever
- Grid is symmetric: `max(teamA.count, teamB.count)` rows; shorter team gets disabled placeholder tiles
- Tap player → tap action = 1 stat event recorded
- Action bar appears after player selection, hides after action recorded
- Undo removes the last event instantly

### 5.3 Live Stats Panel
- Read-only tab accessible during gameplay
- Mode 1: Player → total points
- Mode 2: Player → FG/3PT/FT makes and attempts

### 5.4 End Game
- Triggered manually by stat keeper (requires confirmation)
- Freezes event log permanently
- Computes and displays final box score
- Generates shareable game report URL

### 5.5 Shareable Game Report
- Public URL: `/game/{id}`
- No login required
- Read-only
- Shows final score and full player box score

---

## 6. Non-Features (Explicitly Out of Scope)

The following must NOT be built:

- Authentication or user accounts
- Persistent players or rosters across games
- Leagues, seasons, or game history
- Exports (CSV, PDF, Excel)
- Advanced stats (assists, rebounds, steals, blocks, turnovers)
- Multiple simultaneous active games
- Scrolling in the live game screen
- Push notifications
- Real-time sync for spectators (report page is pull-on-load only)

---

## 7. Success Criteria

| Metric | Target |
|---|---|
| Time from open to first stat recorded | < 2 minutes |
| Taps to record any stat | Exactly 2 |
| Perceived UI response time | < 50ms (optimistic) |
| Screen scrolling during live game | Zero |
| Time to share game result | < 10 seconds after End Game |

---

## 8. Constraints

- Must work on iPad Safari without installing anything
- Must survive browser refresh (game state persists to server)
- Shareable URL must be accessible without login on any device
- No horizontal scrolling on any screen

---

## 9. Out-of-Scope Clarifications

| Question | Answer |
|---|---|
| Can a stat keeper edit an event (not just undo)? | No — undo only (pop last event) |
| Can players be added mid-game? | No — roster is locked at game setup |
| Can the game mode be changed mid-game? | No — mode is fixed at setup |
| Can there be more than 2 teams? | No — always exactly Team A vs Team B |
| Is there a game clock? | No — pickup games don't use one |
