# UI/UX Brief — StatTap MVP

**Version:** 1.0  
**Date:** 2026-06-18  
**Generated with:** ui-ux-pro-max skill v2.5.0

---

## Design Philosophy

StatTap is a tool, not a product. It must disappear. The stat keeper's attention is on the court — the UI should demand zero cognitive load. Every design decision must answer: **does this make the stat keeper faster?**

**Design axiom:** Two taps. Zero hesitation. No scrolling.

---

## Device Priority

| Priority | Device | Viewport | Notes |
|---|---|---|---|
| 1 | iPad (landscape) | 1024×768+ | Primary design target |
| 2 | iPad (portrait) | 768×1024 | Must also work |
| 3 | Laptop | 1280×800+ | Secondary |
| 4 | Mobile | 375×667+ | Report page only |

---

## Design System

### Style

**Exaggerated Minimalism meets Sports Dashboard**

- Dark mode only (reduces glare in outdoor/gym environments)
- High contrast — all text and interactive elements meet WCAG AAA (7:1+)
- Bold, clear numbers — scores and player labels must be readable at a glance
- No decorative elements — every pixel has a function
- Status colors used semantically (orange = primary action, green = make, red = miss/end game)

### Color Palette

| Role | Hex | Usage |
|---|---|---|
| Background | `#0F172A` | Page background (dark navy) |
| Surface | `#1E293B` | Cards, player tiles, panels |
| Surface Elevated | `#293548` | Selected tiles, modals |
| Primary | `#F97316` | Basketball orange — primary actions, CTAs |
| On Primary | `#FFFFFF` | Text on orange |
| Team A Accent | `#38BDF8` | Sky blue — Team A column indicator |
| Team B Accent | `#A78BFA` | Purple — Team B column indicator |
| Make / Success | `#22C55E` | FG Make, FT Make, 3PT Make buttons |
| Miss / Neutral | `#64748B` | FG Miss, FT Miss, 3PT Miss buttons |
| Score Text | `#F8FAFC` | Live score numbers |
| Muted Text | `#94A3B8` | Secondary labels, placeholders |
| Destructive | `#EF4444` | End Game button, errors |
| Border | `rgba(255,255,255,0.08)` | Subtle tile borders |
| Disabled Tile | `#1E293B` | Blank/placeholder tiles (dimmed) |

**CSS Variables:**
```css
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
  --color-muted: #94A3B8;
  --color-destructive: #EF4444;
  --color-border: rgba(255,255,255,0.08);
}
```

### Typography

**Pairing: Barlow Condensed (headings/labels) + Barlow (body)**

