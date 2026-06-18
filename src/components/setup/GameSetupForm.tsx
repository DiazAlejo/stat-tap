'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TeamNameInput } from '@/components/setup/TeamNameInput'
import { PlayerEntryList } from '@/components/setup/PlayerEntryList'
import { ModeSelector } from '@/components/setup/ModeSelector'
import { TeamColorPicker } from '@/components/setup/TeamColorPicker'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from '@/lib/game'
import type { StatMode } from '@/lib/types'

interface PlayerEntry {
  jersey: string
  name: string
  slot: number
}

interface GameSetupFormProps {
  onCancel?: () => void
}

export function GameSetupForm({ onCancel }: GameSetupFormProps) {
  const router = useRouter()
  const [teamAName, setTeamAName] = useState('')
  const [teamBName, setTeamBName] = useState('')
  const [playersA, setPlayersA] = useState<PlayerEntry[]>([])
  const [playersB, setPlayersB] = useState<PlayerEntry[]>([])
  const [mode, setMode] = useState<StatMode>('points-only')
  const [teamAColor, setTeamAColor] = useState(DEFAULT_TEAM_A_COLOR)
  const [teamBColor, setTeamBColor] = useState(DEFAULT_TEAM_B_COLOR)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPlayers = playersA.length + playersB.length
  const canStart = totalPlayers > 0

  async function handleStart() {
    if (!canStart || loading) return
    setLoading(true)
    setError(null)

    const players = [
      ...playersA.map(p => ({ ...p, team: 'A' })),
      ...playersB.map(p => ({ ...p, team: 'B' })),
    ]

    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamA: { name: teamAName || 'Team A' },
          teamB: { name: teamBName || 'Team B' },
          players,
          mode,
          teamAColor,
          teamBColor,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create game')
      router.push(`/live/${data.gameId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create game')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span
            className="font-display font-bold text-xl"
            style={{ color: teamAColor }}
          >
            {teamAName || 'Team A'}
          </span>
          <TeamNameInput team="A" value={teamAName} onChange={setTeamAName} teamColor={teamAColor} />
          <TeamColorPicker
            team="A"
            value={teamAColor}
            onChange={setTeamAColor}
            disabledColor={teamBColor}
          />
        </div>
        <div className="flex flex-col gap-3">
          <span
            className="font-display font-bold text-xl"
            style={{ color: teamBColor }}
          >
            {teamBName || 'Team B'}
          </span>
          <TeamNameInput team="B" value={teamBName} onChange={setTeamBName} teamColor={teamBColor} />
          <TeamColorPicker
            team="B"
            value={teamBColor}
            onChange={setTeamBColor}
            disabledColor={teamAColor}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <PlayerEntryList team="A" entries={playersA} onChange={setPlayersA} />
        <PlayerEntryList team="B" entries={playersB} onChange={setPlayersB} />
      </div>

      <ModeSelector value={mode} onChange={setMode} />

      {error && <p className="text-destructive font-body text-sm">{error}</p>}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-muted font-display font-semibold text-lg cursor-pointer hover:text-fg transition-colors min-h-[48px]"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || loading}
          className="bg-primary text-white font-display font-bold text-xl py-4 px-8 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] active:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating game…' : 'Start Game →'}
        </button>
      </div>
    </div>
  )
}
