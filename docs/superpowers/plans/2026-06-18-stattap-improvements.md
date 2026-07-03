# StatTap Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add team colors, home page with game list, differentiated logger/public report view, and fix points-only box score display.

**Architecture:** Eight self-contained tasks that each produce working, committable code. Team colors are stored in `GameMeta` (JSON blob in Supabase) and threaded through via props in live game components and report components. The home page becomes a server component fetching game list from Supabase; the game setup form moves to a modal component. The game report differentiates the logger view (ends the game, sees Home + Copy buttons) from the public view (no navigation) via a `?from=logger` query param set on redirect.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase, Lucide React, Vitest

---

## File Structure

**Files to create:**
- `src/components/setup/TeamColorPicker.tsx` — color swatch picker for team setup
- `src/components/setup/GameSetupForm.tsx` — extracted from current `page.tsx`, reusable setup form
- `src/components/home/GameCard.tsx` — individual game row card with copy button
- `src/components/home/HomeClient.tsx` — client component for home page interactivity
- `src/components/home/NewGameModal.tsx` — modal wrapping `GameSetupForm`
- `src/components/report/LoggerActions.tsx` — client component with Home link + Copy URL button
- `src/app/api/games/route.ts` — `GET /api/games` endpoint

**Files to modify:**
- `src/lib/types.ts` — add `teamAColor?`, `teamBColor?` to `GameMeta`; add `GameListItem`
- `src/lib/game.ts` — add `DEFAULT_TEAM_A_COLOR`, `DEFAULT_TEAM_B_COLOR`, `TEAM_COLORS`
- `src/lib/db.ts` — add `listGames()`
- `src/app/api/game/route.ts` — accept `teamAColor`, `teamBColor` in POST body
- `src/app/page.tsx` — transform from setup screen to home server component
- `src/app/game/[gameId]/page.tsx` — add `searchParams`, render `LoggerActions`, pass `mode` + colors to report components
- `src/app/live/[gameId]/LiveGameClient.tsx` — redirect to `?from=logger` after end game
- `src/components/report/BoxScoreTable.tsx` — add `mode` + `teamColor` props, conditional column rendering
- `src/components/report/FinalScoreHeader.tsx` — add `teamAColor` + `teamBColor` props
- `src/components/live/ScoreHeader.tsx` — add `teamAColor` + `teamBColor` props
- `src/components/live/PlayerGrid.tsx` — read colors from context, pass to `TeamColumn`
- `src/components/live/TeamColumn.tsx` — add `teamColor` prop, inline style
- `src/components/live/PlayerTile.tsx` — add `teamColor` prop, inline style for selected border
- `src/components/live/LiveStatsPanel.tsx` — read colors from context

---

## Task 1: Fix BoxScoreTable for Points-Only Mode

In `points-only` mode users never log misses, so showing `3/3 FG` is misleading. Show only the makes count.

**Files:**
- Modify: `src/components/report/BoxScoreTable.tsx`
- Modify: `src/app/game/[gameId]/page.tsx`

- [ ] **Step 1: Update BoxScoreTable to accept and use `mode` prop**

Replace the full content of `src/components/report/BoxScoreTable.tsx`:

```tsx
import type { Player, PlayerStats, StatMode } from '@/lib/types'

interface BoxScoreTableProps {
  teamName: string
  team: 'A' | 'B'
  players: Player[]
  playerStats: Record<string, PlayerStats>
  mode: StatMode
}

export function BoxScoreTable({ teamName, team, players, playerStats, mode }: BoxScoreTableProps) {
  const accentColor = team === 'A' ? 'text-team-a' : 'text-team-b'
  const accentBorder = team === 'A' ? 'border-team-a' : 'border-team-b'
  const isPointsOnly = mode === 'points-only'

  const sorted = [...players].sort((a, b) => {
    const aPoints = playerStats[a.id]?.points ?? 0
    const bPoints = playerStats[b.id]?.points ?? 0
    return bPoints - aPoints
  })

  return (
    <div className={`bg-surface rounded-xl overflow-hidden border-t-4 ${accentBorder}`}>
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className={`font-display font-bold text-lg uppercase tracking-wide ${accentColor}`}>
          {teamName}
        </h2>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-4 py-2 font-body text-xs text-muted uppercase tracking-wide">Player</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">PTS</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">FG</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">3P</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">FT</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(player => {
            const stats = playerStats[player.id] ?? {
              points: 0, fgMakes: 0, fgAttempts: 0,
              threeMakes: 0, threeAttempts: 0, ftMakes: 0, ftAttempts: 0,
            }
            return (
              <tr key={player.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3 font-display font-semibold text-base text-fg">{player.displayLabel}</td>
                <td className="px-3 py-3 text-right font-display font-bold text-base text-fg tabular-nums">{stats.points}</td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.fgMakes : `${stats.fgMakes}/${stats.fgAttempts}`}
                </td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.threeMakes : `${stats.threeMakes}/${stats.threeAttempts}`}
                </td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.ftMakes : `${stats.ftMakes}/${stats.ftAttempts}`}
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted font-body text-sm">No players</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Pass `mode` from game report page to BoxScoreTable**

In `src/app/game/[gameId]/page.tsx`, update both `BoxScoreTable` calls to add `mode={meta.mode}`:

```tsx
<BoxScoreTable
  teamName={meta.teamA.name}
  team="A"
  players={playersA}
  playerStats={finalState.playerStats}
  mode={meta.mode}
