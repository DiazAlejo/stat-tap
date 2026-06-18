# Supabase Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `@vercel/kv` with Supabase Postgres as the data store, keeping all API route and frontend code unchanged.

**Architecture:** A single file `src/lib/db.ts` replaces `src/lib/kv.ts` with identical exported function signatures backed by Supabase instead of Redis. All 5 API routes and the report page only need their import path updated from `@/lib/kv` to `@/lib/db`.

**Tech Stack:** `@supabase/supabase-js`, Next.js 16 App Router, TypeScript strict, Vitest

---

## File Map

| Action | File |
|---|---|
| Create | `src/lib/db.ts` |
| Create | `src/test/db.test.ts` |
| Delete | `src/lib/kv.ts` |
| Modify (import only) | `src/app/api/game/route.ts` |
| Modify (import only) | `src/app/api/game/[id]/route.ts` |
| Modify (import only) | `src/app/api/game/[id]/event/route.ts` |
| Modify (import only) | `src/app/api/game/[id]/undo/route.ts` |
| Modify (import only) | `src/app/api/game/[id]/end/route.ts` |
| Modify (import only) | `src/app/game/[gameId]/page.tsx` |
| Modify | `.env.local` |
| Modify (via npm) | `package.json` |

---

## Task 1: Install Dependencies + Create Supabase Tables + Update Env Vars

**Files:**
- Modify: `package.json` (via npm commands)
- Modify: `.env.local`

- [ ] **Step 1: Swap npm packages**

```bash
npm uninstall @vercel/kv
npm install @supabase/supabase-js
```

Expected: `package.json` no longer lists `@vercel/kv`, now lists `@supabase/supabase-js`.

- [ ] **Step 2: Create tables in Supabase dashboard**

Go to your Supabase project → SQL Editor → run this migration:

```sql
create table games (
  id         text primary key,
  meta       jsonb not null,
  snapshot   jsonb,
  status     text not null default 'live',
  created_at timestamptz not null default now()
);

create table events (
  id         text primary key,
  game_id    text not null references games(id),
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

create index events_game_id_created_at on events(game_id, created_at);
```

Expected: Both tables appear in the Supabase Table Editor.

- [ ] **Step 3: Copy Supabase credentials**

In the Supabase dashboard → Project Settings → API:
- Copy **Project URL** (e.g. `https://xxxx.supabase.co`)
- Copy **service_role** key (under "Project API keys", NOT the anon key)

- [ ] **Step 4: Update `.env.local`**

Replace the old KV vars with Supabase vars. The file should contain:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Remove `KV_REST_API_URL` and `KV_REST_API_TOKEN` entirely.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.local
git commit -m "chore: swap @vercel/kv for @supabase/supabase-js, update env vars"
```

---

## Task 2: Create `src/lib/db.ts`

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Write the failing type-check test first**

Create `src/test/db.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock must be declared before importing db
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

// Import after mock is set up
const { getMeta, getEvents, pushEvent, popEvent, getSnapshot } = await import('@/lib/db')

describe('db helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMeta returns null when game not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    const result = await getMeta('nonexistent')
    expect(result).toBeNull()
  })

  it('getMeta returns meta object when game exists', async () => {
    const fakeMeta = { id: 'game-1', teamA: { name: 'Lakers' }, teamB: { name: 'Celtics' }, players: [], mode: 'points-only', status: 'live', createdAt: 1 }
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { meta: fakeMeta }, error: null }),
        }),
      }),
    })
    const result = await getMeta('game-1')
    expect(result).toEqual(fakeMeta)
  })

  it('getEvents returns empty array when no events', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })
    const result = await getEvents('game-1')
    expect(result).toEqual([])
  })

  it('getEvents returns payloads in order', async () => {
    const fakeEvents = [
      { id: 'e1', playerId: 'p1', team: 'A', actionType: 'FG_MAKE', points: 2, timestamp: 1 },
      { id: 'e2', playerId: 'p1', team: 'A', actionType: 'FT_MAKE', points: 1, timestamp: 2 },
    ]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: fakeEvents.map(e => ({ payload: e })), error: null }),
        }),
      }),
    })
    const result = await getEvents('game-1')
    expect(result).toEqual(fakeEvents)
  })

  it('popEvent returns null when no events exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    })
    const result = await popEvent('game-1')
    expect(result).toBeNull()
  })

  it('getSnapshot returns null when no snapshot', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { snapshot: null }, error: null }),
        }),
      }),
    })
    const result = await getSnapshot('game-1')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- --run src/test/db.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/db'`

