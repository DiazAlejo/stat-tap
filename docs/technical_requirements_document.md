# Technical Requirements Document — StatTap MVP

**Version:** 1.0  
**Date:** 2026-06-18  
**Status:** Approved

---

## 1. Tech Stack

**Updated 2026-07-01** — the original v1.0 plan below specified Vercel KV; the project migrated to Supabase on 2026-06-18 (see `docs/superpowers/plans/2026-06-18-supabase-migration.md`). Table reflects the actual current stack (verified against `package.json`).

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Frontend + API routes in one project |
| Language | TypeScript | Type safety across client and server |
| Storage | Supabase (Postgres) | `games` + `events` tables, JSONB payloads — see `database_schema.md` |
| Deployment | Vercel | Native Next.js integration |
| Styling | Tailwind CSS | Utility-first, rapid iPad-first layout |
| Icons | Lucide React | Consistent SVG icon set |
| State | React Context + useReducer | Simple, no external dependency needed |

---

## 2. Architecture

### 2.1 Overview

Pure event log architecture. All game state is derived from an append-only event log. No computed state is persisted during a live game. End Game triggers a one-time snapshot computation.

```
Browser (Next.js Client)
│
├── LocalState: events[], derived GameState, selectedPlayerId
├── Optimistic updates: reducer runs immediately on every tap
│
▼
Next.js API Routes (app/api/)
│
▼
Supabase (Postgres) — src/lib/db.ts
├── games table   → id, meta (jsonb), snapshot (jsonb, set once on End Game), status
└── events table  → id, game_id (FK), payload (jsonb), created_at (insert / delete for undo)
```

### 2.2 Optimistic Update Contract

1. User completes 2-tap interaction
2. Event created locally, pushed to `events[]`
3. Reducer runs synchronously → UI updates (<50ms)
4. `POST /api/game/:id/event` fires in background
5. On success: `syncStatus = 'synced'`
6. On failure: event popped locally, UI reverts, sync error indicator shown (non-blocking)

### 2.3 Game Recovery

On mount at `/live/[gameId]`:
1. `GET /api/game/:id` fetches full event list from KV
2. Events hydrate local array
3. Reducer runs to restore full derived state
4. Game resumes from any device

---

## 3. Data Models

### 3.1 GameMeta
```ts
type GameMeta = {
  id: string                          // crypto.randomUUID()
  teamA: { name: string }             // default: "Team A"
  teamB: { name: string }             // default: "Team B"
  players: Player[]
  mode: 'points-only' | 'make-miss'
  status: 'live' | 'ended'
  createdAt: number                   // Unix ms
}
```

### 3.2 Player
```ts
type Player = {
  id: string          // uuid
  team: 'A' | 'B'
  jersey: string | null
  name: string | null
  displayLabel: string  // resolved at setup (see resolution rules below)
  slot: number          // 1–12, grid position within team column
}
```

**displayLabel resolution (at setup time, immutable):**
1. Jersey + name → `"23 · Jordan"`
2. Jersey only → `"23"`
3. Name only → `"Jordan"`
4. Neither → `"Player {slot}"`

### 3.3 GameEvent
```ts
type GameEvent = {
  id: string
  playerId: string
  team: 'A' | 'B'
  actionType: 'FG_MAKE' | 'FG_MISS' | '3PT_MAKE' | '3PT_MISS' | 'FT_MAKE' | 'FT_MISS'
  points: number    // FG_MAKE=2, 3PT_MAKE=3, FT_MAKE=1, all MISS=0
  timestamp: number // Unix ms
}
```

### 3.4 GameState (derived, never persisted during live game)
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

### 3.5 GameSnapshot (written once on End Game)
```ts
type GameSnapshot = {
  meta: GameMeta
  events: GameEvent[]
  finalState: GameState
  endedAt: number
}
```

---

## 4. Reducer

Pure function, shared between client and server code:

