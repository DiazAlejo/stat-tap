'use client'

import { Check, X } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { ActionType, GameEvent } from '@/lib/types'

const POINTS_ONLY_ACTIONS: { label: string; actionType: ActionType; points: number }[] = [
  { label: '+1 FT', actionType: 'FT_MAKE', points: 1 },
  { label: '+2 2PT', actionType: 'FG_MAKE', points: 2 },
  { label: '+3 3PT', actionType: '3PT_MAKE', points: 3 },
]

const MAKE_MISS_ACTIONS: { label: string; actionType: ActionType; points: number; isMake: boolean }[] = [
  { label: 'FT Make', actionType: 'FT_MAKE', points: 1, isMake: true },
  { label: 'FT Miss', actionType: 'FT_MISS', points: 0, isMake: false },
  { label: '2PT Make', actionType: 'FG_MAKE', points: 2, isMake: true },
  { label: '2PT Miss', actionType: 'FG_MISS', points: 0, isMake: false },
  { label: '3PT Make', actionType: '3PT_MAKE', points: 3, isMake: true },
  { label: '3PT Miss', actionType: '3PT_MISS', points: 0, isMake: false },
]

export function ActionBar() {
  const { meta, selectedPlayerId, dispatch } = useGame()

  const hasPlayer = selectedPlayerId !== null
  const selectedPlayer = meta.players.find(p => p.id === selectedPlayerId)
  const selectedTeamColor = selectedPlayer?.team === 'B'
    ? (meta.teamBColor ?? DEFAULT_TEAM_B_COLOR)
    : (meta.teamAColor ?? DEFAULT_TEAM_A_COLOR)

  function handleAction(actionType: ActionType, points: number) {
    if (!selectedPlayer) return

    const event: GameEvent = {
      id: crypto.randomUUID(),
      playerId: selectedPlayer.id,
      team: selectedPlayer.team,
      actionType,
      points,
      timestamp: Date.now(),
    }

    dispatch({ type: 'ADD_EVENT', event })
    dispatch({ type: 'SET_SYNC', status: 'syncing' })

    fetch(`/api/game/${meta.id}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
      .then(res => {
        if (res.ok) {
          dispatch({ type: 'SET_SYNC', status: 'synced' })
        } else {
          dispatch({ type: 'UNDO' })
          dispatch({ type: 'SET_SYNC', status: 'error' })
        }
      })
      .catch(() => {
        dispatch({ type: 'UNDO' })
        dispatch({ type: 'SET_SYNC', status: 'error' })
      })
  }

  const isPointsOnly = meta.mode === 'points-only'

  return (
    <div className="shrink-0 bg-surface-elevated border-t-2 border-[var(--color-border)]">
      <div className="px-4 py-1.5 text-center border-b border-[var(--color-border)]">
        {selectedPlayer ? (
          <span
            className="font-display font-semibold text-xs uppercase tracking-wide"
            style={{ color: selectedTeamColor }}
          >
            {selectedPlayer.displayLabel}
          </span>
        ) : (
          <span className="font-display font-semibold text-xs text-muted uppercase tracking-wide">
            Select a player
          </span>
        )}
      </div>

      <div className="flex gap-1 p-1">
        {isPointsOnly
          ? POINTS_ONLY_ACTIONS.map(action => (
              <button
                key={action.actionType}
                disabled={!hasPlayer}
                onClick={() => handleAction(action.actionType, action.points)}
                aria-label={`${action.label} for ${selectedPlayer?.displayLabel ?? 'selected player'}`}
                className="flex-1 min-h-[96px] bg-primary text-white font-display font-bold text-2xl sm:text-3xl rounded-lg cursor-pointer active:opacity-85 active:scale-[0.98] transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {action.label}
              </button>
            ))
          : MAKE_MISS_ACTIONS.map(action => (
              <button
                key={action.actionType}
                disabled={!hasPlayer}
                onClick={() => handleAction(action.actionType, action.points)}
                aria-label={`${action.label} for ${selectedPlayer?.displayLabel ?? 'selected player'}`}
                className={`flex-1 min-h-[88px] font-display font-bold text-base sm:text-lg text-white rounded-lg cursor-pointer active:opacity-85 active:scale-[0.98] transition-all duration-150 flex flex-col items-center justify-center gap-0.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 ${
                  action.isMake ? 'bg-make' : 'bg-miss'
                }`}
              >
                {action.isMake ? <Check size={18} /> : <X size={18} />}
                {action.label}
              </button>
            ))
        }
      </div>
    </div>
  )
}
