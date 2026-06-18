import { NextRequest, NextResponse } from 'next/server'
import { getMeta, setMeta, getEvents, setSnapshot } from '@/lib/db'
import { gameReducer } from '@/lib/reducer'
import type { GameSnapshot } from '@/lib/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const meta = await getMeta(id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (meta.status === 'ended') return NextResponse.json({ error: 'Already ended' }, { status: 409 })

  const events = await getEvents(id)
  const finalState = gameReducer(events)

  const endedMeta = { ...meta, status: 'ended' as const }
  const snapshot: GameSnapshot = {
    meta: endedMeta,
    events,
    finalState,
    endedAt: Date.now(),
  }

  await setMeta(id, endedMeta)
  await setSnapshot(id, snapshot)

  return NextResponse.json({ snapshot })
}
