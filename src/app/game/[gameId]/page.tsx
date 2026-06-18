import { redirect } from 'next/navigation'
import { getMeta, getEvents, getSnapshot } from '@/lib/kv'
import { gameReducer } from '@/lib/reducer'
import { FinalScoreHeader } from '@/components/report/FinalScoreHeader'
import { BoxScoreTable } from '@/components/report/BoxScoreTable'
import type { GameState } from '@/lib/types'

export default async function GameReportPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const meta = await getMeta(gameId)

  if (!meta) redirect('/')

  let finalState: GameState
  let isLive: boolean

  if (meta.status === 'ended') {
    const snapshot = await getSnapshot(gameId)
    if (snapshot) {
      finalState = snapshot.finalState
    } else {
      // Snapshot missing — recompute from events
      const events = await getEvents(gameId)
      finalState = gameReducer(events)
    }
    isLive = false
  } else {
    // Game still live — show current computed state
    const events = await getEvents(gameId)
    finalState = gameReducer(events)
    isLive = true
  }

  const playersA = meta.players.filter(p => p.team === 'A')
  const playersB = meta.players.filter(p => p.team === 'B')

  return (
    <main className="min-h-dvh bg-bg p-6 flex flex-col gap-8 max-w-3xl mx-auto">
      {isLive && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
          <p className="text-primary font-display font-bold text-sm uppercase tracking-wide">Game in Progress</p>
        </div>
      )}

      <FinalScoreHeader
        teamAName={meta.teamA.name}
        teamBName={meta.teamB.name}
        scoreA={finalState.scoreA}
        scoreB={finalState.scoreB}
        isLive={isLive}
      />

      <div className="flex flex-col gap-6">
        <BoxScoreTable
          teamName={meta.teamA.name}
          team="A"
          players={playersA}
          playerStats={finalState.playerStats}
        />
        <BoxScoreTable
          teamName={meta.teamB.name}
          team="B"
          players={playersB}
          playerStats={finalState.playerStats}
        />
      </div>
    </main>
  )
}
