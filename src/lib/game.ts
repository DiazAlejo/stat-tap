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