/>
<BoxScoreTable
  teamName={meta.teamB.name}
  team="B"
  players={playersB}
  playerStats={finalState.playerStats}
  mode={meta.mode}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/report/BoxScoreTable.tsx src/app/game/[gameId]/page.tsx
git commit -m "fix: show makes-only in points-only mode box score"
```

---

## Task 2: Differentiated Logger vs Public Report View

After ending a game, the stat keeper is redirected to `/game/{id}?from=logger`. That view shows Home + Copy URL buttons. The public shareable link (`/game/{id}`) shows the same stats with no navigation buttons.

**Files:**
- Modify: `src/app/live/[gameId]/LiveGameClient.tsx`
- Create: `src/components/report/LoggerActions.tsx`
- Modify: `src/app/game/[gameId]/page.tsx`

- [ ] **Step 1: Update redirect in LiveGameClient to include `?from=logger`**

In `src/app/live/[gameId]/LiveGameClient.tsx`, change line 32:

Old:
```tsx
router.push(`/game/${meta.id}`)
```

New:
```tsx
router.push(`/game/${meta.id}?from=logger`)
```

- [ ] **Step 2: Create LoggerActions client component**

Create `src/components/report/LoggerActions.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, Copy, Check } from 'lucide-react'

interface LoggerActionsProps {
  gameId: string
}

