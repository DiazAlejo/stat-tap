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
