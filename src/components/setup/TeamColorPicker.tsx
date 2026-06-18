import { TEAM_COLORS } from '@/lib/game'

interface TeamColorPickerProps {
  team: 'A' | 'B'
  value: string
  onChange: (color: string) => void
}

export function TeamColorPicker({ team, value, onChange }: TeamColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-body text-muted uppercase tracking-wide">Team {team} Color</label>
      <div className="flex gap-2 flex-wrap">
        {TEAM_COLORS.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Select color ${color} for Team ${team}`}
            aria-pressed={value === color}
            style={{ backgroundColor: color }}
            className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-150 ${
              value === color
                ? 'ring-2 ring-offset-2 ring-offset-bg ring-white scale-110'
                : 'hover:scale-105 active:scale-95'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
