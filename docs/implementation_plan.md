# Implementation Plan — StatTap MVP

**Version:** 1.0  
**Date:** 2026-06-18  
**Stack:** Next.js 14 (App Router) + Vercel KV + Tailwind CSS + TypeScript

---

## Prerequisites

Before starting implementation:
- [ ] Node.js 18+ installed
- [ ] Vercel account created
- [ ] Vercel KV database provisioned (via Vercel dashboard)
- [ ] `NEXT_PUBLIC_APP_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` env vars ready

---

## Phase 1: Project Scaffold

**Goal:** Working Next.js project with Tailwind, TypeScript, Vercel KV configured, and custom fonts loaded.

### Tasks

1. **Initialize Next.js project**
   ```bash
   npx create-next-app@latest stat-tap --typescript --tailwind --app --src-dir
   ```

2. **Install dependencies**
   ```bash
   npm install @vercel/kv lucide-react
   ```

3. **Configure Tailwind** — extend with custom fonts and color tokens from `ui_ux_brief.md`

4. **Load Google Fonts** — Barlow Condensed + Barlow via `app/layout.tsx`

5. **Create type definitions** — `src/lib/types.ts` with all types from TRD

6. **Create reducer** — `src/lib/reducer.ts` with `gameReducer` and `applyEvent`

7. **Create KV helpers** — `src/lib/kv.ts` wrapping Vercel KV calls

8. **Create game utilities** — `src/lib/game.ts` with `resolveDisplayLabel`, `emptyStats`, `initialGameState`

9. **Configure environment** — `.env.local` with KV credentials

**Review gate:** Run `npm run dev`, confirm app loads at `localhost:3000` with correct fonts and dark background.

---

## Phase 2: API Routes

**Goal:** All 5 API routes implemented and tested with curl or Postman.

### Tasks

1. **`POST /api/game`** — `src/app/api/game/route.ts`
   - Validate body (players, mode)
   - Generate `gameId = crypto.randomUUID()`
   - Resolve `displayLabel` for each player
   - Store `game:{id}:meta` in KV
   - Return `{ gameId }`

2. **`GET /api/game/[id]`** — `src/app/api/game/[id]/route.ts`
   - Fetch meta from KV
   - `LRANGE game:{id}:events 0 -1` to get full event list
   - Return `{ meta, events, snapshot? }`
   - If `status=ended`, include snapshot

3. **`POST /api/game/[id]/event`** — `src/app/api/game/[id]/event/route.ts`
   - Validate body is a valid `GameEvent`
   - Check game `status=live`, reject if ended
   - `RPUSH game:{id}:events` serialized event
   - Return `{ ok: true }`

4. **`POST /api/game/[id]/undo`** — `src/app/api/game/[id]/undo/route.ts`
   - `RPOP game:{id}:events`
   - Return `{ ok: true, removedEvent: event | null }`

5. **`POST /api/game/[id]/end`** — `src/app/api/game/[id]/end/route.ts`
   - Fetch all events via `LRANGE`
   - Run `gameReducer(events)` to compute `finalState`
   - Store `game:{id}:snapshot`
   - Update `game:{id}:meta` status to `ended`
   - Return `{ snapshot }`

**Review gate:** Test all 5 routes with manual API calls. Verify event list in KV grows/shrinks correctly. Verify snapshot is immutable after End Game.

---

## Phase 3: Game Setup Screen

**Goal:** Stat keeper can create a game and navigate to the live screen.

### Tasks

1. **`GameSetupScreen`** — `src/app/page.tsx`
   - Two-column layout (Team A / Team B)
   - Team name inputs with defaults
   - Player entry lists per team
   - Mode selector (Points Only / Make Miss)
   - Start Game button

2. **`PlayerEntryList`** — `src/components/setup/PlayerEntryList.tsx`
   - List of `PlayerEntryRow` components
   - "+ Add Player" button (disabled at 12 players)
   - Manages local player array state

3. **`PlayerEntryRow`** — `src/components/setup/PlayerEntryRow.tsx`
   - Jersey input (max 3 chars, numeric keyboard)
   - Name input (max 30 chars)
   - Live `displayLabel` preview
   - Delete button (×)

4. **`ModeSelector`** — `src/components/setup/ModeSelector.tsx`
   - Two large toggle options: "Points Only" / "Make & Miss"
   - Visual description of each mode

