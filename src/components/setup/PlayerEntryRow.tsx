import { X } from 'lucide-react'
import { resolveDisplayLabel } from '@/lib/game'

interface PlayerEntry {
  jersey: string
  name: string
  slot: number
}

interface PlayerEntryRowProps {
  entry: PlayerEntry
  onChange: (updated: PlayerEntry) => void
  onRemove: () => void
}

export function PlayerEntryRow({ entry, onChange, onRemove }: PlayerEntryRowProps) {
  const preview = resolveDisplayLabel(
    entry.jersey || null,
    entry.name || null,
    entry.slot
  )

  return (
    <div className="flex items-center gap-2 min-w-0">
      <input
        type="text"
        value={entry.jersey}
        onChange={e => onChange({ ...entry, jersey: e.target.value })}
        placeholder="#"
        maxLength={3}
        inputMode="numeric"
        className="w-14 shrink-0 bg-surface border border-[var(--color-border)] rounded-lg px-3 py-2 text-fg font-display text-lg text-center min-h-[44px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      <input
        type="text"
        value={entry.name}
        onChange={e => onChange({ ...entry, name: e.target.value })}
        placeholder="Name"
        maxLength={30}
        className="flex-1 min-w-0 bg-surface border border-[var(--color-border)] rounded-lg px-3 py-2 text-fg font-body text-base min-h-[44px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      <button
        onClick={onRemove}
        aria-label={`Remove ${preview}`}
        className="shrink-0 p-2 text-muted hover:text-destructive transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X size={18} />
      </button>
    </div>
  )
}
