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
  title: 'Oikonomos | Agent Keychain & Portfolio Manager',
  description: 'Two API calls create a treasury + DeFi agent pair with deterministic wallets, ENS subnames, and on-chain identities. The treasury agent autonomously manages Uniswap V4 fees.',
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
