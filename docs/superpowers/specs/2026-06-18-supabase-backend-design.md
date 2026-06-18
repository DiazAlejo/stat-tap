# Supabase Backend Migration — StatTap MVP

**Date:** 2026-06-18  
**Scope:** Replace `@vercel/kv` with Supabase (Postgres) in the data layer only. Zero frontend changes, zero API route changes.

---

## Architecture

The swap is purely in the data layer. Nothing above `src/lib/db.ts` changes.

```
Frontend (unchanged)
    ↓
API Routes (unchanged) — import getMeta, setMeta, getEvents, pushEvent, popEvent, getSnapshot, setSnapshot
    ↓
src/lib/db.ts  ← replaces src/lib/kv.ts (same exported function names, Supabase implementation)
    ↓
Supabase (Postgres via @supabase/supabase-js)
```

**Files changed:**
- `src/lib/kv.ts` — deleted
- `src/lib/db.ts` — created (same 7 function signatures)
- `src/app/api/game/route.ts` — import path updated only
- `src/app/api/game/[id]/route.ts` — import path updated only
- `src/app/api/game/[id]/event/route.ts` — import path updated only
- `src/app/api/game/[id]/undo/route.ts` — import path updated only
- `src/app/api/game/[id]/end/route.ts` — import path updated only
- `src/app/game/[gameId]/page.tsx` — import path updated only
- `.env.local` — new Supabase env vars

**Files NOT changed:** All components, context, reducer, types, game utilities, layout, pages.

---

## Database Schema

### Table: `games`

```sql
create table games (
  id         text primary key,
  meta       jsonb not null,
  snapshot   jsonb,
  status     text not null default 'live',
  created_at timestamptz not null default now()
);
```

| Column | Type | Notes |
|---|---|---|
| `id` | `text` (PK) | UUID from `crypto.randomUUID()` |
| `meta` | `jsonb` | Full `GameMeta` object |
| `snapshot` | `jsonb` | `GameSnapshot` — null until End Game |
| `status` | `text` | `'live'` or `'ended'` — denormalized for fast reads |
| `created_at` | `timestamptz` | Set by Postgres `now()` |

### Table: `events`

```sql
create table events (
  id         text primary key,
  game_id    text not null references games(id),
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

create index events_game_id_created_at on events(game_id, created_at);
```

| Column | Type | Notes |
|---|---|---|
| `id` | `text` (PK) | UUID from the `GameEvent.id` field |
| `game_id` | `text` (FK) | References `games.id`, indexed |
| `payload` | `jsonb` | Full `GameEvent` object |
| `created_at` | `timestamptz` | Used for ordering and undo |

### No RLS

Row Level Security is disabled for MVP — all reads are public (the game report route reads without auth), and writes come only from server-side API routes using the service role key.

---

## `src/lib/db.ts` — Function Signatures

Identical to the current `kv.ts` exports:

```ts
getMeta(gameId: string): Promise<GameMeta | null>
  // SELECT meta FROM games WHERE id = gameId

setMeta(gameId: string, meta: GameMeta): Promise<void>
  // UPSERT into games (id, meta, status)

getEvents(gameId: string): Promise<GameEvent[]>
  // SELECT payload FROM events WHERE game_id = gameId ORDER BY created_at ASC

pushEvent(gameId: string, event: GameEvent): Promise<void>
  // INSERT into events (id, game_id, payload)

popEvent(gameId: string): Promise<GameEvent | null>
  // DELETE FROM events WHERE id = (
  //   SELECT id FROM events WHERE game_id = gameId ORDER BY created_at DESC LIMIT 1
  // ) RETURNING payload

getSnapshot(gameId: string): Promise<GameSnapshot | null>
  // SELECT snapshot FROM games WHERE id = gameId

setSnapshot(gameId: string, snapshot: GameSnapshot): Promise<void>
  // UPDATE games SET snapshot = snapshot, status = 'ended' WHERE id = gameId
```

### Supabase Client

One singleton client in `db.ts`, server-side only:

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

Service role key is used (not anon key) — bypasses RLS, correct for server-side API routes. This key must never be exposed to the client.

---

## Environment Variables

Remove from `.env.local`:
```
KV_REST_API_URL
KV_REST_API_TOKEN
```

Add to `.env.local`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Migration Steps (for implementation)

1. Install `@supabase/supabase-js`, uninstall `@vercel/kv`
2. Run SQL migrations in Supabase dashboard (create `games` and `events` tables)
3. Add env vars to `.env.local`
4. Create `src/lib/db.ts` with Supabase implementation
5. Delete `src/lib/kv.ts`
6. Update import paths in all 5 API routes and the report page
7. Run `npm run build` — must pass
8. Manual smoke test: create game, record events, undo, end game, view report

---

## Behavioral Differences from KV

| Operation | Vercel KV | Supabase |
|---|---|---|
| Store game | `SET game:{id}:meta` | `INSERT INTO games` |
| Get game | `GET game:{id}:meta` | `SELECT FROM games WHERE id` |
| Append event | `RPUSH game:{id}:events` | `INSERT INTO events` |
| Undo last event | `RPOP game:{id}:events` | `DELETE ... ORDER BY created_at DESC LIMIT 1` |
| Get all events | `LRANGE game:{id}:events 0 -1` | `SELECT ... ORDER BY created_at ASC` |
| Store snapshot | `SET game:{id}:snapshot` | `UPDATE games SET snapshot` |
| Get snapshot | `GET game:{id}:snapshot` | `SELECT snapshot FROM games WHERE id` |

Functionally identical from the user's perspective.
