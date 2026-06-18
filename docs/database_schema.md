# Database Schema — StatTap MVP

**Version:** 1.0  
**Date:** 2026-06-18  
**Storage:** Vercel KV (Redis)

---

## Overview

StatTap uses Vercel KV (Redis) as its only data store. There is no relational database. All data is stored as JSON strings or Redis lists, keyed by game ID.

---

## Key Naming Convention

```
game:{uuid}:meta        → Game metadata (JSON string)
game:{uuid}:events      → Ordered event log (Redis LIST)
game:{uuid}:snapshot    → Final game snapshot (JSON string, set once)
```

All `{uuid}` values are generated via `crypto.randomUUID()` at game creation.

---

## Key 1: `game:{id}:meta`

**Type:** Redis STRING (JSON)  
**Written:** Once at game creation (`POST /api/game`)  
**Updated:** Once at End Game (status field: `live` → `ended`)  
**Read:** On every `GET /api/game/:id`

### Schema

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "teamA": { "name": "Lakers" },
  "teamB": { "name": "Celtics" },
  "players": [
    {
      "id": "a1b2c3d4-...",
      "team": "A",
      "jersey": "23",
      "name": "Jordan",
      "displayLabel": "23 · Jordan",
      "slot": 1
    },
    {
      "id": "e5f6g7h8-...",
      "team": "A",
      "jersey": "14",
      "name": null,
      "displayLabel": "14",
      "slot": 2
    },
    {
      "id": "i9j0k1l2-...",
      "team": "B",
      "jersey": null,
      "name": "Marcus",
      "displayLabel": "Marcus",
      "slot": 1
    },
    {
      "id": "m3n4o5p6-...",
      "team": "B",
      "jersey": null,
      "name": null,
      "displayLabel": "Player 2",
      "slot": 2
    }
  ],
  "mode": "make-miss",
  "status": "live",
  "createdAt": 1750281600000
}
```

### Field Reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | Yes | Primary key, game identifier |
| `teamA.name` | string | Yes | Default: "Team A" |
| `teamB.name` | string | Yes | Default: "Team B" |
| `players` | Player[] | Yes | Min 1 total; max 12 per team |
| `players[].id` | string (UUID) | Yes | Player identifier, never changes |
| `players[].team` | "A" \| "B" | Yes | Team assignment |
| `players[].jersey` | string \| null | No | Optional, max 3 chars |
| `players[].name` | string \| null | No | Optional, max 30 chars |
| `players[].displayLabel` | string | Yes | Resolved at setup, immutable |
| `players[].slot` | number (1–12) | Yes | Grid position within team column |
| `mode` | "points-only" \| "make-miss" | Yes | Fixed for game duration |
| `status` | "live" \| "ended" | Yes | Changed once on End Game |
| `createdAt` | number (Unix ms) | Yes | Set at creation |

---

## Key 2: `game:{id}:events`

**Type:** Redis LIST  
**Append:** `RPUSH game:{id}:events <json>` on each stat event  
**Undo:** `RPOP game:{id}:events` to remove last event  
**Read:** `LRANGE game:{id}:events 0 -1` to get full event log  

### Individual Event Schema

```json
{
  "id": "q7r8s9t0-e29b-41d4-a716-446655440001",
  "playerId": "a1b2c3d4-...",
  "team": "A",
  "actionType": "FG_MAKE",
  "points": 2,
  "timestamp": 1750281720000
}
```

### Field Reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | Yes | Event identifier |
| `playerId` | string (UUID) | Yes | References `players[].id` in meta |
| `team` | "A" \| "B" | Yes | Redundant (derivable from playerId) but stored for fast reads |
| `actionType` | enum | Yes | See Action Types below |
| `points` | number | Yes | Pre-computed at event creation |
| `timestamp` | number (Unix ms) | Yes | Client-generated at tap time |

### Action Types

| actionType | points | Description |
|---|---|---|
| `FG_MAKE` | 2 | Field goal made (2-pointer) |
| `FG_MISS` | 0 | Field goal missed |
| `3PT_MAKE` | 3 | Three-pointer made |
| `3PT_MISS` | 0 | Three-pointer missed |
| `FT_MAKE` | 1 | Free throw made |
| `FT_MISS` | 0 | Free throw missed |

### Redis Operations

| Operation | Command | When |
|---|---|---|
| Add event | `RPUSH game:{id}:events {json}` | `POST /api/game/:id/event` |
| Undo last event | `RPOP game:{id}:events` | `POST /api/game/:id/undo` |
| Read all events | `LRANGE game:{id}:events 0 -1` | `GET /api/game/:id` |
| Count events | `LLEN game:{id}:events` | Diagnostic only |

---

## Key 3: `game:{id}:snapshot`

**Type:** Redis STRING (JSON)  
**Written:** Once on End Game (`POST /api/game/:id/end`)  
**Never updated** after being set  
**Read:** By `/game/{id}` report page  

### Schema

```json
{
  "meta": { ... },
  "events": [ ... ],
  "finalState": {
    "scoreA": 48,
    "scoreB": 41,
    "playerStats": {
      "a1b2c3d4-...": {
        "points": 18,
        "fgMakes": 5,
        "fgAttempts": 9,
        "threeMakes": 1,
        "threeAttempts": 2,
        "ftMakes": 5,
        "ftAttempts": 6
      }
    }
  },
  "endedAt": 1750284000000
}
```

### Field Reference

| Field | Type | Notes |
|---|---|---|
| `meta` | GameMeta | Full copy of `game:{id}:meta` at time of End Game |
| `events` | GameEvent[] | Full copy of event list at time of End Game |
| `finalState` | GameState | Computed by running reducer over all events |
| `finalState.scoreA` | number | Total points scored by Team A |
| `finalState.scoreB` | number | Total points scored by Team B |
| `finalState.playerStats` | Record<playerId, PlayerStats> | Per-player computed stats |
| `finalState.playerStats[id].points` | number | Total points |
| `finalState.playerStats[id].fgMakes` | number | Field goals made |
| `finalState.playerStats[id].fgAttempts` | number | Field goals attempted |
| `finalState.playerStats[id].threeMakes` | number | Three-pointers made |
| `finalState.playerStats[id].threeAttempts` | number | Three-pointers attempted |
| `finalState.playerStats[id].ftMakes` | number | Free throws made |
| `finalState.playerStats[id].ftAttempts` | number | Free throws attempted |
| `endedAt` | number (Unix ms) | Timestamp of End Game trigger |

---

## Data Size Estimates

| Key | Estimated Size | Notes |
|---|---|---|
| `game:{id}:meta` | ~2–4 KB | Scales with player count |
| `game:{id}:events` (per item) | ~200–300 bytes | Each event JSON |
| `game:{id}:events` (full list, 200 events) | ~50–60 KB | Typical full game |
| `game:{id}:snapshot` | ~55–65 KB | Meta + events + finalState |

Vercel KV free tier: 256 MB storage. StatTap games are negligibly small.

---

## TTL Policy

MVP: **No TTL set.** Games persist indefinitely in Vercel KV.

Future consideration: Set TTL of 30 days on `game:{id}:meta` and `game:{id}:events` after End Game.

---

## No Relational Schema

StatTap explicitly has no:
- User table
- Team table (teams are embedded in game meta)
- Player table (players are embedded in game meta)
- Season or league table
- Cross-game relations of any kind

Every game is a fully self-contained document.
