import { redirect } from 'next/navigation'
import { getMeta, getEvents } from '@/lib/kv'
import { LiveGameClient } from './LiveGameClient'

export default async function LiveGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const meta = await getMeta(gameId)

  if (!meta) redirect('/')
  if (meta.status === 'ended') redirect(`/game/${gameId}`)

  const events = await getEvents(gameId)

  return <LiveGameClient meta={meta} initialEvents={events} />
}
