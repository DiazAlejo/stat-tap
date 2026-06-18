import { NextRequest, NextResponse } from 'next/server'
import { getMeta, getEvents, getSnapshot, deleteGame } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const meta = await getMeta(id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const events = await getEvents(id)

  if (meta.status === 'ended') {
    const snapshot = await getSnapshot(id)
    return NextResponse.json({ meta, events, snapshot })
  }

  return NextResponse.json({ meta, events })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const meta = await getMeta(id)
  if (!meta) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  try {
    await deleteGame(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('deleteGame failed', err)
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}
