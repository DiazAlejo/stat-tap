import type { StatMode } from '@/lib/types'

interface ModeSelectorProps {
  value: StatMode
  onChange: (mode: StatMode) => void
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-body text-muted uppercase tracking-wide">Stat Mode</label>
      <div className="grid grid-cols-2 gap-3">
        {(['points-only', 'make-miss'] as StatMode[]).map(mode => {
          const selected = value === mode
          const label = mode === 'points-only' ? 'Points Only' : 'Make & Miss'
          const description = mode === 'points-only'
            ? '+1 FT · +2 FG · +3 3PT'
            : 'Track makes and misses per shot type'
          return (
            <button
              key={mode}
              onClick={() => onChange(mode)}
              aria-pressed={selected}
              className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-150
                ${selected
                  ? 'border-primary bg-surface-elevated text-fg'
                  : 'border-[var(--color-border)] bg-surface text-muted hover:border-primary/50'
                }`}
            >
              <span className="font-display font-bold text-lg">{label}</span>
              <span className="font-body text-sm opacity-70">{description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
