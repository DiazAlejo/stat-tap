import type { Player, PlayerStats, StatMode } from '@/lib/types'

interface BoxScoreTableProps {
  teamName: string
  team: 'A' | 'B'
  players: Player[]
  playerStats: Record<string, PlayerStats>
  mode: StatMode
}

export function BoxScoreTable({ teamName, team, players, playerStats, mode }: BoxScoreTableProps) {
  const accentColor = team === 'A' ? 'text-team-a' : 'text-team-b'
  const accentBorder = team === 'A' ? 'border-team-a' : 'border-team-b'
  const isPointsOnly = mode === 'points-only'

  const sorted = [...players].sort((a, b) => {
    const aPoints = playerStats[a.id]?.points ?? 0
    const bPoints = playerStats[b.id]?.points ?? 0
    return bPoints - aPoints
  })

  return (
    <div className={`bg-surface rounded-xl overflow-hidden border-t-4 ${accentBorder}`}>
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className={`font-display font-bold text-lg uppercase tracking-wide ${accentColor}`}>
          {teamName}
        </h2>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-4 py-2 font-body text-xs text-muted uppercase tracking-wide">Player</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">PTS</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">FG</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">3P</th>
            <th className="text-right px-3 py-2 font-body text-xs text-muted uppercase tracking-wide">FT</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(player => {
            const stats = playerStats[player.id] ?? {
              points: 0, fgMakes: 0, fgAttempts: 0,
              threeMakes: 0, threeAttempts: 0, ftMakes: 0, ftAttempts: 0,
            }
            return (
              <tr key={player.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3 font-display font-semibold text-base text-fg">{player.displayLabel}</td>
                <td className="px-3 py-3 text-right font-display font-bold text-base text-fg tabular-nums">{stats.points}</td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.fgMakes : `${stats.fgMakes}/${stats.fgAttempts}`}
                </td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.threeMakes : `${stats.threeMakes}/${stats.threeAttempts}`}
                </td>
                <td className="px-3 py-3 text-right font-body text-sm text-muted tabular-nums">
                  {isPointsOnly ? stats.ftMakes : `${stats.ftMakes}/${stats.ftAttempts}`}
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted font-body text-sm">No players</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
