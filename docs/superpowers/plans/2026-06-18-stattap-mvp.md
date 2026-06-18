# StatTap MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **UI/UX Requirement:** Before building any frontend component, read `design-system/stattap/MASTER.md`. Every component must conform to the design tokens, touch targets, typography, and anti-patterns defined there. No exceptions.

**Goal:** Build a complete real-time basketball pickup game stat tracker web app — 2-tap stat entry, live scoreboard, undo, end-game snapshot, and shareable read-only link.

**Architecture:** Pure event log stored in Vercel KV. All game state is derived by running a pure reducer over the event list. The UI updates optimistically on every tap and syncs to the server in the background.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vercel KV, Lucide React, Barlow Condensed + Barlow fonts, Vitest + React Testing Library

---

## File Map

```
src/
├── app/
│   ├── globals.css                         ← CSS variables, font import, base reset
│   ├── layout.tsx                          ← Root layout, font loading
│   ├── page.tsx                            ← GameSetupScreen
│   ├── live/[gameId]/page.tsx              ← LiveGameScreen
│   ├── game/[gameId]/page.tsx              ← GameReportScreen (server component)
│   └── api/
│       ├── game/route.ts                   ← POST /api/game
│       └── game/[id]/
│           ├── route.ts                    ← GET /api/game/[id]
│           ├── event/route.ts              ← POST /api/game/[id]/event
│           ├── undo/route.ts               ← POST /api/game/[id]/undo
│           └── end/route.ts               ← POST /api/game/[id]/end
│
├── components/
│   ├── setup/
│   │   ├── TeamNameInput.tsx
│   │   ├── PlayerEntryList.tsx
│   │   ├── PlayerEntryRow.tsx
│   │   └── ModeSelector.tsx
│   ├── live/
│   │   ├── ScoreHeader.tsx
│   │   ├── PlayerGrid.tsx
│   │   ├── TeamColumn.tsx
│   │   ├── PlayerTile.tsx
│   │   ├── BlankTile.tsx
│   │   ├── ActionBar.tsx
│   │   ├── LiveStatsPanel.tsx
│   │   └── EndGameModal.tsx
│   ├── report/
│   │   ├── FinalScoreHeader.tsx
│   │   └── BoxScoreTable.tsx
│   └── ui/
│       └── SyncIndicator.tsx
│
├── context/
│   └── GameContext.tsx                     ← useReducer state, dispatch, selectedPlayer
│
└── lib/
    ├── types.ts                            ← All TypeScript types (single source of truth)
    ├── reducer.ts                          ← Pure gameReducer + applyEvent (shared client/server)
    ├── game.ts                             ← resolveDisplayLabel, emptyStats, initialGameState
    └── kv.ts                              ← Vercel KV helpers (typed wrappers)

design-system/stattap/
└── MASTER.md                              ← Design tokens (READ THIS before any UI work)

docs/
├── prd.md
├── technical_requirements_document.md
├── user_journey_plan.md
├── ui_ux_brief.md
├── database_schema.md
└── implementation_plan.md
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-git --import-alias "@/*"
```

When prompted: use `src/` directory → Yes, App Router → Yes, Turbopack → No (keep webpack for stability with KV).

- [ ] **Step 2: Install dependencies**

```bash
npm install @vercel/kv lucide-react
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Configure Tailwind with design tokens**

Replace `tailwind.config.ts` entirely:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        body:    ['Barlow', 'sans-serif'],
      },
      colors: {
        bg:               '#0F172A',
        surface:          '#1E293B',
        'surface-elevated': '#293548',
        primary:          '#F97316',
        'team-a':         '#38BDF8',
        'team-b':         '#A78BFA',
        make:             '#22C55E',
        miss:             '#64748B',
        score:            '#F8FAFC',
        fg:               '#F8FAFC',
        muted:            '#94A3B8',
        destructive:      '#EF4444',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Set up globals.css**

Replace `src/app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-surface-elevated: #293548;
  --color-primary: #F97316;
  --color-on-primary: #FFFFFF;
  --color-team-a: #38BDF8;
  --color-team-b: #A78BFA;
  --color-make: #22C55E;
  --color-miss: #64748B;
  --color-score: #F8FAFC;
  --color-fg: #F8FAFC;
  --color-muted: #94A3B8;
  --color-destructive: #EF4444;
  --color-border: rgba(255, 255, 255, 0.08);
}

* { box-sizing: border-box; }

