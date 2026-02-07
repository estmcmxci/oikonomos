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
  description: 'Agent keychain for DeFi — launch agents with wallets, ENS identity, and autonomous V4 fee management.',
  metadataBase: new URL('https://oikonomos.vercel.app'),
  openGraph: {
    title: 'Oikonomos — Agent Keychain & Portfolio Manager',
    description: 'Launch AI agents with deterministic wallets, ENS identity, and autonomous Uniswap V4 fee management.',
    siteName: 'Oikonomos',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oikonomos — Agent Keychain & Portfolio Manager',
    description: 'Launch AI agents with deterministic wallets, ENS identity, and autonomous Uniswap V4 fee management.',
  },
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
