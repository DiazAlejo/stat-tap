---
date: 2026-06-30
type: next-actions
project: stat-tap
impact: 4
urgency: 4
strategic: 5
tags:
  - project/stat-tap
---

# StatTap — Next Actions

Last updated: 2026-06-30. History: [[projects/stat-tap/build-log|build-log]] · scope: [[projects/stat-tap/mvp|mvp]] · origin: [[projects/stat-tap/idea|idea]]

Docs: [[projects/stat-tap/docs/prd|PRD]] · [[projects/stat-tap/docs/database_schema|database schema]] · [[projects/stat-tap/docs/implementation_plan|implementation plan]] · [[projects/stat-tap/docs/technical_requirements_document|tech requirements]] · [[projects/stat-tap/docs/ui_ux_brief|UI/UX brief]] · [[projects/stat-tap/docs/user_journey_plan|user journey]] · [[projects/stat-tap/design-system/stattap/MASTER|design system]] · [[projects/stat-tap/README|README]]

---

## This Session (Do Now)

- [ ] Open the app and audit current UI state — which screens are built and functional?
- [ ] Identify the single most broken or missing thing in the live game screen
- [ ] Fix or build that one thing before ending the session

---

## This Week

- [ ] Complete the live game screen on iPad simulator — all players visible, no scrolling, 2-tap flow working
- [ ] Implement undo button (pop last event from event stack)
- [ ] Implement end game flow: confirmation → freeze → compute final stats → generate game ID
- [ ] Create the game report route `/game/[id]` — public, read-only, shows final box score
- [ ] Test the shareable link on a real iPhone

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
