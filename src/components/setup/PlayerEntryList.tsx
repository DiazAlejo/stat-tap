import { Plus } from 'lucide-react'
import { PlayerEntryRow } from './PlayerEntryRow'

interface PlayerEntry {
  jersey: string
  name: string
  slot: number
}

interface PlayerEntryListProps {
  team: 'A' | 'B'
  entries: PlayerEntry[]
  onChange: (entries: PlayerEntry[]) => void
}

export function PlayerEntryList({ team, entries, onChange }: PlayerEntryListProps) {
  const accentColor = team === 'A' ? 'text-team-a' : 'text-team-b'
  const borderColor = team === 'A' ? 'border-team-a/30' : 'border-team-b/30'

  const add = () => {
    if (entries.length >= 12) return
    onChange([...entries, { jersey: '', name: '', slot: entries.length + 1 }])
  }

  const update = (i: number, updated: PlayerEntry) => {
    const next = [...entries]
    next[i] = updated
    onChange(next)
  }

  const remove = (i: number) => {
    const next = entries
      .filter((_, idx) => idx !== i)
      .map((e, idx) => ({ ...e, slot: idx + 1 }))
    onChange(next)
  }

  return (
    <div className={`flex flex-col gap-2 border ${borderColor} rounded-xl p-4 bg-surface min-w-0`}>
      <h3 className={`font-display font-bold text-lg uppercase tracking-wide ${accentColor}`}>
        Team {team}
      </h3>
      <div className="flex flex-col gap-2">
        {entries.map((entry, i) => (
          <PlayerEntryRow
            key={i}
            entry={entry}
            onChange={updated => update(i, updated)}
            onRemove={() => remove(i)}
          />
        ))}
      </div>
      {entries.length < 12 && (
        <button
          onClick={add}
          className="flex items-center gap-2 text-muted hover:text-primary transition-colors cursor-pointer mt-1 py-2 font-body text-sm"
        >
          <Plus size={16} />
          Add Player
        </button>
      )}
      {entries.length === 0 && (
        <p className="text-muted text-sm font-body italic">No players yet — tap Add Player</p>
      )}
    </div>
  )
}
