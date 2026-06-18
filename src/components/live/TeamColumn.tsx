import type { Player } from '@/lib/types'
import { PlayerTile } from './PlayerTile'
import { BlankTile } from './BlankTile'

interface TeamColumnProps {
  team: 'A' | 'B'
  teamName: string
  teamColor: string
  players: Player[]
  rowCount: number
  tileHeight: number
}

export function TeamColumn({ team, teamName, teamColor, players, rowCount, tileHeight }: TeamColumnProps) {
  const blankCount = rowCount - players.length

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="px-4 py-2 border-b-2 shrink-0" style={{ borderBottomColor: teamColor }}>
        <span
          className="font-display font-bold text-sm uppercase tracking-widest"
          style={{ color: teamColor }}
        >
          {teamName}
        </span>
      </div>
      <div className="flex flex-col flex-1">
        {players.map(player => (
          <PlayerTile key={player.id} player={player} tileHeight={tileHeight} teamColor={teamColor} />
        ))}
        {Array.from({ length: blankCount }).map((_, i) => (
          <BlankTile key={`blank-${i}`} tileHeight={tileHeight} />
        ))}
      </div>
    </div>
  )
}
