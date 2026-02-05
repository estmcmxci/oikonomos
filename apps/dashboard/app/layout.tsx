import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { BackgroundLayers } from '@/components/layout/BackgroundLayers'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'Oikonomos | Autonomous DeFi Strategy Agents',
  description: 'Discover verified agents, delegate trading authority with cryptographic constraints, and verify every execution on-chain.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <BackgroundLayers />
          {children}
        </Providers>
      </body>
    </html>
  )
}
