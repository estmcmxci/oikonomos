'use client'

import type { ReactNode } from 'react'
import { WalletButton } from './WalletButton'
import { useLaunch } from '@/lib/launch-context'

interface WalletGateProps {
  children: ReactNode
  stepNumber: number
  stepLabel: string
}

export function WalletGate({ children, stepNumber, stepLabel }: WalletGateProps) {
  const { isWalletConnected } = useLaunch()

  if (isWalletConnected) {
    return <>{children}</>
  }

  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/30">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <circle cx="16" cy="12" r="2"/>
            <path d="M6 12h4"/>
          </svg>
        </div>

        <div className="font-mono text-[0.625rem] text-accent-blue uppercase tracking-[0.2em] mb-2">
          Step {stepNumber}
        </div>
        <h2 className="font-display text-xl font-bold tracking-tight mb-2">
          {stepLabel}
        </h2>
        <p className="font-display text-sm font-light text-text-secondary mb-8">
          Connect your wallet to continue
        </p>

        <div className="flex justify-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
