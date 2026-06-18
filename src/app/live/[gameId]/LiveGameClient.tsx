'use client'

import { useState } from 'react'
import { GameProvider, useGame } from '@/context/GameContext'
import { ScoreHeader } from '@/components/live/ScoreHeader'
import { PlayerGrid } from '@/components/live/PlayerGrid'
import { ActionBar } from '@/components/live/ActionBar'
import { SyncIndicator } from '@/components/ui/SyncIndicator'
import type { GameMeta, GameEvent } from '@/lib/types'

function LiveGameInner() {
  const { meta, derived, dispatch } = useGame()
  const [showEndGameModal, setShowEndGameModal] = useState(false)

  function handleUndo() {
    dispatch({ type: 'UNDO' })
    fetch(`/api/game/${meta.id}/undo`, { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <ScoreHeader
        teamAName={meta.teamA.name}
        teamBName={meta.teamB.name}
        scoreA={derived.scoreA}
        scoreB={derived.scoreB}
        onUndo={handleUndo}
        onEndGameClick={() => setShowEndGameModal(true)}
      />
      <div className="absolute top-3 right-[180px] z-10">
        <SyncIndicator />
      </div>
      <PlayerGrid />
      <ActionBar />
      {showEndGameModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-display font-bold text-2xl text-fg">End this game?</h2>
              <p className="font-body text-muted text-sm">This will lock the event log and generate the final report. This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndGameModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] text-muted font-display font-semibold cursor-pointer hover:text-fg transition-colors active:opacity-85"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowEndGameModal(false)
                  const res = await fetch(`/api/game/${meta.id}/end`, { method: 'POST' })
                  if (res.ok) window.location.href = `/game/${meta.id}`
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-destructive text-white font-display font-bold cursor-pointer active:opacity-85 active:scale-[0.98] transition-all"
              >
                End Game &rarr;
              </button>
            </div>
          </div>
        </div>
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
