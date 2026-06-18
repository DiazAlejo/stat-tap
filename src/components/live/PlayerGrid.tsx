'use client'

import { useGame } from '@/context/GameContext'
import { TeamColumn } from './TeamColumn'

const MIN_TILE_HEIGHT = 56

export function PlayerGrid() {
  const { meta } = useGame()

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')
  const rowCount = Math.max(playersA.length, playersB.length, 1)

  // Calculate tile height from viewport — leave space for score header (~100px) and action bar (~80px)
  // We use CSS calc rather than JS to avoid reflows
  // Each tile gets equal share of the remaining height
  const tileHeight = Math.max(MIN_TILE_HEIGHT,
    typeof window !== 'undefined'
      ? Math.floor((window.innerHeight - 180) / rowCount)
      : MIN_TILE_HEIGHT
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      <TeamColumn
        team="A"
        teamName={meta.teamA.name}
        players={playersA}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />
      <div className="w-px bg-[var(--color-border)] shrink-0" />
      <TeamColumn
        team="B"
        teamName={meta.teamB.name}
        players={playersB}
        rowCount={rowCount}
        tileHeight={tileHeight}
      />
    </div>
  )
}
