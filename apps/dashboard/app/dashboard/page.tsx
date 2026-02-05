'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'

const executions = [
  { id: 0, action: 'USDC → DAI', amount: '$1,247.50', slippage: '3 bps', status: 'success' },
  { id: 1, action: 'DAI → USDC', amount: '$892.30', slippage: '5 bps', status: 'success' },
  { id: 2, action: 'USDC → DAI', amount: '$2,156.90', slippage: '4 bps', status: 'success' },
  { id: 3, action: 'DAI → USDC', amount: '$543.20', slippage: '2 bps', status: 'pending' },
]

const receipts = [
  { txHash: '0x8f3a...c2d1', strategyId: 'treasury.oikonomos.eth', quoteId: '0x4a2b...9f1e', slippage: '3 bps', tokenIn: 'USDC', tokenOut: 'DAI', amountIn: 1247500000, amountOut: 1247125437 },
  { txHash: '0x7b1c...d4e2', strategyId: 'treasury.oikonomos.eth', quoteId: '0x3c9d...8a2f', slippage: '5 bps', tokenIn: 'DAI', tokenOut: 'USDC', amountIn: 892300000, amountOut: 891853650 },
  { txHash: '0x6e5d...a3b1', strategyId: 'treasury.oikonomos.eth', quoteId: '0x2d8e...7c1a', slippage: '4 bps', tokenIn: 'USDC', tokenOut: 'DAI', amountIn: 2156900000, amountOut: 2156037724 },
]

