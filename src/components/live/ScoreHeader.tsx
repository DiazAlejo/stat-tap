'use client'

import { RotateCcw, X } from 'lucide-react'

interface ScoreHeaderProps {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  teamAColor: string
  teamBColor: string
  onUndo: () => void
  onEndGameClick: () => void
}

export function ScoreHeader({
  teamAName, teamBName, scoreA, scoreB,
  teamAColor, teamBColor,
  onUndo, onEndGameClick,
}: ScoreHeaderProps) {
  return (
    <header className="shrink-0 bg-surface border-b-2 border-[var(--color-border)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
        <button
          onClick={onUndo}
          aria-label="Undo last event"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated text-muted hover:text-fg transition-colors duration-150 cursor-pointer active:opacity-85 active:scale-[0.98] min-h-[44px]"
        >
          <RotateCcw size={16} />
          <span className="font-display font-semibold text-xs uppercase tracking-wide">Undo</span>
        </button>

        <button
          onClick={onEndGameClick}
          aria-label="End game"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-150 cursor-pointer active:opacity-85 active:scale-[0.98] min-h-[44px]"
        >
          <X size={16} />
          <span className="font-display font-semibold text-xs uppercase tracking-wide">End Game</span>
        </button>
      </div>

      <div
        className="flex items-center justify-center gap-4 sm:gap-8 px-4 py-3 sm:py-4"
        aria-live="polite"
        aria-label={`Score: ${teamAName} ${scoreA}, ${teamBName} ${scoreB}`}
      >
        <div className="flex flex-col items-center min-w-0 flex-1">
          <span
            className="font-display font-bold text-xs sm:text-sm uppercase tracking-widest truncate max-w-full mb-1"
            style={{ color: teamAColor }}
          >
            {teamAName}
          </span>
          <span
            className="font-display font-bold text-[5.5rem] sm:text-[7rem] leading-none tabular-nums"
            style={{ color: teamAColor }}
          >
            {scoreA}
          </span>
        </div>

        <span className="font-display font-bold text-3xl sm:text-5xl text-muted/60 shrink-0 pb-2">–</span>

        <div className="flex flex-col items-center min-w-0 flex-1">
          <span
            className="font-display font-bold text-xs sm:text-sm uppercase tracking-widest truncate max-w-full mb-1"
            style={{ color: teamBColor }}
          >
            {teamBName}
          </span>
          <span
            className="font-display font-bold text-[5.5rem] sm:text-[7rem] leading-none tabular-nums"
            style={{ color: teamBColor }}
          >
            {scoreB}
          </span>
        </div>
      </div>
    </header>
  )
}