- [ ] **Step 3: Create `src/lib/db.ts`**

```ts
import { createClient } from '@supabase/supabase-js'
import type { GameMeta, GameEvent, GameSnapshot } from './types'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getMeta(gameId: string): Promise<GameMeta | null> {
  const { data } = await supabase
    .from('games')
    .select('meta')
    .eq('id', gameId)
    .single()
  return data?.meta ?? null
}

export async function setMeta(gameId: string, meta: GameMeta): Promise<void> {
  await supabase
    .from('games')
    .upsert({ id: gameId, meta, status: meta.status })
}

export async function getEvents(gameId: string): Promise<GameEvent[]> {
  const { data } = await supabase
    .from('events')
    .select('payload')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })
  return (data ?? []).map(row => row.payload as GameEvent)
}

export async function pushEvent(gameId: string, event: GameEvent): Promise<void> {
  await supabase
    .from('events')
    .insert({ id: event.id, game_id: gameId, payload: event })
}

export async function popEvent(gameId: string): Promise<GameEvent | null> {
  const { data: last } = await supabase
    .from('events')
    .select('id, payload')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!last) return null

  await supabase.from('events').delete().eq('id', last.id)
  return last.payload as GameEvent
}

export async function getSnapshot(gameId: string): Promise<GameSnapshot | null> {
  const { data } = await supabase
    .from('games')
    .select('snapshot')
    .eq('id', gameId)
    .single()
  return data?.snapshot ?? null
}

export async function setSnapshot(gameId: string, snapshot: GameSnapshot): Promise<void> {
  await supabase
    .from('games')
    .update({ snapshot, status: 'ended' })
    .eq('id', gameId)
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm test -- --run src/test/db.test.ts
```

Expected: 6/6 passing

- [ ] **Step 5: Run full test suite — no regressions**

```bash
npm test -- --run
```

Expected: 19/19 passing (13 existing + 6 new)

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.ts src/test/db.test.ts
git commit -m "feat: add Supabase db helpers replacing Vercel KV"
```

---

## Task 3: Update Import Paths + Delete kv.ts

**Files:**
- Modify: `src/app/api/game/route.ts`
- Modify: `src/app/api/game/[id]/route.ts`
- Modify: `src/app/api/game/[id]/event/route.ts`
- Modify: `src/app/api/game/[id]/undo/route.ts`
- Modify: `src/app/api/game/[id]/end/route.ts`
- Modify: `src/app/game/[gameId]/page.tsx`
- Delete: `src/lib/kv.ts`

- [ ] **Step 1: Update all import paths in one command**

```bash
find src -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "@/lib/kv" | xargs sed -i '' 's|@/lib/kv|@/lib/db|g'
```

Expected output — files updated (verify with):
```bash
grep -r "@/lib/kv" src/
```
Expected: no output (zero remaining references)

- [ ] **Step 2: Delete kv.ts**

```bash
rm src/lib/kv.ts
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: Compiled successfully, 0 TypeScript errors.

- [ ] **Step 4: Run full test suite**

```bash
npm test -- --run
```

Expected: 19/19 passing

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ src/app/game/ src/lib/
git commit -m "feat: migrate all API routes and report page to Supabase db helpers"
```

---

## Task 4: Smoke Test

This task has no code changes — it verifies the running app works end-to-end with the real Supabase database.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: Server running at `http://localhost:3000`

- [ ] **Step 2: Create a game**

Open `http://localhost:3000`. Add 2 players to Team A, 2 players to Team B. Click "Start Game →".

Expected: Redirects to `/live/{gameId}`. Score header shows 0 – 0.

Verify in Supabase Table Editor → `games` table: one row exists with `status = 'live'`.

- [ ] **Step 3: Record events**

Tap a player → tap "+2 FG". Repeat for a few players.

Expected: Score updates immediately. Sync indicator shows "Synced" after each tap.

Verify in Supabase Table Editor → `events` table: rows exist for the game.

- [ ] **Step 4: Undo**

Tap the Undo button.

Expected: Score reverts by the last event's points.

Verify in Supabase → `events` table: last row was deleted.

- [ ] **Step 5: End game**

Tap "End Game" → confirm.

Expected: Navigates to `/game/{gameId}`. Box score matches recorded events.

Verify in Supabase → `games` table: `status = 'ended'`, `snapshot` column is populated.

- [ ] **Step 6: View report on a different browser tab**

Open `/game/{gameId}` in an incognito window.

Expected: Report loads with correct final score and box score. No login required.

- [ ] **Step 7: Push to GitHub**

```bash
git push
```

Expected: All commits pushed to `origin/master`.
