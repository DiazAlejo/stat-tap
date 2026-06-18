'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { Player } from '@/lib/types'
import type { GameState } from '@/lib/types'

type StatsTab = 'points' | 'shooting'

function PointsRow({ player, points }: { player: Player; points: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
      <span className="font-display font-semibold text-base text-fg">{player.displayLabel}</span>
      <span className="font-display font-bold text-lg text-fg tabular-nums">{points} pts</span>
    </div>
  )
}

function ShootingRow({ player, stats }: {
  player: Player
  stats: {
    fgMakes: number
    fgAttempts: number
    threeMakes: number
    threeAttempts: number
    ftMakes: number
    ftAttempts: number
  }
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)] gap-4">
      <span className="font-display font-semibold text-sm text-fg shrink-0">{player.displayLabel}</span>
      <span className="font-body text-xs text-muted tabular-nums whitespace-nowrap">
        {stats.fgMakes}/{stats.fgAttempts} FG · {stats.threeMakes}/{stats.threeAttempts} 3P · {stats.ftMakes}/{stats.ftAttempts} FT
      </span>
    </div>
  )
}

function TeamStatsSection({ teamLabel, teamColor, players, tab, derived }: {
  teamLabel: string
  teamColor: string
  players: Player[]
  tab: StatsTab
  derived: GameState
}) {
  const sorted = [...players].sort((a, b) => {
    const aStats = derived.playerStats[a.id]
    const bStats = derived.playerStats[b.id]
    return (bStats?.points ?? 0) - (aStats?.points ?? 0)
  })

  return (
    <div className="flex flex-col gap-1">
      <h3
        className="font-display font-bold text-xs uppercase tracking-widest mb-1"
        style={{ color: teamColor }}
      >
        {teamLabel}
      </h3>
      {sorted.map(player => {
        const stats = derived.playerStats[player.id]
        if (!stats) return null
        return tab === 'points'
          ? <PointsRow key={player.id} player={player} points={stats.points} />
          : <ShootingRow key={player.id} player={player} stats={stats} />
      })}
    </div>
  )
}

interface LiveStatsPanelProps {
  onClose: () => void
}

export function LiveStatsPanel({ onClose }: LiveStatsPanelProps) {
  const { meta, derived } = useGame()
  const [tab, setTab] = useState<StatsTab>('points')

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')
  const teamAColor = meta.teamAColor ?? DEFAULT_TEAM_A_COLOR
  const teamBColor = meta.teamBColor ?? DEFAULT_TEAM_B_COLOR

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-display font-bold text-xl text-fg">Live Stats</h2>
          <button
            onClick={onClose}
            aria-label="Close stats panel"
            className="text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex gap-0 px-6 py-3 border-b border-[var(--color-border)]">
          {(['points', 'shooting'] as StatsTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`flex-1 py-2 font-display font-semibold text-sm uppercase tracking-wide cursor-pointer transition-colors
                ${tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted hover:text-fg border-b-2 border-transparent'
                }`}
            >
              {t === 'points' ? 'Points' : 'Shooting'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          <TeamStatsSection
            teamLabel={meta.teamA.name}
            teamColor={teamAColor}
            players={playersA}
            tab={tab}
            derived={derived}
          />
          <TeamStatsSection
            teamLabel={meta.teamB.name}
            teamColor={teamBColor}
            players={playersB}
            tab={tab}
            derived={derived}
          />
        </div>
      </div>
    </>
  )
}
