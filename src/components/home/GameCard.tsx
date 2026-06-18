'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Zap } from 'lucide-react'
import type { GameListItem } from '@/lib/types'

interface GameCardProps {
  game: GameListItem
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const url = `${window.location.origin}/game/${game.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function handleCardClick() {
    router.push(`/game/${game.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
      className="bg-surface border border-[var(--color-border)] rounded-xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-elevated transition-colors min-h-[72px] active:scale-[0.99] active:opacity-90"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="font-display font-bold text-lg truncate" style={{ color: game.teamAColor }}>
          {game.teamAName}
        </span>
        <span className="text-muted font-body text-base shrink-0">vs</span>
        <span className="font-display font-bold text-lg truncate" style={{ color: game.teamBColor }}>
          {game.teamBName}
        </span>
        {game.status === 'live' && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full shrink-0">
            <Zap size={10} className="text-primary" fill="currentColor" />
            <span className="text-primary font-display font-bold text-xs uppercase tracking-wide">Live</span>
          </span>
        )}
      </div>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Copy share link'}
        className="shrink-0 flex items-center justify-center p-2 rounded-lg bg-surface-elevated text-muted hover:text-fg transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
      >
        {copied ? <Check size={18} className="text-make" /> : <Copy size={18} />}
      </button>
    </div>
  )
}
