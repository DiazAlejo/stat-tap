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

/** Total field goals (2PT + 3PT only; free throws excluded). */
export function totalFgMakes(stats: PlayerStats): number {
  return stats.fgMakes + stats.threeMakes
}

export function totalFgAttempts(stats: PlayerStats): number {
  return stats.fgAttempts + stats.threeAttempts
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
] as const
