import type { Player } from '@/lib/types'
import { PlayerTile } from './PlayerTile'
import { BlankTile } from './BlankTile'

interface TeamColumnProps {
  teamName: string
  teamColor: string
  players: Player[]
  rowCount: number
  tileHeight: number
}

export function TeamColumn({ teamName, teamColor, players, rowCount, tileHeight }: TeamColumnProps) {
  const mid = Math.ceil(players.length / 2)
  const leftPlayers = players.slice(0, mid)
  const rightPlayers = players.slice(mid)

  const leftBlanks = rowCount - leftPlayers.length
  const rightBlanks = rowCount - rightPlayers.length

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="px-2 py-2 border-b-2 shrink-0" style={{ borderBottomColor: teamColor }}>
        <span
          className="font-display font-bold text-sm uppercase tracking-widest"
          style={{ color: teamColor }}
        >
          {teamName}
        </span>
      </div>
      <div className="flex flex-1">
        {/* Left sub-column */}
        <div className="flex flex-col flex-1">
          {leftPlayers.map(player => (
            <PlayerTile key={player.id} player={player} tileHeight={tileHeight} teamColor={teamColor} />
          ))}
          {Array.from({ length: leftBlanks }).map((_, i) => (
            <BlankTile key={`blank-L-${i}`} tileHeight={tileHeight} />
          ))}
        </div>
        <div className="w-px bg-[var(--color-border)] shrink-0" />
        {/* Right sub-column */}
        <div className="flex flex-col flex-1">
          {rightPlayers.map(player => (
            <PlayerTile key={player.id} player={player} tileHeight={tileHeight} teamColor={teamColor} />
          ))}
          {Array.from({ length: rightBlanks }).map((_, i) => (
            <BlankTile key={`blank-R-${i}`} tileHeight={tileHeight} />
          ))}
        </div>
      </div>
    </div>
  )
}
