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
  }

  await setMeta(gameId, meta)
  return NextResponse.json({ gameId })
}
