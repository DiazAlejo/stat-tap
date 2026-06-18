import { listGames } from '@/lib/db'
import { HomeClient } from '@/components/home/HomeClient'
import type { GameListItem } from '@/lib/types'

export default async function HomePage() {
  let games: GameListItem[] = []
  try {
    games = await listGames()
  } catch {
    // DB unavailable — render home page with empty list rather than crashing
  }
  return <HomeClient initialGames={games} />
}
