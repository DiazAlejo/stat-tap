# StatTap Bug Fixes & UX Improvements

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 9 reported bugs — ended games showing as live, final score missing from game list, game card taps not navigating, delete not persisting across refreshes, duplicate team colors allowed, no live color preview, new game as a fullscreen page instead of modal, live stats panel with two tabs instead of one, and a scrollable live game grid that cuts off the action bar.

**Architecture:** All fixes are frontend/client-side except Task 1 (db.ts error surfacing). Status + score bugs share a root cause: `setMeta` and `setSnapshot` silently swallow Supabase errors so the `status` column never updates. Delete persistence requires the client to check `res.ok` and revert the optimistic update on failure. The new-game full-screen flow replaces `NewGameModal` with a dedicated `/new` route. The 2×2 player grid restructures `TeamColumn` to split each team's players into two sub-columns, halving the row count so tiles never overflow the viewport.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase (service role), `next/link`, `lucide-react`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/db.ts` | Modify | Add error checking to `setMeta` + `setSnapshot`; add `meta.status` fallback in `listGames` |
| `src/components/home/GameCard.tsx` | Modify | Use `<Link>` for card body; await delete fetch; revert optimistic delete on failure |
| `src/components/home/HomeClient.tsx` | Modify | Pass `onRestoreGame` to `GameCard`; navigate to `/new` on button click; delete `NewGameModal` import |
| `src/components/home/NewGameModal.tsx` | Delete | Replaced by dedicated `/new` page |
| `src/app/new/page.tsx` | Create | Full-screen new game setup page |
| `src/components/setup/TeamColorPicker.tsx` | Modify | Add `disabledColor` prop — disable the swatch the other team already owns |
| `src/components/setup/GameSetupForm.tsx` | Modify | Pass `disabledColor`; add colored team-name live preview above each section |
| `src/components/live/LiveStatsPanel.tsx` | Modify | Remove two-tab switcher; render single adaptive panel (points-only vs make-miss) |
| `src/components/live/TeamColumn.tsx` | Modify | Split players into two sub-columns (left = first half, right = second half) |
| `src/components/live/PlayerGrid.tsx` | Modify | `rowCount` uses `Math.ceil(maxPlayers / 2)` to match new sub-column layout |
| `src/app/live/[gameId]/LiveGameClient.tsx` | Modify | Use `h-dvh` instead of `min-h-dvh` to guarantee no overflow scroll |

---

## Task 1: Fix db.ts — surface errors from setMeta + setSnapshot, add status fallback in listGames

**Root cause of "ended game appears as live" and "final score not showing":** `setMeta` and `setSnapshot` use `.upsert()` / `.update()` without checking errors, so Supabase failures are silently swallowed. The `status` column never gets written to `'ended'`, so `listGames()` always returns `'live'`, and the score guard in `GameCard` (`game.status === 'ended'`) never fires.

**Files:**
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Add error checking to setMeta and setSnapshot**

Open `src/lib/db.ts`. Replace both functions:

```typescript
export async function setMeta(gameId: string, meta: GameMeta): Promise<void> {
  const { error } = await getClient()
    .from('games')
    .upsert({ id: gameId, meta: meta as unknown as Json, status: meta.status })
  if (error) throw error
}

export async function setSnapshot(gameId: string, snapshot: GameSnapshot): Promise<void> {
  const { error } = await getClient()
    .from('games')
    .update({ snapshot: snapshot as unknown as Json, status: 'ended' })
    .eq('id', gameId)
  if (error) throw error
}
```

- [ ] **Step 2: Add meta.status fallback in listGames**

In `listGames()`, change the status line from:
```typescript
const status: GameStatus = row.status === 'ended' ? 'ended' : 'live'
```
to:
```typescript
const status: GameStatus =
  (row.status === 'ended' || meta.status === 'ended') ? 'ended' : 'live'
```

