'use client'

import { useState } from 'react'
import { Zap, Plus } from 'lucide-react'
import { GameCard } from '@/components/home/GameCard'
import { NewGameModal } from '@/components/home/NewGameModal'
import type { GameListItem } from '@/lib/types'

interface HomeClientProps {
  initialGames: GameListItem[]
}

export function HomeClient({ initialGames }: HomeClientProps) {
  const [showModal, setShowModal] = useState(false)
  const [games, setGames] = useState<GameListItem[]>(initialGames)

  function handleDelete(id: string) {
    setGames(prev => prev.filter(g => g.id !== id))
  }

  return (
    <main className="min-h-dvh bg-bg flex flex-col max-w-3xl mx-auto">
      <header className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-3">
          <Zap size={28} className="text-primary" fill="currentColor" />
          <h1 className="font-display font-bold text-3xl text-fg">StatTap</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-display font-bold text-lg rounded-xl cursor-pointer active:opacity-85 active:scale-[0.98] transition-all duration-150 min-h-[48px]"
        >
          <Plus size={20} />
          New Game
        </button>
      </header>

      <div className="flex-1 px-6 py-6 flex flex-col gap-3">
        {games.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-20">
            <Zap size={48} className="text-muted opacity-30" />
            <p className="font-display font-bold text-xl text-muted">No games yet</p>
            <p className="font-body text-sm text-muted opacity-70">Tap &ldquo;New Game&rdquo; to start tracking</p>
          </div>
        ) : (
          games.map(game => (
            <GameCard key={game.id} game={game} onDelete={handleDelete} />
          ))
        )}
      </div>

      {showModal && <NewGameModal onClose={() => setShowModal(false)} />}
    </main>
  )
}
