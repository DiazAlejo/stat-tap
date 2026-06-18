import { createClient } from '@supabase/supabase-js'
import type { GameMeta, GameEvent, GameSnapshot } from './types'

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getMeta(gameId: string): Promise<GameMeta | null> {
  const { data } = await getClient()
    .from('games')
    .select('meta')
    .eq('id', gameId)
    .single()
  return data?.meta ?? null
}

export async function setMeta(gameId: string, meta: GameMeta): Promise<void> {
  await getClient()
    .from('games')
    .upsert({ id: gameId, meta, status: meta.status })
}

export async function getEvents(gameId: string): Promise<GameEvent[]> {
  const { data } = await getClient()
    .from('events')
    .select('payload')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })
  return (data ?? []).map(row => row.payload as GameEvent)
}

export async function pushEvent(gameId: string, event: GameEvent): Promise<void> {
  await getClient()
    .from('events')
    .insert({ id: event.id, game_id: gameId, payload: event })
}

export async function popEvent(gameId: string): Promise<GameEvent | null> {
  const { data: last } = await getClient()
    .from('events')
    .select('id, payload')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!last) return null

  await getClient().from('events').delete().eq('id', last.id)
  return last.payload as GameEvent
}

export async function getSnapshot(gameId: string): Promise<GameSnapshot | null> {
  const { data } = await getClient()
    .from('games')
    .select('snapshot')
    .eq('id', gameId)
    .single()
  return data?.snapshot ?? null
}

export async function setSnapshot(gameId: string, snapshot: GameSnapshot): Promise<void> {
  await getClient()
    .from('games')
    .update({ snapshot, status: 'ended' })
    .eq('id', gameId)
}
