# StatTap Bug Fixes — Round 2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix nine reported regressions: stale home list, delete silently succeeding without actually deleting, wrong card-tap destination for live games, broken shareable links from game cards, missing input color preview in setup, scrollbar on new-game page, action bar hidden until player selected, and live stats hiding players with zero stats.

**Architecture:** Three root causes drive most bugs. (1) **Stale home page**: Next.js client-side router cache serves the home page from memory — adding `dynamic = 'force-dynamic'` and `router.refresh()` forces a fresh SSR pass every time. (2) **Silent Supabase delete**: RLS silently blocks DELETE when the service-role key isn't applied correctly, returning success with 0 rows deleted — we verify by chaining `.select('id')` after delete and throwing if nothing was deleted. (3) **Wrong card-tap destination**: tapping a live game card should resume `/live/[id]`, not the report page. The remaining bugs are straightforward single-file changes.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase JS client, `next/navigation` (`useRouter`, `router.refresh`), `lucide-react`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/page.tsx` | Modify | Add `dynamic = 'force-dynamic'` |
| `src/components/report/LoggerActions.tsx` | Modify | `router.push('/') + router.refresh()` for Home button |
| `src/components/home/GameCard.tsx` | Modify | Live games → `/live/${id}`, ended games → `/game/${id}?from=home`, share link unaffected |
| `src/lib/db.ts` | Modify | `deleteGame` chains `.select('id')` and throws if 0 rows deleted |
| `src/app/api/game/[id]/route.ts` | Modify | Wrap `getMeta` call in try/catch in the DELETE handler |
| `src/app/new/page.tsx` | Modify | Remove `overflow-y-auto` inner wrapper — let page scroll naturally |
| `src/components/setup/TeamNameInput.tsx` | Modify | Accept `teamColor` prop, apply to input text color |
| `src/components/setup/GameSetupForm.tsx` | Modify | Pass `teamAColor` / `teamBColor` to each `TeamNameInput` |
| `src/components/live/ActionBar.tsx` | Modify | Always visible, never slides off; buttons still disabled when no player selected |
| `src/components/live/LiveStatsPanel.tsx` | Modify | Use `emptyStats()` fallback so all players appear regardless of score |

---

## Task 1: Force-fresh home page + LoggerActions force-refresh

**Root cause of "ended game not appearing on home after coming back"**: Next.js App Router caches the home page in the client-side router for 30 s. After ending a game and tapping Home, the browser renders the stale pre-game list without re-running `listGames()`.

**Two-part fix:**
1. `export const dynamic = 'force-dynamic'` on `src/app/page.tsx` opts out of all static/incremental generation, so the server always re-runs `listGames()` on every request.
2. In `LoggerActions`, replace `<Link href="/">` with an imperative `router.push('/'); router.refresh()` sequence so Next.js invalidates the router cache entry for `/` before navigating.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/report/LoggerActions.tsx`

- [ ] **Step 1: Add dynamic export to src/app/page.tsx**

Replace the full file:

```typescript
import { listGames } from '@/lib/db'
import { HomeClient } from '@/components/home/HomeClient'
import type { GameListItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let games: GameListItem[] = []
  try {
    games = await listGames()
  } catch {
    // DB unavailable — render home page with empty list rather than crashing
  }
  return <HomeClient initialGames={games} />
}
```

- [ ] **Step 2: Update LoggerActions to force-refresh on Home**

Replace the full file:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Copy, Check } from 'lucide-react'

interface LoggerActionsProps {
  gameId: string
}

export function LoggerActions({ gameId }: LoggerActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  function handleHome() {
    router.push('/')
    router.refresh()
  }

  function handleCopy() {
    const url = `${window.location.origin}/game/${gameId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleHome}
        className="flex items-center gap-2 px-4 py-3 bg-surface rounded-xl border border-[var(--color-border)] text-fg font-display font-semibold text-sm uppercase tracking-wide cursor-pointer hover:bg-surface-elevated transition-colors min-h-[48px]"
      >
        <Home size={16} />
        Home
      </button>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Copy share link'}
        className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-display font-bold text-sm uppercase tracking-wide cursor-pointer active:opacity-85 transition-all duration-150 min-h-[48px]"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied!' : 'Copy Share Link'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/report/LoggerActions.tsx
