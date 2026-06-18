import { NextRequest, NextResponse } from 'next/server'
import { getMeta, pushEvent } from '@/lib/kv'
import type { GameEvent } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const meta = await getMeta(id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (meta.status === 'ended') return NextResponse.json({ error: 'Game is ended' }, { status: 409 })

  const event: GameEvent = await req.json()
  await pushEvent(id, event)
  return NextResponse.json({ ok: true })
}
