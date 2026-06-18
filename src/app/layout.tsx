import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StatTap',
  description: 'Real-time basketball pickup game stat tracker',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // maximumScale intentionally omitted — disabling zoom is an accessibility violation
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${barlowCondensed.variable} min-h-dvh bg-bg text-fg font-body`}>
        {children}
      </body>
    </html>
  )
}
