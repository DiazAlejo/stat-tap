interface TeamNameInputProps {
  team: 'A' | 'B'
  value: string
  onChange: (val: string) => void
  teamColor: string
}

export function TeamNameInput({ team, value, onChange, teamColor }: TeamNameInputProps) {
  const label = team === 'A' ? 'Team A' : 'Team B'
  const placeholder = team === 'A' ? 'Team A' : 'Team B'

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-body text-muted uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={20}
        style={{ color: teamColor }}
        className="bg-surface border border-[var(--color-border)] rounded-lg px-4 py-3 font-display text-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200"
      />
    </div>
  )
}
