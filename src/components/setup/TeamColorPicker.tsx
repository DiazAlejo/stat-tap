import { TEAM_COLORS } from '@/lib/game'

interface TeamColorPickerProps {
  team: 'A' | 'B'
  value: string
  onChange: (color: string) => void
  disabledColor?: string
}

export function TeamColorPicker({ team, value, onChange, disabledColor }: TeamColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-body text-muted uppercase tracking-wide">Team {team} Color</label>
      <div className="flex gap-2 flex-wrap">
        {TEAM_COLORS.map(color => {
          const isSelected = value === color
          const isDisabled = disabledColor === color && !isSelected
          return (
            <button
              key={color}
              type="button"
              onClick={() => !isDisabled && onChange(color)}
              aria-label={`Select color ${color} for Team ${team}${isDisabled ? ' (used by other team)' : ''}`}
              aria-pressed={isSelected}
              disabled={isDisabled}
              className={`w-11 h-11 rounded-full transition-all duration-150 ${
                isSelected
                  ? 'outline outline-2 outline-offset-2 outline-white scale-110 cursor-pointer'
                  : isDisabled
                  ? 'opacity-25 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95 cursor-pointer'
              }`}
              style={{ backgroundColor: color }}
            />
          )
        })}
      </div>
    </div>
  )
}
