# Game Card & Report Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add delete, final score, and date to home game cards; add date to the shareable report; add a back-to-home button that only appears when navigating from the home page (not via a shared link).

**Architecture:** Score is stored in `GameMeta` when a game ends so `listGames()` can return it without fetching the large snapshot column. The `?from=home` query param (parallel to the existing `?from=logger`) signals that the user arrived from the home page, enabling the back button. Delete is optimistic: the game is removed from `HomeClient` local state immediately, and the API call deletes from Supabase in the background.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase (via `@supabase/supabase-js`), `lucide-react`

---

## File Map

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `scoreA?: number`, `scoreB?: number` to `GameMeta` and `GameListItem` |
| `src/app/api/game/[id]/end/route.ts` | Store `scoreA`/`scoreB` in `endedMeta` when game ends |
| `src/lib/db.ts` | Add `deleteGame()` function; update `listGames()` to return scores |
| `src/app/api/game/[id]/route.ts` | Add `DELETE` handler |
| `src/components/home/HomeClient.tsx` | Manage `games` in local state; wire `onDelete` to `GameCard` |
| `src/components/home/GameCard.tsx` | Add delete button (2-tap confirm), score + date display, `?from=home` nav |
| `src/components/report/FinalScoreHeader.tsx` | Add `createdAt: number` prop; show formatted date |
| `src/components/report/HomeBackButton.tsx` | **New** — "← Back" link to `/` |
| `src/app/game/[gameId]/page.tsx` | Handle `from=home`; pass `createdAt` to `FinalScoreHeader`; render `HomeBackButton` |

---

### Task 1: Store final score in GameMeta + update types + return from listGames

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/app/api/game/[id]/end/route.ts`
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Update `GameMeta` and `GameListItem` in `src/lib/types.ts`**

Add two optional fields to both interfaces:

```typescript
export interface GameMeta {
  id: string
  teamA: { name: string }
  teamB: { name: string }
  players: Player[]
  mode: StatMode
  status: GameStatus
  createdAt: number
  teamAColor?: string
  teamBColor?: string
  scoreA?: number   // ← ADD
  scoreB?: number   // ← ADD
}

// ...

export interface GameListItem {
  id: string
  teamAName: string
  teamBName: string
  teamAColor: string
  teamBColor: string
  status: GameStatus
  createdAt: number
  scoreA?: number   // ← ADD
  scoreB?: number   // ← ADD
}
```

- [ ] **Step 2: Store final score in `endedMeta` when game ends — `src/app/api/game/[id]/end/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getMeta, setMeta, getEvents, setSnapshot } from '@/lib/db'
import { gameReducer } from '@/lib/reducer'
import type { GameSnapshot } from '@/lib/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const meta = await getMeta(id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (meta.status === 'ended') return NextResponse.json({ error: 'Already ended' }, { status: 409 })

  const events = await getEvents(id)
  const finalState = gameReducer(events)

  const endedMeta = {
    ...meta,
    status: 'ended' as const,
    scoreA: finalState.scoreA,   // ← ADD
    scoreB: finalState.scoreB,   // ← ADD
  }
  const snapshot: GameSnapshot = {
    meta: endedMeta,
    events,
    finalState,
    endedAt: Date.now(),
  }

  await setMeta(id, endedMeta)
  await setSnapshot(id, snapshot)

  return NextResponse.json({ snapshot })
}
```

- [ ] **Step 3: Return `scoreA`/`scoreB` from `listGames()` in `src/lib/db.ts`**

Find the `listGames` function and update the `items.push(...)` call to include scores:

```typescript
items.push({
  id: row.id,
  teamAName: meta.teamA.name,
  teamBName: meta.teamB.name,
  teamAColor: meta.teamAColor ?? DEFAULT_TEAM_A_COLOR,
  teamBColor: meta.teamBColor ?? DEFAULT_TEAM_B_COLOR,
  status,
  createdAt: new Date(row.created_at).getTime(),
  scoreA: meta.scoreA,   // ← ADD (undefined for live games or old ended games)
  scoreB: meta.scoreB,   // ← ADD
})
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Expected: TypeScript clean, all routes compile, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/app/api/game/\[id\]/end/route.ts src/lib/db.ts
git commit -m "feat: store final score in GameMeta on game end"
```

---

### Task 2: deleteGame DB function + DELETE /api/game/[id]

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/app/api/game/[id]/route.ts`