5. **Form submission handler**
   - Validate: at least 1 player (either team)
   - `POST /api/game` with form data
   - On success: `router.push('/live/{gameId}')`

**Review gate:** Create a game with 4v4 players, mixed jersey/name combinations. Verify navigation to `/live/{gameId}`. Verify game appears in KV with correct structure.

---

## Phase 4: Live Game Screen — Player Grid

**Goal:** Player grid renders correctly for all player count combinations, tiles are tappable.

### Tasks

1. **`LiveGameScreen`** — `src/app/live/[gameId]/page.tsx`
   - On mount: `GET /api/game/:id`, hydrate state
   - Redirect to `/game/:id` if `status=ended`
   - Render `ScoreHeader` + `PlayerGrid`

2. **Game state context** — `src/context/GameContext.tsx`
   - `events`, `meta`, `derived` (from reducer), `selectedPlayerId`, `syncStatus`
   - `dispatch` actions: `ADD_EVENT`, `UNDO`, `SET_SELECTED`

3. **`ScoreHeader`** — `src/components/live/ScoreHeader.tsx`
   - Team A name + score (left)
   - Team B name + score (right)
   - Score in `Barlow Condensed 700` at 72px
   - Undo button (left)
   - End Game button (right)

4. **`PlayerGrid`** — `src/components/live/PlayerGrid.tsx`
   - Two `TeamColumn` components side by side
   - Calculates `rowCount = max(teamA.length, teamB.length)`
   - Calculates `tileHeight = gridHeight / rowCount` (min 56px)
   - Passes `tileHeight` to columns

5. **`TeamColumn`** — `src/components/live/TeamColumn.tsx`
   - Renders `PlayerTile` for each real player
   - Renders `BlankTile` for padding slots
   - Team accent color header bar

6. **`PlayerTile`** — `src/components/live/PlayerTile.tsx`
   - Displays `displayLabel`
   - Selected state: elevated background + team accent left border
   - `onClick`: dispatches `SET_SELECTED(playerId)`
   - `aria-label`, `role="button"`, `aria-pressed`

7. **`BlankTile`** — `src/components/live/BlankTile.tsx`
   - Same dimensions as PlayerTile
   - Dimmed appearance, `aria-hidden="true"`, no `onClick`

**Review gate:** Test with 1v1, 5v5, 12v5, 12v12. Verify grid fills screen with no scrolling on iPad (1024×768). Verify blank tiles appear for shorter team. Verify tile height never drops below 56px.

---

## Phase 5: Live Game Screen — Action Bar & Event Recording

**Goal:** Complete 2-tap stat entry loop works end-to-end.

### Tasks

1. **`ActionBar`** — `src/components/live/ActionBar.tsx`
   - Renders only when `selectedPlayerId !== null`
   - `points-only` mode: three buttons (+1 FT, +2 FG, +3 3PT)
   - `make-miss` mode: six buttons (FT Make, FT Miss, FG Make, FG Miss, 3PT Make, 3PT Miss)
   - Make buttons: green background; Miss buttons: slate background
   - Each button: 72px height minimum
   - On tap: create event, dispatch `ADD_EVENT`, clear `selectedPlayerId`

2. **Event creation logic**
   - Build `GameEvent` from `selectedPlayerId`, `team`, `actionType`, `points`, `timestamp`
   - Optimistic dispatch to local state
   - Background `POST /api/game/:id/event`
   - On failure: dispatch `UNDO` locally, set `syncStatus = 'error'`

3. **`SyncIndicator`** — `src/components/ui/SyncIndicator.tsx`
   - Small icon in corner: ✓ synced / spinner syncing / ⚠ error
   - Never blocks interaction

4. **Undo button handler**
   - Dispatch `UNDO` locally (pop last event from array, rerun reducer)
   - Background `POST /api/game/:id/undo`

**Review gate:** Record 10 events across players. Verify score updates correctly. Undo 3 times — verify score reverts correctly. Verify KV event list length matches local count. Test with network throttled to confirm optimistic UI never lags.

---

## Phase 6: End Game Flow

**Goal:** Stat keeper can end the game and reach the shareable report.

### Tasks