Rationale: Purpose-built for sports and athletic contexts. Condensed variant maximizes information density on player tiles — critical for fitting 12 players per column on an iPad.

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap');
```

**Tailwind Config:**
```js
fontFamily: {
  display: ['Barlow Condensed', 'sans-serif'],
  body: ['Barlow', 'sans-serif'],
}
```

**Type Scale:**

| Token | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `score` | 72px / 4.5rem | 700 | Barlow Condensed | Live score digits |
| `h1` | 32px / 2rem | 700 | Barlow Condensed | Team names in header |
| `h2` | 24px / 1.5rem | 600 | Barlow Condensed | Section headers |
| `player-label` | 18px / 1.125rem | 600 | Barlow Condensed | Player tile label |
| `action-btn` | 20px / 1.25rem | 700 | Barlow Condensed | Action bar buttons |
| `body` | 16px / 1rem | 400 | Barlow | Setup form inputs |
| `caption` | 13px / 0.8125rem | 400 | Barlow | Stats breakdown labels |

---

## Screen-by-Screen UX

### Screen 1: Game Setup (`/`)

**Layout (iPad landscape):**
```
┌─────────────────────────────────────────────────┐
│              ⚡ StatTap                           │
│                                                   │
│  [Team A Name ____________]  [Team B Name _____]  │
│                                                   │
│  TEAM A                      TEAM B               │
│  ┌──────────────────┐        ┌──────────────────┐ │
│  │ 23  Jordan     × │        │ 7   Marcus     × │ │
│  │ 14  [name]     × │        │ 11  [name]     × │ │
│  │ + Add Player     │        │ + Add Player     │ │
│  └──────────────────┘        └──────────────────┘ │
│                                                   │
│  Stat Mode: ○ Points Only  ● Make/Miss            │
│                                                   │
│              [ Start Game → ]                     │
└─────────────────────────────────────────────────┘
```

**UX Rules:**
- "Start Game" disabled until at least 1 player exists (either team)
- Player rows: jersey input (3 chars max), name input, delete button
- Live display label preview shown next to each player row
- Mode selector: two large radio-style toggle buttons
- No required fields — keyboard never required to start

---

### Screen 2: Live Game (`/live/[gameId]`)

**Layout (iPad landscape):**
```
┌─────────────────────────────────────────────────┐
│  TEAM A           48 – 41         TEAM B         │
│  [↩ Undo]                    [End Game]           │
├──────────────────────┬──────────────────────────┤
│  TEAM A              │  TEAM B                   │
│  ┌────────────────┐  │  ┌────────────────┐       │
│  │   23 · Jordan  │  │  │   7 · Marcus   │       │
│  ├────────────────┤  │  ├────────────────┤       │
│  │   14           │  │  │   11 · Devon   │       │
│  ├────────────────┤  │  ├────────────────┤       │
│  │   Player 3     │  │  │   ░░░░░░░░░░   │  ← blank
│  ├────────────────┤  │  ├────────────────┤       │
│  │   31 · T.Wash  │  │  │   ░░░░░░░░░░   │  ← blank
│  └────────────────┘  │  └────────────────┘       │
├──────────────────────┴──────────────────────────┤
│  [+1 FT]        [+2 FG]        [+3 3PT]          │  ← Points Only mode
└─────────────────────────────────────────────────┘
```

**After player tap:**
```
┌─────────────────────────────────────────────────┐
│  TEAM A           48 – 41         TEAM B         │
│  [↩ Undo]                    [End Game]           │
├──────────────────────┬──────────────────────────┤
│  ...player grid...   │  ...                      │
│  ┌────────────────┐  │                            │
│  │ ▶ 23 · Jordan  │  ← selected (highlighted)    │
│  └────────────────┘  │                            │
├──────────────────────┴──────────────────────────┤
│  [FT Make]  [FT Miss]  [FG Make]  [FG Miss]  [3PT Make]  [3PT Miss]  │
└─────────────────────────────────────────────────┘
```

**UX Rules:**
- Score: `Barlow Condensed 700` at 72px, always centered, always visible
- Team names flank the score in their accent color
- Player tile height = `(gridHeight) / max(teamA, teamB)`, minimum 56px
- Selected player tile: `var(--color-surface-elevated)` + left border in team accent color
- Action bar: slides up from bottom after player selected (200ms ease-out)
- Action bar hides and selection clears immediately after action tap
- Blank tiles: `var(--color-surface)` at 30% opacity, no interaction, no label
- Undo button: always visible, never disabled (server RPOP is a no-op if list is empty)
- Stats tab: bottom-right icon that opens the live stats panel as a full overlay

---

### Screen 3: Action Bar — Make/Miss Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│  [FT Make ✓]  [FT Miss ✗]  │  [FG Make ✓]  [FG Miss ✗]  │  [3PT Make ✓]  [3PT Miss ✗]  │
└─────────────────────────────────────────────────────────────────────┘
```

**UX Rules:**
- Make buttons: `var(--color-make)` background (green)
- Miss buttons: `var(--color-miss)` background (slate)
- Each button minimum height: 72px on iPad (large touch target)
- Group separators between FT/FG/3PT shot types
- Clear ✓ and ✗ iconography reinforces make vs miss

---

### Screen 4: Live Stats Panel (overlay)

