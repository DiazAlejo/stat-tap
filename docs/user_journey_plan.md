# User Journey Plan — StatTap MVP

**Version:** 1.0  
**Date:** 2026-06-18

---

## Overview

StatTap has three distinct user roles with different journeys through the app:

| Role | Device | Entry Point | Goal |
|---|---|---|---|
| Stat Keeper | iPad (primary) | `/` | Set up and track a full game live |
| Player | Any device | `/game/{id}` link | See their stats and final score |
| Spectator | Any device | `/game/{id}` link | Follow the game or see the result |

---

## Journey 1: Stat Keeper — Full Game Flow

### Phase 1: Game Setup (`/`)

**Trigger:** Stat keeper opens StatTap before the game starts

**Steps:**
1. Arrives at homepage
2. Sees two columns: Team A (left) / Team B (right)
3. Types team names (optional — defaults to "Team A" / "Team B")
4. For each team, adds players:
   - Taps "+ Add Player"
   - Types jersey number (optional)
   - Types name (optional)
   - Sees live preview of the display label ("23 · Jordan", "23", "Jordan", "Player 1")
   - Repeats for each player (up to 12 per team)
5. Selects stat tracking mode:
   - **Points Only** (+1/+2/+3 buttons)
   - **Make/Miss** (separate make and miss buttons per shot type)
6. Taps "Start Game"
7. Game created on server → navigates to `/live/{gameId}`

**UX notes:**
- Setup should take under 2 minutes for a 5-on-5 game
- Adding a player requires 0 required fields (just tap "+ Add Player" and move on)
- Mode selector must be visually clear — this affects the entire game

---

### Phase 2: Live Game (`/live/{gameId}`)

**Trigger:** Game has started, players are on the court

**Core loop (every stat event):**

```
1. Ball goes in (or up)
2. Stat keeper sees the player grid
3. Taps the player tile (1st tap)
   → Player tile highlights
   → Action bar slides up
4. Taps the action (2nd tap)
   → Event recorded locally (instant)
   → Score/stats update immediately
   → Action bar hides
   → Player tile deselects
   → UI returns to idle
5. Background: event persists to server
```

**Undo (mistake recovery):**

```
1. Stat keeper realizes last event was wrong
2. Taps Undo button (always visible in header)
3. Last event removed from local state instantly
4. Score/stats recomputed
5. Background: server pops last event from KV list
```

**Checking stats mid-game:**

```
1. Stat keeper wants to see player breakdown
2. Taps "Stats" tab
3. Live stats panel slides in (read-only)
4. Taps back to return to game grid
```

**End Game:**

```
1. Game is over
2. Stat keeper taps "End Game" button
3. Confirmation modal appears ("End game? This cannot be undone.")
4. Taps "Confirm"
5. Game locked — no more events accepted
6. Final stats computed and snapshot stored
7. Navigates to `/game/{gameId}` (the shareable report)
```

---

### Phase 3: Post-Game

**Sharing the result:**

```
1. Stat keeper is on the GameReportScreen
2. Copies the URL from the browser address bar
3. Pastes into group chat / texts players the link
```

---

## Journey 2: Player — Viewing Stats

**Trigger:** Receives `/game/{id}` link from stat keeper after the game

**Steps:**
1. Opens link on any device (no app, no login)
2. Sees final score (prominent header)
3. Sees full box score with their name/jersey
4. Can scroll to see all players

**UX notes:**
- Page loads fast — snapshot is pre-computed
- No interactive elements — purely read-only
- Works on mobile, laptop, any browser

---

## Journey 3: Spectator — Following a Live Game

**Trigger:** Receives `/game/{id}` link while the game is in progress

**Steps:**
1. Opens link — sees live score and current player stats
2. Page shows current state (fetched once on load)
3. Must refresh to see updates (no real-time sync for MVP)

**UX notes:**
- Clear indication the game is still in progress (vs. final)
- Simple pull-to-refresh on mobile

---

## Key UX Principles Applied

### 2-Tap Rule
Every stat event is exactly 2 taps. No exceptions. No confirmation dialogs for normal events. No numeric input. No text entry during gameplay.

### No Scrolling During Gameplay
The player grid is designed to fill the screen with all players visible simultaneously. Grid tile size adapts to the number of players. Scrolling is a hard failure condition for the live game screen.

### Optimistic UI
The UI responds to every tap in under 50ms regardless of network conditions. Network failures are silent (retry indicator only) and never block the stat keeper.

### Undo is Always One Tap
The Undo button is permanently visible in the header during live gameplay. It always removes the last event. It cannot undo multiple levels in MVP.

### Session Resilience
If the stat keeper accidentally closes the browser, navigates away, or their iPad sleeps, the game is fully recoverable by returning to the same URL. All state is server-persisted in real time.

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Stat keeper taps wrong player | Tap another player tile — selection transfers |
| Stat keeper taps player then changes mind | Tap same player tile again to deselect, or tap different player |
| Network is slow/offline | Event queued, sync indicator shows "syncing"; UI is not blocked |
| Browser refreshed mid-game | Full state restored from server event log on remount |
| Both teams have 0 players | Not possible — "Start Game" disabled until at least 1 player total |
| One team has 12, other has 0 | Other team column shows 12 blank placeholder tiles |
| End Game tapped by mistake | Confirmation modal required — cannot undo End Game in MVP |
| Share link opened before End Game | Shows live stats (read-only), clearly labeled "Game in Progress" |
