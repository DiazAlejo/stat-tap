import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StatTap',
  description: 'Real-time basketball pickup game stat tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-bg text-fg font-body">{children}</body>
    </html>
  )
}