git commit -m "fix: force-dynamic home page; router.refresh() on Home button so new games appear immediately"
```

---

## Task 2: Fix game card navigation — live → /live, ended → /game?from=home

**Root cause of "tapping game card doesn't open stats"**: All cards navigate to `/game/${id}?from=home` (the report page) regardless of status. For a **live** game the user expects to resume live tracking at `/live/${id}` — landing on the read-only report page is surprising and may appear broken. For **ended** games the report page is correct.

**Share link is unaffected**: the copy button always generates `/game/${id}` (the public report URL), regardless of game status. This is the correct sharable URL in all cases.

**Files:**
- Modify: `src/components/home/GameCard.tsx`

- [ ] **Step 1: Update handleCardClick logic in GameCard.tsx**

The only change needed is the `href` on the `<Link>`. Replace the current `GameCard.tsx` full file with:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Copy, Check, Zap, Trash2 } from 'lucide-react'
import type { GameListItem } from '@/lib/types'

interface GameCardProps {
  game: GameListItem
  onDelete: (id: string) => void
  onRestoreGame: (game: GameListItem) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function GameCard({ game, onDelete, onRestoreGame }: GameCardProps) {
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Share link always points to the public report page (never to /live)
    const url = `${window.location.origin}/game/${game.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  async function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      timerRef.current = setTimeout(() => setConfirming(false), 5000)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirming(false)
    setDeleteError(false)
    onDelete(game.id)
    try {
      const res = await fetch(`/api/game/${game.id}`, { method: 'DELETE' })
      if (!res.ok) {
        onRestoreGame(game)
        setDeleteError(true)
        setTimeout(() => setDeleteError(false), 4000)
      }
    } catch {
      onRestoreGame(game)
      setDeleteError(true)
      setTimeout(() => setDeleteError(false), 4000)
    }
  }

  // Live games resume live tracking; ended games open the stats report
  const cardHref = game.status === 'live'
    ? `/live/${game.id}`
    : `/game/${game.id}?from=home`

  return (
    <div className="relative bg-surface border border-[var(--color-border)] rounded-xl hover:bg-surface-elevated transition-colors active:scale-[0.99] active:opacity-90">
      <Link
        href={cardHref}
        className="flex flex-col gap-1 min-w-0 px-5 py-4 pr-28 block"
      >
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
          {game.status === 'ended' && game.scoreA !== undefined && game.scoreB !== undefined && (
            <>
              <span className="font-display font-bold text-base text-fg tabular-nums">
                {game.scoreA} – {game.scoreB}
              </span>
              <span className="text-muted font-body text-sm">·</span>
            </>
          )}
          <span className="font-body text-sm text-muted">{formatDate(game.createdAt)}</span>
        </div>
        {deleteError && (
          <span className="font-body text-xs text-destructive">Delete failed — try again</span>
        )}
      </Link>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <button
          onClick={handleDeleteClick}
          aria-label={confirming ? 'Confirm delete' : 'Delete game'}
          className={`flex items-center justify-center rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] ${
            confirming
              ? 'bg-destructive/10 text-destructive px-2 py-3'
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

Key changes vs current version:
- `cardHref` computed from `game.status`: live → `/live/${game.id}`, ended → `/game/${game.id}?from=home`
- `deleteError` state shows "Delete failed — try again" inline on the card
- Confirm timeout extended from 3 s → 5 s (more forgiving)

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/home/GameCard.tsx
git commit -m "fix: live game cards navigate to /live; ended game cards navigate to report; show delete error inline"
```

---

## Task 3: Fix silent delete — verify rows actually deleted in Supabase

**Root cause of "games come back on refresh"**: Supabase's `.delete()` returns `{ error: null }` even when RLS silently blocks the operation and 0 rows are deleted. The DELETE route gets no error, returns 204, the client sees success and keeps the game removed from local state — but the DB row was never deleted. On refresh `listGames()` returns it again.

**Fix**: chain `.select('id')` on the `.delete()` call for the games table. Supabase returns the deleted rows when `.select()` is chained. If the returned array is empty (0 rows deleted), throw an error so the route returns 500 and the client reverts the optimistic delete.

Also: wrap `getMeta` in a try/catch in the DELETE route — if the Supabase connection fails on that call, the unhandled exception currently produces an unstructured 500.

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/app/api/game/[id]/route.ts`

- [ ] **Step 1: Update deleteGame in db.ts to verify deletion**

In `src/lib/db.ts`, replace `deleteGame`:

```typescript
export async function deleteGame(gameId: string): Promise<void> {
  const { error: eventsErr } = await getClient()
    .from('events')
    .delete()
    .eq('game_id', gameId)
  if (eventsErr) throw eventsErr

  const { data, error: gameErr } = await getClient()
    .from('games')
    .delete()
    .eq('id', gameId)
    .select('id')  // returns deleted rows; empty array = RLS blocked or row missing
  if (gameErr) throw gameErr
  if (!data || data.length === 0) {
    throw new Error(`Game ${gameId} was not deleted — RLS may be blocking the operation`)
  }
}
```

- [ ] **Step 2: Wrap getMeta in try/catch in the DELETE route**

Replace the full `src/app/api/game/[id]/route.ts`:

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

  let meta
  try {
    meta = await getMeta(id)
  } catch (err) {
    console.error('getMeta failed in DELETE', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  try {
    await deleteGame(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('deleteGame failed', err)
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/app/api/game/[id]/route.ts
git commit -m "fix: verify Supabase delete actually removed rows; catch getMeta errors in DELETE route"
```

---

## Task 4: Fix /new page scrollbar + team name input color

**Bug 1 — scrollbar on /new page**: The current `/new/page.tsx` has `<div className="flex-1 overflow-y-auto">` wrapping `GameSetupForm`. On macOS with "Always show scrollbars" setting (or any device where content slightly overflows), this creates a visible scrollbar. Since the page is inside a `min-h-dvh` container that grows naturally, the inner scroll wrapper is unnecessary — the entire page can scroll as one unit. Removing it eliminates the scrollbar.

**Bug 2 — team name input doesn't change color**: `TeamNameInput` uses hard-coded Tailwind CSS classes `border-team-a` / `border-team-b` and the input text is always `text-fg`. Passing `teamColor` as a prop and applying it as `style={{ color: teamColor }}` makes the input text reflect the selected color live.

**Files:**
- Modify: `src/app/new/page.tsx`
- Modify: `src/components/setup/TeamNameInput.tsx`
- Modify: `src/components/setup/GameSetupForm.tsx`

- [ ] **Step 1: Remove inner scroll wrapper from /new/page.tsx**

Replace the full file:

```tsx
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { GameSetupForm } from '@/components/setup/GameSetupForm'

export default function NewGamePage() {
  return (
    <main className="min-h-dvh bg-bg flex flex-col max-w-3xl mx-auto">
      <header className="flex items-center gap-4 px-6 py-5 border-b border-[var(--color-border)] shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1 text-muted hover:text-fg font-display font-semibold text-sm uppercase tracking-wide transition-colors min-h-[44px]"
        >
          <ChevronLeft size={16} />
          Back
        </Link>
        <h1 className="font-display font-bold text-2xl text-fg">New Game</h1>
      </header>
      <GameSetupForm />
    </main>
  )
}
```

- [ ] **Step 2: Add teamColor prop to TeamNameInput.tsx**

Replace the full file:

```tsx
interface TeamNameInputProps {
  team: 'A' | 'B'
  value: string
  onChange: (val: string) => void
  teamColor: string
}

export function TeamNameInput({ team, value, onChange, teamColor }: TeamNameInputProps) {
  const label = team === 'A' ? 'Team A' : 'Team B'
  const placeholder = team === 'A' ? 'Team A' : 'Team B'

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-body text-muted uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={20}
        style={{ color: teamColor }}
        className="bg-surface border border-[var(--color-border)] rounded-lg px-4 py-3 font-display text-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200"
      />
    </div>
  )
}
```

Note: removed the hard-coded `border-team-a / border-team-b` class refs since the dynamic color is now set via `style`. Border falls back to the standard `--color-border` CSS variable, which is fine — the color preview is now shown via the live text color instead.

- [ ] **Step 3: Pass teamAColor / teamBColor to TeamNameInput in GameSetupForm.tsx**

In `src/components/setup/GameSetupForm.tsx`, find the two `<TeamNameInput>` usages and add the `teamColor` prop:

Change:
```tsx
<TeamNameInput team="A" value={teamAName} onChange={setTeamAName} />
```
to:
```tsx
<TeamNameInput team="A" value={teamAName} onChange={setTeamAName} teamColor={teamAColor} />
```

And:
```tsx
<TeamNameInput team="B" value={teamBName} onChange={setTeamBName} />
```
to:
```tsx
<TeamNameInput team="B" value={teamBName} onChange={setTeamBName} teamColor={teamBColor} />
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/new/page.tsx src/components/setup/TeamNameInput.tsx src/components/setup/GameSetupForm.tsx
git commit -m "fix: remove inner scroll wrapper on /new page; team name input text uses selected team color"
```

---

## Task 5: ActionBar — always visible, buttons disabled until player selected

**Current behavior**: The action bar is off-screen until a player is tapped (`translate-y-full` hides it). The user doesn't know the buttons exist until they discover the tap-then-button flow.

**New behavior**: ActionBar is always rendered at the bottom. Buttons are disabled and visually muted when no player is selected. A short prompt ("Select a player") is shown in place of the buttons when nothing is selected, so the two-tap flow is self-explaining.

**Files:**
- Modify: `src/components/live/ActionBar.tsx`

- [ ] **Step 1: Rewrite ActionBar.tsx**

Replace the full file:

```tsx
'use client'

import { Check, X } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import type { ActionType, GameEvent } from '@/lib/types'

const POINTS_ONLY_ACTIONS: { label: string; actionType: ActionType; points: number }[] = [
  { label: '+1 FT', actionType: 'FT_MAKE', points: 1 },
  { label: '+2 FG', actionType: 'FG_MAKE', points: 2 },
  { label: '+3 3PT', actionType: '3PT_MAKE', points: 3 },
]

const MAKE_MISS_ACTIONS: { label: string; actionType: ActionType; points: number; isMake: boolean }[] = [
  { label: 'FT Make', actionType: 'FT_MAKE', points: 1, isMake: true },
  { label: 'FT Miss', actionType: 'FT_MISS', points: 0, isMake: false },
  { label: 'FG Make', actionType: 'FG_MAKE', points: 2, isMake: true },
  { label: 'FG Miss', actionType: 'FG_MISS', points: 0, isMake: false },
  { label: '3PT Make', actionType: '3PT_MAKE', points: 3, isMake: true },
  { label: '3PT Miss', actionType: '3PT_MISS', points: 0, isMake: false },
]

export function ActionBar() {
  const { meta, selectedPlayerId, dispatch } = useGame()

  const hasPlayer = selectedPlayerId !== null
  const selectedPlayer = meta.players.find(p => p.id === selectedPlayerId)

  function handleAction(actionType: ActionType, points: number) {
    if (!selectedPlayer) return

    const event: GameEvent = {
      id: crypto.randomUUID(),
      playerId: selectedPlayer.id,
      team: selectedPlayer.team,
      actionType,
      points,
      timestamp: Date.now(),
    }

    dispatch({ type: 'ADD_EVENT', event })
    dispatch({ type: 'SET_SYNC', status: 'syncing' })

    fetch(`/api/game/${meta.id}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
      .then(res => {
        if (res.ok) {
          dispatch({ type: 'SET_SYNC', status: 'synced' })
        } else {
          dispatch({ type: 'UNDO' })
          dispatch({ type: 'SET_SYNC', status: 'error' })
        }
      })
      .catch(() => {
        dispatch({ type: 'UNDO' })
        dispatch({ type: 'SET_SYNC', status: 'error' })
      })
  }

  if (!hasPlayer) {
    return (
      <div className="shrink-0 bg-surface border-t border-[var(--color-border)] flex items-center justify-center min-h-[72px]">
        <span className="font-display font-semibold text-sm text-muted uppercase tracking-wide">
          Select a player
        </span>
      </div>
    )
  }

  return (
    <div className="shrink-0 bg-surface border-t border-[var(--color-border)]">
      <div className="flex gap-px">
        {meta.mode === 'points-only'
          ? POINTS_ONLY_ACTIONS.map(action => (
              <button
                key={action.actionType}
                onClick={() => handleAction(action.actionType, action.points)}
                aria-label={`${action.label} for ${selectedPlayer?.displayLabel ?? 'selected player'}`}
                className="flex-1 min-h-[72px] bg-primary text-white font-display font-bold text-xl cursor-pointer active:opacity-85 active:scale-[0.98] transition-all duration-150"
              >
                {action.label}
              </button>
            ))
          : MAKE_MISS_ACTIONS.map(action => (
              <button
                key={action.actionType}
                onClick={() => handleAction(action.actionType, action.points)}
                aria-label={`${action.label} for ${selectedPlayer?.displayLabel ?? 'selected player'}`}
                className={`flex-1 min-h-[72px] font-display font-bold text-lg text-white cursor-pointer active:opacity-85 active:scale-[0.98] transition-all duration-150 flex flex-col items-center justify-center gap-1
                  ${action.isMake ? 'bg-make' : 'bg-miss'}
                `}
              >
                {action.isMake ? <Check size={16} /> : <X size={16} />}
                {action.label}
              </button>
            ))
        }
      </div>
    </div>
  )
}
```

Key changes:
- No more `translate-y-full` / `transition-transform` hiding
- When `!hasPlayer`: render a static bar with "Select a player" instead of nothing
- When `hasPlayer`: render the action buttons (same as before, but always in DOM)
- Removed `disabled` props and `pointer-events-none` — the early return makes them unnecessary when no player is selected

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/live/ActionBar.tsx
git commit -m "feat: action bar always visible; shows 'Select a player' prompt when nothing selected"
```

