import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from './database.types'
import type { GameMeta, GameEvent, GameSnapshot, GameListItem, GameStatus } from './types'
import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR } from './game'

let _client: ReturnType<typeof createClient<Database>> | null = null

function getClient() {
  if (!_client) {
    _client = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _client
}

export async function getMeta(gameId: string): Promise<GameMeta | null> {
  const { data } = await getClient()
    .from('games')
    .select('meta')
    .eq('id', gameId)
    .single()
  return (data?.meta as unknown as GameMeta) ?? null
}

export async function setMeta(gameId: string, meta: GameMeta): Promise<void> {
  await getClient()
    .from('games')
    .upsert({ id: gameId, meta: meta as unknown as Json, status: meta.status })
}

export async function getEvents(gameId: string): Promise<GameEvent[]> {
  const { data } = await getClient()
    .from('events')
    .select('payload')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })
  return (data ?? []).map(row => row.payload as unknown as GameEvent)
}

export async function pushEvent(gameId: string, event: GameEvent): Promise<void> {
  await getClient()
    .from('events')
    .insert({ id: event.id, game_id: gameId, payload: event as unknown as Json })
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
  return last.payload as unknown as GameEvent
}

export async function getSnapshot(gameId: string): Promise<GameSnapshot | null> {
  const { data } = await getClient()
    .from('games')
    .select('snapshot')
    .eq('id', gameId)
    .single()
  return (data?.snapshot as unknown as GameSnapshot) ?? null
}

export async function setSnapshot(gameId: string, snapshot: GameSnapshot): Promise<void> {
  await getClient()
    .from('games')
    .update({ snapshot: snapshot as unknown as Json, status: 'ended' })
    .eq('id', gameId)
}

export async function listGames(): Promise<GameListItem[]> {
  const { data, error } = await getClient()
    .from('games')
    .select('id, meta, status, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  const items: GameListItem[] = []
  for (const row of data ?? []) {
    try {
      const meta = row.meta as unknown as GameMeta
      const status: GameStatus = row.status === 'ended' ? 'ended' : 'live'
      items.push({
        id: row.id,
        teamAName: meta.teamA.name,
        teamBName: meta.teamB.name,
        teamAColor: meta.teamAColor ?? DEFAULT_TEAM_A_COLOR,
        teamBColor: meta.teamBColor ?? DEFAULT_TEAM_B_COLOR,
        status,
        createdAt: new Date(row.created_at).getTime(),
        scoreA: meta.scoreA,
        scoreB: meta.scoreB,
      })
    } catch {
      // Skip malformed rows rather than crashing the entire list
    }
  }
  return items
}

export async function deleteGame(gameId: string): Promise<void> {
  // Delete events first (foreign key: events.game_id → games.id)
  await getClient().from('events').delete().eq('game_id', gameId)
  await getClient().from('games').delete().eq('id', gameId)
}
