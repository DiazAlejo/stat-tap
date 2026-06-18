export type Team = 'A' | 'B'

export type ActionType =
  | 'FG_MAKE'
  | 'FG_MISS'
  | '3PT_MAKE'
  | '3PT_MISS'
  | 'FT_MAKE'
  | 'FT_MISS'

export type StatMode = 'points-only' | 'make-miss'

export type GameStatus = 'live' | 'ended'

export interface Player {
  id: string
  team: Team
  jersey: string | null
  name: string | null
  displayLabel: string
  slot: number
}

export interface GameMeta {
  id: string
  teamA: { name: string }
  teamB: { name: string }
  players: Player[]
  mode: StatMode
  status: GameStatus
  createdAt: number
  teamAColor?: string
  teamBColor?: string
  scoreA?: number
  scoreB?: number
}

export interface GameEvent {
  id: string
  playerId: string
  team: Team
  actionType: ActionType
  points: number
  timestamp: number
}

export interface PlayerStats {
  points: number
  fgMakes: number
  fgAttempts: number
  threeMakes: number
  threeAttempts: number
  ftMakes: number
  ftAttempts: number
}

export interface GameState {
  scoreA: number
  scoreB: number
  playerStats: Record<string, PlayerStats>
}

export interface GameSnapshot {
  meta: GameMeta
  events: GameEvent[]
  finalState: GameState
  endedAt: number
}

export interface GameListItem {
  id: string
  teamAName: string
  teamBName: string
  teamAColor: string
  teamBColor: string
  status: GameStatus
  createdAt: number
  scoreA?: number
  scoreB?: number
}
