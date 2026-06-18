'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Copy, Check } from 'lucide-react'

interface LoggerActionsProps {
  gameId: string
}

export function LoggerActions({ gameId }: LoggerActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  function handleHome() {
    router.push('/')
    router.refresh()
  }

  function handleCopy() {
    const url = `${window.location.origin}/game/${gameId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleHome}
        className="flex items-center gap-2 px-4 py-3 bg-surface rounded-xl border border-[var(--color-border)] text-fg font-display font-semibold text-sm uppercase tracking-wide cursor-pointer hover:bg-surface-elevated transition-colors min-h-[48px]"
      >
        <Home size={16} />
        Home
      </button>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Copy share link'}
        className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-display font-bold text-sm uppercase tracking-wide cursor-pointer active:opacity-85 transition-all duration-150 min-h-[48px]"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied!' : 'Copy Share Link'}
      </button>
    </div>
  )
}