```ts
// lib/reducer.ts
export function gameReducer(events: GameEvent[]): GameState {
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
  }, initialGameState())
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

## 5. API Routes

All routes in `app/api/` (Next.js App Router).

### 5.1 Route Table

| Method | Route | Action |
|---|---|---|
| POST | `/api/game` | Create game |
| GET | `/api/game/[id]` | Fetch game (live or ended) |
| POST | `/api/game/[id]/event` | Append event |
| POST | `/api/game/[id]/undo` | Pop last event |
| POST | `/api/game/[id]/end` | Finalize game, compute snapshot |

### 5.2 Request / Response Contracts

```
POST /api/game
  Body:     { teamA: { name }, teamB: { name }, players: Player[], mode }
  Response: { gameId: string }
  KV:       SET game:{id}:meta, RPUSH game:{id}:events []

GET /api/game/[id]
  Response: { meta: GameMeta, events: GameEvent[], snapshot?: GameSnapshot }
  Note:     If status=ended, snapshot is source of truth

POST /api/game/[id]/event
  Body:     GameEvent
  Response: { ok: true }
  KV:       RPUSH game:{id}:events event

POST /api/game/[id]/undo
  Body:     {}
  Response: { ok: true, removedEvent: GameEvent | null }
  KV:       RPOP game:{id}:events

POST /api/game/[id]/end
  Body:     {}
  Response: { snapshot: GameSnapshot }
  KV:       SET game:{id}:snapshot, UPDATE game:{id}:meta status=ended
```

### 5.3 Security

- No authentication on any route
- Game ID is `crypto.randomUUID()` — 128-bit random, unguessable
- No rate limiting required for MVP

---

## 6. Frontend Routes

| Route | Component | Description |
|---|---|---|
| `/` | `GameSetupScreen` | Create new game |
| `/live/[gameId]` | `LiveGameScreen` | Live stat entry (primary interface) |
| `/game/[gameId]` | `GameReportScreen` | Public read-only game report |

---

## 7. Component Architecture

```
app/
├── page.tsx                    → GameSetupScreen
├── live/[gameId]/page.tsx      → LiveGameScreen
├── game/[gameId]/page.tsx      → GameReportScreen
│
├── api/
│   ├── game/route.ts           → POST /api/game
│   └── game/[id]/
│       ├── route.ts            → GET /api/game/[id]
│       ├── event/route.ts      → POST /api/game/[id]/event
│       ├── undo/route.ts       → POST /api/game/[id]/undo
│       └── end/route.ts        → POST /api/game/[id]/end
│
components/
├── setup/
│   ├── TeamNameInput.tsx
│   ├── PlayerEntryList.tsx
│   ├── PlayerEntryRow.tsx
│   └── ModeSelector.tsx
│
├── live/
│   ├── ScoreHeader.tsx
│   ├── PlayerGrid.tsx
│   ├── TeamColumn.tsx
│   ├── PlayerTile.tsx
│   ├── BlankTile.tsx
│   ├── ActionBar.tsx
│   ├── LiveStatsPanel.tsx
│   └── EndGameModal.tsx
│
├── report/
│   ├── FinalScoreHeader.tsx
│   └── BoxScoreTable.tsx
│
└── ui/
    └── SyncIndicator.tsx
│
lib/
├── reducer.ts                  → gameReducer (pure, shared client+server)
├── types.ts                    → all TypeScript types
├── kv.ts                       → Vercel KV helpers
└── game.ts                     → displayLabel resolution, emptyStats, initialState
```

---

## 8. Performance Requirements

| Requirement | Target |
|---|---|
| UI response to tap | < 50ms (optimistic, local) |
| API event persistence | < 300ms p95 |
| Game recovery on page load | < 1s |
| Player grid render | 0 layout recalculations during gameplay |
| Re-renders per stat event | Only affected components (score + selected player tile) |

---

## 9. Browser / Device Requirements

| Requirement | Spec |
|---|---|
| Primary target | iPad Safari (iPadOS 16+) |
| Secondary | Chrome/Safari on macOS |
| Tertiary | Mobile Safari / Chrome (read-only report) |
| Minimum viewport width | 375px |
| Touch target minimum | 56px height (exceeds 44pt HIG minimum) |
| Offline behavior | Not supported — requires network for event persistence |

---

## 10. Supabase Table Schema

```
games   TABLE  id (PK), meta (jsonb), snapshot (jsonb, written once), status, created_at
events  TABLE  id (PK), game_id (FK -> games.id), payload (jsonb), created_at
```

Full column reference and JSONB shapes: `database_schema.md`.

TTL: No TTL/expiry set for MVP. Games persist indefinitely in Supabase.
