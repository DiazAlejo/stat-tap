# StatTap MVP — Design Spec

**Date:** 2026-06-18  
**Status:** Approved

---

## Overview

StatTap is a real-time basketball pickup game stat tracker web app. A single stat keeper tracks all events live from the sideline. The core experience is **2 taps → instant stat → zero friction**.

---

## Confirmed Decisions

| Decision | Choice |
|---|---|
| Frontend framework | Next.js 14 (App Router) |
| Backend | Next.js API routes (same project) |
| Storage | Vercel KV (Redis) |
| Deployment | Vercel |
| Stat mode | Chosen at game setup, fixed for duration |
| Max players per team | 12 |
| Player grid layout | Symmetric mirrored — `max(teamA, teamB)` rows, shorter team gets disabled placeholder tiles |
| Player identity | Jersey and name both optional; auto-label "Player N" if neither provided |
| Game persistence | Every event auto-saved to server in real time (survives browser close) |
| Architecture | Pure event log — derived state computed by reducer, never stored during live game |

---

## Architecture

### Stack

- **Next.js 14** — frontend + API routes in one project
- **Vercel KV** — event log, game metadata, end-game snapshots
- **Deployed on Vercel**

### Data Flow

1. Stat keeper creates game → `POST /api/game` → KV stores game config, returns `gameId`
2. Browser navigates to `/live/{gameId}`
3. Each tap pair (player → action) fires `POST /api/game/:id/event` → event appended to KV list
4. Frontend reducer recomputes state optimistically — UI updates instantly before server responds
5. Server response confirms persistence; on failure, event is rolled back locally and error shown
6. Undo → `POST /api/game/:id/undo` → pops KV list tail, frontend pops local array
7. End Game → `POST /api/game/:id/end` → server runs reducer over event log, stores immutable snapshot
8. Share URL → `/game/{id}` fetches snapshot (or live events if game still active), renders read-only

### KV Data Structure

```
game:{id}:meta      → { teamA, teamB, players, mode, status, createdAt }
game:{id}:events    → Redis LIST of serialized GameEvent objects (RPUSH to append, RPOP to undo)
game:{id}:snapshot  → GameSnapshot (set only on End Game)
```

---

## Data Models

### GameMeta

```ts
type GameMeta = {
  id: string
  teamA: { name: string }
  teamB: { name: string }
  players: Player[]
  mode: 'points-only' | 'make-miss'
  status: 'live' | 'ended'
  createdAt: number
}
```

### Player

```ts
type Player = {
  id: string          // uuid, generated at game setup
  team: 'A' | 'B'
  jersey: string | null
  name: string | null
  displayLabel: string  // resolved at setup: "23 · Jordan" | "23" | "Jordan" | "Player 4"
  slot: number          // 1–12, position in grid column
}
```

Display label resolution priority:
1. Jersey + name → `"23 · Jordan"`
2. Jersey only → `"23"`
3. Name only → `"Jordan"`
4. Neither → `"Player N"` (N = slot number)

### GameEvent

```ts
type GameEvent = {
  id: string
  playerId: string
  team: 'A' | 'B'
  actionType: 'FG_MAKE' | 'FG_MISS' | '3PT_MAKE' | '3PT_MISS' | 'FT_MAKE' | 'FT_MISS'
  points: number   // FG_MAKE=2, 3PT_MAKE=3, FT_MAKE=1, all MISS=0
  timestamp: number
}
```

### Derived State (never persisted during live game)

```ts
type GameState = {
  scoreA: number
  scoreB: number
  playerStats: Record<string, PlayerStats>
}

type PlayerStats = {
  points: number
  fgMakes: number
  fgAttempts: number
  threeMakes: number
  threeAttempts: number
  ftMakes: number
  ftAttempts: number
}
```

### GameSnapshot (stored on End Game)

```ts
type GameSnapshot = {
  meta: GameMeta
  events: GameEvent[]
  finalState: GameState
  endedAt: number
}
```

---

## Reducer Logic

The reducer is a pure function shared between client and server:

```ts
function gameReducer(events: GameEvent[]): GameState {
  return events.reduce((state, event) => {
    const stats = state.playerStats[event.playerId] ?? emptyStats()
    return {
      ...state,
      scoreA: event.team === 'A' ? state.scoreA + event.points : state.scoreA,
      scoreB: event.team === 'B' ? state.scoreB + event.points : state.scoreB,
      playerStats: {
        ...state.playerStats,
        [event.playerId]: applyEvent(stats, event)
      }
    }
  }, initialState())
}

function applyEvent(stats: PlayerStats, event: GameEvent): PlayerStats {
  switch (event.actionType) {
    case 'FG_MAKE':  return { ...stats, points: stats.points + 2, fgMakes: stats.fgMakes + 1, fgAttempts: stats.fgAttempts + 1 }
    case 'FG_MISS':  return { ...stats, fgAttempts: stats.fgAttempts + 1 }
    case '3PT_MAKE': return { ...stats, points: stats.points + 3, threeMakes: stats.threeMakes + 1, threeAttempts: stats.threeAttempts + 1 }
    case '3PT_MISS': return { ...stats, threeAttempts: stats.threeAttempts + 1 }
    case 'FT_MAKE':  return { ...stats, points: stats.points + 1, ftMakes: stats.ftMakes + 1, ftAttempts: stats.ftAttempts + 1 }
    case 'FT_MISS':  return { ...stats, ftAttempts: stats.ftAttempts + 1 }
  }
}
```

