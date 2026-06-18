'use client'

import { X } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { Player, PlayerStats } from '@/lib/types'

function PointsOnlyRow({ player, stats }: { player: Player; stats: PlayerStats }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
      <span className="font-display font-semibold text-base text-fg">{player.displayLabel}</span>
      <span className="font-display font-bold text-lg text-fg tabular-nums">{stats.points} pts</span>
    </div>
  )
}

function MakeMissRow({ player, stats }: { player: Player; stats: PlayerStats }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)] gap-4">
      <span className="font-display font-semibold text-sm text-fg shrink-0">{player.displayLabel}</span>
      <div className="flex items-center gap-3 text-xs font-body tabular-nums">
        <span className="text-fg font-bold">{stats.points}pts</span>
        <span className="text-muted">FG {stats.fgMakes}/{stats.fgAttempts}</span>
        <span className="text-muted">3PT {stats.threeMakes}/{stats.threeAttempts}</span>
        <span className="text-muted">FT {stats.ftMakes}/{stats.ftAttempts}</span>
      </div>
    </div>
  )
}

interface LiveStatsPanelProps {
  onClose: () => void
}

export function LiveStatsPanel({ onClose }: LiveStatsPanelProps) {
  const { meta, derived } = useGame()

  const playersA = meta.players.filter(p => p.team === 'A')
    .sort((a, b) => (derived.playerStats[b.id]?.points ?? 0) - (derived.playerStats[a.id]?.points ?? 0))
  const playersB = meta.players.filter(p => p.team === 'B')
    .sort((a, b) => (derived.playerStats[b.id]?.points ?? 0) - (derived.playerStats[a.id]?.points ?? 0))

  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR
  const isMakeMiss = meta.mode === 'make-miss'

  function renderTeam(teamLabel: string, teamColor: string, players: Player[]) {
    return (
      <div className="flex flex-col gap-1">
        <h3
          className="font-display font-bold text-xs uppercase tracking-widest mb-1"
          style={{ color: teamColor }}
        >
          {teamLabel}
        </h3>
        {players.map(player => {
          const stats = derived.playerStats[player.id]
          if (!stats) return null
          return isMakeMiss
            ? <MakeMissRow key={player.id} player={player} stats={stats} />
            : <PointsOnlyRow key={player.id} player={player} stats={stats} />
        })}
      </div>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface z-50 flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 250ms ease-out' }}
        role="complementary"
        aria-label="Live stats panel"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="font-display font-bold text-xl text-fg">Live Stats</h2>
          <button
            onClick={onClose}
            aria-label="Close stats panel"
            className="text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          {renderTeam(meta.teamA.name, teamAColor, playersA)}
          {renderTeam(meta.teamB.name, teamBColor, playersB)}
        </div>
      </div>
    </>
  )
}
