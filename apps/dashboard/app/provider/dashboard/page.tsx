'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'

const executions = [
  { user: '0x8f3a...c2d1', trade: '$2,450 USDC → DAI', slippage: '3 bps', fee: '$1.23' },
  { user: '0x4b2e...9f1a', trade: '$890 DAI → USDC', slippage: '5 bps', fee: '$0.45' },
  { user: '0x7a25...3f8d', trade: '$5,200 USDC → DAI', slippage: '4 bps', fee: '$2.60' },
  { user: '0x1c9d...7e2b', trade: '$1,780 DAI → USDC', slippage: '3 bps', fee: '$0.89' },
  { user: '0x6e5f...a4c3', trade: '$3,100 USDC → DAI', slippage: '6 bps', fee: '$1.55' },
]

export default function ProviderDashboardPage() {
  const gaugeRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    // Animate gauge on load
    const timeout = setTimeout(() => {
      if (gaugeRef.current) {
        const percentage = 52
        const dasharray = 339.292
        const offset = dasharray - (dasharray * percentage / 100)
        gaugeRef.current.style.strokeDashoffset = String(offset)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [])

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

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6">
            <Link href="/provider" className="font-mono text-[0.6875rem] text-text-secondary uppercase tracking-wider hover:text-accent-blue transition-colors">
              Build
            </Link>
            <Link href="/provider/dashboard" className="font-mono text-[0.6875rem] text-accent-blue uppercase tracking-wider">
              Dashboard
            </Link>
          </nav>
          <WalletButton />
        </div>
      </header>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-8 opacity-0 animate-fade-up delay-200">
        <div className="flex items-center gap-4 p-2.5 pr-4 bg-bg-card border border-border-subtle backdrop-blur-xl">
          <div className="w-8 h-8 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/30 font-mono text-[0.6875rem] font-bold text-accent-blue">
            SA
          </div>
          <div>
            <div className="font-mono text-sm font-medium text-accent-blue">strategy.alice.eth</div>
            <div className="font-mono text-[0.625rem] text-text-tertiary">Agent #642</div>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link
            href="/provider/ens"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-transparent border border-border-subtle font-mono text-xs text-text-secondary hover:text-text-primary hover:border-border-accent transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </Link>
          <a
            href="#"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-transparent border border-border-subtle font-mono text-xs text-text-secondary hover:text-text-primary hover:border-border-accent transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            View on Explorer
          </a>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-subtle mb-6 opacity-0 animate-fade-up delay-300">
        {[
          { value: '47', label: 'Executions', highlight: true },
          { value: '98.5%', label: 'Compliance Rate', isCyan: true },
          { value: '4.2bps', label: 'Avg Slippage' },
          { value: '$127K', label: 'Volume Routed' },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-base p-6 text-center">
            <div className="font-mono text-2xl font-bold text-text-primary mb-2">
              {stat.highlight || stat.isCyan ? (
                <span className={stat.isCyan ? 'text-accent-cyan' : 'text-accent-blue'}>{stat.value}</span>
              ) : (
                <>
                  {stat.value.startsWith('$') && <span className="text-accent-blue">$</span>}
                  {stat.value.replace('$', '').replace('bps', '')}
                  {stat.value.endsWith('bps') && <span className="text-accent-blue">bps</span>}
                </>
              )}
            </div>
            <div className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-[0.15em]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 pb-12">
        {/* Main Column */}
        <div className="flex flex-col gap-6">
          {/* Execution History */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-400">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Execution History
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-4 py-3 text-left font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider">Trade</th>
                    <th className="px-4 py-3 text-right font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider hidden sm:table-cell">Slippage</th>
                    <th className="px-4 py-3 text-right font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider">Fee Earned</th>
                    <th className="px-4 py-3 text-right font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-accent-blue/5 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[0.8125rem] text-text-primary">{exec.user}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-[0.8125rem] text-text-secondary">
                          {exec.trade.split(' → ')[0]}
                          <span className="text-text-tertiary">→</span>
                          {exec.trade.split(' → ')[1]}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[0.8125rem] text-text-secondary hidden sm:table-cell">{exec.slippage}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-[0.8125rem] font-medium text-accent-cyan">{exec.fee}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button className="font-mono text-[0.8125rem] text-accent-blue hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-500">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Weekly Volume
              </span>
            </div>
            <div className="p-5">
              <div className="h-[120px] flex items-end gap-2 mb-2">
                {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-accent-blue/30 to-accent-blue/10 border-t-2 border-accent-blue transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t border-border-subtle">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <span key={day} className="font-mono text-[0.5625rem] text-text-tertiary">{day}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="flex flex-col gap-6 lg:order-first lg:order-none">
          {/* Reputation */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-400">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Reputation Score
              </span>
              <span className="px-2.5 py-1 bg-color-dai/10 border border-color-dai/30 font-mono text-[0.5625rem] uppercase tracking-wider text-color-dai">
                Cold Start
              </span>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-5">
                {/* Gauge */}
                <div className="relative w-[140px] h-[140px] flex-shrink-0">
                  <svg viewBox="0 0 120 120" width="140" height="140">
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#5298FF"/>
                        <stop offset="100%" stopColor="#00D4AA"/>
                      </linearGradient>
                    </defs>
                    <circle
                      cx="60" cy="60" r="54"
                      fill="none" stroke="rgba(82,152,255,0.1)" strokeWidth="12"
                    />
                    <circle
                      ref={gaugeRef}
                      cx="60" cy="60" r="54"
                      fill="none" stroke="url(#gaugeGradient)" strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="339.292"
                      strokeDashoffset="339.292"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-[2.5rem] font-bold text-text-primary leading-none">52</span>
                    <span className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mt-1">of 100</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="flex-1 w-full">
                  {[
                    { label: 'Executions', value: '47 / 100', isWarning: true },
                    { label: 'Compliance', value: '98.5%', isGood: true },
                    { label: 'Avg Slippage', value: '4.2 bps', isGood: true },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-b-0">
                      <span className="font-mono text-xs text-text-secondary">{item.label}</span>
                      <span className={`font-mono text-sm font-medium ${
                        item.isGood ? 'text-accent-cyan' :
                        item.isWarning ? 'text-color-dai' :
                        'text-text-primary'
                      }`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cold Start Notice */}
              <div className="p-4 bg-color-dai/5 border border-color-dai/15">
                <div className="flex items-center gap-2.5 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-color-dai">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="font-mono text-xs font-medium text-color-dai">Building Reputation</span>
                </div>
                <p className="font-display text-[0.8125rem] text-text-secondary leading-relaxed mb-3">
                  Complete 100 executions to exit cold start. Consider these strategies:
                </p>
                <div className="space-y-2">
                  {['Self-trade to build history', 'Subsidize fees temporarily', 'Stake collateral (coming soon)'].map((opt) => (
                    <div key={opt} className="flex items-center gap-2.5 font-mono text-xs text-text-secondary">
                      <div className="w-1 h-1 bg-color-dai" />
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-500">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                x402 Earnings
              </span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-5 pb-5 border-b border-border-subtle">
                <div>
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1">Total Earned</div>
                  <div className="font-mono text-2xl font-bold text-accent-cyan">
                    $63.50 <span className="text-base text-text-tertiary font-normal">USDC</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-semibold text-text-primary">0.05%</div>
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider">Fee Rate</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'This Month', value: '$48.20', isUp: true },
                  { label: 'Last Month', value: '$15.30' },
                  { label: 'Volume Routed', value: '$127,000' },
                  { label: 'Unique Users', value: '12' },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-black/20 border border-border-subtle">
                    <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1.5">
                      {item.label}
                    </div>
                    <div className={`font-mono text-base font-medium ${item.isUp ? 'text-accent-cyan' : 'text-text-primary'}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