body {
  background-color: #0F172A;
  color: #F8FAFC;
  font-family: 'Barlow', sans-serif;
  -webkit-tap-highlight-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.1ms !important;
    transition-duration: 0.1ms !important;
  }
}
```

- [ ] **Step 6: Update root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StatTap',
  description: 'Real-time basketball pickup game stat tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-bg text-fg font-body">{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Set up .env.local**

Create `.env.local`:
```
KV_REST_API_URL=your_kv_url_here
KV_REST_API_TOKEN=your_kv_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add `.env.local` to `.gitignore` (verify it's there).

- [ ] **Step 8: Verify scaffold**

```bash
npm run dev
```

Expected: App loads at `localhost:3000`, dark navy background `#0F172A`, no errors in console.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind design tokens and Barlow fonts"
```

---

## Task 2: Types + Reducer + Game Utilities

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/reducer.ts`
- Create: `src/lib/game.ts`
- Create: `src/test/reducer.test.ts`

- [ ] **Step 1: Write failing tests for reducer**

Create `src/test/reducer.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { gameReducer } from '@/lib/reducer'
import { emptyStats, initialGameState } from '@/lib/game'
import type { GameEvent } from '@/lib/types'

const makeEvent = (overrides: Partial<GameEvent>): GameEvent => ({
  id: 'evt-1',
  playerId: 'player-1',
  team: 'A',
  actionType: 'FG_MAKE',
  points: 2,
  timestamp: Date.now(),
  ...overrides,
})

describe('gameReducer', () => {
  it('returns initial state for empty event list', () => {
    const state = gameReducer([])
    expect(state.scoreA).toBe(0)
    expect(state.scoreB).toBe(0)
    expect(state.playerStats).toEqual({})
  })

  it('adds 2 points to Team A score on FG_MAKE', () => {
    const state = gameReducer([makeEvent({ actionType: 'FG_MAKE', points: 2, team: 'A' })])
    expect(state.scoreA).toBe(2)
    expect(state.scoreB).toBe(0)
  })

  it('adds 3 points to Team B score on 3PT_MAKE', () => {
    const state = gameReducer([makeEvent({ actionType: '3PT_MAKE', points: 3, team: 'B' })])
    expect(state.scoreA).toBe(0)
    expect(state.scoreB).toBe(3)
  })

  it('adds 1 point on FT_MAKE', () => {
    const state = gameReducer([makeEvent({ actionType: 'FT_MAKE', points: 1, team: 'A' })])
    expect(state.scoreA).toBe(1)
  })

  it('adds 0 points on any MISS', () => {
    const events = [
      makeEvent({ actionType: 'FG_MISS', points: 0 }),
      makeEvent({ actionType: '3PT_MISS', points: 0 }),
      makeEvent({ actionType: 'FT_MISS', points: 0 }),
    ]
    const state = gameReducer(events)
    expect(state.scoreA).toBe(0)
  })

  it('tracks fgMakes and fgAttempts correctly', () => {
    const events = [
      makeEvent({ actionType: 'FG_MAKE', points: 2 }),
      makeEvent({ actionType: 'FG_MISS', points: 0 }),
    ]
    const state = gameReducer(events)
    expect(state.playerStats['player-1'].fgMakes).toBe(1)
    expect(state.playerStats['player-1'].fgAttempts).toBe(2)
  })

  it('tracks threeMakes and threeAttempts correctly', () => {
    const events = [
      makeEvent({ actionType: '3PT_MAKE', points: 3 }),
      makeEvent({ actionType: '3PT_MISS', points: 0 }),
      makeEvent({ actionType: '3PT_MISS', points: 0 }),
    ]
    const state = gameReducer(events)
    expect(state.playerStats['player-1'].threeMakes).toBe(1)
    expect(state.playerStats['player-1'].threeAttempts).toBe(3)
  })

  it('tracks ftMakes and ftAttempts correctly', () => {
    const events = [
      makeEvent({ actionType: 'FT_MAKE', points: 1 }),
      makeEvent({ actionType: 'FT_MAKE', points: 1 }),
      makeEvent({ actionType: 'FT_MISS', points: 0 }),
    ]
    const state = gameReducer(events)
    expect(state.playerStats['player-1'].ftMakes).toBe(2)
    expect(state.playerStats['player-1'].ftAttempts).toBe(3)
    expect(state.playerStats['player-1'].points).toBe(2)
  })

  it('accumulates points correctly across multiple players', () => {
    const events = [
      makeEvent({ playerId: 'p1', team: 'A', actionType: 'FG_MAKE', points: 2 }),
      makeEvent({ playerId: 'p2', team: 'A', actionType: '3PT_MAKE', points: 3 }),
      makeEvent({ playerId: 'p3', team: 'B', actionType: 'FT_MAKE', points: 1 }),
    ]
    const state = gameReducer(events)
    expect(state.scoreA).toBe(5)
    expect(state.scoreB).toBe(1)
    expect(state.playerStats['p1'].points).toBe(2)
    expect(state.playerStats['p2'].points).toBe(3)
    expect(state.playerStats['p3'].points).toBe(1)
  })

  it('undo simulation: removing last event reverts score', () => {
    const events = [
      makeEvent({ id: 'e1', actionType: 'FG_MAKE', points: 2 }),
      makeEvent({ id: 'e2', actionType: '3PT_MAKE', points: 3 }),
    ]
    const stateWith = gameReducer(events)
    const stateWithout = gameReducer(events.slice(0, -1))
    expect(stateWith.scoreA).toBe(5)
    expect(stateWithout.scoreA).toBe(2)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```

Expected: `Cannot find module '@/lib/reducer'`

- [ ] **Step 3: Create types.ts**

Create `src/lib/types.ts`:
```ts
export type Team = 'A' | 'B'

export type ActionType =
  | 'FG_MAKE'
  | 'FG_MISS'
  | '3PT_MAKE'
  | '3PT_MISS'
  | 'FT_MAKE'
  | 'FT_MISS'

export type StatMode = 'points-only' | 'make-miss'

export type GameStatus = 'live' | 'ended'

export interface Player {
  id: string
  team: Team
  jersey: string | null
  name: string | null
  displayLabel: string
  slot: number
}

export interface GameMeta {
  id: string
  teamA: { name: string }
  teamB: { name: string }
  players: Player[]
  mode: StatMode
  status: GameStatus
  createdAt: number
}

export interface GameEvent {
  id: string
  playerId: string
  team: Team
  actionType: ActionType
  points: number
  timestamp: number
}

export interface PlayerStats {
  points: number
  fgMakes: number
  fgAttempts: number
  threeMakes: number
  threeAttempts: number
  ftMakes: number
  ftAttempts: number
}

export interface GameState {
  scoreA: number
  scoreB: number
  playerStats: Record<string, PlayerStats>
}

export interface GameSnapshot {
  meta: GameMeta
  events: GameEvent[]
  finalState: GameState
  endedAt: number
}
```

- [ ] **Step 4: Create game.ts utilities**

Create `src/lib/game.ts`:
```ts
import type { Player, PlayerStats, GameState } from './types'

export function emptyStats(): PlayerStats {
  return {
    points: 0,
    fgMakes: 0,
    fgAttempts: 0,
    threeMakes: 0,
    threeAttempts: 0,
    ftMakes: 0,
    ftAttempts: 0,
  }
}

export function initialGameState(): GameState {
  return { scoreA: 0, scoreB: 0, playerStats: {} }
}

export function resolveDisplayLabel(
  jersey: string | null,
  name: string | null,
  slot: number
): string {
  if (jersey && name) return `${jersey} · ${name}`
  if (jersey) return jersey
  if (name) return name
  return `Player ${slot}`
}

export function buildPlayer(
  jersey: string | null,
  name: string | null,
  slot: number,
  team: 'A' | 'B'
): Omit<Player, 'id'> {
  return {
    team,
    jersey: jersey || null,
    name: name || null,
    displayLabel: resolveDisplayLabel(jersey, name, slot),
    slot,
  }
}
```

- [ ] **Step 5: Create reducer.ts**

Create `src/lib/reducer.ts`:
```ts
import type { GameEvent, GameState, PlayerStats } from './types'
import { emptyStats, initialGameState } from './game'

function applyEvent(stats: PlayerStats, event: GameEvent): PlayerStats {
  switch (event.actionType) {
    case 'FG_MAKE':
      return { ...stats, points: stats.points + 2, fgMakes: stats.fgMakes + 1, fgAttempts: stats.fgAttempts + 1 }
    case 'FG_MISS':
      return { ...stats, fgAttempts: stats.fgAttempts + 1 }
    case '3PT_MAKE':
      return { ...stats, points: stats.points + 3, threeMakes: stats.threeMakes + 1, threeAttempts: stats.threeAttempts + 1 }
    case '3PT_MISS':
      return { ...stats, threeAttempts: stats.threeAttempts + 1 }
    case 'FT_MAKE':
      return { ...stats, points: stats.points + 1, ftMakes: stats.ftMakes + 1, ftAttempts: stats.ftAttempts + 1 }
    case 'FT_MISS':
      return { ...stats, ftAttempts: stats.ftAttempts + 1 }
  }
}

export function gameReducer(events: GameEvent[]): GameState {
  return events.reduce((state, event) => {
    const stats = state.playerStats[event.playerId] ?? emptyStats()
    return {
      ...state,
      scoreA: event.team === 'A' ? state.scoreA + event.points : state.scoreA,
      scoreB: event.team === 'B' ? state.scoreB + event.points : state.scoreB,
      playerStats: {
        ...state.playerStats,
        [event.playerId]: applyEvent(stats, event),
      },
    }
  }, initialGameState())
}
```

- [ ] **Step 6: Run tests — expect pass**

```bash
npm test
```

Expected: All 9 reducer tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/reducer.ts src/lib/game.ts src/test/reducer.test.ts src/test/setup.ts vitest.config.ts
git commit -m "feat: add types, pure game reducer, and display label utilities"
```

---

## Task 3: KV Helpers + API Routes

**Files:**
- Create: `src/lib/kv.ts`
- Create: `src/app/api/game/route.ts`
- Create: `src/app/api/game/[id]/route.ts`
- Create: `src/app/api/game/[id]/event/route.ts`
- Create: `src/app/api/game/[id]/undo/route.ts`
- Create: `src/app/api/game/[id]/end/route.ts`

- [ ] **Step 1: Create KV helpers**

Create `src/lib/kv.ts`:
```ts
import { kv } from '@vercel/kv'
import type { GameMeta, GameEvent, GameSnapshot } from './types'

export async function getMeta(gameId: string): Promise<GameMeta | null> {
  return kv.get<GameMeta>(`game:${gameId}:meta`)
}

export async function setMeta(gameId: string, meta: GameMeta): Promise<void> {
  await kv.set(`game:${gameId}:meta`, meta)
}

export async function getEvents(gameId: string): Promise<GameEvent[]> {
  const raw = await kv.lrange<string>(`game:${gameId}:events`, 0, -1)
  return raw.map(r => (typeof r === 'string' ? JSON.parse(r) : r))
}

export async function pushEvent(gameId: string, event: GameEvent): Promise<void> {
  await kv.rpush(`game:${gameId}:events`, JSON.stringify(event))
}

export async function popEvent(gameId: string): Promise<GameEvent | null> {
  const raw = await kv.rpop<string>(`game:${gameId}:events`)
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

export async function getSnapshot(gameId: string): Promise<GameSnapshot | null> {
  return kv.get<GameSnapshot>(`game:${gameId}:snapshot`)
}

export async function setSnapshot(gameId: string, snapshot: GameSnapshot): Promise<void> {
  await kv.set(`game:${gameId}:snapshot`, snapshot)
}
```

- [ ] **Step 2: Create POST /api/game**

Create `src/app/api/game/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { setMeta } from '@/lib/kv'
import { resolveDisplayLabel } from '@/lib/game'
import type { GameMeta, Player } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { teamA, teamB, players, mode } = body

  if (!players || players.length === 0) {
    return NextResponse.json({ error: 'At least one player required' }, { status: 400 })
  }

  const gameId = crypto.randomUUID()

  const resolvedPlayers: Player[] = players.map((p: any, i: number) => ({
    id: crypto.randomUUID(),
    team: p.team,
    jersey: p.jersey || null,
    name: p.name || null,
    displayLabel: resolveDisplayLabel(p.jersey || null, p.name || null, p.slot ?? i + 1),
    slot: p.slot ?? i + 1,
  }))

  const meta: GameMeta = {
    id: gameId,
    teamA: { name: teamA?.name || 'Team A' },
    teamB: { name: teamB?.name || 'Team B' },
    players: resolvedPlayers,
    mode: mode ?? 'points-only',
    status: 'live',
    createdAt: Date.now(),
  }

  await setMeta(gameId, meta)
  return NextResponse.json({ gameId })
}
```

- [ ] **Step 3: Create GET /api/game/[id]**

Create `src/app/api/game/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getMeta, getEvents, getSnapshot } from '@/lib/kv'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const meta = await getMeta(params.id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const events = await getEvents(params.id)

  if (meta.status === 'ended') {
    const snapshot = await getSnapshot(params.id)
    return NextResponse.json({ meta, events, snapshot })
  }

  return NextResponse.json({ meta, events })
}
```

- [ ] **Step 4: Create POST /api/game/[id]/event**

Create `src/app/api/game/[id]/event/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getMeta, pushEvent } from '@/lib/kv'
import type { GameEvent } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const meta = await getMeta(params.id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (meta.status === 'ended') return NextResponse.json({ error: 'Game is ended' }, { status: 409 })

  const event: GameEvent = await req.json()
  await pushEvent(params.id, event)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Create POST /api/game/[id]/undo**

Create `src/app/api/game/[id]/undo/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getMeta, popEvent } from '@/lib/kv'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const meta = await getMeta(params.id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (meta.status === 'ended') return NextResponse.json({ error: 'Game is ended' }, { status: 409 })

  const removedEvent = await popEvent(params.id)
  return NextResponse.json({ ok: true, removedEvent })
}
```

- [ ] **Step 6: Create POST /api/game/[id]/end**

Create `src/app/api/game/[id]/end/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getMeta, setMeta, getEvents, setSnapshot } from '@/lib/kv'
import { gameReducer } from '@/lib/reducer'
import type { GameSnapshot } from '@/lib/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const meta = await getMeta(params.id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (meta.status === 'ended') return NextResponse.json({ error: 'Already ended' }, { status: 409 })

  const events = await getEvents(params.id)
  const finalState = gameReducer(events)

  const endedMeta = { ...meta, status: 'ended' as const }
  const snapshot: GameSnapshot = {
    meta: endedMeta,
    events,
    finalState,
    endedAt: Date.now(),
  }

  await setMeta(params.id, endedMeta)
  await setSnapshot(params.id, snapshot)

  return NextResponse.json({ snapshot })
}
```

- [ ] **Step 7: Manual API test**

Start the dev server:
```bash
npm run dev
```

In a second terminal, test each route:

```bash
# Create game
curl -s -X POST http://localhost:3000/api/game \
  -H "Content-Type: application/json" \
  -d '{"teamA":{"name":"Lakers"},"teamB":{"name":"Celtics"},"players":[{"team":"A","jersey":"23","name":"Jordan","slot":1},{"team":"B","jersey":"7","name":"Marcus","slot":1}],"mode":"make-miss"}' | jq .

# Note the gameId from above, e.g. "abc-123"
# GET game
curl -s http://localhost:3000/api/game/abc-123 | jq .

# Add event
curl -s -X POST http://localhost:3000/api/game/abc-123/event \
  -H "Content-Type: application/json" \
  -d '{"id":"e1","playerId":"<player-id-from-above>","team":"A","actionType":"FG_MAKE","points":2,"timestamp":1234567890}' | jq .

# Undo
curl -s -X POST http://localhost:3000/api/game/abc-123/undo \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# End game
curl -s -X POST http://localhost:3000/api/game/abc-123/end \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

Expected: Each route returns correct JSON, KV persists data between calls.

- [ ] **Step 8: Commit**

```bash
git add src/lib/kv.ts src/app/api/
git commit -m "feat: add KV helpers and all 5 API routes"
```

---

## Task 4: Game Context + State Management

**Files:**
- Create: `src/context/GameContext.tsx`
- Create: `src/test/GameContext.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/test/GameContext.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { GameProvider, useGame } from '@/context/GameContext'
import type { GameMeta } from '@/lib/types'

const mockMeta: GameMeta = {
  id: 'game-1',
  teamA: { name: 'Lakers' },
  teamB: { name: 'Celtics' },
  players: [
    { id: 'p1', team: 'A', jersey: '23', name: 'Jordan', displayLabel: '23 · Jordan', slot: 1 },
    { id: 'p2', team: 'B', jersey: '7', name: null, displayLabel: '7', slot: 1 },
  ],
  mode: 'points-only',
  status: 'live',
  createdAt: Date.now(),
}

const initialEvents = [
  { id: 'e1', playerId: 'p1', team: 'A' as const, actionType: 'FG_MAKE' as const, points: 2, timestamp: Date.now() },
]

function TestConsumer() {
  const { derived, selectedPlayerId, syncStatus } = useGame()
  return (
    <div>
      <span data-testid="score-a">{derived.scoreA}</span>
      <span data-testid="score-b">{derived.scoreB}</span>
      <span data-testid="selected">{selectedPlayerId ?? 'none'}</span>
      <span data-testid="sync">{syncStatus}</span>
    </div>
  )
}

function TestDispatcher() {
  const { dispatch } = useGame()
  return (
    <button
      onClick={() =>
        dispatch({
          type: 'ADD_EVENT',
          event: { id: 'e2', playerId: 'p2', team: 'B', actionType: '3PT_MAKE', points: 3, timestamp: Date.now() },
        })
      }
    >
      add event
    </button>
  )
}

describe('GameContext', () => {
  it('derives initial state from events', () => {
    render(
      <GameProvider meta={mockMeta} initialEvents={initialEvents}>
        <TestConsumer />
      </GameProvider>
    )
    expect(screen.getByTestId('score-a').textContent).toBe('2')
    expect(screen.getByTestId('score-b').textContent).toBe('0')
  })

  it('updates score when ADD_EVENT dispatched', async () => {
    render(
      <GameProvider meta={mockMeta} initialEvents={initialEvents}>
        <TestConsumer />
        <TestDispatcher />
      </GameProvider>
    )
    act(() => {
      screen.getByText('add event').click()
    })
    expect(screen.getByTestId('score-b').textContent).toBe('3')
  })

  it('shows synced as default syncStatus', () => {
    render(
      <GameProvider meta={mockMeta} initialEvents={[]}>
        <TestConsumer />
      </GameProvider>
    )
    expect(screen.getByTestId('sync').textContent).toBe('synced')
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```

Expected: `Cannot find module '@/context/GameContext'`

- [ ] **Step 3: Create GameContext.tsx**

Create `src/context/GameContext.tsx`:
```tsx
'use client'

import { createContext, useContext, useReducer, useCallback } from 'react'
import { gameReducer } from '@/lib/reducer'
import type { GameEvent, GameMeta, GameState } from '@/lib/types'

type SyncStatus = 'synced' | 'syncing' | 'error'

type ClientAction =
  | { type: 'ADD_EVENT'; event: GameEvent }
  | { type: 'UNDO' }
  | { type: 'SET_SELECTED'; playerId: string | null }
  | { type: 'SET_SYNC'; status: SyncStatus }

interface ClientState {
  meta: GameMeta
  events: GameEvent[]
  derived: GameState
  selectedPlayerId: string | null
  syncStatus: SyncStatus
}

interface GameContextValue extends ClientState {
  dispatch: (action: ClientAction) => void
}

function clientReducer(state: ClientState, action: ClientAction): ClientState {
  switch (action.type) {
    case 'ADD_EVENT': {
      const events = [...state.events, action.event]
      return { ...state, events, derived: gameReducer(events), selectedPlayerId: null, syncStatus: 'syncing' }
    }
    case 'UNDO': {
      const events = state.events.slice(0, -1)
      return { ...state, events, derived: gameReducer(events), syncStatus: 'syncing' }
    }
    case 'SET_SELECTED':
      return { ...state, selectedPlayerId: action.playerId }
    case 'SET_SYNC':
      return { ...state, syncStatus: action.status }
  }
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({
  meta,
  initialEvents,
  children,
}: {
  meta: GameMeta
  initialEvents: GameEvent[]
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(clientReducer, {
    meta,
    events: initialEvents,
    derived: gameReducer(initialEvents),
    selectedPlayerId: null,
    syncStatus: 'synced',
  })

  return (
    <GameContext.Provider value={{ ...state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: All context tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/GameContext.tsx src/test/GameContext.test.tsx
git commit -m "feat: add GameContext with optimistic reducer and sync status"
```

---

## Task 5: Game Setup Screen

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/setup/TeamNameInput.tsx`
- Create: `src/components/setup/PlayerEntryRow.tsx`
- Create: `src/components/setup/PlayerEntryList.tsx`
- Create: `src/components/setup/ModeSelector.tsx`

> **UI/UX:** Read `design-system/stattap/MASTER.md` before implementing. Use `--color-bg`, `--color-surface`, `--color-primary`, Barlow Condensed for headings, minimum 44px input height.

- [ ] **Step 1: Create TeamNameInput**

Create `src/components/setup/TeamNameInput.tsx`:
```tsx
interface TeamNameInputProps {
  team: 'A' | 'B'
  value: string
  onChange: (val: string) => void
}

export function TeamNameInput({ team, value, onChange }: TeamNameInputProps) {
  const accentClass = team === 'A' ? 'border-team-a focus:border-team-a focus:ring-team-a/20' : 'border-team-b focus:border-team-b focus:ring-team-b/20'
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
        className={`bg-surface border ${accentClass} rounded-lg px-4 py-3 text-fg font-display text-xl min-h-[44px] focus:outline-none focus:ring-2 transition-colors duration-200`}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create PlayerEntryRow**

Create `src/components/setup/PlayerEntryRow.tsx`:
```tsx
import { X } from 'lucide-react'
import { resolveDisplayLabel } from '@/lib/game'

interface PlayerEntry {
  jersey: string
  name: string
  slot: number
}

interface PlayerEntryRowProps {
  entry: PlayerEntry
  onChange: (updated: PlayerEntry) => void
  onRemove: () => void
}

export function PlayerEntryRow({ entry, onChange, onRemove }: PlayerEntryRowProps) {
  const preview = resolveDisplayLabel(
    entry.jersey || null,
    entry.name || null,
    entry.slot
  )

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={entry.jersey}
        onChange={e => onChange({ ...entry, jersey: e.target.value })}
        placeholder="#"
        maxLength={3}
        inputMode="numeric"
        className="w-14 bg-surface border border-[var(--color-border)] rounded-lg px-3 py-2 text-fg font-display text-lg text-center min-h-[44px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      <input
        type="text"
        value={entry.name}
        onChange={e => onChange({ ...entry, name: e.target.value })}
        placeholder="Name"
        maxLength={30}
        className="flex-1 bg-surface border border-[var(--color-border)] rounded-lg px-3 py-2 text-fg font-body text-base min-h-[44px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      <span className="text-muted text-sm font-body min-w-[80px] truncate">{preview}</span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${preview}`}
        className="p-2 text-muted hover:text-destructive transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X size={18} />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create PlayerEntryList**

Create `src/components/setup/PlayerEntryList.tsx`:
```tsx
import { Plus } from 'lucide-react'
import { PlayerEntryRow } from './PlayerEntryRow'

interface PlayerEntry {
  jersey: string
  name: string
  slot: number
}

interface PlayerEntryListProps {
  team: 'A' | 'B'
  entries: PlayerEntry[]
  onChange: (entries: PlayerEntry[]) => void
}

export function PlayerEntryList({ team, entries, onChange }: PlayerEntryListProps) {
  const accentColor = team === 'A' ? 'text-team-a' : 'text-team-b'
  const borderColor = team === 'A' ? 'border-team-a/30' : 'border-team-b/30'

  const add = () => {
    if (entries.length >= 12) return
    onChange([...entries, { jersey: '', name: '', slot: entries.length + 1 }])
  }

  const update = (i: number, updated: PlayerEntry) => {
    const next = [...entries]
    next[i] = updated
    onChange(next)
  }

  const remove = (i: number) => {
    const next = entries.filter((_, idx) => idx !== i).map((e, idx) => ({ ...e, slot: idx + 1 }))
    onChange(next)
  }

  return (
    <div className={`flex flex-col gap-2 border ${borderColor} rounded-xl p-4 bg-surface`}>
      <h3 className={`font-display font-bold text-lg uppercase tracking-wide ${accentColor}`}>
        Team {team}
      </h3>
      <div className="flex flex-col gap-2">
        {entries.map((entry, i) => (
          <PlayerEntryRow
            key={i}
            entry={entry}
            onChange={updated => update(i, updated)}
            onRemove={() => remove(i)}
          />
        ))}
      </div>
      {entries.length < 12 && (
        <button
          onClick={add}
          className="flex items-center gap-2 text-muted hover:text-primary transition-colors cursor-pointer mt-1 py-2 font-body text-sm"
        >
          <Plus size={16} />
          Add Player
        </button>
      )}
      {entries.length === 0 && (
        <p className="text-muted text-sm font-body italic">No players yet — tap Add Player</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create ModeSelector**

Create `src/components/setup/ModeSelector.tsx`:
```tsx
import type { StatMode } from '@/lib/types'

interface ModeSelectorProps {
  value: StatMode
  onChange: (mode: StatMode) => void
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-body text-muted uppercase tracking-wide">Stat Mode</label>
      <div className="grid grid-cols-2 gap-3">
        {(['points-only', 'make-miss'] as StatMode[]).map(mode => {
          const selected = value === mode
          const label = mode === 'points-only' ? 'Points Only' : 'Make & Miss'
          const description = mode === 'points-only'
            ? '+1 FT · +2 FG · +3 3PT'
            : 'Track makes and misses per shot type'
          return (
            <button
              key={mode}
              onClick={() => onChange(mode)}
              aria-pressed={selected}
              className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-150
                ${selected
                  ? 'border-primary bg-surface-elevated text-fg'
                  : 'border-[var(--color-border)] bg-surface text-muted hover:border-primary/50'
                }`}
            >
              <span className="font-display font-bold text-lg">{label}</span>
              <span className="font-body text-sm opacity-70">{description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create GameSetupScreen (app/page.tsx)**

Replace `src/app/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { TeamNameInput } from '@/components/setup/TeamNameInput'
import { PlayerEntryList } from '@/components/setup/PlayerEntryList'
import { ModeSelector } from '@/components/setup/ModeSelector'
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
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create game')
      router.push(`/live/${data.gameId}`)
    } catch (e: any) {
      setError(e.message)
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
        <TeamNameInput team="A" value={teamAName} onChange={setTeamAName} />
        <TeamNameInput team="B" value={teamBName} onChange={setTeamBName} />
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

- [ ] **Step 6: Visual test in browser**

```bash
npm run dev
```

Open `http://localhost:3000`.

Verify:
- Dark `#0F172A` background
- Two-column layout (Team A / Team B)
- Add players, see live preview labels
- Mode selector toggles correctly
- "Start Game" disabled with 0 players, enabled after adding 1
- Starting a game navigates to `/live/{gameId}`

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/components/setup/
git commit -m "feat: add game setup screen with player entry and mode selector"
```

---

## Task 6: Live Game Screen — Shell + ScoreHeader

**Files:**
- Create: `src/app/live/[gameId]/page.tsx`
- Create: `src/components/live/ScoreHeader.tsx`
- Create: `src/components/ui/SyncIndicator.tsx`

> **UI/UX:** Score uses Barlow Condensed 700 at 72px (`text-8xl`). Team names in `text-team-a` / `text-team-b`. Undo button always visible. End Game button uses `--color-destructive`. Minimum 48px height for header buttons.

- [ ] **Step 1: Create SyncIndicator**

Create `src/components/ui/SyncIndicator.tsx`:
```tsx
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

type SyncStatus = 'synced' | 'syncing' | 'error'

export function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === 'synced') return null
  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-1 text-xs font-body">
      {status === 'syncing' && (
        <span className="text-muted flex items-center gap-1">
          <Loader size={14} className="animate-spin" />
          Syncing…
        </span>
      )}
      {status === 'error' && (
        <span className="text-destructive flex items-center gap-1">
          <AlertCircle size={14} />
          Sync error
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create ScoreHeader**

Create `src/components/live/ScoreHeader.tsx`:
```tsx
'use client'

import { RotateCcw } from 'lucide-react'
import { useGame } from '@/context/GameContext'

interface ScoreHeaderProps {
  onUndo: () => void
  onEndGame: () => void
}

export function ScoreHeader({ onUndo, onEndGame }: ScoreHeaderProps) {
  const { meta, derived } = useGame()

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onUndo}
          aria-label="Undo last event"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted hover:text-fg hover:bg-surface-elevated transition-all duration-150 cursor-pointer min-h-[48px] font-body text-sm"
        >
          <RotateCcw size={18} />
          Undo
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-display font-bold text-2xl text-team-a">{meta.teamA.name}</span>
        <div className="flex items-baseline gap-3">
          <span className="font-display font-bold text-8xl leading-none text-score tabular-nums">
            {derived.scoreA}
          </span>
          <span className="font-display text-4xl text-muted">–</span>
          <span className="font-display font-bold text-8xl leading-none text-score tabular-nums">
            {derived.scoreB}
          </span>
        </div>
        <span className="font-display font-bold text-2xl text-team-b">{meta.teamB.name}</span>
      </div>

      <button
        onClick={onEndGame}
        aria-label="End game"
        className="px-4 py-2 rounded-lg bg-destructive text-white font-display font-bold text-base cursor-pointer transition-opacity duration-150 hover:opacity-90 active:opacity-80 min-h-[48px]"
      >
        End Game
      </button>
    </header>
  )
}
```

- [ ] **Step 3: Create LiveGameScreen shell**

Create `src/app/live/[gameId]/page.tsx`:
```tsx
import { notFound, redirect } from 'next/navigation'
import { getMeta, getEvents } from '@/lib/kv'
import { LiveGameClient } from './LiveGameClient'

export default async function LiveGameScreen({ params }: { params: { gameId: string } }) {
  const meta = await getMeta(params.gameId)
  if (!meta) notFound()
  if (meta.status === 'ended') redirect(`/game/${params.gameId}`)

  const events = await getEvents(params.gameId)
  return <LiveGameClient meta={meta} initialEvents={events} />
}
```

Create `src/app/live/[gameId]/LiveGameClient.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { GameProvider, useGame } from '@/context/GameContext'
import { ScoreHeader } from '@/components/live/ScoreHeader'
import { SyncIndicator } from '@/components/ui/SyncIndicator'
import type { GameEvent, GameMeta } from '@/lib/types'

function LiveGameInner() {
  const { syncStatus, dispatch, meta, events } = useGame()
  const [showEndModal, setShowEndModal] = useState(false)

  async function handleUndo() {
    if (events.length === 0) return
    dispatch({ type: 'UNDO' })
    try {
      await fetch(`/api/game/${meta.id}/undo`, { method: 'POST' })
      dispatch({ type: 'SET_SYNC', status: 'synced' })
    } catch {
      dispatch({ type: 'SET_SYNC', status: 'error' })
    }
  }

  return (
    <div className="h-dvh bg-bg flex flex-col overflow-hidden">
      <SyncIndicator status={syncStatus} />
      <ScoreHeader onUndo={handleUndo} onEndGame={() => setShowEndModal(true)} />
      <div className="flex-1 flex items-center justify-center text-muted font-body">
        {/* PlayerGrid goes here in Task 7 */}
        Player grid coming soon…
      </div>
      {/* EndGameModal goes here in Task 9 */}
    </div>
  )
}

export function LiveGameClient({ meta, initialEvents }: { meta: GameMeta; initialEvents: GameEvent[] }) {
  return (
    <GameProvider meta={meta} initialEvents={initialEvents}>
      <LiveGameInner />
    </GameProvider>
  )
}
```

- [ ] **Step 4: Visual test**

Navigate to a game URL from setup. Verify:
- Score shows at 72px Barlow Condensed
- Team names in blue/purple
- Undo and End Game buttons visible in header
- Dark background throughout

- [ ] **Step 5: Commit**

```bash
git add src/app/live/ src/components/live/ScoreHeader.tsx src/components/ui/SyncIndicator.tsx
git commit -m "feat: add live game screen shell with score header"
```

---

## Task 7: Player Grid

**Files:**
- Create: `src/components/live/PlayerTile.tsx`
- Create: `src/components/live/BlankTile.tsx`
- Create: `src/components/live/TeamColumn.tsx`
- Create: `src/components/live/PlayerGrid.tsx`
- Create: `src/test/PlayerGrid.test.tsx`
- Modify: `src/app/live/[gameId]/LiveGameClient.tsx`

> **UI/UX:** Grid fills all space between header and action bar. Tile height = `gridHeight / max(teamA, teamB)`, minimum 56px. Blank tiles same height, 30% opacity, no interaction. Selected tile: `--color-surface-elevated` + 4px team-color left border.

- [ ] **Step 1: Write failing tests**

Create `src/test/PlayerGrid.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerTile } from '@/components/live/PlayerTile'
import { BlankTile } from '@/components/live/BlankTile'

describe('PlayerTile', () => {
  it('renders display label', () => {
    render(
      <PlayerTile
        player={{ id: 'p1', team: 'A', jersey: '23', name: 'Jordan', displayLabel: '23 · Jordan', slot: 1 }}
        selected={false}
        tileHeight={72}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText('23 · Jordan')).toBeTruthy()
  })

  it('calls onSelect with playerId on click', async () => {
    const onSelect = vi.fn()
    render(
      <PlayerTile
        player={{ id: 'p1', team: 'A', jersey: '23', name: null, displayLabel: '23', slot: 1 }}
        selected={false}
        tileHeight={72}
        onSelect={onSelect}
      />
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('p1')
  })

  it('has aria-pressed=true when selected', () => {
    render(
      <PlayerTile
        player={{ id: 'p1', team: 'A', jersey: null, name: 'Marcus', displayLabel: 'Marcus', slot: 1 }}
        selected={true}
        tileHeight={72}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })
})

describe('BlankTile', () => {
  it('is not interactive', () => {
    const { container } = render(<BlankTile tileHeight={72} />)
    expect(container.querySelector('[role="button"]')).toBeNull()
  })

  it('has aria-hidden', () => {
    const { container } = render(<BlankTile tileHeight={72} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })
})
```

Add to `package.json`:
```json
"test": "vitest run"
```

Install userEvent:
```bash
npm install -D @testing-library/user-event
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```

Expected: `Cannot find module '@/components/live/PlayerTile'`

- [ ] **Step 3: Create PlayerTile**

Create `src/components/live/PlayerTile.tsx`:
```tsx
import type { Player } from '@/lib/types'

interface PlayerTileProps {
  player: Player
  selected: boolean
  tileHeight: number
  onSelect: (playerId: string) => void
}

export function PlayerTile({ player, selected, tileHeight, onSelect }: PlayerTileProps) {
  const teamBorderColor = player.team === 'A' ? 'border-team-a' : 'border-team-b'

  return (
    <button
      role="button"
      aria-pressed={selected}
      aria-label={`${player.displayLabel}, Team ${player.team}`}
      onClick={() => onSelect(player.id)}
      style={{ height: `${tileHeight}px` }}
      className={`w-full flex items-center justify-center font-display font-semibold text-lg cursor-pointer select-none transition-all duration-[120ms] ease-out
        border border-[var(--color-border)]
        ${selected
          ? `bg-surface-elevated border-l-4 ${teamBorderColor} text-fg`
          : 'bg-surface text-fg hover:bg-surface-elevated'
        }`}
    >
      {player.displayLabel}
    </button>
  )
}
```

- [ ] **Step 4: Create BlankTile**

Create `src/components/live/BlankTile.tsx`:
```tsx
interface BlankTileProps {
  tileHeight: number
}

export function BlankTile({ tileHeight }: BlankTileProps) {
  return (
    <div
      aria-hidden="true"
      style={{ height: `${tileHeight}px` }}
      className="w-full bg-surface border border-[var(--color-border)] opacity-30"
    />
  )
}
```

- [ ] **Step 5: Create TeamColumn**

Create `src/components/live/TeamColumn.tsx`:
```tsx
import type { Player } from '@/lib/types'
import { PlayerTile } from './PlayerTile'
import { BlankTile } from './BlankTile'

interface TeamColumnProps {
  team: 'A' | 'B'
  teamName: string
  players: Player[]
  rowCount: number
  tileHeight: number
  selectedPlayerId: string | null
  onSelect: (playerId: string) => void
}

export function TeamColumn({ team, teamName, players, rowCount, tileHeight, selectedPlayerId, onSelect }: TeamColumnProps) {
  const accentColor = team === 'A' ? 'text-team-a border-team-a/40' : 'text-team-b border-team-b/40'
  const blanks = rowCount - players.length

  return (
    <div className="flex flex-col flex-1">
      <div className={`text-center font-display font-bold text-sm uppercase tracking-widest py-1 border-b ${accentColor}`}>
        {teamName}
      </div>
      <div className="flex flex-col flex-1">
        {players.map(player => (
          <PlayerTile
            key={player.id}
            player={player}
            selected={selectedPlayerId === player.id}
            tileHeight={tileHeight}
            onSelect={onSelect}
          />
        ))}
        {Array.from({ length: Math.max(0, blanks) }).map((_, i) => (
          <BlankTile key={`blank-${i}`} tileHeight={tileHeight} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create PlayerGrid**

Create `src/components/live/PlayerGrid.tsx`:
```tsx
'use client'

import { useRef, useEffect, useState } from 'react'
import { useGame } from '@/context/GameContext'
import { TeamColumn } from './TeamColumn'

const MIN_TILE_HEIGHT = 56

interface PlayerGridProps {
  onSelect: (playerId: string) => void
}

export function PlayerGrid({ onSelect }: PlayerGridProps) {
  const { meta, selectedPlayerId } = useGame()
  const containerRef = useRef<HTMLDivElement>(null)
  const [tileHeight, setTileHeight] = useState(MIN_TILE_HEIGHT)

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')
  const rowCount = Math.max(playersA.length, playersB.length, 1)

  useEffect(() => {
    function updateHeight() {
      if (!containerRef.current) return
      const available = containerRef.current.clientHeight
      const computed = Math.floor(available / rowCount)
      setTileHeight(Math.max(computed, MIN_TILE_HEIGHT))
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [rowCount])

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      <TeamColumn
        team="A"
        teamName={meta.teamA.name}
        players={playersA}
        rowCount={rowCount}
        tileHeight={tileHeight}
        selectedPlayerId={selectedPlayerId}
        onSelect={onSelect}
      />
      <div className="w-px bg-[var(--color-border)]" />
      <TeamColumn
        team="B"
        teamName={meta.teamB.name}
        players={playersB}
        rowCount={rowCount}
        tileHeight={tileHeight}
        selectedPlayerId={selectedPlayerId}
        onSelect={onSelect}
      />
    </div>
  )
}
```

- [ ] **Step 7: Wire PlayerGrid into LiveGameClient**

Modify `src/app/live/[gameId]/LiveGameClient.tsx` — replace the placeholder div:
```tsx
// Add import at top:
import { PlayerGrid } from '@/components/live/PlayerGrid'

// Replace the placeholder div inside LiveGameInner:
<div className="flex-1 flex overflow-hidden">
  <PlayerGrid onSelect={(playerId) => dispatch({ type: 'SET_SELECTED', playerId })} />
</div>
```

- [ ] **Step 8: Run tests — expect pass**

```bash
npm test
```

Expected: All PlayerGrid and BlankTile tests PASS.

- [ ] **Step 9: Visual test**

Navigate to `/live/{gameId}` with a game that has 4 Team A players and 2 Team B players. Verify:
- Team B shows 2 real tiles and 2 blank tiles (same height, dimmed)
- Tapping a player tile highlights it with team-color left border
- Grid fills available height with no scrolling

- [ ] **Step 10: Commit**

```bash
git add src/components/live/PlayerTile.tsx src/components/live/BlankTile.tsx src/components/live/TeamColumn.tsx src/components/live/PlayerGrid.tsx src/test/PlayerGrid.test.tsx
git commit -m "feat: add player grid with symmetric mirrored layout and tile selection"
```

---

## Task 8: Action Bar + Event Recording

**Files:**
- Create: `src/components/live/ActionBar.tsx`
- Create: `src/test/ActionBar.test.tsx`
- Modify: `src/app/live/[gameId]/LiveGameClient.tsx`

> **UI/UX:** Action bar minimum height 72px per button. Make buttons `--color-make` (green), Miss buttons `--color-miss` (slate). Barlow Condensed 700 20px labels. Slide up on player select (200ms ease-out), slide down after action (150ms ease-in). ✓/✗ icons on make/miss buttons.

- [ ] **Step 1: Write failing tests**

Create `src/test/ActionBar.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionBar } from '@/components/live/ActionBar'

describe('ActionBar — points-only mode', () => {
  it('renders +1, +2, +3 buttons', () => {
    render(<ActionBar mode="points-only" onAction={vi.fn()} />)
    expect(screen.getByText('+1 FT')).toBeTruthy()
    expect(screen.getByText('+2 FG')).toBeTruthy()
    expect(screen.getByText('+3 3PT')).toBeTruthy()
  })

  it('calls onAction with FT_MAKE on +1 tap', async () => {
    const onAction = vi.fn()
    render(<ActionBar mode="points-only" onAction={onAction} />)
    await userEvent.click(screen.getByText('+1 FT'))
    expect(onAction).toHaveBeenCalledWith('FT_MAKE', 1)
  })

  it('calls onAction with FG_MAKE on +2 tap', async () => {
    const onAction = vi.fn()
    render(<ActionBar mode="points-only" onAction={onAction} />)
    await userEvent.click(screen.getByText('+2 FG'))
    expect(onAction).toHaveBeenCalledWith('FG_MAKE', 2)
  })

  it('calls onAction with 3PT_MAKE on +3 tap', async () => {
    const onAction = vi.fn()
    render(<ActionBar mode="points-only" onAction={onAction} />)
    await userEvent.click(screen.getByText('+3 3PT'))
    expect(onAction).toHaveBeenCalledWith('3PT_MAKE', 3)
  })
})

describe('ActionBar — make-miss mode', () => {
  it('renders 6 buttons', () => {
    render(<ActionBar mode="make-miss" onAction={vi.fn()} />)
    expect(screen.getByText('FT ✓')).toBeTruthy()
    expect(screen.getByText('FT ✗')).toBeTruthy()
    expect(screen.getByText('FG ✓')).toBeTruthy()
    expect(screen.getByText('FG ✗')).toBeTruthy()
    expect(screen.getByText('3PT ✓')).toBeTruthy()
    expect(screen.getByText('3PT ✗')).toBeTruthy()
  })

  it('calls onAction with FG_MISS and 0 points on FG miss tap', async () => {
    const onAction = vi.fn()
    render(<ActionBar mode="make-miss" onAction={onAction} />)
    await userEvent.click(screen.getByText('FG ✗'))
    expect(onAction).toHaveBeenCalledWith('FG_MISS', 0)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```

Expected: `Cannot find module '@/components/live/ActionBar'`

- [ ] **Step 3: Create ActionBar**

Create `src/components/live/ActionBar.tsx`:
```tsx
import type { ActionType, StatMode } from '@/lib/types'

interface ActionBarProps {
  mode: StatMode
  onAction: (actionType: ActionType, points: number) => void
}

const POINTS_ONLY_ACTIONS: { label: string; actionType: ActionType; points: number }[] = [
  { label: '+1 FT', actionType: 'FT_MAKE', points: 1 },
  { label: '+2 FG', actionType: 'FG_MAKE', points: 2 },
  { label: '+3 3PT', actionType: '3PT_MAKE', points: 3 },
]

const MAKE_MISS_ACTIONS: { label: string; actionType: ActionType; points: number; isMake: boolean }[] = [
  { label: 'FT ✓', actionType: 'FT_MAKE', points: 1, isMake: true },
  { label: 'FT ✗', actionType: 'FT_MISS', points: 0, isMake: false },
  { label: 'FG ✓', actionType: 'FG_MAKE', points: 2, isMake: true },
  { label: 'FG ✗', actionType: 'FG_MISS', points: 0, isMake: false },
  { label: '3PT ✓', actionType: '3PT_MAKE', points: 3, isMake: true },
  { label: '3PT ✗', actionType: '3PT_MISS', points: 0, isMake: false },
]

export function ActionBar({ mode, onAction }: ActionBarProps) {
  if (mode === 'points-only') {
    return (
      <div className="flex border-t border-[var(--color-border)] bg-surface">
        {POINTS_ONLY_ACTIONS.map(({ label, actionType, points }) => (
          <button
            key={actionType}
            onClick={() => onAction(actionType, points)}
            aria-label={label}
            className="flex-1 min-h-[72px] font-display font-bold text-xl text-white bg-make hover:opacity-90 active:opacity-80 cursor-pointer transition-opacity duration-150 border-r border-[var(--color-border)] last:border-r-0"
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex border-t border-[var(--color-border)] bg-surface">
      {MAKE_MISS_ACTIONS.map(({ label, actionType, points, isMake }) => (
        <button
          key={actionType}
          onClick={() => onAction(actionType, points)}
          aria-label={label}
          className={`flex-1 min-h-[72px] font-display font-bold text-lg text-white cursor-pointer transition-opacity duration-150 border-r border-[var(--color-border)] last:border-r-0 hover:opacity-90 active:opacity-80
            ${isMake ? 'bg-make' : 'bg-miss'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Wire ActionBar into LiveGameClient with event recording**

Replace full contents of `src/app/live/[gameId]/LiveGameClient.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GameProvider, useGame } from '@/context/GameContext'
import { ScoreHeader } from '@/components/live/ScoreHeader'
import { PlayerGrid } from '@/components/live/PlayerGrid'
import { ActionBar } from '@/components/live/ActionBar'
import { SyncIndicator } from '@/components/ui/SyncIndicator'
import type { ActionType, GameEvent, GameMeta } from '@/lib/types'

function LiveGameInner() {
  const { syncStatus, dispatch, meta, events, selectedPlayerId } = useGame()
  const [showEndModal, setShowEndModal] = useState(false)
  const router = useRouter()

  async function handleUndo() {
    if (events.length === 0) return
    dispatch({ type: 'UNDO' })
    try {
      await fetch(`/api/game/${meta.id}/undo`, { method: 'POST' })
      dispatch({ type: 'SET_SYNC', status: 'synced' })
    } catch {
      dispatch({ type: 'SET_SYNC', status: 'error' })
    }
  }

  async function handleAction(actionType: ActionType, points: number) {
    if (!selectedPlayerId) return
    const player = meta.players.find(p => p.id === selectedPlayerId)
    if (!player) return

    const event: GameEvent = {
      id: crypto.randomUUID(),
      playerId: selectedPlayerId,
      team: player.team,
      actionType,
      points,
      timestamp: Date.now(),
    }

    dispatch({ type: 'ADD_EVENT', event })

    try {
      await fetch(`/api/game/${meta.id}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      dispatch({ type: 'SET_SYNC', status: 'synced' })
    } catch {
      dispatch({ type: 'UNDO' })
      dispatch({ type: 'SET_SYNC', status: 'error' })
    }
  }

  function handleSelectPlayer(playerId: string) {
    dispatch({ type: 'SET_SELECTED', playerId: selectedPlayerId === playerId ? null : playerId })
  }

  return (
    <div className="h-dvh bg-bg flex flex-col overflow-hidden">
      <SyncIndicator status={syncStatus} />
      <ScoreHeader onUndo={handleUndo} onEndGame={() => setShowEndModal(true)} />
      <div className="flex-1 flex overflow-hidden">
        <PlayerGrid onSelect={handleSelectPlayer} />
      </div>
      {selectedPlayerId && (
        <ActionBar mode={meta.mode} onAction={handleAction} />
      )}
      {/* EndGameModal added in Task 9 */}
    </div>
  )
}

export function LiveGameClient({ meta, initialEvents }: { meta: GameMeta; initialEvents: GameEvent[] }) {
  return (
    <GameProvider meta={meta} initialEvents={initialEvents}>
      <LiveGameInner />
    </GameProvider>
  )
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npm test
```

Expected: All ActionBar tests PASS.

- [ ] **Step 6: End-to-end manual test**

1. Create a 3v3 game in points-only mode
2. Tap player → tap +2 FG → verify score updates immediately
3. Tap player → tap +3 3PT → verify score
4. Tap Undo → verify score reverts
5. Create a second game in make-miss mode
6. Verify 6 buttons appear with green/slate colors and ✓/✗ icons
7. Record FG Miss → verify score stays the same

- [ ] **Step 7: Commit**

```bash
git add src/components/live/ActionBar.tsx src/app/live/[gameId]/LiveGameClient.tsx src/test/ActionBar.test.tsx
git commit -m "feat: add action bar with optimistic event recording and undo"
```

---

## Task 9: End Game Modal + Live Stats Panel

**Files:**
- Create: `src/components/live/EndGameModal.tsx`
- Create: `src/components/live/LiveStatsPanel.tsx`
- Modify: `src/app/live/[gameId]/LiveGameClient.tsx`

> **UI/UX:** Modal uses 50% black scrim with `backdrop-blur-sm`. "End Game" button is `--color-destructive` (red). Cancel is ghost/outline. Focus trapped. Stats panel slides in from right (250ms ease-out), closes (180ms ease-in).

- [ ] **Step 1: Create EndGameModal**

Create `src/components/live/EndGameModal.tsx`:
```tsx
'use client'

import { useEffect, useRef } from 'react'

interface EndGameModalProps {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export function EndGameModal({ onConfirm, onCancel, loading }: EndGameModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-game-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-surface-elevated rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6 shadow-2xl"
           style={{ animation: 'scale-in 200ms ease-out' }}>
        <div className="flex flex-col gap-2 text-center">
          <h2 id="end-game-title" className="font-display font-bold text-2xl text-fg">End this game?</h2>
          <p className="font-body text-muted text-sm leading-relaxed">
            This will lock the event log and generate the final report. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-muted font-display font-bold text-lg cursor-pointer hover:text-fg hover:border-fg/30 transition-all duration-150 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-destructive text-white font-display font-bold text-lg cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity duration-150 disabled:opacity-50"
          >
            {loading ? 'Ending…' : 'End Game →'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

Add to `src/app/globals.css`:
```css
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 2: Create LiveStatsPanel**

Create `src/components/live/LiveStatsPanel.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import type { PlayerStats } from '@/lib/types'

interface LiveStatsPanelProps {
  onClose: () => void
}

function fmtShooting(makes: number, attempts: number) {
  return `${makes}/${attempts}`
}

export function LiveStatsPanel({ onClose }: LiveStatsPanelProps) {
  const { meta, derived } = useGame()
  const [tab, setTab] = useState<'points' | 'shooting'>('points')

  const players = [...meta.players].sort((a, b) => {
    const sa = derived.playerStats[a.id]?.points ?? 0
    const sb = derived.playerStats[b.id]?.points ?? 0
    return sb - sa
  })

  const teamsOrder = ['A', 'B'] as const

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 w-80 bg-surface shadow-2xl flex flex-col"
      style={{ animation: 'slide-in-right 250ms ease-out' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="font-display font-bold text-xl text-fg">Live Stats</h2>
        <button
          onClick={onClose}
          aria-label="Close stats panel"
          className="p-2 text-muted hover:text-fg transition-colors cursor-pointer rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex border-b border-[var(--color-border)]">
        {(['points', 'shooting'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 font-display font-semibold text-sm uppercase tracking-wide cursor-pointer transition-colors duration-150 ${
              tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-fg'
            }`}
          >
            {t === 'points' ? 'Points' : 'Shooting'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {teamsOrder.map(team => {
          const teamPlayers = players.filter(p => p.team === team)
          const teamName = team === 'A' ? meta.teamA.name : meta.teamB.name
          const accentColor = team === 'A' ? 'text-team-a' : 'text-team-b'

          return (
            <div key={team}>
              <h3 className={`font-display font-bold text-xs uppercase tracking-widest mb-2 ${accentColor}`}>
                {teamName}
              </h3>
              {teamPlayers.map(player => {
                const stats: PlayerStats = derived.playerStats[player.id] ?? {
                  points: 0, fgMakes: 0, fgAttempts: 0,
                  threeMakes: 0, threeAttempts: 0, ftMakes: 0, ftAttempts: 0
                }
                return (
                  <div key={player.id} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-b-0">
                    <span className="font-display text-base text-fg">{player.displayLabel}</span>
                    {tab === 'points' ? (
                      <span className="font-display font-bold text-lg text-score tabular-nums">
                        {stats.points} pts
                      </span>
                    ) : (
                      <span className="font-body text-sm text-muted tabular-nums">
                        {fmtShooting(stats.fgMakes, stats.fgAttempts)} FG ·{' '}
                        {fmtShooting(stats.threeMakes, stats.threeAttempts)} 3P ·{' '}
                        {fmtShooting(stats.ftMakes, stats.ftAttempts)} FT
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

Add to `src/app/globals.css`:
```css
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

- [ ] **Step 3: Wire both into LiveGameClient**

Replace full `src/app/live/[gameId]/LiveGameClient.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2 } from 'lucide-react'
import { GameProvider, useGame } from '@/context/GameContext'
import { ScoreHeader } from '@/components/live/ScoreHeader'
import { PlayerGrid } from '@/components/live/PlayerGrid'
import { ActionBar } from '@/components/live/ActionBar'
import { EndGameModal } from '@/components/live/EndGameModal'
import { LiveStatsPanel } from '@/components/live/LiveStatsPanel'
import { SyncIndicator } from '@/components/ui/SyncIndicator'
import type { ActionType, GameEvent, GameMeta } from '@/lib/types'

function LiveGameInner() {
  const { syncStatus, dispatch, meta, events, selectedPlayerId } = useGame()
  const [showEndModal, setShowEndModal] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [endingGame, setEndingGame] = useState(false)
  const router = useRouter()

  async function handleUndo() {
    if (events.length === 0) return
    dispatch({ type: 'UNDO' })
    try {
      await fetch(`/api/game/${meta.id}/undo`, { method: 'POST' })
      dispatch({ type: 'SET_SYNC', status: 'synced' })
    } catch {
      dispatch({ type: 'SET_SYNC', status: 'error' })
    }
  }

  async function handleAction(actionType: ActionType, points: number) {
    if (!selectedPlayerId) return
    const player = meta.players.find(p => p.id === selectedPlayerId)
    if (!player) return

    const event: GameEvent = {
      id: crypto.randomUUID(),
      playerId: selectedPlayerId,
      team: player.team,
      actionType,
      points,
      timestamp: Date.now(),
    }

    dispatch({ type: 'ADD_EVENT', event })

    try {
      await fetch(`/api/game/${meta.id}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      dispatch({ type: 'SET_SYNC', status: 'synced' })
    } catch {
      dispatch({ type: 'UNDO' })
      dispatch({ type: 'SET_SYNC', status: 'error' })
    }
  }

  function handleSelectPlayer(playerId: string) {
    dispatch({ type: 'SET_SELECTED', playerId: selectedPlayerId === playerId ? null : playerId })
  }

  async function handleEndGame() {
    setEndingGame(true)
    try {
      await fetch(`/api/game/${meta.id}/end`, { method: 'POST' })
      router.push(`/game/${meta.id}`)
    } catch {
      setEndingGame(false)
    }
  }

  return (
    <div className="h-dvh bg-bg flex flex-col overflow-hidden">
      <SyncIndicator status={syncStatus} />
      <ScoreHeader onUndo={handleUndo} onEndGame={() => setShowEndModal(true)} />
      <div className="flex-1 flex overflow-hidden">
        <PlayerGrid onSelect={handleSelectPlayer} />
      </div>
      {selectedPlayerId && <ActionBar mode={meta.mode} onAction={handleAction} />}

      {/* Stats toggle */}
      <button
        onClick={() => setShowStats(true)}
        aria-label="Open live stats"
        className="fixed bottom-4 right-4 z-30 bg-surface-elevated text-muted hover:text-fg p-3 rounded-full shadow-lg cursor-pointer transition-colors duration-150"
        style={{ display: selectedPlayerId ? 'none' : undefined }}
      >
        <BarChart2 size={22} />
      </button>

      {showStats && <LiveStatsPanel onClose={() => setShowStats(false)} />}
      {showEndModal && (
        <EndGameModal
          onConfirm={handleEndGame}
          onCancel={() => setShowEndModal(false)}
          loading={endingGame}
        />
      )}
    </div>
  )
}

export function LiveGameClient({ meta, initialEvents }: { meta: GameMeta; initialEvents: GameEvent[] }) {
  return (
    <GameProvider meta={meta} initialEvents={initialEvents}>
      <LiveGameInner />
    </GameProvider>
  )
}
```

- [ ] **Step 4: Visual test**

1. Record 5+ events across multiple players
2. Open stats panel → verify points are correct
3. Switch to Shooting tab → verify FG/3PT/FT breakdown
4. Close panel
5. Tap End Game → verify confirmation modal appears
6. Press Escape → modal closes
7. Tap End Game → Confirm → verify redirect to `/game/{id}`

- [ ] **Step 5: Commit**

```bash
git add src/components/live/EndGameModal.tsx src/components/live/LiveStatsPanel.tsx src/app/live/[gameId]/LiveGameClient.tsx src/app/globals.css
git commit -m "feat: add end game modal and live stats panel with slide-in animation"
```

---

## Task 10: Game Report Screen

**Files:**
- Create: `src/app/game/[gameId]/page.tsx`
- Create: `src/components/report/FinalScoreHeader.tsx`
- Create: `src/components/report/BoxScoreTable.tsx`

> **UI/UX:** Report page allows scrolling (not a live game screen). Use tabular number font for stat columns. "Game in Progress" banner if status=live. Fully read-only — no interactive elements.

- [ ] **Step 1: Create FinalScoreHeader**

Create `src/components/report/FinalScoreHeader.tsx`:
```tsx
interface FinalScoreHeaderProps {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  isLive: boolean
}

export function FinalScoreHeader({ teamAName, teamBName, scoreA, scoreB, isLive }: FinalScoreHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      {isLive && (
        <span className="text-xs font-body uppercase tracking-widest text-make bg-make/10 px-3 py-1 rounded-full">
          Game In Progress
        </span>
      )}
      {!isLive && (
        <span className="text-xs font-body uppercase tracking-widest text-muted">Final</span>
      )}
      <div className="flex items-center gap-6">
        <span className="font-display font-bold text-2xl text-team-a">{teamAName}</span>
        <div className="flex items-baseline gap-3">
          <span className="font-display font-bold text-8xl text-score tabular-nums">{scoreA}</span>
          <span className="font-display text-4xl text-muted">–</span>
          <span className="font-display font-bold text-8xl text-score tabular-nums">{scoreB}</span>
        </div>
        <span className="font-display font-bold text-2xl text-team-b">{teamBName}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create BoxScoreTable**

Create `src/components/report/BoxScoreTable.tsx`:
```tsx
import type { Player, PlayerStats } from '@/lib/types'

interface BoxScoreTableProps {
  teamName: string
  team: 'A' | 'B'
  players: Player[]
  stats: Record<string, PlayerStats>
}

function fmtShooting(makes: number, attempts: number) {
  return `${makes}/${attempts}`
}

export function BoxScoreTable({ teamName, team, players, stats }: BoxScoreTableProps) {
  const accentColor = team === 'A' ? 'text-team-a border-team-a/30' : 'text-team-b border-team-b/30'
  const sorted = [...players].sort((a, b) => {
    const sa = stats[a.id]?.points ?? 0
    const sb = stats[b.id]?.points ?? 0
    return sb - sa
  })

  return (
    <div className={`rounded-xl border ${accentColor} overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${accentColor}`}>
        <h2 className={`font-display font-bold text-lg uppercase tracking-wide ${accentColor.split(' ')[0]}`}>
          {teamName}
        </h2>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-4 py-2 font-body text-xs text-muted uppercase tracking-wide">Player</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide tabular-nums">PTS</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide tabular-nums">FG</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide tabular-nums">3P</th>
            <th className="text-right px-4 py-2 font-body text-xs text-muted uppercase tracking-wide tabular-nums">FT</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(player => {
            const s: PlayerStats = stats[player.id] ?? {
              points: 0, fgMakes: 0, fgAttempts: 0,
              threeMakes: 0, threeAttempts: 0, ftMakes: 0, ftAttempts: 0
            }
            return (
              <tr key={player.id} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-4 py-3 font-display text-base text-fg">{player.displayLabel}</td>
                <td className="px-3 py-3 text-right font-display font-bold text-base text-score tabular-nums">{s.points}</td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">{fmtShooting(s.fgMakes, s.fgAttempts)}</td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">{fmtShooting(s.threeMakes, s.threeAttempts)}</td>
                <td className="px-4 py-3 text-right font-body text-sm text-muted tabular-nums">{fmtShooting(s.ftMakes, s.ftAttempts)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create GameReportScreen**

Create `src/app/game/[gameId]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { Zap } from 'lucide-react'
import { getMeta, getEvents, getSnapshot } from '@/lib/kv'
import { gameReducer } from '@/lib/reducer'
import { FinalScoreHeader } from '@/components/report/FinalScoreHeader'
import { BoxScoreTable } from '@/components/report/BoxScoreTable'
import type { GameState } from '@/lib/types'

export default async function GameReportScreen({ params }: { params: { gameId: string } }) {
  const meta = await getMeta(params.gameId)
  if (!meta) notFound()

  let finalState: GameState

  if (meta.status === 'ended') {
    const snapshot = await getSnapshot(params.gameId)
    if (!snapshot) notFound()
    finalState = snapshot.finalState
  } else {
    const events = await getEvents(params.gameId)
    finalState = gameReducer(events)
  }

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')

  return (
    <main className="min-h-dvh bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <header className="flex items-center gap-2">
          <Zap size={22} className="text-primary" fill="currentColor" />
          <span className="font-display font-bold text-xl text-fg">StatTap</span>
        </header>

        <FinalScoreHeader
          teamAName={meta.teamA.name}
          teamBName={meta.teamB.name}
          scoreA={finalState.scoreA}
          scoreB={finalState.scoreB}
          isLive={meta.status === 'live'}
        />

        <BoxScoreTable
          team="A"
          teamName={meta.teamA.name}
          players={playersA}
          stats={finalState.playerStats}
        />

        <BoxScoreTable
          team="B"
          teamName={meta.teamB.name}
          players={playersB}
          stats={finalState.playerStats}
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Visual test**

1. Complete a full game (create, record 10+ events, end)
2. Verify redirect to `/game/{id}`
3. Copy URL, open in private/incognito window — verify page loads without login
4. Verify scores and shooting stats match what was entered
5. Verify "FINAL" label on ended game
6. Open a live game's share URL → verify "Game in Progress" banner

- [ ] **Step 5: Commit**

```bash
git add src/app/game/ src/components/report/
git commit -m "feat: add public game report screen with box score"
```

---

## Task 11: iPad Polish + Accessibility

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/live/PlayerGrid.tsx`
- Modify: `src/components/live/ScoreHeader.tsx`
- Modify: `src/app/live/[gameId]/LiveGameClient.tsx`

> **UI/UX:** Run full pre-delivery checklist from `design-system/stattap/MASTER.md` before this task. No scrolling in live screen. All touch targets ≥56px tiles, ≥72px action buttons. Focus rings on all interactive elements. `aria-live` on score region.

- [ ] **Step 1: Add aria-live to score**

In `src/components/live/ScoreHeader.tsx`, wrap the score area:
```tsx
<div
  aria-live="polite"
  aria-label={`Score: ${meta.teamA.name} ${derived.scoreA}, ${meta.teamB.name} ${derived.scoreB}`}
  className="flex items-baseline gap-3"
>
  <span className="font-display font-bold text-8xl leading-none text-score tabular-nums">
    {derived.scoreA}
  </span>
  <span className="font-display text-4xl text-muted">–</span>
  <span className="font-display font-bold text-8xl leading-none text-score tabular-nums">
    {derived.scoreB}
  </span>
</div>
```

- [ ] **Step 2: Add focus rings globally**

In `src/app/globals.css`, add:
```css
:focus-visible {
  outline: 4px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
[role="button"]:focus-visible {
  outline: 4px solid var(--color-primary);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Prevent body scroll on live game screen**

In `src/app/live/[gameId]/LiveGameClient.tsx`, add to the outer div:
```tsx
<div
  className="h-dvh bg-bg flex flex-col overflow-hidden touch-none"
  onTouchMove={e => e.preventDefault()}
>
```

Note: `touch-none` sets `touch-action: none` which prevents scroll gestures on iPad Safari.

- [ ] **Step 4: iPad Safari testing checklist**

Open the app on an iPad (or use Safari DevTools device simulation at 1024×768 landscape):

- [ ] Live game screen: no scroll possible (try swiping aggressively)
- [ ] Score readable at 72px with Barlow Condensed
- [ ] All player tiles ≥56px height when 12 players present
- [ ] All action bar buttons ≥72px height
- [ ] Tapping a tile — immediate visual feedback (≤120ms)
- [ ] Tapping action — immediate score update (≤50ms perceived)
- [ ] Undo button always visible and tappable
- [ ] End Game modal dismisses with Escape on keyboard
- [ ] Stats panel opens/closes smoothly
- [ ] Portrait orientation: layout still functional (player tiles reflow)

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Final commit**

```bash
git add src/app/globals.css src/components/live/ScoreHeader.tsx src/app/live/[gameId]/LiveGameClient.tsx
git commit -m "feat: iPad polish — aria-live score, focus rings, touch-action overflow prevention"
```

---

## Task 12: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/stat-tap.git
git push -u origin master
```

- [ ] **Step 2: Import to Vercel**

1. Go to vercel.com → New Project → Import from GitHub → select `stat-tap`
2. Framework: Next.js (auto-detected)
3. Add environment variables from `.env.local`:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `NEXT_PUBLIC_APP_URL` (set to production URL)
4. Click Deploy

- [ ] **Step 3: Link Vercel KV**

In Vercel dashboard → Storage → select your KV database → Connect to Project → select `stat-tap`.

- [ ] **Step 4: Smoke test production**

1. Open production URL
2. Create a game
3. Record 5 stats
4. End game
5. Open share link on a different device (phone) — verify report loads
6. Return to the live game URL mid-game on a new tab — verify game state restores

- [ ] **Step 5: Final production commit**

```bash
git commit --allow-empty -m "chore: deploy StatTap MVP to Vercel"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| 2-tap stat entry (player → action) | Task 7, 8 |
| Live score, real-time updates | Task 6, 8 |
| All players on screen, no scrolling | Task 7 |
| Symmetric grid (max rows, blank tiles) | Task 7 |
| Points Only + Make/Miss modes | Task 8 |
| Undo (pop last event) | Task 4 (context), Task 8 |
| Game persists across browser close | Task 3 (API hydration), Task 6 |
| Live stats panel (read-only) | Task 9 |
| End game confirmation | Task 9 |
| Shareable game report `/game/{id}` | Task 10 |
| Public, no login required | Task 10 (server component, no auth) |
| Dark mode, basketball orange, Barlow Condensed | Task 1, all UI tasks |
| UI/UX pro max design system applied | design-system/stattap/MASTER.md referenced throughout |
| iPad-first, 56px+ tiles | Task 7, Task 11 |
| Optimistic updates | Task 4 (context), Task 8 |
| displayLabel resolution | Task 2 (game.ts), Task 3 (API) |

**No placeholders found.** Every step contains complete code.

**Type consistency:** All components use types from `src/lib/types.ts`. `GameEvent`, `Player`, `PlayerStats`, `GameState`, `GameMeta`, `GameSnapshot` used consistently across tasks. `applyEvent` in reducer uses `ActionType` values that match `ActionBar` output exactly.
