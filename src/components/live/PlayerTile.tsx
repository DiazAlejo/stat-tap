'use client'

import { useGame } from '@/context/GameContext'
import type { Player } from '@/lib/types'

interface PlayerTileProps {
  player: Player
  tileHeight: number
  teamColor: string
}

export function PlayerTile({ player, tileHeight, teamColor }: PlayerTileProps) {
  const { selectedPlayerId, dispatch } = useGame()
  const isSelected = selectedPlayerId === player.id

  function handleClick() {
    dispatch({ type: 'SET_SELECTED', playerId: player.id })
  }

  return (
    <button
      aria-pressed={isSelected}
      aria-label={`${player.displayLabel}, Team ${player.team}`}
      onClick={handleClick}
      style={{
        height: `${tileHeight}px`,
        ...(isSelected ? { borderLeftColor: teamColor } : {}),
      }}
      className={`
        w-full flex items-center justify-center px-4
        font-display font-semibold text-lg text-fg
        border border-[var(--color-border)]
        cursor-pointer select-none
        transition-all duration-[120ms] ease-out
        ${isSelected
          ? 'bg-surface-elevated border-l-4'
          : 'bg-surface hover:bg-surface-elevated/50'
        }
      `}
    >
      {player.displayLabel}
    </button>
  )
}
