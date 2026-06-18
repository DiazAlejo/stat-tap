'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Copy, Check, Zap, Trash2 } from 'lucide-react'
import type { GameListItem } from '@/lib/types'

interface GameCardProps {
  game: GameListItem
  onDelete: (id: string) => void
  onRestoreGame: (game: GameListItem) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function GameCard({ game, onDelete, onRestoreGame }: GameCardProps) {
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/game/${game.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  async function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      timerRef.current = setTimeout(() => setConfirming(false), 3000)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirming(false)
    onDelete(game.id) // optimistic remove
    try {
      const res = await fetch(`/api/game/${game.id}`, { method: 'DELETE' })
      if (!res.ok) {
        onRestoreGame(game) // revert if server rejected it
      }
    } catch {
      onRestoreGame(game) // revert on network error
    }
  }

  return (
    <div className="relative bg-surface border border-[var(--color-border)] rounded-xl hover:bg-surface-elevated transition-colors active:scale-[0.99] active:opacity-90">
      {/* Clickable card body — Link is the reliable navigation primitive */}
      <Link
        href={`/game/${game.id}?from=home`}
        className="flex flex-col gap-1 min-w-0 px-5 py-4 pr-28 block"
      >
        <div className="flex items-center gap-3 min-w-0">
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
        <div className="flex items-center gap-2">
          {game.status === 'ended' && game.scoreA !== undefined && game.scoreB !== undefined && (
            <>
              <span className="font-display font-bold text-base text-fg tabular-nums">
                {game.scoreA} – {game.scoreB}
              </span>
              <span className="text-muted font-body text-sm">·</span>
            </>
          )}
          <span className="font-body text-sm text-muted">{formatDate(game.createdAt)}</span>
        </div>
      </Link>

      {/* Action buttons — absolutely positioned so they don't intercept the Link */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <button
          onClick={handleDeleteClick}
          aria-label={confirming ? 'Confirm delete' : 'Delete game'}
          className={`flex items-center justify-center rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] ${
            confirming
              ? 'bg-destructive/10 text-destructive px-2 py-3'
              : 'p-2 bg-surface-elevated text-muted hover:text-destructive'
          }`}
        >
          {confirming ? (
            <span className="font-display font-bold text-xs whitespace-nowrap">Delete?</span>
          ) : (
            <Trash2 size={18} />
          )}
        </button>
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Link copied' : 'Copy share link'}
          className="flex items-center justify-center p-2 rounded-lg bg-surface-elevated text-muted hover:text-fg transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
        >
          {copied ? <Check size={18} className="text-make" /> : <Copy size={18} />}
        </button>
      </div>
    </div>
  )
}
