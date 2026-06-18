# Design System Master File — StatTap

> **LOGIC:** When building a specific page, first check `design-system/stattap/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** StatTap  
**Updated:** 2026-06-18  
**Style:** Dark Mode — Sports Dashboard  
**Primary Device:** iPad (landscape)

---

## Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background | `#0F172A` | `--color-bg` | Page background (dark navy) |
| Surface | `#1E293B` | `--color-surface` | Cards, player tiles, panels |
| Surface Elevated | `#293548` | `--color-surface-elevated` | Selected tiles, modals |
| Primary | `#F97316` | `--color-primary` | Basketball orange — CTAs, primary actions |
| On Primary | `#FFFFFF` | `--color-on-primary` | Text on orange |
| Team A | `#38BDF8` | `--color-team-a` | Sky blue — Team A column indicator |
| Team B | `#A78BFA` | `--color-team-b` | Purple — Team B column indicator |
| Make / Success | `#22C55E` | `--color-make` | FG Make, FT Make, 3PT Make buttons |
| Miss / Neutral | `#64748B` | `--color-miss` | FG Miss, FT Miss, 3PT Miss buttons |
| Score Text | `#F8FAFC` | `--color-score` | Live score numbers |
| Foreground | `#F8FAFC` | `--color-fg` | Primary text |
| Muted | `#94A3B8` | `--color-muted` | Secondary labels, placeholders |
| Destructive | `#EF4444` | `--color-destructive` | End Game button, errors |
| Border | `rgba(255,255,255,0.08)` | `--color-border` | Subtle tile borders |
| Disabled | `#1E293B` | `--color-disabled` | Blank/placeholder tiles |

**CSS Variables (globals.css):**
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
  --color-fg: #F8FAFC;
  --color-muted: #94A3B8;
  --color-destructive: #EF4444;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-disabled: #1E293B;
}
```

---

## Typography

**Pairing:** Barlow Condensed (headings/labels) + Barlow (body)  
*Purpose-built for sports and athletic interfaces. Condensed maximizes information density on player tiles.*

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap');
```

**Tailwind config:**
```js
fontFamily: {
  display: ['Barlow Condensed', 'sans-serif'],
  body:    ['Barlow', 'sans-serif'],
}
```

**Type Scale:**

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `score` | 72px | 700 | Barlow Condensed | Live score digits |
| `h1` | 32px | 700 | Barlow Condensed | Team names |
| `h2` | 24px | 600 | Barlow Condensed | Section headers |
| `player-label` | 18px | 600 | Barlow Condensed | Player tile label |
| `action-btn` | 20px | 700 | Barlow Condensed | Action bar buttons |
| `body` | 16px | 400 | Barlow | Setup form inputs |
| `caption` | 13px | 400 | Barlow | Stats breakdown labels |

---

## Spacing

Use 4/8dp base rhythm throughout.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight gaps |
| `--space-2` | `8px` | Icon gaps, inline spacing |
| `--space-4` | `16px` | Standard padding |
| `--space-6` | `24px` | Section padding |
| `--space-8` | `32px` | Large gaps |

---

## Touch Targets (iPad-first)

| Element | Min Height | Notes |
|---------|-----------|-------|
| Player tile | 56px | Adapts upward with fewer players |
| Action bar button | 72px | Large — tapped during gameplay |
| Header buttons (Undo, End Game) | 48px | Less critical |
| Setup form inputs | 44px | Apple HIG minimum |

---

## Component Specs

### Player Tile
```css
.player-tile {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-fg);
  cursor: pointer;
  min-height: 56px;
  transition: background 120ms ease-out, border-left 120ms ease-out;
}

.player-tile--selected {
  background: var(--color-surface-elevated);
  border-left: 4px solid var(--color-team-a); /* or team-b */
}

.player-tile--blank {
  background: var(--color-disabled);
  opacity: 0.3;
  cursor: default;
  pointer-events: none;
}
```

### Action Button — Make
```css
.action-btn-make {
  background: var(--color-make);
  color: white;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 20px;
  font-weight: 700;
  min-height: 72px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 150ms ease;
}
.action-btn-make:active { opacity: 0.85; }
```

### Action Button — Miss
```css
.action-btn-miss {
  background: var(--color-miss);
  color: white;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 20px;
  font-weight: 700;
  min-height: 72px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 150ms ease;
}
.action-btn-miss:active { opacity: 0.85; }
```

### Primary Button (CTA)
```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: 14px 28px;
  border-radius: 10px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 150ms ease, transform 150ms ease;
}
.btn-primary:active { opacity: 0.85; transform: scale(0.98); }
```

### Destructive Button
```css
.btn-destructive {
  background: var(--color-destructive);
  color: white;
  padding: 14px 28px;
  border-radius: 10px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 150ms ease;
}
```

### Score Display
```css
.score {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 72px;
  font-weight: 700;
  color: var(--color-score);
  line-height: 1;
  letter-spacing: -0.02em;
}
```

### Inputs
```css
.input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: var(--color-fg);
  min-height: 44px;
  transition: border-color 200ms ease;
}
.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
}
```

---

## Animation Spec

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Player tile selected | bg + border-left appear | 120ms | ease-out |
| Action bar appears | slide up + fade in | 200ms | ease-out |
| Action bar hides | slide down + fade out | 150ms | ease-in |
| Score updates | instant | 0ms | — |
| Stats panel opens | slide in from right | 250ms | ease-out |
| Stats panel closes | slide out to right | 180ms | ease-in |
| End Game modal | scale + fade from center | 200ms | ease-out |

All animations must be disabled/reduced to 100ms fade when `prefers-reduced-motion: reduce`.

---

## Anti-Patterns (NEVER DO)

- ❌ No emojis as icons — use Lucide React SVG only
- ❌ No hover-only states — all interactions must work on touch
- ❌ No animations on width/height — use transform/opacity only
- ❌ No horizontal scroll on any screen
- ❌ No modals for normal stat recording (only undo/end game)
- ❌ No color as sole differentiator — always pair with icon or label
- ❌ No placeholder-only labels on form inputs
- ❌ No scrolling in live game screen

---

## Pre-Delivery Checklist

- [ ] All touch targets ≥ 56px height (player tiles), ≥ 72px (action buttons)
- [ ] No emojis — SVG icons from Lucide React
- [ ] `cursor-pointer` on all clickable elements
- [ ] Active/pressed state on every interactive element
- [ ] Focus rings visible (4px, `--color-primary`)
- [ ] `prefers-reduced-motion` respected
- [ ] No scrolling in live game screen verified on iPad 1024×768
- [ ] Score readable at 72px Barlow Condensed 700
- [ ] Color never sole differentiator (make/miss have ✓/✗ icons too)
- [ ] Dark background `#0F172A` throughout