- [ ] **Step 1: Add `deleteGame` to `src/lib/db.ts`**

Add this function at the end of the file (after `listGames`):

```typescript
export async function deleteGame(gameId: string): Promise<void> {
  // Delete events first (foreign key constraint: events.game_id → games.id)
  await getClient().from('events').delete().eq('game_id', gameId)
  await getClient().from('games').delete().eq('id', gameId)
}
```

- [ ] **Step 2: Add `DELETE` handler to `src/app/api/game/[id]/route.ts`**

The file currently has only a `GET` export. Add the `DELETE` export below it:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getMeta, getEvents, getSnapshot, deleteGame } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const meta = await getMeta(id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const events = await getEvents(id)

  if (meta.status === 'ended') {
    const snapshot = await getSnapshot(id)
    return NextResponse.json({ meta, events, snapshot })
  }

  return NextResponse.json({ meta, events })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await deleteGame(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('deleteGame failed', err)
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

Expected: TypeScript clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/app/api/game/\[id\]/route.ts
git commit -m "feat: add deleteGame DB function and DELETE /api/game/[id]"
```

---

### Task 3: HomeClient — local games state + delete wiring

**Files:**
- Modify: `src/components/home/HomeClient.tsx`

- [ ] **Step 1: Replace `src/components/home/HomeClient.tsx`**

Move `initialGames` into `useState` so deletions update the list immediately without a page reload:

```tsx
'use client'

import { useState } from 'react'
import { Zap, Plus } from 'lucide-react'
import { GameCard } from '@/components/home/GameCard'
import { NewGameModal } from '@/components/home/NewGameModal'
import type { GameListItem } from '@/lib/types'

interface HomeClientProps {
  initialGames: GameListItem[]
}

export function HomeClient({ initialGames }: HomeClientProps) {
  const [showModal, setShowModal] = useState(false)
  const [games, setGames] = useState<GameListItem[]>(initialGames)

  function handleDelete(id: string) {
    setGames(prev => prev.filter(g => g.id !== id))
  }

  return (
    <main className="min-h-dvh bg-bg flex flex-col max-w-3xl mx-auto">
      <header className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-3">
          <Zap size={28} className="text-primary" fill="currentColor" />
          <h1 className="font-display font-bold text-3xl text-fg">StatTap</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-display font-bold text-lg rounded-xl cursor-pointer active:opacity-85 active:scale-[0.98] transition-all duration-150 min-h-[48px]"
        >
          <Plus size={20} />
          New Game
        </button>
      </header>

      <div className="flex-1 px-6 py-6 flex flex-col gap-3">
        {games.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-20">
            <Zap size={48} className="text-muted opacity-30" />
            <p className="font-display font-bold text-xl text-muted">No games yet</p>
            <p className="font-body text-sm text-muted opacity-70">Tap &ldquo;New Game&rdquo; to start tracking</p>
          </div>
        ) : (
          games.map(game => (
            <GameCard key={game.id} game={game} onDelete={handleDelete} />
          ))
        )}
      </div>

      {showModal && <NewGameModal onClose={() => setShowModal(false)} />}
    </main>
  )
}
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: TypeScript error on `GameCard` because `onDelete` prop not yet defined there — this is expected and will be fixed in Task 4.

- [ ] **Step 3: Commit (even if build has type error — Task 4 finishes the wiring)**

Skip this — wait for Task 4 to make the build clean before committing.

---

### Task 4: GameCard redesign — delete, score, date, from=home nav

**Files:**
- Modify: `src/components/home/GameCard.tsx`

**Note:** This task also resolves the TypeScript error introduced in Task 3.

- [ ] **Step 1: Replace `src/components/home/GameCard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Zap, Trash2 } from 'lucide-react'
import type { GameListItem } from '@/lib/types'

interface GameCardProps {
  game: GameListItem
  onDelete: (id: string) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function GameCard({ game, onDelete }: GameCardProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const url = `${window.location.origin}/game/${game.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    // Optimistic: remove from UI immediately, fire delete in background
    onDelete(game.id)
    fetch(`/api/game/${game.id}`, { method: 'DELETE' }).catch(() => {})
  }

  function handleCardClick() {
    router.push(`/game/${game.id}?from=home`)
  }

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
      className="bg-surface border border-[var(--color-border)] rounded-xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-elevated transition-colors active:scale-[0.99] active:opacity-90"
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display font-bold text-lg truncate" style={{ color: game.teamAColor }}>
            {game.teamAName}
          </span>
          <span className="text-muted font-body text-base shrink-0">vs</span>
          <span className="font-display font-bold text-lg truncate" style={{ color: game.teamBColor }}>
            {game.teamBName}
          </span>
          {game.status === 'live' && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full shrink-0">
              <Zap size={10} className="text-primary" fill="currentColor" />
              <span className="text-primary font-display font-bold text-xs uppercase tracking-wide">Live</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {game.status === 'ended' && game.scoreA !== undefined && (
            <>
              <span className="font-display font-bold text-base text-fg tabular-nums">
                {game.scoreA} – {game.scoreB}
              </span>
              <span className="text-muted font-body text-sm">·</span>
            </>
          )}
          <span className="font-body text-sm text-muted">{formatDate(game.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDeleteClick}
          aria-label={confirming ? 'Confirm delete' : 'Delete game'}
          className={`flex items-center justify-center rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] ${
            confirming
              ? 'bg-destructive/10 text-destructive px-2'
              : 'p-2 bg-surface-elevated text-muted hover:text-destructive'
          }`}
        >
          {confirming ? (
            <span className="font-display font-bold text-xs whitespace-nowrap">Delete?</span>
          ) : (
            <Trash2 size={18} />
          )}
        </button>
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Link copied' : 'Copy share link'}
          className="flex items-center justify-center p-2 rounded-lg bg-surface-elevated text-muted hover:text-fg transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
        >
          {copied ? <Check size={18} className="text-make" /> : <Copy size={18} />}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build and verify — both Task 3 and Task 4 are now complete**

```bash
npm run build
```

Expected: TypeScript clean.

- [ ] **Step 3: Commit Tasks 3 and 4 together**

```bash
git add src/components/home/HomeClient.tsx src/components/home/GameCard.tsx
git commit -m "feat: game card delete, score, date, and from=home navigation"
```

---

### Task 5: Date on report + HomeBackButton for from=home

**Files:**
- Modify: `src/components/report/FinalScoreHeader.tsx`
- Create: `src/components/report/HomeBackButton.tsx`
- Modify: `src/app/game/[gameId]/page.tsx`

- [ ] **Step 1: Add `createdAt` prop and date to `src/components/report/FinalScoreHeader.tsx`**

```tsx
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface FinalScoreHeaderProps {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  isLive: boolean
  teamAColor: string
  teamBColor: string
  createdAt: number   // ← ADD
}

export function FinalScoreHeader({
  teamAName, teamBName, scoreA, scoreB, isLive, teamAColor, teamBColor, createdAt,
}: FinalScoreHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end gap-1">
          <span
            className="font-display font-bold text-sm uppercase tracking-widest"
            style={{ color: teamAColor }}
          >
            {teamAName}
          </span>
          <span className="font-display font-bold text-[72px] leading-none text-score tabular-nums">{scoreA}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-display font-bold text-4xl text-muted">–</span>
          <span className={`font-display font-bold text-xs uppercase tracking-widest ${isLive ? 'text-primary' : 'text-muted'}`}>
            {isLive ? 'LIVE' : 'FINAL'}
          </span>
          <span className="font-body text-xs text-muted">{formatDate(createdAt)}</span>
        </div>
        <div className="flex flex-col items-start gap-1">
          <span
            className="font-display font-bold text-sm uppercase tracking-widest"
            style={{ color: teamBColor }}
          >
            {teamBName}
          </span>
          <span className="font-display font-bold text-[72px] leading-none text-score tabular-nums">{scoreB}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/report/HomeBackButton.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function HomeBackButton() {
  return (
    <Link
      href="/"
      className="flex items-center gap-1 text-muted hover:text-fg font-display font-semibold text-sm uppercase tracking-wide transition-colors min-h-[44px] self-start"
    >
      <ChevronLeft size={16} />
      Back
    </Link>
  )
}
```

- [ ] **Step 3: Update `src/app/game/[gameId]/page.tsx`**

Add `isFromHome` check, import `HomeBackButton`, and pass `createdAt` to `FinalScoreHeader`:

```tsx
import { redirect } from 'next/navigation'
import { getMeta, getEvents, getSnapshot } from '@/lib/db'
import { gameReducer } from '@/lib/reducer'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import { FinalScoreHeader } from '@/components/report/FinalScoreHeader'
import { BoxScoreTable } from '@/components/report/BoxScoreTable'
import { LoggerActions } from '@/components/report/LoggerActions'
import { HomeBackButton } from '@/components/report/HomeBackButton'
import type { GameState } from '@/lib/types'

export default async function GameReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { gameId } = await params
  const { from } = await searchParams
  const isLogger = from === 'logger'
  const isFromHome = from === 'home'

  const meta = await getMeta(gameId)
  if (!meta) redirect('/')

  let finalState: GameState
  let isLive: boolean

  if (meta.status === 'ended') {
    const snapshot = await getSnapshot(gameId)
    if (snapshot) {
      finalState = snapshot.finalState
    } else {
      const events = await getEvents(gameId)
      finalState = gameReducer(events)
    }
    isLive = false
  } else {
    const events = await getEvents(gameId)
    finalState = gameReducer(events)
    isLive = true
  }

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')
  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR

  return (
    <main className="min-h-dvh bg-bg p-6 flex flex-col gap-8 max-w-3xl mx-auto">
      {isLogger && <LoggerActions gameId={gameId} />}
      {isFromHome && <HomeBackButton />}

      {isLive && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
          <p className="text-primary font-display font-bold text-sm uppercase tracking-wide">Game in Progress</p>
        </div>
      )}

      <FinalScoreHeader
        teamAName={meta.teamA.name}
        teamBName={meta.teamB.name}
        scoreA={finalState.scoreA}
        scoreB={finalState.scoreB}
        isLive={isLive}
        teamAColor={teamAColor}
        teamBColor={teamBColor}
        createdAt={meta.createdAt}
      />

      <div className="flex flex-col gap-6">
        <BoxScoreTable
          teamName={meta.teamA.name}
          players={playersA}
          playerStats={finalState.playerStats}
          mode={meta.mode}
          teamColor={teamAColor}
        />
        <BoxScoreTable
          teamName={meta.teamB.name}
          players={playersB}
          playerStats={finalState.playerStats}
          mode={meta.mode}
          teamColor={teamBColor}
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Expected: TypeScript clean, all routes compile.

- [ ] **Step 5: Commit**

```bash
git add src/components/report/FinalScoreHeader.tsx src/components/report/HomeBackButton.tsx src/app/game/\[gameId\]/page.tsx
git commit -m "feat: date on report, back button for home-navigated reports"
```

---

## Self-Review

**Spec coverage:**
- ✅ Delete from home card → Task 2 (API) + Tasks 3 & 4 (UI with 2-tap confirm)
- ✅ Final score on card → Task 1 (stores in meta on end) + Task 4 (renders in card)
- ✅ Date on card → Task 4 (`formatDate(game.createdAt)` always shown)
- ✅ Date on shareable stats sheet → Task 5 (`createdAt` prop on `FinalScoreHeader`)
- ✅ Back button from home → Task 4 (`?from=home` in card nav) + Task 5 (`HomeBackButton` when `isFromHome`)
- ✅ No back button on shared link → report page only renders `HomeBackButton` when `from=home`; bare URL (no param) shows nothing

**Placeholder scan:** No TBDs, TODOs, or vague steps. All code is complete and copy-pasteable.

**Type consistency:**
- `GameMeta.scoreA/scoreB: number | undefined` — set in `/end` route, read in `listGames()`
- `GameListItem.scoreA/scoreB: number | undefined` — returned from `listGames()`, consumed in `GameCard`
- `FinalScoreHeader.createdAt: number` — passed from `page.tsx` using `meta.createdAt` (always defined, no `??` needed)
- `GameCard.onDelete: (id: string) => void` — defined in Task 4, wired in Task 3 (`HomeClient.handleDelete`)
- All consistent across tasks.
