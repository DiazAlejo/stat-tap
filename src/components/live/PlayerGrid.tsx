'use client'

import { useGame } from '@/context/GameContext'
import { TeamColumn } from './TeamColumn'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'

const MIN_TILE_HEIGHT = 44
const CHROME_OFFSET = 300

export function PlayerGrid() {
  const { meta } = useGame()

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')

  const rowCount = Math.max(
    Math.ceil(playersA.length / 2),
    Math.ceil(playersB.length / 2),
    1
  )

  const tileHeight = Math.max(
    MIN_TILE_HEIGHT,
    typeof window !== 'undefined'
      ? Math.floor((window.innerHeight - CHROME_OFFSET) / rowCount)
      : MIN_TILE_HEIGHT
  )

  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      <TeamColumn
        team="A"
        teamName={meta.teamA.name}
        teamColor={teamAColor}
        players={playersA}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />

      <div
        className="w-1.5 shrink-0 self-stretch"
        style={{
          background: `linear-gradient(to bottom, transparent, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.2) 80%, transparent)`,
        }}
        aria-hidden="true"
      />

      <TeamColumn
        team="B"
        teamName={meta.teamB.name}
        teamColor={teamBColor}
        players={playersB}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />
    </div>
  )
}