---

## Client-Side State

```ts
type ClientState = {
  meta: GameMeta
  events: GameEvent[]          // local copy, grows per tap
  derived: GameState           // recomputed after every push/pop
  selectedPlayerId: string | null   // cleared after action tap
  syncStatus: 'synced' | 'syncing' | 'error'
}
```

### Optimistic Update Flow

1. User taps action → event created locally → pushed to `events[]` → reducer runs → UI updates
2. Background: `POST /api/game/:id/event` fires
3. On success: `syncStatus = 'synced'`
4. On failure: event popped from local array, UI reverts, error indicator shown

### Undo Flow

1. User taps Undo → last event popped from local `events[]` → reducer reruns → UI updates instantly
2. Background: `POST /api/game/:id/undo` fires to pop from KV list

### Game Recovery

On mount at `/live/[gameId]`, fetch `GET /api/game/:id`, hydrate local event array, run reducer to restore full derived state. Survives any browser close or refresh.

---

## API Routes

All routes in `app/api/` (Next.js App Router):

| Method | Route | Description |
|---|---|---|
| POST | `/api/game` | Create game, store meta in KV, return gameId |
| GET | `/api/game/[id]` | Return meta + events (live) or snapshot (ended) |
| POST | `/api/game/[id]/event` | Append event to KV list (RPUSH) |
| POST | `/api/game/[id]/undo` | Pop last event from KV list (RPOP) |
| POST | `/api/game/[id]/end` | Run reducer, store snapshot, set status = 'ended' |

### Request / Response Shapes

```
POST /api/game
  body:     { teamA: { name }, teamB: { name }, players: Player[], mode }
  response: { gameId: string }

POST /api/game/[id]/event
  body:     GameEvent
  response: { ok: true }

POST /api/game/[id]/undo
  body:     {}
  response: { ok: true, removedEvent: GameEvent | null }

POST /api/game/[id]/end
  body:     {}
  response: { snapshot: GameSnapshot }

GET /api/game/[id]
  response: { meta, events, snapshot? }
  note:     if status=ended, snapshot is source of truth for /game/[id] page
```

**Security:** No authentication. Game ID is a `crypto.randomUUID()` — unguessable for MVP purposes.

---

## UI Component Structure

### Routes

```
/                    → GameSetupScreen
/live/[gameId]       → LiveGameScreen
/game/[gameId]       → GameReportScreen (public, read-only)
```

### Component Tree

```
GameSetupScreen
├── TeamNameInputs (A / B)
├── PlayerEntryList (Team A)  — add/remove players, jersey + name inputs
├── PlayerEntryList (Team B)
├── ModeSelector  (points-only | make-miss)
└── StartGameButton

LiveGameScreen
├── ScoreHeader
│   ├── TeamScore (A)
│   ├── TeamScore (B)
│   ├── UndoButton
│   └── EndGameButton
├── PlayerGrid
│   ├── TeamColumn (A)
│   │   └── PlayerTile × N  (or BlankTile for padding slots)
│   └── TeamColumn (B)
│       └── PlayerTile × N  (or BlankTile for padding slots)
├── ActionBar  (appears after player is selected)
│   ├── [Points Only]   +1 FT / +2 FG / +3 3PT
│   └── [Make/Miss]     FT Make · FT Miss / FG Make · FG Miss / 3PT Make · 3PT Miss
├── LiveStatsPanel  (tab/overlay, read-only)
│   ├── PointsView        — player → total points
│   └── ShootingView      — player → FG / 3PT / FT makes/attempts
└── EndGameModal  (confirmation dialog)

GameReportScreen
├── FinalScoreHeader
├── BoxScoreTable (Team A)
└── BoxScoreTable (Team B)
```

### Player Grid Layout Rules

- Two columns: Team A (left) / Team B (right)
- Row count = `max(teamA.length, teamB.length)`
- Grid height = viewport height minus ScoreHeader and ActionBar heights
- Tile height = `gridHeight / rowCount` (minimum 56px touch target floor)
- PlayerTile: tappable, shows `displayLabel`, highlights on selection
- BlankTile: same dimensions, visually dimmed, no interaction

### Interaction State Machine

```
idle
  → [tap player tile]
playerSelected  (player tile highlighted, ActionBar appears)
  → [tap action button]
recording  (optimistic update fires, event created)
  → [reducer runs, UI updates]
idle  (selectedPlayerId cleared, ActionBar hides)

Any state → [tap Undo] → undo fires, state reverts → idle
```

---

## Shareable Game Report

- `/game/{id}` is publicly accessible, no login required
- Fetches `GET /api/game/:id` — if `status=ended`, renders from snapshot
- If `status=live`, renders current derived state as read-only (allows friends to follow along)
- Snapshot is immutable once End Game is triggered
- Share mechanism: stat keeper copies URL from browser address bar (no in-app share button needed for MVP)

---

## Strict MVP Boundaries

The following are explicitly out of scope and must not be added:

- Authentication or user accounts
- Persistent players or rosters across games
- Leagues, seasons, or game history
- Exports (CSV, PDF, Excel)
- Advanced stats (assists, rebounds, steals, blocks, turnovers)
- Multiple simultaneous active games
- Scrolling in the live game screen
- Push notifications or real-time sync to spectators (report page is pull-only)
