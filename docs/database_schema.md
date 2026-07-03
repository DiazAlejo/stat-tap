# Database Schema — StatTap MVP

**Version:** 2.0
**Date:** 2026-07-01 (updated — migrated off the original v1.0 Vercel KV design on 2026-06-18, same day it was written)
**Storage:** Supabase (Postgres)

---

## Overview

StatTap uses Supabase Postgres as its only data store, accessed via `@supabase/supabase-js` in `src/lib/db.ts`. There are two tables: `games` and `events`. Game and player data is stored as JSONB rather than fully normalized — the relational structure exists only for the `events.game_id` foreign key.

---

## Table: `games`

**Written:** Once at game creation (`POST /api/game`)
**Updated:** `meta`/`status` on each event-driven change; `snapshot`/`status` once at End Game
**Read:** On every `GET /api/game/:id` and by `listGames()` for the game list

```sql
create table games (
  id         text primary key,
  meta       jsonb not null,
  snapshot   jsonb,
  status     text not null default 'live',
  created_at timestamptz not null default now()
);
```

### Column Reference

| Column | Type | Notes |
|---|---|---|
| `id` | text | Primary key, `crypto.randomUUID()` generated at game creation |
| `meta` | jsonb | Full `GameMeta` object (see below) |
| `snapshot` | jsonb, nullable | Full `GameSnapshot`, set once on End Game, never updated after |
| `status` | text | `'live'` \| `'ended'` |
| `created_at` | timestamptz | Set at row creation |

### `meta` (GameMeta) shape

```ts
{
  id: string
  teamA: { name: string }
  teamB: { name: string }
  players: Player[]
  mode: 'points-only' | 'make-miss'
  status: 'live' | 'ended'
  createdAt: number
  teamAColor?: string
  teamBColor?: string
  scoreA?: number
  scoreB?: number
}
```

### `Player` shape (embedded in `meta.players`)

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Player identifier, never changes |
| `team` | `'A' \| 'B'` | Team assignment |
| `jersey` | string \| null | Optional |
| `name` | string \| null | Optional |
| `displayLabel` | string | Resolved at setup, immutable — see resolution rules in `technical_requirements_document.md` |
| `slot` | number (1–12) | Grid position within team column |

---

## Table: `events`

**Insert:** `insert into events` on each stat event
**Undo:** Fetch the most recent row by `game_id` + `created_at desc`, then `delete` it
**Read:** `select * from events where game_id = :id order by created_at asc`

```sql
create table events (
  id         text primary key,
  game_id    text not null references games(id),
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

create index events_game_id_created_at on events(game_id, created_at);
```

### `payload` (GameEvent) shape

```ts
{
  id: string
  playerId: string
  team: 'A' | 'B'
  actionType: 'FG_MAKE' | 'FG_MISS' | '3PT_MAKE' | '3PT_MISS' | 'FT_MAKE' | 'FT_MISS'
  points: number
  timestamp: number
}
```

### Action Types

| actionType | points | Description |
|---|---|---|
| `FG_MAKE` | 2 | Field goal made (2-pointer) |
| `FG_MISS` | 0 | Field goal missed |
| `3PT_MAKE` | 3 | Three-pointer made |
| `3PT_MISS` | 0 | Three-pointer missed |
| `FT_MAKE` | 1 | Free throw made |
| `FT_MISS` | 0 | Free throw missed |

---

## `snapshot` (GameSnapshot) shape

Written once on End Game, never updated:

```ts
{
  meta: GameMeta
  events: GameEvent[]
  finalState: {
    scoreA: number
    scoreB: number
    playerStats: Record<string, {
      points: number
      fgMakes: number
      fgAttempts: number
      threeMakes: number
      threeAttempts: number
      ftMakes: number
      ftAttempts: number
    }>
  }
  endedAt: number
}
```

---

## Deleting a Game

`deleteGame()` in `src/lib/db.ts` deletes `events` rows for the game first (FK constraint), then the `games` row. Throws if the `games` delete affects zero rows (RLS may be blocking it).

---

## No Additional Relational Schema

StatTap still has no:
- User table
- Separate `teams`/`players` tables (embedded in `games.meta` as JSONB)
- Season or league table
- Cross-game relations beyond `events.game_id → games.id`

---

## Source of Truth

This doc is generated from the actual implementation in `src/lib/db.ts` and `src/lib/database.types.ts` (Supabase-generated types) as of 2026-07-01. If those files change, update this doc to match — don't let it drift again the way the original Vercel KV version did.
