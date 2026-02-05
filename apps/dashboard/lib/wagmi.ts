import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia, baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Oikonomos',
  projectId: '477d336ead207752e6ffab321072b0a8',
  chains: [baseSepolia, sepolia],
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
