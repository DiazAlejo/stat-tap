---
date: 2026-07-07
type: next-actions
project: stat-tap
impact: 2
urgency: 1
strategic: 3
tags:
  - project/stat-tap
  - status/on-hold
---

# StatTap — Next Actions

**Status: ON HOLD** (2026-07-06) — company/dashboard is the active priority. No sessions until Alejo explicitly restarts. History preserved below.

Last updated: 2026-07-07. History: [[projects/stat-tap/build-log|build-log]] · scope: [[projects/stat-tap/mvp|mvp]] · origin: [[projects/stat-tap/idea|idea]]

Docs: [[projects/stat-tap/docs/prd|PRD]] · [[projects/stat-tap/docs/database_schema|database schema]] · [[projects/stat-tap/docs/implementation_plan|implementation plan]] · [[projects/stat-tap/docs/technical_requirements_document|tech requirements]] · [[projects/stat-tap/docs/ui_ux_brief|UI/UX brief]] · [[projects/stat-tap/docs/user_journey_plan|user journey]] · [[projects/stat-tap/design-system/stattap/MASTER|design system]] · [[projects/stat-tap/README|README]]

---

## This Session (Do Now)

- [ ] Implement the live game screen UI — core screen; everything else is secondary
- [ ] Implement undo button (pop last event from event stack)
- [ ] Create the game report route `/game/[id]` — public, read-only, shows final box score
- [ ] Test the shareable link on a real iPhone

---

## Suggested (Optional)

- [ ] Run all tests and verify they pass (GameContext, db, game, reducer)
- [ ] Supabase RLS: game report should be publicly readable, writeable only during active session
- [ ] Mobile layout testing on iPhone (secondary priority after iPad)
- [ ] Performance: verify stat entry feels instant (<50ms perceived latency)
- [ ] Add player count validation (max 12 per team enforced in UI)


## This Week

- [ ] Complete the live game screen on iPad simulator — all players visible, no scrolling, 2-tap flow working
- [ ] Implement undo button (pop last event from event stack)
- [ ] Implement end game flow: confirmation → freeze → compute final stats → generate game ID
- [ ] Create the game report route `/game/[id]` — public, read-only, shows final box score
- [ ] Test the shareable link on a real iPhone

---

## GitHub Backlog

- [ ] #1: Implement the live game screen UI — core screen (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/1
- [ ] #2: Implement undo button (pop last event from event stack) (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/2
- [ ] #3: Create game report route /game/[id] — public read-only box score (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/3
- [ ] #4: Test the shareable link on a real iPhone (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/4
- [ ] #5: Run all tests and verify they pass (GameContext, db, game, reducer) (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/5
- [ ] #6: Supabase RLS: game report publicly readable, writeable only during active session (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/6
- [ ] #7: Mobile layout testing on iPhone (secondary priority after iPad) (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/7
- [ ] #8: Performance: verify stat entry feels instant (<50ms perceived latency) (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/8
- [ ] #9: Add player count validation (max 12 per team enforced in UI) (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/9
- [ ] #10: Complete live game screen on iPad simulator — all players visible, 2-tap flow (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/10
- [ ] #11: Implement end game flow: confirmation → freeze → compute stats → generate game ID (labels: enhancement) — gh:https://github.com/DiazAlejo/stat-tap/issues/11
- [ ] #12: Stat tracking mode lock — verify UX for mid-game mode changes (labels: question) — gh:https://github.com/DiazAlejo/stat-tap/issues/12
- [ ] #13: Auto-save vs. manual save — decide per-event vs. game-end persistence (labels: question) — gh:https://github.com/DiazAlejo/stat-tap/issues/13
- [ ] #14: Deployment URL — decide domain/subdomain for live Vercel deployment (labels: question) — gh:https://github.com/DiazAlejo/stat-tap/issues/14

---

## Backlog

- [ ] Run all tests and verify they pass (GameContext, db, game, reducer)
- [ ] Supabase RLS: game report should be publicly readable, writeable only during active session
- [ ] Mobile layout testing on iPhone (secondary priority after iPad)
- [ ] Performance: verify stat entry feels instant (<50ms perceived latency)
- [ ] Add player count validation (max 12 per team enforced in UI)

---

## Blocked

None currently.

---

## Decisions Needed

- [ ] **Stat tracking mode lock:** Mode is chosen at game setup and fixed for the entire game. Verify this is the right UX — can a user change mode mid-game if they chose wrong?
- [ ] **Auto-save vs. manual save:** Does the game auto-save every event to Supabase, or only on game end? Auto-save is safer but adds latency per tap.
- [ ] **Deployment URL:** Which domain/subdomain for the live Vercel deployment? Needed before sharing test links.
