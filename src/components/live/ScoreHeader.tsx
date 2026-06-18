'use client'

import { RotateCcw, X } from 'lucide-react'

interface ScoreHeaderProps {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  onUndo: () => void
  onEndGameClick: () => void
}

export function ScoreHeader({ teamAName, teamBName, scoreA, scoreB, onUndo, onEndGameClick }: ScoreHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-[var(--color-border)] shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onUndo}
          aria-label="Undo last event"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated text-muted hover:text-fg transition-colors duration-150 cursor-pointer active:opacity-85 active:scale-[0.98] min-h-[48px]"
        >
          <RotateCcw size={18} />
          <span className="font-display font-semibold text-sm uppercase tracking-wide">Undo</span>
        </button>
      </div>

      <div className="flex items-center gap-6" aria-live="polite" aria-label={`Score: ${teamAName} ${scoreA}, ${teamBName} ${scoreB}`}>
        <div className="flex flex-col items-end">
          <span className="font-display font-bold text-sm uppercase tracking-widest text-team-a">{teamAName}</span>
          <span className="font-display font-bold text-[72px] leading-none text-score tabular-nums">{scoreA}</span>
        </div>
        <span className="font-display font-bold text-4xl text-muted">–</span>
        <div className="flex flex-col items-start">
          <span className="font-display font-bold text-sm uppercase tracking-widest text-team-b">{teamBName}</span>
          <span className="font-display font-bold text-[72px] leading-none text-score tabular-nums">{scoreB}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onEndGameClick}
          aria-label="End game"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-150 cursor-pointer active:opacity-85 active:scale-[0.98] min-h-[48px]"
        >
          <X size={18} />
          <span className="font-display font-semibold text-sm uppercase tracking-wide">End Game</span>
        </button>
      </div>
    </header>
  )
}