export function LoggerActions({ gameId }: LoggerActionsProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/game/${gameId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-3 bg-surface rounded-xl border border-[var(--color-border)] text-fg font-display font-semibold text-sm uppercase tracking-wide cursor-pointer hover:bg-surface-elevated transition-colors min-h-[48px]"
      >
        <Home size={16} />
        Home
      </Link>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-display font-bold text-sm uppercase tracking-wide cursor-pointer active:opacity-85 transition-all duration-150 min-h-[48px]"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied!' : 'Copy Share Link'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Update game report page to read searchParams and render LoggerActions**

Replace the full content of `src/app/game/[gameId]/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getMeta, getEvents, getSnapshot } from '@/lib/db'
import { gameReducer } from '@/lib/reducer'
import { FinalScoreHeader } from '@/components/report/FinalScoreHeader'
import { BoxScoreTable } from '@/components/report/BoxScoreTable'
import { LoggerActions } from '@/components/report/LoggerActions'
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

  return (
    <main className="min-h-dvh bg-bg p-6 flex flex-col gap-8 max-w-3xl mx-auto">
      {isLogger && <LoggerActions gameId={gameId} />}

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
      />

      <div className="flex flex-col gap-6">
        <BoxScoreTable
          teamName={meta.teamA.name}
          team="A"
          players={playersA}
          playerStats={finalState.playerStats}
          mode={meta.mode}
        />
        <BoxScoreTable
          teamName={meta.teamB.name}
          team="B"
          players={playersB}
          playerStats={finalState.playerStats}
          mode={meta.mode}
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/live/[gameId]/LiveGameClient.tsx src/components/report/LoggerActions.tsx src/app/game/[gameId]/page.tsx
git commit -m "feat: differentiate logger vs public game report view"
```

---

## Task 3: Add Team Colors to GameMeta Type + API

Colors are stored as hex strings in `GameMeta`. Default: Team A = `#38BDF8` (sky blue), Team B = `#A78BFA` (purple). The POST API accepts optional `teamAColor` and `teamBColor` and falls back to defaults.

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/game.ts`
- Modify: `src/app/api/game/route.ts`

- [ ] **Step 1: Add color constants to `src/lib/game.ts`**

Add at the bottom of `src/lib/game.ts`:

```typescript
export const DEFAULT_TEAM_A_COLOR = '#38BDF8'
export const DEFAULT_TEAM_B_COLOR = '#A78BFA'

export const TEAM_COLORS = [
  '#38BDF8', // sky blue
  '#3B82F6', // blue
  '#A78BFA', // purple
  '#EC4899', // pink
  '#F97316', // orange
  '#22C55E', // green
  '#EAB308', // yellow
  '#EF4444', // red
]
```

- [ ] **Step 2: Add `teamAColor` and `teamBColor` to `GameMeta` in `src/lib/types.ts`**

Change the `GameMeta` interface to add two optional fields after `createdAt`:

Old:
```typescript
export interface GameMeta {
  id: string
  teamA: { name: string }
  teamB: { name: string }
  players: Player[]
  mode: StatMode
  status: GameStatus
  createdAt: number
}
```

New:
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
}
```

- [ ] **Step 3: Update POST `/api/game` to store colors**

Replace the full content of `src/app/api/game/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { setMeta } from '@/lib/db'
import { resolveDisplayLabel, DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { GameMeta, Player } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { teamA, teamB, players, mode, teamAColor, teamBColor } = body

  if (!players || players.length === 0) {
    return NextResponse.json({ error: 'At least one player required' }, { status: 400 })
  }

  const gameId = crypto.randomUUID()

  const resolvedPlayers: Player[] = (players as Array<{
    team: 'A' | 'B'
    jersey?: string
    name?: string
    slot?: number
  }>).map((p, i) => ({
    id: crypto.randomUUID(),
    team: p.team,
    jersey: p.jersey ?? null,
    name: p.name ?? null,
    displayLabel: resolveDisplayLabel(p.jersey ?? null, p.name ?? null, p.slot ?? i + 1),
    slot: p.slot ?? i + 1,
  }))

  const meta: GameMeta = {
    id: gameId,
    teamA: { name: teamA?.name ?? 'Team A' },
    teamB: { name: teamB?.name ?? 'Team B' },
    players: resolvedPlayers,
    mode: mode ?? 'points-only',
    status: 'live',
    createdAt: Date.now(),
    teamAColor: typeof teamAColor === 'string' ? teamAColor : DEFAULT_TEAM_A_COLOR,
    teamBColor: typeof teamBColor === 'string' ? teamBColor : DEFAULT_TEAM_B_COLOR,
  }

  await setMeta(gameId, meta)
  return NextResponse.json({ gameId })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/game.ts src/app/api/game/route.ts
git commit -m "feat: add team colors to GameMeta type and game creation API"
```

---

## Task 4: TeamColorPicker Component + Setup Form Integration

Add a color swatch picker to the game setup form. The existing `page.tsx` (game setup screen) gets color state and the new picker component.

**Files:**
- Create: `src/components/setup/TeamColorPicker.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create TeamColorPicker component**

Create `src/components/setup/TeamColorPicker.tsx`:

```tsx
import { TEAM_COLORS } from '@/lib/game'

interface TeamColorPickerProps {
  team: 'A' | 'B'
  value: string
  onChange: (color: string) => void
}

export function TeamColorPicker({ team, value, onChange }: TeamColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-body text-muted uppercase tracking-wide">Team {team} Color</label>
      <div className="flex gap-2 flex-wrap">
        {TEAM_COLORS.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Select color ${color} for Team ${team}`}
            aria-pressed={value === color}
            style={{ backgroundColor: color }}
            className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-150 ${
              value === color
                ? 'ring-2 ring-offset-2 ring-offset-bg ring-white scale-110'
                : 'hover:scale-105 active:scale-95'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add color state and TeamColorPicker to `src/app/page.tsx`**

Replace the full content of `src/app/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { TeamNameInput } from '@/components/setup/TeamNameInput'
import { PlayerEntryList } from '@/components/setup/PlayerEntryList'
import { ModeSelector } from '@/components/setup/ModeSelector'
import { TeamColorPicker } from '@/components/setup/TeamColorPicker'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { StatMode } from '@/lib/types'

interface PlayerEntry {
  jersey: string
  name: string
  slot: number
}

export default function GameSetupScreen() {
  const router = useRouter()
  const [teamAName, setTeamAName] = useState('')
  const [teamBName, setTeamBName] = useState('')
  const [playersA, setPlayersA] = useState<PlayerEntry[]>([])
  const [playersB, setPlayersB] = useState<PlayerEntry[]>([])
  const [mode, setMode] = useState<StatMode>('points-only')
  const [teamAColor, setTeamAColor] = useState(DEFAULT_TEAM_A_COLOR)
  const [teamBColor, setTeamBColor] = useState(DEFAULT_TEAM_B_COLOR)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPlayers = playersA.length + playersB.length
  const canStart = totalPlayers > 0

  async function handleStart() {
    if (!canStart || loading) return
    setLoading(true)
    setError(null)

    const players = [
      ...playersA.map(p => ({ ...p, team: 'A' })),
      ...playersB.map(p => ({ ...p, team: 'B' })),
    ]

    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamA: { name: teamAName || 'Team A' },
          teamB: { name: teamBName || 'Team B' },
          players,
          mode,
          teamAColor,
          teamBColor,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create game')
      router.push(`/live/${data.gameId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create game')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-bg p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-3">
        <Zap size={28} className="text-primary" fill="currentColor" />
        <h1 className="font-display font-bold text-3xl text-fg">StatTap</h1>
      </header>

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

      <div className="grid grid-cols-2 gap-6">
        <PlayerEntryList team="A" entries={playersA} onChange={setPlayersA} />
        <PlayerEntryList team="B" entries={playersB} onChange={setPlayersB} />
      </div>

      <ModeSelector value={mode} onChange={setMode} />

      {error && <p className="text-destructive font-body text-sm">{error}</p>}

      <button
        onClick={handleStart}
        disabled={!canStart || loading}
        className="bg-primary text-white font-display font-bold text-xl py-4 px-8 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] active:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed self-end"
      >
        {loading ? 'Creating game…' : 'Start Game →'}
      </button>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/setup/TeamColorPicker.tsx src/app/page.tsx
git commit -m "feat: add team color picker to game setup"
```

---

## Task 5: Apply Team Colors in Live Game Components

Thread custom team colors through the live game UI. Components that use `useGame()` read colors from `meta`; `ScoreHeader` receives them as props from `LiveGameInner`.

**Files:**
- Modify: `src/components/live/ScoreHeader.tsx`
- Modify: `src/app/live/[gameId]/LiveGameClient.tsx`
- Modify: `src/components/live/PlayerGrid.tsx`
- Modify: `src/components/live/TeamColumn.tsx`
- Modify: `src/components/live/PlayerTile.tsx`
- Modify: `src/components/live/LiveStatsPanel.tsx`

- [ ] **Step 1: Update ScoreHeader to accept team colors as props**

Replace the full content of `src/components/live/ScoreHeader.tsx`:

```tsx
'use client'

import { RotateCcw, X } from 'lucide-react'

interface ScoreHeaderProps {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  teamAColor: string
  teamBColor: string
  onUndo: () => void
  onEndGameClick: () => void
}

export function ScoreHeader({
  teamAName, teamBName, scoreA, scoreB,
  teamAColor, teamBColor,
  onUndo, onEndGameClick,
}: ScoreHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-[var(--color-border)] shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onUndo}
          aria-label="Undo last event"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated text-muted hover:text-fg transition-colors duration-150 cursor-pointer active:opacity-85 active:scale-[0.98] min-h-[48px]"
        >
          <RotateCcw size={18} />
          <span className="font-display font-semibold text-sm uppercase tracking-wide">Undo</span>
        </button>
      </div>

      <div className="flex items-center gap-6" aria-live="polite" aria-label={`Score: ${teamAName} ${scoreA}, ${teamBName} ${scoreB}`}>
        <div className="flex flex-col items-end">
          <span
            className="font-display font-bold text-sm uppercase tracking-widest"
            style={{ color: teamAColor }}
          >
            {teamAName}
          </span>
          <span className="font-display font-bold text-[72px] leading-none text-score tabular-nums">{scoreA}</span>
        </div>
        <span className="font-display font-bold text-4xl text-muted">–</span>
        <div className="flex flex-col items-start">
          <span
            className="font-display font-bold text-sm uppercase tracking-widest"
            style={{ color: teamBColor }}
          >
            {teamBName}
          </span>
          <span className="font-display font-bold text-[72px] leading-none text-score tabular-nums">{scoreB}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onEndGameClick}
          aria-label="End game"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-150 cursor-pointer active:opacity-85 active:scale-[0.98] min-h-[48px]"
        >
          <X size={18} />
          <span className="font-display font-semibold text-sm uppercase tracking-wide">End Game</span>
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Pass team colors from meta to ScoreHeader in LiveGameClient**

In `src/app/live/[gameId]/LiveGameClient.tsx`, add the import and update `LiveGameInner`:

Add import at top:
```tsx
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
```

In `LiveGameInner`, update the `ScoreHeader` usage (inside the `return`):

Old:
```tsx
<ScoreHeader
  teamAName={meta.teamA.name}
  teamBName={meta.teamB.name}
  scoreA={derived.scoreA}
  scoreB={derived.scoreB}
  onUndo={handleUndo}
  onEndGameClick={() => setShowEndGameModal(true)}
/>
```

New:
```tsx
<ScoreHeader
  teamAName={meta.teamA.name}
  teamBName={meta.teamB.name}
  scoreA={derived.scoreA}
  scoreB={derived.scoreB}
  teamAColor={meta.teamAColor ?? DEFAULT_TEAM_A_COLOR}
  teamBColor={meta.teamBColor ?? DEFAULT_TEAM_B_COLOR}
  onUndo={handleUndo}
  onEndGameClick={() => setShowEndGameModal(true)}
/>
```

- [ ] **Step 3: Update PlayerGrid to read colors and pass to TeamColumn**

Replace the full content of `src/components/live/PlayerGrid.tsx`:

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
  const rowCount = Math.max(playersA.length, playersB.length, 1)

  const tileHeight = Math.max(MIN_TILE_HEIGHT,
    typeof window !== 'undefined'
      ? Math.floor((window.innerHeight - 180) / rowCount)
      : MIN_TILE_HEIGHT
  )

  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR

  return (
    <div className="flex flex-1 overflow-hidden">
      <TeamColumn
        team="A"
        teamName={meta.teamA.name}
        teamColor={teamAColor}
        players={playersA}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />
      <div className="w-px bg-[var(--color-border)] shrink-0" />
      <TeamColumn
        team="B"
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

- [ ] **Step 4: Update TeamColumn to accept and use teamColor**

Replace the full content of `src/components/live/TeamColumn.tsx`:

```tsx
import type { Player } from '@/lib/types'
import { PlayerTile } from './PlayerTile'
import { BlankTile } from './BlankTile'

interface TeamColumnProps {
  team: 'A' | 'B'
  teamName: string
  teamColor: string
  players: Player[]
  rowCount: number
  tileHeight: number
}

export function TeamColumn({ team, teamName, teamColor, players, rowCount, tileHeight }: TeamColumnProps) {
  const blankCount = rowCount - players.length

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="px-4 py-2 border-b-2 shrink-0" style={{ borderBottomColor: teamColor }}>
        <span
          className="font-display font-bold text-sm uppercase tracking-widest"
          style={{ color: teamColor }}
        >
          {teamName}
        </span>
      </div>
      <div className="flex flex-col flex-1">
        {players.map(player => (
          <PlayerTile key={player.id} player={player} tileHeight={tileHeight} teamColor={teamColor} />
        ))}
        {Array.from({ length: blankCount }).map((_, i) => (
          <BlankTile key={`blank-${i}`} tileHeight={tileHeight} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update PlayerTile to accept teamColor and use inline border style**

Replace the full content of `src/components/live/PlayerTile.tsx`:

```tsx
'use client'

import { useGame } from '@/context/GameContext'
import type { Player } from '@/lib/types'

interface PlayerTileProps {
  player: Player
  tileHeight: number
  teamColor: string
}

export function PlayerTile({ player, tileHeight, teamColor }: PlayerTileProps) {
  const { selectedPlayerId, dispatch } = useGame()
  const isSelected = selectedPlayerId === player.id

  function handleClick() {
    dispatch({ type: 'SET_SELECTED', playerId: player.id })
  }

  return (
    <button
      aria-pressed={isSelected}
      aria-label={`${player.displayLabel}, Team ${player.team}`}
      onClick={handleClick}
      style={{
        height: `${tileHeight}px`,
        ...(isSelected ? { borderLeftColor: teamColor } : {}),
      }}
      className={`
        w-full flex items-center justify-center px-4
        font-display font-semibold text-lg text-fg
        border border-[var(--color-border)]
        cursor-pointer select-none
        transition-all duration-[120ms] ease-out
        ${isSelected
          ? 'bg-surface-elevated border-l-4'
          : 'bg-surface hover:bg-surface-elevated/50'
        }
      `}
    >
      {player.displayLabel}
    </button>
  )
}
```

- [ ] **Step 6: Update LiveStatsPanel to use team colors from context**

Replace the full content of `src/components/live/LiveStatsPanel.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { Player } from '@/lib/types'
import type { GameState } from '@/lib/types'

type StatsTab = 'points' | 'shooting'

function PointsRow({ player, points }: { player: Player; points: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
      <span className="font-display font-semibold text-base text-fg">{player.displayLabel}</span>
      <span className="font-display font-bold text-lg text-fg tabular-nums">{points} pts</span>
    </div>
  )
}

function ShootingRow({ player, stats }: {
  player: Player
  stats: {
    fgMakes: number
    fgAttempts: number
    threeMakes: number
    threeAttempts: number
    ftMakes: number
    ftAttempts: number
  }
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)] gap-4">
      <span className="font-display font-semibold text-sm text-fg shrink-0">{player.displayLabel}</span>
      <span className="font-body text-xs text-muted tabular-nums whitespace-nowrap">
        {stats.fgMakes}/{stats.fgAttempts} FG · {stats.threeMakes}/{stats.threeAttempts} 3P · {stats.ftMakes}/{stats.ftAttempts} FT
      </span>
    </div>
  )
}

function TeamStatsSection({ teamLabel, teamColor, players, tab, derived }: {
  teamLabel: string
  teamColor: string
  players: Player[]
  tab: StatsTab
  derived: GameState
}) {
  const sorted = [...players].sort((a, b) => {
    const aStats = derived.playerStats[a.id]
    const bStats = derived.playerStats[b.id]
    return (bStats?.points ?? 0) - (aStats?.points ?? 0)
  })

  return (
    <div className="flex flex-col gap-1">
      <h3
        className="font-display font-bold text-xs uppercase tracking-widest mb-1"
        style={{ color: teamColor }}
      >
        {teamLabel}
      </h3>
      {sorted.map(player => {
        const stats = derived.playerStats[player.id]
        if (!stats) return null
        return tab === 'points'
          ? <PointsRow key={player.id} player={player} points={stats.points} />
          : <ShootingRow key={player.id} player={player} stats={stats} />
      })}
    </div>
  )
}

interface LiveStatsPanelProps {
  onClose: () => void
}

export function LiveStatsPanel({ onClose }: LiveStatsPanelProps) {
  const { meta, derived } = useGame()
  const [tab, setTab] = useState<StatsTab>('points')

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')
  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-display font-bold text-xl text-fg">Live Stats</h2>
          <button
            onClick={onClose}
            aria-label="Close stats panel"
            className="text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex gap-0 px-6 py-3 border-b border-[var(--color-border)]">
          {(['points', 'shooting'] as StatsTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`flex-1 py-2 font-display font-semibold text-sm uppercase tracking-wide cursor-pointer transition-colors
                ${tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted hover:text-fg border-b-2 border-transparent'
                }`}
            >
              {t === 'points' ? 'Points' : 'Shooting'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          <TeamStatsSection
            teamLabel={meta.teamA.name}
            teamColor={teamAColor}
            players={playersA}
            tab={tab}
            derived={derived}
          />
          <TeamStatsSection
            teamLabel={meta.teamB.name}
            teamColor={teamBColor}
            players={playersB}
            tab={tab}
            derived={derived}
          />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/live/ScoreHeader.tsx src/app/live/[gameId]/LiveGameClient.tsx src/components/live/PlayerGrid.tsx src/components/live/TeamColumn.tsx src/components/live/PlayerTile.tsx src/components/live/LiveStatsPanel.tsx
git commit -m "feat: apply custom team colors in live game UI"
```

---

## Task 6: Apply Team Colors in Game Report Components

Thread custom team colors into `FinalScoreHeader` and `BoxScoreTable`, replacing the hardcoded `text-team-a/b` and `border-team-a/b` CSS classes.

**Files:**
- Modify: `src/components/report/FinalScoreHeader.tsx`
- Modify: `src/components/report/BoxScoreTable.tsx`
- Modify: `src/app/game/[gameId]/page.tsx`

- [ ] **Step 1: Update FinalScoreHeader to accept and use team colors**

Replace the full content of `src/components/report/FinalScoreHeader.tsx`:

```tsx
interface FinalScoreHeaderProps {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  isLive: boolean
  teamAColor: string
  teamBColor: string
}

export function FinalScoreHeader({
  teamAName, teamBName, scoreA, scoreB, isLive, teamAColor, teamBColor,
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

- [ ] **Step 2: Update BoxScoreTable to accept and use teamColor**

Replace the full content of `src/components/report/BoxScoreTable.tsx`:

```tsx
import type { Player, PlayerStats, StatMode } from '@/lib/types'

interface BoxScoreTableProps {
  teamName: string
  team: 'A' | 'B'
  players: Player[]
  playerStats: Record<string, PlayerStats>
  mode: StatMode
  teamColor: string
}

export function BoxScoreTable({ teamName, players, playerStats, mode, teamColor }: BoxScoreTableProps) {
  const isPointsOnly = mode === 'points-only'

  const sorted = [...players].sort((a, b) => {
    const aPoints = playerStats[a.id]?.points ?? 0
    const bPoints = playerStats[b.id]?.points ?? 0
    return bPoints - aPoints
  })

  return (
    <div
      className="bg-surface rounded-xl overflow-hidden border-t-4"
      style={{ borderTopColor: teamColor }}
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2
          className="font-display font-bold text-lg uppercase tracking-wide"
          style={{ color: teamColor }}
        >
          {teamName}
        </h2>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-4 py-2 font-body text-xs text-muted uppercase tracking-wide">Player</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">PTS</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">FG</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">3P</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">FT</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(player => {
            const stats = playerStats[player.id] ?? {
              points: 0, fgMakes: 0, fgAttempts: 0,
              threeMakes: 0, threeAttempts: 0, ftMakes: 0, ftAttempts: 0,
            }
            return (
              <tr key={player.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3 font-display font-semibold text-base text-fg">{player.displayLabel}</td>
                <td className="px-3 py-3 text-right font-display font-bold text-base text-fg tabular-nums">{stats.points}</td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.fgMakes : `${stats.fgMakes}/${stats.fgAttempts}`}
                </td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.threeMakes : `${stats.threeMakes}/${stats.threeAttempts}`}
                </td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.ftMakes : `${stats.ftMakes}/${stats.ftAttempts}`}
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted font-body text-sm">No players</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Update game report page to pass colors to report components**

Replace the full content of `src/app/game/[gameId]/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getMeta, getEvents, getSnapshot } from '@/lib/db'
import { gameReducer } from '@/lib/reducer'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import { FinalScoreHeader } from '@/components/report/FinalScoreHeader'
import { BoxScoreTable } from '@/components/report/BoxScoreTable'
import { LoggerActions } from '@/components/report/LoggerActions'
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
      />

      <div className="flex flex-col gap-6">
        <BoxScoreTable
          teamName={meta.teamA.name}
          team="A"
          players={playersA}
          playerStats={finalState.playerStats}
          mode={meta.mode}
          teamColor={teamAColor}
        />
        <BoxScoreTable
          teamName={meta.teamB.name}
          team="B"
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

- [ ] **Step 4: Commit**

```bash
git add src/components/report/FinalScoreHeader.tsx src/components/report/BoxScoreTable.tsx src/app/game/[gameId]/page.tsx
git commit -m "feat: apply custom team colors in game report view"
```

---

## Task 7: Add listGames to DB + GET /api/games Endpoint

Enable the home page to fetch all games, including team names and colors for display in cards.

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/db.ts`
- Create: `src/app/api/games/route.ts`

- [ ] **Step 1: Add `GameListItem` type to `src/lib/types.ts`**

Add after the `GameSnapshot` interface:

```typescript
export interface GameListItem {
  id: string
  teamAName: string
  teamBName: string
  teamAColor: string
  teamBColor: string
  status: 'live' | 'ended'
  createdAt: number
}
```

- [ ] **Step 2: Add `listGames()` to `src/lib/db.ts`**

Add the import and function to `src/lib/db.ts`. At the top, add import:

```typescript
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from './game'
import type { GameMeta, GameEvent, GameSnapshot, GameListItem } from './types'
```

(Replace existing `import type { GameMeta, GameEvent, GameSnapshot } from './types'`)

Then add at the bottom of `src/lib/db.ts`:

```typescript
export async function listGames(): Promise<GameListItem[]> {
  const { data } = await getClient()
    .from('games')
    .select('id, meta, status, created_at')
    .order('created_at', { ascending: false })

  return (data ?? []).map(row => {
    const meta = row.meta as unknown as GameMeta
    return {
      id: row.id,
      teamAName: meta.teamA.name,
      teamBName: meta.teamB.name,
      teamAColor: meta.teamAColor ?? DEFAULT_TEAM_A_COLOR,
      teamBColor: meta.teamBColor ?? DEFAULT_TEAM_B_COLOR,
      status: row.status as 'live' | 'ended',
      createdAt: new Date(row.created_at).getTime(),
    }
  })
}
```

- [ ] **Step 3: Create GET `/api/games` route**

Create `src/app/api/games/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { listGames } from '@/lib/db'

export async function GET() {
  const games = await listGames()
  return NextResponse.json({ games })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/db.ts src/app/api/games/route.ts
git commit -m "feat: add listGames DB function and GET /api/games endpoint"
```

---

## Task 8: Home Page Redesign with Game List + New Game Modal

Transform `page.tsx` from the game setup screen into a home page. Extract the setup form into a reusable component. Add a game list with cards and a modal for creating new games.

**Files:**
- Create: `src/components/setup/GameSetupForm.tsx`
- Create: `src/components/home/GameCard.tsx`
- Create: `src/components/home/HomeClient.tsx`
- Create: `src/components/home/NewGameModal.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create GameSetupForm extracted from current page.tsx**

Create `src/components/setup/GameSetupForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TeamNameInput } from '@/components/setup/TeamNameInput'
import { PlayerEntryList } from '@/components/setup/PlayerEntryList'
import { ModeSelector } from '@/components/setup/ModeSelector'
import { TeamColorPicker } from '@/components/setup/TeamColorPicker'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { StatMode } from '@/lib/types'

interface PlayerEntry {
  jersey: string
  name: string
  slot: number
}

interface GameSetupFormProps {
  onCancel?: () => void
}

export function GameSetupForm({ onCancel }: GameSetupFormProps) {
  const router = useRouter()
  const [teamAName, setTeamAName] = useState('')
  const [teamBName, setTeamBName] = useState('')
  const [playersA, setPlayersA] = useState<PlayerEntry[]>([])
  const [playersB, setPlayersB] = useState<PlayerEntry[]>([])
  const [mode, setMode] = useState<StatMode>('points-only')
  const [teamAColor, setTeamAColor] = useState(DEFAULT_TEAM_A_COLOR)
  const [teamBColor, setTeamBColor] = useState(DEFAULT_TEAM_B_COLOR)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPlayers = playersA.length + playersB.length
  const canStart = totalPlayers > 0

  async function handleStart() {
    if (!canStart || loading) return
    setLoading(true)
    setError(null)

    const players = [
      ...playersA.map(p => ({ ...p, team: 'A' })),
      ...playersB.map(p => ({ ...p, team: 'B' })),
    ]

    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamA: { name: teamAName || 'Team A' },
          teamB: { name: teamBName || 'Team B' },
          players,
          mode,
          teamAColor,
          teamBColor,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create game')
      router.push(`/live/${data.gameId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create game')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
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

      <div className="grid grid-cols-2 gap-6">
        <PlayerEntryList team="A" entries={playersA} onChange={setPlayersA} />
        <PlayerEntryList team="B" entries={playersB} onChange={setPlayersB} />
      </div>

      <ModeSelector value={mode} onChange={setMode} />

      {error && <p className="text-destructive font-body text-sm">{error}</p>}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-muted font-display font-semibold text-lg cursor-pointer hover:text-fg transition-colors min-h-[48px]"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || loading}
          className="bg-primary text-white font-display font-bold text-xl py-4 px-8 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] active:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating game…' : 'Start Game →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create NewGameModal component**

Create `src/components/home/NewGameModal.tsx`:

```tsx
'use client'

import { X } from 'lucide-react'
import { GameSetupForm } from '@/components/setup/GameSetupForm'

interface NewGameModalProps {
  onClose: () => void
}

export function NewGameModal({ onClose }: NewGameModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-4 top-8 bottom-8 z-50 bg-bg rounded-2xl overflow-y-auto max-w-3xl mx-auto shadow-2xl"
        role="dialog"
        aria-label="New Game Setup"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] sticky top-0 bg-bg z-10">
          <h2 className="font-display font-bold text-2xl text-fg">New Game</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>
        <GameSetupForm onCancel={onClose} />
      </div>
    </>
  )
}
```

- [ ] **Step 3: Create GameCard component**

Create `src/components/home/GameCard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Zap } from 'lucide-react'
import type { GameListItem } from '@/lib/types'

interface GameCardProps {
  game: GameListItem
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const url = `${window.location.origin}/game/${game.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleCardClick() {
    router.push(`/game/${game.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleCardClick()}
      className="bg-surface border border-[var(--color-border)] rounded-xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-elevated transition-colors min-h-[72px] active:scale-[0.99] active:opacity-90"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-display font-bold text-lg" style={{ color: game.teamAColor }}>
          {game.teamAName}
        </span>
        <span className="text-muted font-body text-base shrink-0">vs</span>
        <span className="font-display font-bold text-lg" style={{ color: game.teamBColor }}>
          {game.teamBName}
        </span>
        {game.status === 'live' && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full shrink-0">
            <Zap size={10} className="text-primary" fill="currentColor" />
            <span className="text-primary font-display font-bold text-xs uppercase tracking-wide">Live</span>
          </span>
        )}
      </div>
      <button
        onClick={handleCopy}
        aria-label="Copy share link"
        className="shrink-0 flex items-center justify-center p-2 rounded-lg bg-surface-elevated text-muted hover:text-fg transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
      >
        {copied ? <Check size={18} className="text-make" /> : <Copy size={18} />}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create HomeClient component**

Create `src/components/home/HomeClient.tsx`:

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
        {initialGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-20">
            <Zap size={48} className="text-muted opacity-30" />
            <p className="font-display font-bold text-xl text-muted">No games yet</p>
            <p className="font-body text-sm text-muted opacity-70">Tap &ldquo;New Game&rdquo; to start tracking</p>
          </div>
        ) : (
          initialGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))
        )}
      </div>

      {showModal && <NewGameModal onClose={() => setShowModal(false)} />}
    </main>
  )
}
```

- [ ] **Step 5: Replace page.tsx with home server component**

Replace the full content of `src/app/page.tsx`:

```tsx
import { listGames } from '@/lib/db'
import { HomeClient } from '@/components/home/HomeClient'

export default async function HomePage() {
  const games = await listGames()
  return <HomeClient initialGames={games} />
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/setup/GameSetupForm.tsx src/components/home/GameCard.tsx src/components/home/HomeClient.tsx src/components/home/NewGameModal.tsx src/app/page.tsx
git commit -m "feat: home page with game list and new game modal"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Points-only box score shows only makes count (not make/miss) | Task 1 |
| Logger sees Home + Copy URL buttons after ending game | Task 2 |
| Shareable link is standalone — no navigation | Task 2 (no nav in public view) |
| LiveGameClient redirects to `?from=logger` | Task 2 |
| Team color picker in game setup | Task 4 |
| Colors stored in GameMeta | Task 3 |
| Colors applied in live game | Task 5 |
| Colors applied in game report | Task 6 |
| Home page with game list | Tasks 7 + 8 |
| Games shown as "Team A vs Team B" with copy button per card | Task 8 |
| Tapping card navigates to stats page | Task 8 (`GameCard`) |
| "New Game" button opens setup as modal | Task 8 (`NewGameModal`) |
| Games saved globally (no auth) | Task 7 (`listGames` fetches all) |

**Placeholder scan:** No TBD, TODO, or incomplete steps found.

**Type consistency:**
- `BoxScoreTable` receives `mode: StatMode` and `teamColor: string` — set in Tasks 1 and 6, both match.
- `FinalScoreHeader` receives `teamAColor: string` and `teamBColor: string` — set in Task 6, matches.
- `ScoreHeader` receives `teamAColor: string` and `teamBColor: string` — set in Task 5, matches.
- `TeamColumn` receives `teamColor: string` — set in Task 5, passed from `PlayerGrid`, matches.
- `PlayerTile` receives `teamColor: string` — set in Task 5, passed from `TeamColumn`, matches.
- `GameListItem` type — added in Task 7, used in Tasks 7 and 8, consistent.
- `DEFAULT_TEAM_A_COLOR` / `DEFAULT_TEAM_B_COLOR` — defined in `game.ts` (Task 3), imported in Tasks 4, 5, 6, 7, all consistent.
- `TEAM_COLORS` — defined in `game.ts` (Task 3), imported in `TeamColorPicker` (Task 4), consistent.
- `listGames()` — defined in `db.ts` (Task 7), used in `page.tsx` (Task 8) and `GET /api/games` (Task 7), consistent.
