'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface EndGameModalProps {
  onClose: () => void
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export function EndGameModal({ onClose, onConfirm, isLoading }: EndGameModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap: focus first focusable on open
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isLoading])

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && !isLoading) onClose() }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="End game confirmation"
        className="bg-surface rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-display font-bold text-2xl text-fg">End this game?</h2>
            <p className="font-body text-muted text-sm leading-relaxed">
              This will lock the event log and generate the final report. This cannot be undone.
            </p>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              aria-label="Cancel"
              className="text-muted hover:text-fg transition-colors cursor-pointer mt-1 shrink-0"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] text-muted font-display font-semibold cursor-pointer hover:text-fg transition-colors active:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-destructive text-white font-display font-bold cursor-pointer active:opacity-85 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ending…' : 'End Game →'}
          </button>
        </div>
      </div>
    </div>
  )
}
