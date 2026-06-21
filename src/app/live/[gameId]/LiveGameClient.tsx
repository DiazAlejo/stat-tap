'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2 } from 'lucide-react'
import { GameProvider, useGame } from '@/context/GameContext'
import { ScoreHeader } from '@/components/live/ScoreHeader'
import { PlayerGrid } from '@/components/live/PlayerGrid'
import { ActionBar } from '@/components/live/ActionBar'
import { SyncIndicator } from '@/components/ui/SyncIndicator'
import { EndGameModal } from '@/components/live/EndGameModal'
import { LiveStatsPanel } from '@/components/live/LiveStatsPanel'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { GameMeta, GameEvent } from '@/lib/types'

function LiveGameInner() {
  const { meta, derived, dispatch } = useGame()
  const [showEndGameModal, setShowEndGameModal] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(false)
  const [endGameLoading, setEndGameLoading] = useState(false)
  const router = useRouter()

  function handleUndo() {
    dispatch({ type: 'UNDO' })
    fetch(`/api/game/${meta.id}/undo`, { method: 'POST' }).catch(() => {})
  }

  async function handleEndGame() {
    setEndGameLoading(true)
    try {
      const res = await fetch(`/api/game/${meta.id}/end`, { method: 'POST' })
      if (res.ok) {
        router.push(`/game/${meta.id}?from=logger`)
      } else {
        setEndGameLoading(false)
        setShowEndGameModal(false)
      }
    } catch {
      setEndGameLoading(false)
      setShowEndGameModal(false)
    }
  }

  return (
    <div className="h-dvh bg-bg flex flex-col overflow-hidden">
      <ScoreHeader
        teamAName={meta.teamA.name}
        teamBName={meta.teamB.name}
        scoreA={derived.scoreA}
        scoreB={derived.scoreB}
        teamAColor={meta.teamAColor ?? DEFAULT_TEAM_A_COLOR}
        teamBColor={meta.teamBColor ?? DEFAULT_TEAM_B_COLOR}
        onUndo={handleUndo}
        onEndGameClick={() => setShowEndGameModal(true)}
      />
      <div className="absolute top-2 right-4 z-10">
        <SyncIndicator />
      </div>
      <PlayerGrid />
      <ActionBar />

      {/* Stats toggle button */}
      <button
        onClick={() => setShowStatsPanel(true)}
        aria-label="Open live stats"
        className="fixed bottom-[108px] right-4 z-30 bg-surface-elevated border border-[var(--color-border)] rounded-full p-3 cursor-pointer text-muted hover:text-primary transition-colors shadow-lg"
      >
        <BarChart2 size={22} />
      </button>

      {showEndGameModal && (
        <EndGameModal
          onClose={() => setShowEndGameModal(false)}
          onConfirm={handleEndGame}
          isLoading={endGameLoading}
        />
      )}
      {showStatsPanel && (
        <LiveStatsPanel onClose={() => setShowStatsPanel(false)} />
      )}
    </div>
  )
}

export function LiveGameClient({ meta, initialEvents }: { meta: GameMeta; initialEvents: GameEvent[] }) {
  return (
    <GameProvider meta={meta} initialEvents={initialEvents}>
      <LiveGameInner />
    </GameProvider>
  )
}
