import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { GameSetupForm } from '@/components/setup/GameSetupForm'

export default function NewGamePage() {
  return (
    <main className="min-h-dvh bg-bg flex flex-col max-w-3xl mx-auto">
      <header className="flex items-center gap-4 px-6 py-5 border-b border-[var(--color-border)] shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1 text-muted hover:text-fg font-display font-semibold text-sm uppercase tracking-wide transition-colors min-h-[44px]"
        >
          <ChevronLeft size={16} />
          Back
        </Link>
        <h1 className="font-display font-bold text-2xl text-fg">New Game</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <GameSetupForm />
      </div>
    </main>
  )
}