This acts as belt-and-suspenders: even if the DB `status` column is stale, `meta.status` from the JSON blob is still correct.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts
git commit -m "fix: surface Supabase errors in setMeta/setSnapshot; add meta.status fallback in listGames"
```

---

## Task 2: Fix GameCard — reliable navigation + delete that reverts on failure

**Two bugs addressed:**
1. Card taps sometimes don't navigate (a plain `<div onClick>` is unreliable on iPad — `<Link>` is the correct primitive).
2. Delete returns to list on refresh (the client fires `fetch` and ignores the HTTP response — errors never reverted).

**Files:**
- Modify: `src/components/home/GameCard.tsx`
- Modify: `src/components/home/HomeClient.tsx`

- [ ] **Step 1: Update GameCard.tsx with Link navigation and awaited delete**

Replace the full file content:

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
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
      timerRef.current = setTimeout(() => setConfirming(false), 3000)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirming(false)
    onDelete(game.id) // optimistic remove
    try {
      const res = await fetch(`/api/game/${game.id}`, { method: 'DELETE' })
      if (!res.ok) {
        onRestoreGame(game) // revert if server rejected it
      }
    } catch {
      onRestoreGame(game) // revert on network error
    }
  }

  return (
    <div className="relative bg-surface border border-[var(--color-border)] rounded-xl hover:bg-surface-elevated transition-colors active:scale-[0.99] active:opacity-90">
      {/* Clickable card body */}
      <Link
        href={`/game/${game.id}?from=home`}
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
      </Link>

      {/* Action buttons — absolutely positioned so they don't intercept the Link */}
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

- [ ] **Step 2: Update HomeClient.tsx to add onRestoreGame**

Replace the full file content:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Plus } from 'lucide-react'
import { GameCard } from '@/components/home/GameCard'
import type { GameListItem } from '@/lib/types'

interface HomeClientProps {
  initialGames: GameListItem[]
}

export function HomeClient({ initialGames }: HomeClientProps) {
  const router = useRouter()
  const [games, setGames] = useState<GameListItem[]>(initialGames)

  function handleDelete(id: string) {
    setGames(prev => prev.filter(g => g.id !== id))
  }

  function handleRestoreGame(game: GameListItem) {
    setGames(prev =>
      [...prev, game].sort((a, b) => b.createdAt - a.createdAt)
    )
  }

  return (
    <main className="min-h-dvh bg-bg flex flex-col max-w-3xl mx-auto">
      <header className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-3">
          <Zap size={28} className="text-primary" fill="currentColor" />
          <h1 className="font-display font-bold text-3xl text-fg">StatTap</h1>
        </div>
        <button
          onClick={() => router.push('/new')}
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
            <GameCard
              key={game.id}
              game={game}
              onDelete={handleDelete}
              onRestoreGame={handleRestoreGame}
            />
          ))
        )}
      </div>
    </main>
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
git add src/components/home/GameCard.tsx src/components/home/HomeClient.tsx
git commit -m "fix: use Link for card navigation; await delete and revert optimistic update on failure"
```

---

## Task 3: New Game full-screen page (replace modal with /new route)

The `NewGameModal` is a floating overlay. Replace it with a dedicated `/new` page that uses the full viewport — better on iPad and semantically cleaner.

**Files:**
- Create: `src/app/new/page.tsx`
- Delete: `src/components/home/NewGameModal.tsx` (already removed from `HomeClient` in Task 2)

- [ ] **Step 1: Create src/app/new/page.tsx**

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
      <div className="flex-1 overflow-y-auto">
        <GameSetupForm />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Delete NewGameModal.tsx**

```bash
rm /Users/alejo/Documents/DevHub/Projects/stat-tap/src/components/home/NewGameModal.tsx
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors (NewGameModal is no longer imported anywhere after Task 2)

- [ ] **Step 4: Commit**

```bash
git add src/app/new/page.tsx
git rm src/components/home/NewGameModal.tsx
git commit -m "feat: replace new-game modal with dedicated /new full-screen page"
```

---

## Task 4: Prevent duplicate team colors + live color preview in setup

**Two UX bugs:**
1. Both teams can share the same color — confusing in the live scoreboard.
2. No visual feedback when changing a team color — user can't see the effect until the game starts.

**Files:**
- Modify: `src/components/setup/TeamColorPicker.tsx`
- Modify: `src/components/setup/GameSetupForm.tsx`

- [ ] **Step 1: Add disabledColor prop to TeamColorPicker**

Replace full file:

```tsx
import { TEAM_COLORS } from '@/lib/game'

interface TeamColorPickerProps {
  team: 'A' | 'B'
  value: string
  onChange: (color: string) => void
  disabledColor?: string
}