**Layout:**
```
┌────────────────────────────────┐
│  Live Stats              [✕]   │
│                                 │
│  [Points]  [Shooting]           │
│                                 │
│  TEAM A                         │
│  23 · Jordan      18 pts        │
│  14                8 pts        │
│  Player 3          2 pts        │
│                                 │
│  TEAM B                         │
│  7 · Marcus       12 pts        │
│  11 · Devon        8 pts        │
└────────────────────────────────┘
```

**UX Rules:**
- Slides in from right as full overlay (not a tab — avoid competing with player grid)
- Dismiss via ✕ button or tap outside
- Read-only — no interactive elements in stats view
- Shooting breakdown shows: `5/9 FG · 1/2 3PT · 1/1 FT`

---

### Screen 5: End Game Modal

```
┌──────────────────────────────────┐
│                                   │
│       End this game?              │
│                                   │
│  This will lock the event log     │
│  and generate the final report.   │
│  This cannot be undone.           │
│                                   │
│  [Cancel]       [End Game →]      │
│                                   │
└──────────────────────────────────┘
```

**UX Rules:**
- Modal background: dark scrim (50% opacity black over the game grid)
- "End Game" button: `var(--color-destructive)` (red), visually separated from Cancel
- Cancel: ghost/outline style — never red
- Centered on screen with blur backdrop

---

### Screen 6: Game Report (`/game/[gameId]`)

**Layout (mobile + desktop):**
```
┌────────────────────────────────────┐
│  StatTap                           │
│                                    │
│  TEAM A      48 – 41      TEAM B  │
│              FINAL                 │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ TEAM A BOX SCORE             │  │
│  │ Player        PTS  FG  3P FT │  │
│  │ 23 · Jordan    18  5/9 1/2 1/1│  │
│  │ 14              8  3/6 0/1 2/2│  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ TEAM B BOX SCORE             │  │
│  │ ...                          │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**UX Rules:**
- Scrolling allowed on this page (it's not the live game screen)
- Tabular numbers for stat columns (monospaced figures)
- "Game in Progress" banner shown if status = 'live'
- No edit or interactive elements — purely read-only

---

## Touch Target Standards

| Element | Min Height | Min Width | Notes |
|---|---|---|---|
| Player tile | 56px | Full column width | Adapts to player count |
| Action bar button | 72px | Equal split of bar | Large for fast tapping |
| Score header buttons (Undo, End Game) | 48px | 80px | Less critical, smaller ok |
| Setup form inputs | 44px | — | Apple HIG minimum |
| Add Player row | 44px | — | Touch-friendly |

---

## Animation Spec

| Interaction | Animation | Duration | Easing |
|---|---|---|---|
| Player tile selected | Background + border-left appear | 120ms | ease-out |
| Action bar appears | Slide up + fade in | 200ms | ease-out |
| Action bar hides | Slide down + fade out | 150ms | ease-in |
| Score updates | No animation — instant (optimistic) | 0ms | — |
| Stats panel opens | Slide in from right | 250ms | ease-out |
| Stats panel closes | Slide out to right | 180ms | ease-in |
| End Game modal | Scale + fade in from center | 200ms | ease-out |
| Blank tile | Static — no animation | — | — |

All animations respect `prefers-reduced-motion`: reduce to instant fade at 100ms.

---

## Accessibility Requirements

- All interactive elements: minimum 4px focus ring, visible in dark mode
- Player tiles: `role="button"`, `aria-label="{displayLabel}, Team {A|B}"`
- Action buttons: `aria-label` with full text ("Field Goal Make", not "+2 FG")
- Score: `aria-live="polite"` region for screen reader updates
- Blank tiles: `aria-hidden="true"`, not focusable
- Color is never the sole differentiator (make/miss also use ✓/✗ icons)
- End Game modal: focus trapped, Escape key closes

---

## Anti-Patterns to Avoid

- No emojis as icons — use Lucide React SVG icons throughout
- No hover-only states — all states must work on touch
- No animations on width/height — use transform/opacity only
- No horizontal scroll on any screen
- No modals or dialogs for normal stat recording
- No color as the only signal (always pair color with icon or label)
- No placeholder-only labels on setup form inputs
