'use client'

import { X } from 'lucide-react'
import { GameSetupForm } from '@/components/setup/GameSetupForm'

interface NewGameModalProps {
  onClose: () => void
}

export function NewGameModal({ onClose }: NewGameModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-4 top-8 bottom-8 z-50 bg-bg rounded-2xl overflow-y-auto max-w-3xl mx-auto shadow-2xl"
        role="dialog"
        aria-label="New Game Setup"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] sticky top-0 bg-bg z-10">
          <h2 className="font-display font-bold text-2xl text-fg">New Game</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>
        <GameSetupForm onCancel={onClose} />
      </div>
    </>
  )
}
