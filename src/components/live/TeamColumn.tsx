import type { Player } from '@/lib/types'
import { PlayerTile } from './PlayerTile'
import { BlankTile } from './BlankTile'

interface TeamColumnProps {
  team: 'A' | 'B'
  teamName: string
  players: Player[]
  rowCount: number
  tileHeight: number
}

export function TeamColumn({ team, teamName, players, rowCount, tileHeight }: TeamColumnProps) {
  const accentColor = team === 'A' ? 'text-team-a' : 'text-team-b'
  const accentBorder = team === 'A' ? 'border-team-a' : 'border-team-b'
  const blankCount = rowCount - players.length

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className={`px-4 py-2 border-b-2 ${accentBorder} shrink-0`}>
        <span className={`font-display font-bold text-sm uppercase tracking-widest ${accentColor}`}>
          {teamName}
        </span>
      </div>
      <div className="flex flex-col flex-1">
        {players.map(player => (
          <PlayerTile key={player.id} player={player} tileHeight={tileHeight} />
        ))}
        {Array.from({ length: blankCount }).map((_, i) => (
          <BlankTile key={`blank-${i}`} tileHeight={tileHeight} />
        ))}
      </div>
    </div>
  )
}