export default function DashboardPage() {
  const [selectedReceipt, setSelectedReceipt] = useState<number | null>(null)

  const handleRevoke = () => {
    if (confirm('Are you sure you want to revoke this authorization? The agent will no longer be able to execute trades on your behalf.')) {
      alert('Authorization revoked. Redirecting to home...')
      window.location.href = '/'
    }
  }

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
            <Link href="/discover" className="font-mono text-[0.6875rem] text-text-secondary uppercase tracking-wider hover:text-accent-blue transition-colors">
              Discover
            </Link>
            <Link href="/dashboard" className="font-mono text-[0.6875rem] text-accent-blue uppercase tracking-wider">
              Dashboard
            </Link>
          </nav>
          <WalletButton />
        </div>
      </header>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-8 opacity-0 animate-fade-up delay-200">
        <div>
          <div className="font-mono text-[0.6875rem] font-medium text-accent-cyan uppercase tracking-[0.2em] mb-1">
            Monitoring
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Your Dashboard</h1>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link
            href="/configure"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-transparent border border-border-subtle font-mono text-xs text-text-secondary hover:text-text-primary hover:border-border-accent transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Modify Policy
          </Link>
          <button
            onClick={handleRevoke}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-transparent border border-border-subtle font-mono text-xs text-text-secondary hover:text-accent-red hover:border-accent-red transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Revoke
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 pb-12">
        {/* Main Column */}
        <div className="flex flex-col gap-6">
          {/* Portfolio Overview */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-300">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Portfolio Overview
              </span>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div>
                  <div className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider mb-1">Total Value</div>
                  <div className="font-mono text-[2.5rem] font-bold tracking-tight">
                    <span className="text-text-tertiary">$</span>24,847<span className="text-text-tertiary">.52</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-mono text-xl font-semibold text-accent-cyan">2.1%</div>
                  <div className="font-mono text-[0.625rem] text-text-tertiary">Drift from target · No rebalance needed</div>
                </div>
              </div>

              {/* Allocation Bar */}
              <div className="mb-4">
                <div className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider mb-2.5">
                  Current Allocation
                </div>
                <div className="h-3 flex bg-black/30 border border-border-subtle overflow-hidden">
                  <div className="bg-color-usdc" style={{ width: '52%' }} />
                  <div className="bg-color-dai" style={{ width: '48%' }} />
                </div>
                <div className="flex gap-5 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-color-usdc" />
                    <span className="font-mono text-xs text-text-secondary">USDC</span>
                    <span className="font-mono text-xs font-medium text-text-primary">$12,920.71 (52%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-color-dai" />
                    <span className="font-mono text-xs text-text-secondary">DAI</span>
                    <span className="font-mono text-xs font-medium text-text-primary">$11,926.81 (48%)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                <div>
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1">Target Allocation</div>
                  <div className="font-mono text-sm font-medium text-text-primary">50% USDC / 50% DAI</div>
                </div>
                <div>
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1">Rebalance Trigger</div>
                  <div className="font-mono text-sm font-medium text-text-primary">5% drift threshold</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Executions */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-400">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Recent Executions
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-4 py-3 text-left font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider hidden sm:table-cell">Amount</th>
                    <th className="px-4 py-3 text-right font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider">Slippage</th>
                    <th className="px-4 py-3 text-right font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-wider">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec) => (
                    <tr key={exec.id} className="border-b border-white/[0.04] hover:bg-accent-blue/5 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/20 font-mono text-xs">
                            ↔
                          </div>
                          <span className="font-mono text-[0.8125rem] text-text-secondary">{exec.action}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[0.8125rem] text-text-secondary hidden sm:table-cell">{exec.amount}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-[0.8125rem] text-text-primary">{exec.slippage}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider ${
                          exec.status === 'success'
                            ? 'bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan'
                            : 'bg-color-dai/10 border border-color-dai/20 text-color-dai'
                        }`}>
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {exec.status === 'success' ? (
                          <button
                            onClick={() => setSelectedReceipt(exec.id)}
                            className="font-mono text-[0.8125rem] text-accent-blue hover:text-[#6aa5ff] hover:underline transition-colors"
                          >
                            View
                          </button>
                        ) : (
                          <span className="font-mono text-[0.8125rem] text-text-tertiary">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="flex flex-col gap-6 lg:order-first lg:order-none">
          {/* Active Authorization */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-300">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Active Authorization
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-cyan/10 border border-accent-cyan/30 font-mono text-[0.5625rem] uppercase tracking-wider text-accent-cyan">
                <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse" />
                Active
              </span>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Agent', value: 'treasury.oikonomos.eth', isLink: true },
                { label: 'Expires', value: 'Feb 11, 2025' },
                { label: 'Token Pair', value: 'USDC ↔ DAI' },
                { label: 'Max Slippage', value: '50 bps' },
                { label: 'Drift Trigger', value: '5%' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-white/[0.04] last:border-b-0 last:pb-0">
                  <span className="font-mono text-[0.6875rem] text-text-tertiary">{row.label}</span>
                  {row.isLink ? (
                    <Link href="#" className="font-mono text-[0.8125rem] font-medium text-accent-blue hover:underline">
                      {row.value}
                    </Link>
                  ) : (
                    <span className="font-mono text-[0.8125rem] font-medium text-text-primary">{row.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-400">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Stats Summary
              </span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-border-subtle">
              {[
                { value: '12', label: 'Executions' },
                { value: '3.8', suffix: 'bps', label: 'Avg Slippage' },
                { value: '$4.21', label: 'Fees Paid' },
              ].map((stat, i) => (
                <div key={i} className="bg-bg-base p-4 text-center">
                  <div className="font-mono text-xl font-bold text-text-primary mb-1">
                    {stat.value.startsWith('$') ? (
                      <><span className="text-accent-blue">$</span>{stat.value.slice(1)}</>
                    ) : (
                      <>{stat.value}{stat.suffix && <span className="text-accent-blue">{stat.suffix}</span>}</>
                    )}
                  </div>
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt !== null && receipts[selectedReceipt] && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-bg-elevated border border-border-subtle w-full max-w-[560px] max-h-[90vh] overflow-y-auto animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-border-subtle">
              <span className="font-mono text-[0.8125rem] font-medium uppercase tracking-wider">Execution Receipt</span>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 flex items-center justify-center border border-border-subtle text-text-secondary hover:border-border-accent hover:text-text-primary transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-4">
                {[
                  { label: 'Transaction Hash', value: receipts[selectedReceipt].txHash, isHash: true },
                  { label: 'Strategy ID', value: receipts[selectedReceipt].strategyId },
                  { label: 'Quote ID', value: receipts[selectedReceipt].quoteId },
                  { label: 'Actual Slippage', value: receipts[selectedReceipt].slippage },
                  { label: 'Policy Compliant', value: 'Yes', isCompliant: true },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center pb-3 border-b border-white/[0.04] last:border-b-0">
                    <span className="font-mono text-[0.6875rem] text-text-tertiary">{row.label}</span>
                    {row.isCompliant ? (
                      <span className="flex items-center gap-1.5 font-mono text-[0.8125rem] font-medium text-accent-cyan">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className={`font-mono text-[0.8125rem] font-medium ${row.isHash ? 'text-accent-blue' : 'text-text-primary'}`}>
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <pre className="bg-black/30 border border-border-subtle p-4 font-mono text-[0.6875rem] leading-loose text-text-secondary overflow-x-auto">
{`{
  `}<span className="text-accent-blue">"receiptId"</span>{`: `}<span className="text-accent-cyan">"{receipts[selectedReceipt].txHash}"</span>{`,
  `}<span className="text-accent-blue">"strategyId"</span>{`: `}<span className="text-accent-cyan">"{receipts[selectedReceipt].strategyId}"</span>{`,
  `}<span className="text-accent-blue">"quoteId"</span>{`: `}<span className="text-accent-cyan">"{receipts[selectedReceipt].quoteId}"</span>{`,
  `}<span className="text-accent-blue">"tokenIn"</span>{`: `}<span className="text-accent-cyan">"{receipts[selectedReceipt].tokenIn}"</span>{`,
  `}<span className="text-accent-blue">"tokenOut"</span>{`: `}<span className="text-accent-cyan">"{receipts[selectedReceipt].tokenOut}"</span>{`,
  `}<span className="text-accent-blue">"amountIn"</span>{`: `}<span className="text-color-dai">{receipts[selectedReceipt].amountIn}</span>{`,
  `}<span className="text-accent-blue">"amountOut"</span>{`: `}<span className="text-color-dai">{receipts[selectedReceipt].amountOut}</span>{`,
  `}<span className="text-accent-blue">"actualSlippage"</span>{`: `}<span className="text-color-dai">{parseInt(receipts[selectedReceipt].slippage)}</span>{`,
  `}<span className="text-accent-blue">"maxSlippage"</span>{`: `}<span className="text-color-dai">50</span>{`,
  `}<span className="text-accent-blue">"policyCompliant"</span>{`: `}<span className="text-accent-cyan">true</span>{`,
  `}<span className="text-accent-blue">"timestamp"</span>{`: `}<span className="text-color-dai">{Math.floor(Date.now() / 1000)}</span>{`
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
