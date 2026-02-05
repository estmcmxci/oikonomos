'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'
import { ProgressIndicator, consumerSteps } from '@/components/ProgressIndicator'

export default function AuthorizePage() {
  const [validity, setValidity] = useState('7')
  const [isSigning, setIsSigning] = useState(false)
  const [isSigned, setIsSigned] = useState(false)

  const getExpiryDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleSign = async () => {
    setIsSigning(true)
    // Simulate wallet signature delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSigning(false)
    setIsSigned(true)
  }

  return (
    <div className="container max-w-[800px]">
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

      <ProgressIndicator steps={consumerSteps} currentStep={5} />

      <div className="text-center py-8 pb-6 opacity-0 animate-fade-up delay-300">
        <div className="font-mono text-[0.6875rem] font-medium text-accent-blue uppercase tracking-[0.2em] mb-2">
          Final Step
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Review & Authorize</h1>
      </div>

      {/* Pre-sign content */}
      {!isSigned && (
        <div className="pb-12">
          {/* Authorization Summary */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl mb-6 opacity-0 animate-fade-up delay-400">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Authorization Summary
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1.5">Agent</div>
                  <div className="font-mono text-[0.9375rem] font-medium text-accent-blue">treasury.oikonomos.eth</div>
                </div>
                <div className="p-4 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1.5">Policy Type</div>
                  <div className="font-mono text-[0.9375rem] font-medium text-text-primary">Stablecoin Rebalance</div>
                </div>
                <div className="p-4 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1.5">Token Pair</div>
                  <div className="flex items-center gap-2">
                    <span className="token-badge usdc">USDC</span>
                    <span className="text-text-tertiary">↔</span>
                    <span className="token-badge dai">DAI</span>
                  </div>
                </div>
                <div className="p-4 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1.5">Constraints</div>
                  <div className="font-mono text-[0.9375rem] font-medium text-text-primary">5% drift · 50bps slippage</div>
                </div>
                <div className="sm:col-span-2 p-4 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1.5">Valid For</div>
                  <select
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                    className="px-2 py-1 bg-transparent border border-border-subtle font-mono text-sm text-text-primary cursor-pointer outline-none focus:border-border-accent"
                  >
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Intent Preview */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl mb-6 opacity-0 animate-fade-up delay-500">
            <div className="flex items-center gap-2 p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Signed Intent Preview
              </span>
              <span className="px-1.5 py-0.5 bg-accent-blue/10 border border-accent-blue/20 font-mono text-[0.5rem] text-accent-blue">
                EIP-712
              </span>
            </div>
            <div className="p-5">
              <pre className="bg-black/30 border border-border-subtle p-4 font-mono text-xs leading-loose text-text-secondary overflow-x-auto">
{`{
  `}<span className="text-accent-blue">"user"</span>{`: `}<span className="text-accent-cyan">"0x7a25...3f8d"</span>{`,
  `}<span className="text-accent-blue">"strategyId"</span>{`: `}<span className="text-accent-cyan">"0x8f3a...treasury.oikonomos.eth"</span>{`,
  `}<span className="text-accent-blue">"tokenIn"</span>{`: `}<span className="text-accent-cyan">"0xA0b8...USDC"</span>{`,
  `}<span className="text-accent-blue">"tokenOut"</span>{`: `}<span className="text-accent-cyan">"0x6B17...DAI"</span>{`,
  `}<span className="text-accent-blue">"maxSlippage"</span>{`: `}<span className="text-color-dai">50</span>{`, `}<span className="text-text-tertiary italic">// basis points</span>{`
  `}<span className="text-accent-blue">"deadline"</span>{`: `}<span className="text-color-dai">1707350400</span>{` `}<span className="text-text-tertiary italic">// {validity} days from now</span>{`
}`}
              </pre>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl mb-6 opacity-0 animate-fade-up delay-600">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Agent Permissions
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Allowed */}
                <div>
                  <h4 className="flex items-center gap-1.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-accent-cyan mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Allowed
                  </h4>
                  <div className="space-y-2.5">
                    {['Swap USDC for DAI (and vice versa)', 'Execute trades within 50bps slippage', 'Rebalance when drift exceeds 5%'].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-white/[0.04] last:border-b-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-cyan flex-shrink-0 mt-0.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span className="font-display text-sm text-text-secondary leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Not Allowed */}
                <div>
                  <h4 className="flex items-center gap-1.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-accent-red mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                    Not Allowed
                  </h4>
                  <div className="space-y-2.5">
                    {['Access any other tokens in your wallet', 'Execute trades above slippage limit', 'Withdraw or transfer funds elsewhere'].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-white/[0.04] last:border-b-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-red flex-shrink-0 mt-0.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        <span className="font-display text-sm text-text-secondary leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Section */}
          <div className="opacity-0 animate-fade-up delay-700">
            <div className="flex items-start gap-3 p-4 bg-accent-blue/5 border border-accent-blue/15 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-blue flex-shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="font-display text-[0.8125rem] text-text-secondary leading-relaxed">
                <strong className="text-text-primary">You are signing a message, not a transaction.</strong>{' '}
                This signature authorizes the agent to submit transactions on your behalf within the specified constraints.
                No gas will be charged for this signature. You can revoke this authorization at any time.
              </p>
            </div>

            <button
              onClick={handleSign}
              disabled={isSigning}
              className="btn-primary w-full justify-center py-5 text-[0.9375rem] uppercase tracking-wider relative overflow-hidden group disabled:opacity-70"
            >
              {isSigning ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"/>
                  </svg>
                  Waiting for signature...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/>
                    <circle cx="11" cy="11" r="2"/>
                  </svg>
                  Sign Intent
                </>
              )}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {isSigned && (
        <div className="text-center py-16 pb-12">
          {/* Animated Success Icon */}
          <div className="relative w-[120px] h-[120px] mx-auto mb-8">
            <div className="absolute inset-[-20px] bg-[radial-gradient(circle,rgba(0,212,170,0.3),transparent_70%)] animate-pulse" />
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle
                cx="60" cy="60" r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-accent-cyan"
                style={{
                  strokeDasharray: 377,
                  strokeDashoffset: 0,
                  animation: 'draw-circle 0.6s ease-out forwards'
                }}
              />
              <polyline
                points="38 62 52 76 82 46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent-cyan"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 0,
                  animation: 'draw-check 0.4s ease-out 0.5s forwards'
                }}
              />
            </svg>
          </div>

          <h2 className="font-display text-2xl font-bold mb-3 opacity-0 animate-fade-up delay-900">
            Authorization Active
          </h2>
          <p className="font-display text-base font-light text-text-secondary mb-8 opacity-0 animate-fade-up delay-1000">
            Your intent has been signed. The agent can now execute trades on your behalf.
          </p>

          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-5 mb-8 text-left opacity-0 animate-fade-up delay-1100">
            <div className="space-y-3">
              {[
                { label: 'Agent', value: 'treasury.oikonomos.eth', highlight: true },
                { label: 'Status', value: 'Active', highlight: true },
                { label: 'Expires', value: getExpiryDate(parseInt(validity)) },
                { label: 'Signature', value: '0x8f3a...c2d1' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-white/[0.04] last:border-b-0">
                  <span className="font-mono text-[0.6875rem] text-text-tertiary">{row.label}</span>
                  <span className={`font-mono text-xs ${row.highlight ? 'text-accent-cyan' : 'text-text-primary'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-accent-cyan text-bg-base font-mono text-[0.8125rem] font-medium uppercase tracking-wider transition-all duration-200 hover:bg-[#00e6b8] hover:shadow-[0_0_40px_rgba(0,212,170,0.3)] opacity-0 animate-fade-up delay-1200"
          >
            View Dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      )}

      <style jsx>{`
        @keyframes draw-circle {
          from { stroke-dashoffset: 377; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 60; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
