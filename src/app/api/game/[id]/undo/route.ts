import { NextRequest, NextResponse } from 'next/server'
import { getMeta, popEvent } from '@/lib/kv'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const meta = await getMeta(id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (meta.status === 'ended') return NextResponse.json({ error: 'Game is ended' }, { status: 409 })

  const removedEvent = await popEvent(id)
  return NextResponse.json({ ok: true, removedEvent })
}