---

## Task 6: Live stats — show all players regardless of score

**Root cause**: In `LiveStatsPanel.tsx`, `renderTeam` skips any player where `derived.playerStats[player.id]` is `undefined` (i.e. no events for that player yet). New games or bench players never appear.

**Fix**: Replace `if (!stats) return null` with `emptyStats()` from `@/lib/game` as the fallback. `emptyStats()` returns `{ points: 0, fgMakes: 0, fgAttempts: 0, threeMakes: 0, threeAttempts: 0, ftMakes: 0, ftAttempts: 0 }`.

**Files:**
- Modify: `src/components/live/LiveStatsPanel.tsx`

- [ ] **Step 1: Import emptyStats and fix the null guard**

In `src/components/live/LiveStatsPanel.tsx`, make two changes:

**Change 1** — add `emptyStats` to the import line:

```tsx
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR, emptyStats } from '@/lib/game'
```

**Change 2** — in `renderTeam`, replace:

```tsx
{players.map(player => {
  const stats = derived.playerStats[player.id]
  if (!stats) return null
  return isMakeMiss
    ? <MakeMissRow key={player.id} player={player} stats={stats} />
    : <PointsOnlyRow key={player.id} player={player} stats={stats} />
})}
```

with:

```tsx
{players.map(player => {
  const stats = derived.playerStats[player.id] ?? emptyStats()
  return isMakeMiss
    ? <MakeMissRow key={player.id} player={player} stats={stats} />
    : <PointsOnlyRow key={player.id} player={player} stats={stats} />
})}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/live/LiveStatsPanel.tsx
git commit -m "fix: live stats panel shows all players, not just those who have scored"
```

