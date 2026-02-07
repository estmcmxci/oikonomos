'use client'

import { useState } from 'react'
import type { ClaimHistoryEntry } from '@/lib/api'

const BASESCAN_TX = 'https://basescan.org/tx/'
const PAGE_SIZE = 5

interface ClaimHistoryProps {
  claims: ClaimHistoryEntry[]
}

export function ClaimHistory({ claims }: ClaimHistoryProps) {
  const [page, setPage] = useState(0)

  if (claims.length === 0) {
    return (
      <div className="text-center py-6 text-text-tertiary font-mono text-[0.75rem]">
        No claim history yet
      </div>
    )
  }

  const totalPages = Math.ceil(claims.length / PAGE_SIZE)
  const paged = claims.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest">
          Recent Claims
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="font-mono text-[0.625rem] text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
            >
              Prev
            </button>
            <span className="font-mono text-[0.625rem] text-text-tertiary tabular-nums">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="font-mono text-[0.625rem] text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {paged.map((claim, i) => (
          <ClaimRow key={`${claim.timestamp}-${i}`} claim={claim} />
        ))}
      </div>
    </div>
  )
}

function ClaimRow({ claim }: { claim: ClaimHistoryEntry }) {
  const date = new Date(claim.timestamp)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  const claimed = parseFloat(claim.wethClaimed)
  const deployed = parseFloat(claim.deployerAmount)

  return (
    <div className="py-2 px-3 border border-border-subtle/30 bg-white/[0.01] hover:bg-accent-blue/[0.03] transition-colors">
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-mono text-[0.6875rem] text-text-tertiary tabular-nums min-w-[90px]">
            {dateStr} {timeStr}
          </div>
          <span className="font-mono text-[0.75rem] text-text-secondary">
            {claim.agentName}
          </span>
          <span className={`font-mono text-[0.5625rem] px-1.5 py-px border ${
            claim.mode === 'manual'
              ? 'text-amber-400 border-amber-400/20'
              : 'text-accent-cyan border-accent-cyan/20'
          }`}>
            {claim.mode.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-[0.75rem] text-text-primary tabular-nums">
              {claimed === 0 ? '0' : claimed.toFixed(6)} WETH
            </div>
            {deployed > 0 && (
              <div className="font-mono text-[0.5625rem] text-accent-cyan tabular-nums">
                {deployed.toFixed(6)} distributed
              </div>
            )}
          </div>
          {(claim.claimTxHash || claim.distributionTxHash) && (
            <a
              href={`${BASESCAN_TX}${claim.distributionTxHash || claim.claimTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-accent-blue transition-colors shrink-0"
              title="View on BaseScan"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.75rem] text-text-secondary">{claim.agentName}</span>
            <span className={`font-mono text-[0.5625rem] px-1.5 py-px border ${
              claim.mode === 'manual' ? 'text-amber-400 border-amber-400/20' : 'text-accent-cyan border-accent-cyan/20'
            }`}>
              {claim.mode.toUpperCase()}
            </span>
          </div>
          {(claim.claimTxHash || claim.distributionTxHash) && (
            <a
              href={`${BASESCAN_TX}${claim.distributionTxHash || claim.claimTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-accent-blue transition-colors shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-[0.625rem] text-text-tertiary tabular-nums">{dateStr} {timeStr}</div>
          <div className="font-mono text-[0.75rem] text-text-primary tabular-nums">
            {claimed === 0 ? '0' : claimed.toFixed(6)} WETH
          </div>
        </div>
      </div>
    </div>
  )
}
