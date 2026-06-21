import type { Player, Team } from '@/lib/types'
import { PlayerTile } from './PlayerTile'
import { BlankTile } from './BlankTile'

interface TeamColumnProps {
  team: Team
  teamName: string
  teamColor: string
  players: Player[]
  rowCount: number
  tileHeight: number
}

export function TeamColumn({ team, teamName, teamColor, players, rowCount, tileHeight }: TeamColumnProps) {
  const mid = Math.ceil(players.length / 2)
  const leftPlayers = players.slice(0, mid)
  const rightPlayers = players.slice(mid)

  const leftBlanks = rowCount - leftPlayers.length
  const rightBlanks = rowCount - rightPlayers.length

  return (
    <div
      className="flex flex-col flex-1 min-w-0"
      style={{ backgroundColor: `color-mix(in srgb, ${teamColor} 10%, var(--color-bg))` }}
    >
      <div
        className="px-3 py-2 shrink-0 border-b-2"
        style={{
          borderBottomColor: teamColor,
          backgroundColor: `color-mix(in srgb, ${teamColor} 18%, var(--color-surface))`,
        }}
      >
        <span
          className="font-display font-bold text-sm uppercase tracking-widest"
          style={{ color: teamColor }}
        >
          {teamName}
        </span>
      </div>

      <div className="flex flex-1 min-h-0 p-1 gap-1">
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          {leftPlayers.map(player => (
            <PlayerTile key={player.id} player={player} team={team} tileHeight={tileHeight} teamColor={teamColor} />
          ))}
          {Array.from({ length: leftBlanks }).map((_, i) => (
            <BlankTile key={`blank-L-${i}`} tileHeight={tileHeight} teamColor={teamColor} />
          ))}
        </div>

        <div className="w-px shrink-0 self-stretch opacity-20" style={{ backgroundColor: teamColor }} />

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          {rightPlayers.map(player => (
            <PlayerTile key={player.id} player={player} team={team} tileHeight={tileHeight} teamColor={teamColor} />
          ))}
          {Array.from({ length: rightBlanks }).map((_, i) => (
            <BlankTile key={`blank-R-${i}`} tileHeight={tileHeight} teamColor={teamColor} />
          ))}
        </div>
      </div>
    </div>
  )
}
