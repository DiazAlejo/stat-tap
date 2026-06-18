'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function HomeBackButton() {
  return (
    <Link
      href="/"
      className="flex items-center gap-1 text-muted hover:text-fg font-display font-semibold text-sm uppercase tracking-wide transition-colors min-h-[44px] self-start"
    >
      <ChevronLeft size={16} />
      Back
    </Link>
  )
}
