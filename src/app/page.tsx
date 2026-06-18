import { listGames } from '@/lib/db'
import { HomeClient } from '@/components/home/HomeClient'

export default async function HomePage() {
  const games = await listGames()
  return <HomeClient initialGames={games} />
}
