'use client'

import { useGame } from '@/context/GameContext'
import { TeamColumn } from './TeamColumn'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'

const MIN_TILE_HEIGHT = 56

export function PlayerGrid() {
  const { meta } = useGame()

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')

  // Each team is split into 2 sub-columns, so effective row count is half the player count
  const rowCount = Math.max(
    Math.ceil(playersA.length / 2),
    Math.ceil(playersB.length / 2),
    1
  )

  const tileHeight = Math.max(
    MIN_TILE_HEIGHT,
    typeof window !== 'undefined'
      ? Math.floor((window.innerHeight - 200) / rowCount)
      : MIN_TILE_HEIGHT
  )

  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR

  return (
    <div className="flex flex-1 overflow-hidden">
      <TeamColumn
        teamName={meta.teamA.name}
        teamColor={teamAColor}
        players={playersA}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />
      <div className="w-px bg-[var(--color-border)] shrink-0" />
      <TeamColumn
        teamName={meta.teamB.name}
        teamColor={teamBColor}
        players={playersB}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />
    </div>
  )
}
