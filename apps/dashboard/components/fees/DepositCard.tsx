'use client'

import { useState } from 'react'
import type { Address } from 'viem'

interface DepositCardProps {
  depositAddress?: Address
  chainId: number
}

export function DepositCard({ depositAddress, chainId }: DepositCardProps) {
  const [copied, setCopied] = useState(false)

  if (!depositAddress) return null

  const chainName = chainId === 8453 ? 'Base' : chainId === 84532 ? 'Base Sepolia' : `Chain ${chainId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border-subtle p-4">
      <div className="font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
        Deposit Address
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[0.75rem] text-text-primary break-all flex-1">
          {depositAddress}
        </span>
        <button
          onClick={handleCopy}
          className="text-text-tertiary hover:text-text-primary transition-colors shrink-0 p-1"
          title="Copy address"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
        <span className="font-mono text-[0.625rem] text-text-tertiary">{chainName}</span>
      </div>

      <p className="font-mono text-[0.5625rem] text-text-tertiary mt-2 leading-relaxed">
        Send WETH or ETH to this address to fund your treasury agent.
        Fees will be distributed according to your settings above.
      </p>
    </div>
  )
}
