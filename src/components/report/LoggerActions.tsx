'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, Copy, Check } from 'lucide-react'

interface LoggerActionsProps {
  gameId: string
}

export function LoggerActions({ gameId }: LoggerActionsProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/game/${gameId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-3 bg-surface rounded-xl border border-[var(--color-border)] text-fg font-display font-semibold text-sm uppercase tracking-wide cursor-pointer hover:bg-surface-elevated transition-colors min-h-[48px]"
      >
        <Home size={16} />
        Home
      </Link>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-display font-bold text-sm uppercase tracking-wide cursor-pointer active:opacity-85 transition-all duration-150 min-h-[48px]"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied!' : 'Copy Share Link'}
      </button>
    </div>
  )
}