1. **`EndGameModal`** — `src/components/live/EndGameModal.tsx`
   - Triggered by "End Game" button in `ScoreHeader`
   - Confirmation text + "End Game" (red) + "Cancel" buttons
   - Focus trapped, Escape closes
   - On confirm: `POST /api/game/:id/end` → `router.push('/game/{id}')`

2. **End game API integration**
   - Disable further event recording after confirm (before response)
   - On success: navigate to report page
   - On failure: show error, re-enable game (retry)

**Review gate:** End a game after 10 events. Verify navigation to report page. Verify attempting to record an event after End Game is rejected by API (status=ended check). Verify KV snapshot key exists with correct finalState.

---

## Phase 7: Live Stats Panel

**Goal:** Stat keeper can view player stats mid-game without leaving the grid.

### Tasks

1. **Stats tab button** — in `ScoreHeader` or fixed to screen edge
   - Opens `LiveStatsPanel` as a full overlay

2. **`LiveStatsPanel`** — `src/components/live/LiveStatsPanel.tsx`
   - Slide-in overlay from right (250ms ease-out)
   - Close via ✕ or tap outside
   - Two sub-tabs: "Points" / "Shooting"
   - Derived from `context.derived.playerStats` (always current)

3. **`PointsView`** — player list sorted by points descending
   - Display: `{displayLabel}  {points} pts`

4. **`ShootingView`** — player list with full breakdown
   - Display: `{displayLabel}  {fgMakes}/{fgAttempts} FG · {threeMakes}/{threeAttempts} 3P · {ftMakes}/{ftAttempts} FT`

**Review gate:** Record a mixed set of events. Open stats panel — verify point totals match score. Verify shooting percentages are correct. Confirm panel closes without disrupting game state.

---

## Phase 8: Game Report Screen

**Goal:** Public shareable URL shows final box score.

### Tasks

1. **`GameReportScreen`** — `src/app/game/[gameId]/page.tsx`
   - Server component: fetches `GET /api/game/:id`
   - If `status=live`: renders live state with "Game in Progress" banner
   - If `status=ended`: renders from snapshot

2. **`FinalScoreHeader`** — `src/components/report/FinalScoreHeader.tsx`
   - Team A name / score / Team B name
   - "FINAL" label (or "LIVE" if in progress)

3. **`BoxScoreTable`** — `src/components/report/BoxScoreTable.tsx`
   - One table per team
   - Columns: Player | PTS | FG | 3P | FT
   - Tabular number font for stat columns
   - Sorted by points descending

**Review gate:** Open report URL on mobile Safari. Verify all stats match what was recorded. Verify page is fully read-only (no interactive elements). Verify it works without login on a different device.

---

## Phase 9: Polish & iPad Validation

**Goal:** App feels native on iPad. No layout issues. Animations are smooth.

### Tasks

1. **iPad Safari testing** — landscape and portrait
   - Verify player grid fills screen with no scrolling at all player counts
   - Verify touch targets are all ≥56px height
   - Verify score header is always visible

2. **Animation implementation**
   - Action bar slide-up/down (200ms/150ms)
   - Stats panel slide-in/out (250ms/180ms)
   - Selected tile state change (120ms)
   - All wrapped in `prefers-reduced-motion` check

3. **Error states**
   - Sync error indicator (non-blocking)
   - Game not found (`/live/{badId}` → redirect to `/`)
   - API error on End Game (retry prompt)

4. **Final accessibility pass**
   - `aria-live` on score region
   - All interactive elements have labels
   - Focus management on End Game modal

**Review gate:** Simulate a full 5v5 game on iPad. Record 30+ events including undo. End game. Open report on phone. Confirm zero scrolling in live screen, zero layout issues.

---

## Deployment

1. Push to GitHub
2. Import project to Vercel
3. Link Vercel KV database to project
4. Set env vars in Vercel dashboard
5. Deploy → verify production URL

---

## File Checklist

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          ← GameSetupScreen
│   ├── live/[gameId]/page.tsx            ← LiveGameScreen
│   ├── game/[gameId]/page.tsx            ← GameReportScreen
│   └── api/
│       ├── game/route.ts
│       └── game/[id]/
│           ├── route.ts
│           ├── event/route.ts
│           ├── undo/route.ts
│           └── end/route.ts
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
│   └── GameContext.tsx
│
└── lib/
    ├── types.ts
    ├── reducer.ts
    ├── kv.ts
    └── game.ts
```
