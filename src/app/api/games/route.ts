import { NextResponse } from 'next/server'
import { listGames } from '@/lib/db'

export async function GET() {
  try {
    const games = await listGames()
    return NextResponse.json({ games })
  } catch (err) {
    console.error('listGames failed', err)
    return NextResponse.json({ error: 'Failed to load games' }, { status: 500 })
  }
}
