'use client'

import { useGame } from '@/context/GameContext'
import type { Player, Team } from '@/lib/types'

interface PlayerTileProps {
  player: Player
  team: Team
  tileHeight: number
  teamColor: string
}

export function PlayerTile({ player, team, tileHeight, teamColor }: PlayerTileProps) {
  const { selectedPlayerId, dispatch } = useGame()
  const isSelected = selectedPlayerId === player.id

  function handleClick() {
    dispatch({ type: 'SET_SELECTED', playerId: player.id })
  }

  const accentBorder = team === 'A'
    ? { borderLeftWidth: isSelected ? 4 : 3, borderLeftColor: teamColor }
    : { borderRightWidth: isSelected ? 4 : 3, borderRightColor: teamColor }

  return (
    <button
      aria-pressed={isSelected}
      aria-label={`${player.displayLabel}, Team ${player.team}`}
      onClick={handleClick}
      style={{
        height: `${tileHeight}px`,
        backgroundColor: isSelected
          ? `color-mix(in srgb, ${teamColor} 28%, var(--color-surface-elevated))`
          : `color-mix(in srgb, ${teamColor} 12%, var(--color-surface))`,
        borderColor: `color-mix(in srgb, ${teamColor} 40%, var(--color-border))`,
        boxShadow: isSelected ? `0 0 0 2px color-mix(in srgb, ${teamColor} 70%, transparent)` : undefined,
        ...accentBorder,
      }}
      className="
        w-full flex items-center justify-center px-2
        font-display font-semibold text-sm sm:text-base text-fg
        border rounded-md
        cursor-pointer select-none
        transition-all duration-[120ms] ease-out
        hover:brightness-110
      "
    >
      <span className="truncate">{player.displayLabel}</span>
    </button>
  )
}
