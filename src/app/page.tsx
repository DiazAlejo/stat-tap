'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
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

export default function GameSetupScreen() {
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
    <main className="min-h-dvh bg-bg p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-3">
        <Zap size={28} className="text-primary" fill="currentColor" />
        <h1 className="font-display font-bold text-3xl text-fg">StatTap</h1>
      </header>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <TeamNameInput team="A" value={teamAName} onChange={setTeamAName} />
          <TeamColorPicker team="A" value={teamAColor} onChange={setTeamAColor} />
        </div>
        <div className="flex flex-col gap-3">
          <TeamNameInput team="B" value={teamBName} onChange={setTeamBName} />
          <TeamColorPicker team="B" value={teamBColor} onChange={setTeamBColor} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <PlayerEntryList team="A" entries={playersA} onChange={setPlayersA} />
        <PlayerEntryList team="B" entries={playersB} onChange={setPlayersB} />
      </div>

      <ModeSelector value={mode} onChange={setMode} />

      {error && <p className="text-destructive font-body text-sm">{error}</p>}

      <button
        onClick={handleStart}
        disabled={!canStart || loading}
        className="bg-primary text-white font-display font-bold text-xl py-4 px-8 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] active:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed self-end"
      >
        {loading ? 'Creating game…' : 'Start Game →'}
      </button>
    </main>
  )
}