export function TeamColorPicker({ team, value, onChange, disabledColor }: TeamColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-body text-muted uppercase tracking-wide">Team {team} Color</label>
      <div className="flex gap-2 flex-wrap">
        {TEAM_COLORS.map(color => {
          const isSelected = value === color
          const isDisabled = disabledColor === color && !isSelected
          return (
            <button
              key={color}
              type="button"
              onClick={() => !isDisabled && onChange(color)}
              aria-label={`Select color ${color} for Team ${team}${isDisabled ? ' (used by other team)' : ''}`}
              aria-pressed={isSelected}
              disabled={isDisabled}
              className={`w-11 h-11 rounded-full transition-all duration-150 ${
                isSelected
                  ? 'outline outline-2 outline-offset-2 outline-white scale-110 cursor-pointer'
                  : isDisabled
                  ? 'opacity-25 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95 cursor-pointer'
              }`}
              style={{ backgroundColor: color }}
            />
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update GameSetupForm.tsx — pass disabledColor and add live color preview**

Replace the two-column team grid section inside the returned JSX. The full component stays the same except this block changes from:

```tsx
<div className="grid grid-cols-2 gap-6">
  <div className="flex flex-col gap-3">
    <TeamNameInput team="A" value={teamAName} onChange={setTeamAName} />
    <TeamColorPicker team="A" value={teamAColor} onChange={setTeamAColor} />
  </div>
  <div className="flex flex-col gap-3">
    <TeamNameInput team="B" value={teamBName} onChange={setTeamBName} />
    <TeamColorPicker team="B" value={teamBColor} onChange={setTeamBColor} />
  </div>
</div>

{teamAColor === teamBColor && (
  <p className="text-sm font-body text-muted bg-surface rounded-lg px-4 py-2 border border-[var(--color-border)]">
    Both teams share the same color — the live scoreboard columns may be hard to tell apart.
  </p>
)}
```

to:

```tsx
<div className="grid grid-cols-2 gap-6">
  <div className="flex flex-col gap-3">
    <span
      className="font-display font-bold text-xl"
      style={{ color: teamAColor }}
    >
      {teamAName || 'Team A'}
    </span>
    <TeamNameInput team="A" value={teamAName} onChange={setTeamAName} />
    <TeamColorPicker
      team="A"
      value={teamAColor}
      onChange={setTeamAColor}
      disabledColor={teamBColor}
    />
  </div>
  <div className="flex flex-col gap-3">
    <span
      className="font-display font-bold text-xl"
      style={{ color: teamBColor }}
    >
      {teamBName || 'Team B'}
    </span>
    <TeamNameInput team="B" value={teamBName} onChange={setTeamBName} />
    <TeamColorPicker
      team="B"
      value={teamBColor}
      onChange={setTeamBColor}
      disabledColor={teamAColor}
    />
  </div>
</div>
```

(The same-color warning paragraph is removed because the color picker now prevents the situation entirely.)

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/setup/TeamColorPicker.tsx src/components/setup/GameSetupForm.tsx
git commit -m "feat: prevent duplicate team colors; add live color preview in game setup"
```

---

## Task 5: Live stats panel — single adaptive view (remove two-tab switcher)

**Current behavior:** Two tabs — "Points" and "Shooting" — the user must switch between them.  
**New behavior:** One panel. If `mode === 'points-only'`, show only points. If `mode === 'make-miss'`, show points and full shooting breakdown (FG x/x · 3PT x/x · FT x/x) for every player — all visible at once, no switching.

**Files:**
- Modify: `src/components/live/LiveStatsPanel.tsx`

- [ ] **Step 1: Rewrite LiveStatsPanel.tsx**

Replace the full file:

```tsx
'use client'

import { X } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { Player, PlayerStats } from '@/lib/types'

function PointsOnlyRow({ player, stats }: { player: Player; stats: PlayerStats }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
      <span className="font-display font-semibold text-base text-fg">{player.displayLabel}</span>
      <span className="font-display font-bold text-lg text-fg tabular-nums">{stats.points} pts</span>
    </div>
  )
}

function MakeMissRow({ player, stats }: { player: Player; stats: PlayerStats }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)] gap-4">
      <span className="font-display font-semibold text-sm text-fg shrink-0">{player.displayLabel}</span>
      <div className="flex items-center gap-3 text-xs font-body tabular-nums">
        <span className="text-fg font-bold">{stats.points}pts</span>
        <span className="text-muted">FG {stats.fgMakes}/{stats.fgAttempts}</span>
        <span className="text-muted">3PT {stats.threeMakes}/{stats.threeAttempts}</span>
        <span className="text-muted">FT {stats.ftMakes}/{stats.ftAttempts}</span>
      </div>
    </div>
  )
}

interface LiveStatsPanelProps {
  onClose: () => void
}

export function LiveStatsPanel({ onClose }: LiveStatsPanelProps) {
  const { meta, derived } = useGame()

  const playersA = meta.players.filter(p => p.team === 'A')
    .sort((a, b) => (derived.playerStats[b.id]?.points ?? 0) - (derived.playerStats[a.id]?.points ?? 0))
  const playersB = meta.players.filter(p => p.team === 'B')
    .sort((a, b) => (derived.playerStats[b.id]?.points ?? 0) - (derived.playerStats[a.id]?.points ?? 0))

  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR
  const isMakeMiss = meta.mode === 'make-miss'

  function renderTeam(teamLabel: string, teamColor: string, players: Player[]) {
    return (
      <div className="flex flex-col gap-1">
        <h3
          className="font-display font-bold text-xs uppercase tracking-widest mb-1"
          style={{ color: teamColor }}
        >
          {teamLabel}
        </h3>
        {players.map(player => {
          const stats = derived.playerStats[player.id]
          if (!stats) return null
          return isMakeMiss
            ? <MakeMissRow key={player.id} player={player} stats={stats} />
            : <PointsOnlyRow key={player.id} player={player} stats={stats} />
        })}
      </div>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface z-50 flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 250ms ease-out' }}
        role="complementary"
        aria-label="Live stats panel"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="font-display font-bold text-xl text-fg">Live Stats</h2>
          <button
            onClick={onClose}
            aria-label="Close stats panel"
            className="text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          {renderTeam(meta.teamA.name, teamAColor, playersA)}
          {renderTeam(meta.teamB.name, teamBColor, playersB)}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/live/LiveStatsPanel.tsx
git commit -m "feat: replace two-tab live stats with single adaptive panel (points-only vs make-miss)"
```

---

## Task 6: 2×2 player grid + no-scroll live game screen

**Current problem:** Each team has one column of N player tiles. With many players the tiles shrink below the minimum and the page scrolls, pushing the action bar off screen.

**New layout:** Each team's column is internally split into two sub-columns (left = first half of players, right = second half). This halves the effective row count, doubling the tile height available, and guarantees no overflow.

Also: change `min-h-dvh` → `h-dvh` on the live game outer container to lock the viewport height.

**Files:**
- Modify: `src/components/live/TeamColumn.tsx`
- Modify: `src/components/live/PlayerGrid.tsx`
- Modify: `src/app/live/[gameId]/LiveGameClient.tsx`

- [ ] **Step 1: Rewrite TeamColumn.tsx to render 2 sub-columns**

Replace full file:

```tsx
import type { Player } from '@/lib/types'
import { PlayerTile } from './PlayerTile'
import { BlankTile } from './BlankTile'

interface TeamColumnProps {
  teamName: string
  teamColor: string
  players: Player[]
  rowCount: number
  tileHeight: number
}

export function TeamColumn({ teamName, teamColor, players, rowCount, tileHeight }: TeamColumnProps) {
  const mid = Math.ceil(players.length / 2)
  const leftPlayers = players.slice(0, mid)
  const rightPlayers = players.slice(mid)

  const leftBlanks = rowCount - leftPlayers.length
  const rightBlanks = rowCount - rightPlayers.length

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="px-2 py-2 border-b-2 shrink-0" style={{ borderBottomColor: teamColor }}>
        <span
          className="font-display font-bold text-sm uppercase tracking-widest"
          style={{ color: teamColor }}
        >
          {teamName}
        </span>
      </div>
      <div className="flex flex-1">
        {/* Left sub-column */}
        <div className="flex flex-col flex-1">
          {leftPlayers.map(player => (
            <PlayerTile key={player.id} player={player} tileHeight={tileHeight} teamColor={teamColor} />
          ))}
          {Array.from({ length: leftBlanks }).map((_, i) => (
            <BlankTile key={`blank-L-${i}`} tileHeight={tileHeight} />
          ))}
        </div>
        <div className="w-px bg-[var(--color-border)] shrink-0" />
        {/* Right sub-column */}
        <div className="flex flex-col flex-1">
          {rightPlayers.map(player => (
            <PlayerTile key={player.id} player={player} tileHeight={tileHeight} teamColor={teamColor} />
          ))}
          {Array.from({ length: rightBlanks }).map((_, i) => (
            <BlankTile key={`blank-R-${i}`} tileHeight={tileHeight} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update PlayerGrid.tsx rowCount calculation**

`rowCount` must reflect the new 2-sub-column layout. With `mid = ceil(N/2)` players per sub-column, `rowCount = Math.max(ceil(playersA.length/2), ceil(playersB.length/2), 1)`.

Replace full file:

```tsx
'use client'

import { useGame } from '@/context/GameContext'
import { TeamColumn } from './TeamColumn'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'

const MIN_TILE_HEIGHT = 56

export function PlayerGrid() {
  const { meta } = useGame()

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')

  // Each team is split into 2 sub-columns, so effective row count is half the player count
  const rowCount = Math.max(
    Math.ceil(playersA.length / 2),
    Math.ceil(playersB.length / 2),
    1
  )

  const tileHeight = Math.max(
    MIN_TILE_HEIGHT,
    typeof window !== 'undefined'
      ? Math.floor((window.innerHeight - 200) / rowCount)
      : MIN_TILE_HEIGHT
  )

  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR

  return (
    <div className="flex flex-1 overflow-hidden">
      <TeamColumn
        teamName={meta.teamA.name}
        teamColor={teamAColor}
        players={playersA}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />
      <div className="w-px bg-[var(--color-border)] shrink-0" />
      <TeamColumn
        teamName={meta.teamB.name}
        teamColor={teamBColor}
        players={playersB}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />
    </div>
  )
}
```

- [ ] **Step 3: Lock live game screen height in LiveGameClient.tsx**

In `src/app/live/[gameId]/LiveGameClient.tsx`, change the outer div from `min-h-dvh` to `h-dvh overflow-hidden`:

```tsx
// Before:
<div className="min-h-dvh bg-bg flex flex-col">

// After:
<div className="h-dvh bg-bg flex flex-col overflow-hidden">
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/alejo/Documents/DevHub/Projects/stat-tap && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/live/TeamColumn.tsx src/components/live/PlayerGrid.tsx src/app/live/[gameId]/LiveGameClient.tsx
git commit -m "feat: 2x2 player grid per team; lock live game screen to viewport height (no scroll)"
```

---

## Self-Review

### Spec coverage check

| Requirement | Task |
|---|---|
| Same color prevented (not just warned) | Task 4 |
| New game full screen | Task 3 |
| Live stats single tab: points-only shows pts, make-miss shows pts + FG/3PT/FT | Task 5 |
| Live game no-scroll, 2 sub-columns per team | Task 6 |
| Game card tap opens stats page | Task 2 |
| Ended game no longer appears as live | Task 1 |
| Final score shown on game cards | Task 1 (status fix makes `game.status === 'ended'` true, which enables the score row) |
| Color changes live preview in setup | Task 4 |
| Games deleted persistently | Tasks 1 (server-side errors surfaced) + Task 2 (client awaits and reverts) |

### Placeholder scan

No TBD, TODO, or hand-wavy steps found. All code is complete and compiles against the existing type definitions.

### Type consistency check

- `TeamColorPickerProps.disabledColor?: string` — optional, matches call sites in `GameSetupForm` where it's always provided (never undefined in practice because both colors have defaults from `DEFAULT_TEAM_A_COLOR` / `DEFAULT_TEAM_B_COLOR`).
- `GameCardProps.onRestoreGame: (game: GameListItem) => void` — matches `HomeClient.handleRestoreGame(game: GameListItem)`.
- `PlayerStats` type used in `MakeMissRow` — comes from `derived.playerStats[player.id]` which is `Record<string, PlayerStats>` from `GameState`. Type is consistent with existing `PointsRow` pattern.
- `rowCount` in `PlayerGrid` is `Math.ceil(N/2)` — passed to `TeamColumn.rowCount` prop which uses it to compute blank tiles. `TeamColumn` computes `leftBlanks = rowCount - leftPlayers.length` where `leftPlayers.length = Math.ceil(players.length/2) = rowCount` at maximum, so blanks never go negative. ✓
