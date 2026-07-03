# StatTap — Idea

## The Problem

Pickup basketball is played by millions of people daily with no reliable stat tracking. Existing solutions fail:
- Full sports apps (HomeCourt, StatKeeper) require accounts, rosters, league setup — too complex for a pickup game
- Paper and mental tracking — nothing shareable, nothing permanent
- Generic note-taking — no structure, no final stats, no link to share

The gap: there is no tool that a single person on the sideline can use to track a full pickup game in real-time with zero friction, zero setup, and a shareable link at the end.

---

## Who Has This Problem

Competitive pickup basketball players who want accountability stats. The stat keeper is one person on the sideline — usually the person sitting out — holding an iPad or phone. They need to track events (made shots, missed shots, free throws) in real time without missing gameplay.

The players want to see their stats after the game. Spectators or players not present want to follow along.

Alejo plays basketball. He is this user.

---

## Why Now

Pickup basketball culture has gotten more competitive. Players track everything — their workouts, their nutrition — but not their game stats, because no tool makes it easy enough. An iPad + a clean web app is all that's needed.

---

## The Solution

StatTap: a web app optimized for iPad that lets one person track a full pickup basketball game in real time using only two taps per stat. Setup takes 30 seconds (team names, player names). The game runs with zero friction. When the game ends, a shareable link is generated with the final box score — viewable by anyone on any device.

**Core promise:** Two taps → instant stat → zero friction.

---

## Why This Over Other Ideas

Alejo plays basketball. He knows this problem intimately. The domain knowledge — what stats matter in pickup, what the sideline experience is like, what the right touch target size is on an iPad — comes naturally. The technical scope is well-defined. The MVP is achievable alone.

---

## Risks

1. **Session volatility:** Pickup games are informal. If the stat keeper's device dies or they leave mid-game, data is lost.
2. **Narrow initial use:** Works best with organized pickup games, not every casual game.
3. **No recurring revenue path obvious in v1:** Stat-tap v1 is free to use. Monetization would require v2 features (seasons, team history, analytics).

---

## Connection to Alejo's Goals

- Builds Next.js + Supabase skills in a real production context
- If it reaches 100+ real games tracked, the data becomes a moat for analytics features
- Portfolio-quality project: demonstrates problem-solving, product thinking, and technical execution
- Natural evolution into basketball analytics / ML (see `skills/ml-sports-analytics.md`)
