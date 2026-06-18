'use client'

import { Check, Loader2, AlertTriangle } from 'lucide-react'
import { useGame } from '@/context/GameContext'

export function SyncIndicator() {
  const { syncStatus } = useGame()

  if (syncStatus === 'synced') {
    return (
      <div className="flex items-center gap-1 text-make/70" aria-label="Synced">
        <Check size={14} />
        <span className="font-body text-xs">Synced</span>
      </div>
    )
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1 text-muted" aria-label="Saving…">
        <Loader2 size={14} className="animate-spin" />
        <span className="font-body text-xs">Saving…</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-destructive" aria-label="Sync error">
      <AlertTriangle size={14} />
      <span className="font-body text-xs">Sync error</span>
    </div>
  )
}
