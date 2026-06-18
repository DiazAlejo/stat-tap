import { kv } from '@vercel/kv'
import type { GameMeta, GameEvent, GameSnapshot } from './types'

export async function getMeta(gameId: string): Promise<GameMeta | null> {
  return kv.get<GameMeta>(`game:${gameId}:meta`)
}

export async function setMeta(gameId: string, meta: GameMeta): Promise<void> {
  await kv.set(`game:${gameId}:meta`, meta)
}

export async function getEvents(gameId: string): Promise<GameEvent[]> {
  const raw = await kv.lrange<string>(`game:${gameId}:events`, 0, -1)
  return raw.map(r => (typeof r === 'string' ? JSON.parse(r) : r))
}

export async function pushEvent(gameId: string, event: GameEvent): Promise<void> {
  await kv.rpush(`game:${gameId}:events`, JSON.stringify(event))
}

export async function popEvent(gameId: string): Promise<GameEvent | null> {
  const raw = await kv.rpop<string>(`game:${gameId}:events`)
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

export async function getSnapshot(gameId: string): Promise<GameSnapshot | null> {
  return kv.get<GameSnapshot>(`game:${gameId}:snapshot`)
}

export async function setSnapshot(gameId: string, snapshot: GameSnapshot): Promise<void> {
  await kv.set(`game:${gameId}:snapshot`, snapshot)
}
