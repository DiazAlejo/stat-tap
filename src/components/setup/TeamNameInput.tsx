interface TeamNameInputProps {
  team: 'A' | 'B'
  value: string
  onChange: (val: string) => void
}

export function TeamNameInput({ team, value, onChange }: TeamNameInputProps) {
  const accentClass = team === 'A'
    ? 'border-team-a focus:border-team-a focus:ring-team-a/20'
    : 'border-team-b focus:border-team-b focus:ring-team-b/20'
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
        className={`bg-surface border ${accentClass} rounded-lg px-4 py-3 text-fg font-display text-xl min-h-[44px] focus:outline-none focus:ring-2 transition-colors duration-200`}
      />
    </div>
  )
}
