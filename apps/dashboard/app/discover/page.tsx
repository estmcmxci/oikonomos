'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'
import { ProgressIndicator, consumerSteps } from '@/components/ProgressIndicator'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentTable } from '@/components/agents/AgentTable'

const mockAgents = [
  {
    id: '643',
    name: 'treasury.oikonomos.eth',
    avatar: 'TO',
    score: 85,
    executions: 500,
    slippage: 5,
    success: 99.2,
    tokens: ['USDC', 'DAI', 'USDT', 'WETH'],
    fee: '0.1%',
  },
  {
    id: '642',
    name: 'strategy.alice.eth',
    avatar: 'SA',
    score: 72,
    executions: 100,
    slippage: 8,
    success: 97.0,
    tokens: ['USDC', 'DAI', 'WETH'],
    fee: '0.05%',
  },
  {
    id: '651',
    name: 'defi.bob.eth',
    avatar: 'DB',
    score: 68,
    executions: 250,
    slippage: 12,
    success: 94.8,
    tokens: ['USDC', 'DAI', 'FRAX'],
    fee: '0.08%',
  },
]

type ViewMode = 'cards' | 'table'
type SortMode = 'reputation' | 'fee' | 'executions'

export default function DiscoverPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortMode, setSortMode] = useState<SortMode>('reputation')

  return (
    <div className="container">
      {/* Header */}
      <header className="flex justify-between items-center py-6 border-b border-border-subtle opacity-0 animate-fade-down delay-100">
        <Link href="/" className="flex items-center gap-3 no-underline text-text-primary">
          <div className="w-9 h-9 flex items-center justify-center">
            <Logo size={36} />
          </div>
          <span className="font-mono text-lg font-medium tracking-tight">oikonomos</span>
        </Link>
        <WalletButton />
      </header>

      {/* Progress Indicator */}
      <ProgressIndicator steps={consumerSteps} currentStep={3} />

      {/* Page Header */}
      <div className="py-8 pb-6 opacity-0 animate-fade-up delay-300">
        <div className="font-mono text-[0.6875rem] font-medium text-accent-blue uppercase tracking-[0.2em] mb-2">
          Step 3
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Discover Agents
        </h1>
      </div>

      {/* Search Context Banner */}
      <div className="flex items-center justify-between p-5 md:p-6 bg-bg-card border border-border-subtle backdrop-blur-xl mb-6 opacity-0 animate-fade-up delay-400">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider">
              Policy
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-accent-blue/10 border border-accent-blue/20 font-mono text-[0.625rem] font-medium text-accent-blue">
              Stablecoin Rebalance
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider">
              Tokens
            </span>
            <div className="flex gap-1.5">
              <span className="token-badge usdc">USDC</span>
              <span className="token-badge dai">DAI</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-text-secondary">
            <span className="text-accent-cyan font-bold">3</span> agents match your policy
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6 opacity-0 animate-fade-up delay-500 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider">
            Sort by
          </span>
          <div className="flex gap-1">
            {(['reputation', 'fee', 'executions'] as SortMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`px-3.5 py-2 border font-mono text-[0.6875rem] cursor-pointer transition-all duration-200 ${
                  sortMode === mode
                    ? 'bg-accent-blue border-accent-blue text-bg-base'
                    : 'bg-transparent border-border-subtle text-text-secondary hover:border-border-accent hover:text-text-primary'
                }`}
              >
                {mode === 'fee' ? 'Fee ↑' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider">
              Min Score
            </span>
            <select className="px-3 py-2 bg-bg-card border border-border-subtle font-mono text-[0.6875rem] text-text-secondary cursor-pointer outline-none focus:border-border-accent">
              <option>Any</option>
              <option>50+</option>
              <option>60+</option>
              <option>70+</option>
              <option>80+</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider">
              View
            </span>
            <div className="flex gap-0.5 bg-bg-card border border-border-subtle p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center justify-center w-8 h-7 border-none cursor-pointer transition-all duration-200 ${
                  viewMode === 'cards'
                    ? 'bg-accent-blue text-bg-base'
                    : 'bg-transparent text-text-tertiary hover:text-text-secondary'
                }`}
                title="Card View"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center w-8 h-7 border-none cursor-pointer transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-accent-blue text-bg-base'
                    : 'bg-transparent text-text-tertiary hover:text-text-secondary'
                }`}
                title="Table View"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
          {mockAgents.map((agent, index) => (
            <div
              key={agent.id}
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <AgentCard agent={agent} recommended={index === 0} />
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <AgentTable agents={mockAgents} recommendedId="643" />
      )}
    </div>
  )
}