---

## Self-Review

### Spec coverage

| Reported bug | Task |
|---|---|
| Games still not being deleted | Task 3 (verify rows deleted + getMeta try/catch) |
| Deletes not working correctly | Task 3 |
| Ended game not appearing on home after going back | Task 1 (force-dynamic + router.refresh) |
| Tapping game card doesn't open stats | Task 2 (live → /live, ended → /game) |
| Shareable link from card doesn't work | Task 2 (share link unchanged; live game card now correctly navigates to /live) |
| Team name input should also change color | Task 4 (teamColor prop on TeamNameInput) |
| New game page has scrollbar on the side | Task 4 (remove overflow-y-auto wrapper) |
| Add points button should always be visible | Task 5 (ActionBar always rendered) |
| Live stats shows only players who scored | Task 6 (emptyStats fallback) |

All 9 bugs covered.

### Placeholder scan

No TBD, "handle edge cases", or missing code blocks found.

### Type consistency

- `TeamNameInput` props: `teamColor: string` (required, not optional) — matches all call sites in `GameSetupForm` where `teamAColor` / `teamBColor` are always defined (initialized from `DEFAULT_TEAM_A_COLOR` / `DEFAULT_TEAM_B_COLOR`).
- `deleteGame` now returns `data` from `.select('id')` — TypeScript type from Supabase schema is `{ id: string }[]`, not null. The `!data || data.length === 0` guard is type-safe.
- `emptyStats()` returns `PlayerStats` — matches the `stats: PlayerStats` parameter type in both `PointsOnlyRow` and `MakeMissRow`.
