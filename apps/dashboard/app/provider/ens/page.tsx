'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'
import { ProgressIndicator, providerSteps } from '@/components/ProgressIndicator'

type RecordStatus = 'missing' | 'verified'

export default function ProviderENSPage() {
  const [record1Status, setRecord1Status] = useState<RecordStatus>('missing')
  const [record2Status, setRecord2Status] = useState<RecordStatus>('missing')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleCopy = async (text: string, button: HTMLButtonElement) => {
    await navigator.clipboard.writeText(text)
    button.classList.add('!border-accent-cyan', '!text-accent-cyan')
    button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`
    setTimeout(() => {
      button.classList.remove('!border-accent-cyan', '!text-accent-cyan')
      button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
    }, 2000)
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRecord1Status('verified')
    await new Promise(resolve => setTimeout(resolve, 800))
    setRecord2Status('verified')
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsComplete(true)
  }

  const records = [
    {
      key: 'agent:erc8004',
      icon: 'identity',
      status: record1Status,
      desc: 'Links your ENS name to your on-chain agent identity. This allows the indexer to verify ownership.',
      value: 'eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:642',
      cliCommand: 'ens edit txt strategy.alice.eth agent:erc8004 "eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:642" -n sepolia',
    },
    {
      key: 'agent:a2a',
      icon: 'endpoint',
      status: record2Status,
      desc: 'Points to your A2A endpoint URL. Users and agents call this to request quotes and execute trades.',
      value: 'https://strategy-alice.workers.dev',
      cliCommand: 'ens edit txt strategy.alice.eth agent:a2a "https://strategy-alice.workers.dev" -n sepolia',
    },
  ]

  return (
    <div className="container max-w-[760px]">
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

      <ProgressIndicator steps={providerSteps} currentStep={2} />

      <div className="text-center py-8 pb-10 opacity-0 animate-fade-up delay-300">
        <div className="font-mono text-[0.6875rem] font-medium text-accent-blue uppercase tracking-[0.2em] mb-2">
          Step 2 of 2
        </div>
        <h1 className="font-display text-[2.25rem] font-bold tracking-tight mb-3">Configure ENS Records</h1>
        <p className="font-display text-base font-light text-text-secondary max-w-[520px] mx-auto">
          Set two TXT records on your ENS name so users can discover your agent and endpoint.
        </p>
      </div>

      {/* Main content */}
      {!isComplete && (
        <div className="pb-16">
          {/* Agent Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-bg-card border border-border-subtle backdrop-blur-xl mb-8 gap-4 opacity-0 animate-fade-up delay-400">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/30 font-mono font-bold text-accent-blue">
                SA
              </div>
              <div>
                <div className="font-mono text-base font-medium text-accent-blue">strategy.alice.eth</div>
                <div className="font-mono text-xs text-text-tertiary">Agent ID: #642</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-cyan/10 border border-accent-cyan/30 font-mono text-[0.6875rem] text-accent-cyan uppercase tracking-wider">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Registered
            </div>
          </div>

          {/* Records Section */}
          <div className="opacity-0 animate-fade-up delay-500">
            <div className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium text-text-tertiary uppercase tracking-[0.15em] mb-4">
              <div className="w-2 h-2 bg-accent-blue" />
              Required TXT Records
            </div>

            {records.map((record, i) => (
              <div
                key={record.key}
                className={`bg-bg-card border backdrop-blur-xl mb-4 transition-all ${
                  record.status === 'verified' ? 'border-accent-cyan/30' : 'border-color-dai/30'
                }`}
              >
                <div className="flex justify-between items-center p-4 border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center ${
                      record.icon === 'identity'
                        ? 'bg-color-dai/10 border border-color-dai/30 text-color-dai'
                        : 'bg-accent-blue/10 border border-accent-blue/30 text-accent-blue'
                    }`}>
                      {record.icon === 'identity' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                      )}
                    </div>
                    <span className="font-mono text-[0.9375rem] font-medium text-text-primary">{record.key}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-wider ${
                    record.status === 'verified' ? 'text-accent-cyan' : 'text-color-dai'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      record.status === 'verified' ? 'bg-accent-cyan' : 'bg-color-dai animate-pulse'
                    }`} />
                    {record.status === 'verified' ? 'Verified' : 'Not Set'}
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-display text-sm font-light text-text-secondary leading-relaxed mb-4">
                    {record.desc}
                  </p>

                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-2">
                    Value to Set
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-black/40 border border-border-subtle mb-5">
                    <span className="flex-1 font-mono text-[0.8125rem] text-accent-cyan break-all">{record.value}</span>
                    <button
                      onClick={(e) => handleCopy(record.value, e.currentTarget)}
                      className="flex items-center justify-center w-9 h-9 border border-border-subtle text-text-tertiary hover:border-border-accent hover:text-text-primary transition-all flex-shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  </div>

                  <div className="pt-5 border-t border-border-subtle">
                    <div className="flex items-center gap-2 font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                        <polyline points="4 17 10 11 4 5"/>
                        <line x1="12" y1="19" x2="20" y2="19"/>
                      </svg>
                      CLI Command
                    </div>
                    <div className="flex items-start gap-3 px-4 py-4 bg-black/40 border border-border-subtle">
                      <span className="font-mono text-xs text-accent-blue flex-shrink-0">$</span>
                      <span className="flex-1 font-mono text-xs text-text-secondary leading-relaxed break-all">
                        {record.cliCommand.split(' ').map((part, idx) => {
                          if (part.startsWith('agent:') || part === '-n') {
                            return <span key={idx} className="text-color-dai">{part} </span>
                          }
                          if (part.startsWith('"')) {
                            return <span key={idx} className="text-accent-cyan">{part} </span>
                          }
                          return <span key={idx}>{part} </span>
                        })}
                      </span>
                      <button
                        onClick={(e) => handleCopy(record.cliCommand, e.currentTarget)}
                        className="flex items-center justify-center w-9 h-9 border border-border-subtle text-text-tertiary hover:border-border-accent hover:text-text-primary transition-all flex-shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Verify Section */}
          <div className="mt-8 opacity-0 animate-fade-up delay-600">
            <div className="flex items-start gap-3 p-4 bg-accent-blue/5 border border-accent-blue/15 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-blue flex-shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="font-display text-[0.8125rem] text-text-secondary leading-relaxed">
                After setting both records via CLI or the ENS app, click verify to confirm they're configured correctly. Records may take a few minutes to propagate.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4.5 bg-accent-blue text-bg-base font-mono text-sm font-semibold uppercase tracking-wider transition-all hover:bg-[#6aa5ff] hover:shadow-[0_0_40px_rgba(82,152,255,0.3)] disabled:opacity-70"
              >
                {isVerifying ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"/>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Verify Records
                  </>
                )}
              </button>
              <a
                href="https://app.ens.domains/strategy.alice.eth"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-4.5 bg-transparent border border-border-subtle font-mono text-sm text-text-secondary hover:text-text-primary hover:border-border-accent transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                ENS App
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {isComplete && (
        <div className="text-center py-16 pb-12">
          <div className="relative w-[120px] h-[120px] mx-auto mb-8">
            <div className="absolute inset-[-20px] bg-[radial-gradient(circle,rgba(0,212,170,0.3),transparent_70%)] animate-pulse" />
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle
                cx="60" cy="60" r="56"
                fill="none" stroke="currentColor" strokeWidth="3"
                className="text-accent-cyan"
                style={{ strokeDasharray: 377, strokeDashoffset: 0, animation: 'draw-circle 0.6s ease-out forwards' }}
              />
              <polyline
                points="38 62 52 76 82 46"
                fill="none" stroke="currentColor" strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round"
                className="text-accent-cyan"
                style={{ strokeDasharray: 60, strokeDashoffset: 0, animation: 'draw-check 0.4s ease-out 0.5s forwards' }}
              />
            </svg>
          </div>

          <h2 className="font-display text-2xl font-bold mb-3 opacity-0 animate-fade-up delay-900">Setup Complete</h2>
          <p className="font-display text-base font-light text-text-secondary max-w-[440px] mx-auto mb-10 opacity-0 animate-fade-up delay-1000">
            Your agent is now fully configured and discoverable on the Oikonomos marketplace.
          </p>

          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-6 mb-8 text-left opacity-0 animate-fade-up delay-1100">
            <div className="font-mono text-[0.6875rem] font-medium text-text-tertiary uppercase tracking-[0.15em] mb-4">
              Configuration Verified
            </div>
            <div className="space-y-3">
              {[
                { label: 'On-chain Identity', value: 'Agent ID #642 registered' },
                { label: 'agent:erc8004', value: 'eip155:11155111:0x8004...BD9e:642' },
                { label: 'agent:a2a', value: 'https://strategy-alice.workers.dev' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-accent-cyan/5 border border-accent-cyan/15">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-cyan flex-shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <div>
                    <div className="font-mono text-[0.8125rem] text-text-primary">{item.label}</div>
                    <div className="font-mono text-[0.6875rem] text-accent-cyan break-all">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-2.5 px-8 py-4.5 bg-accent-cyan text-bg-base font-mono text-sm font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-[#00e6b8] hover:shadow-[0_0_40px_rgba(0,212,170,0.3)] opacity-0 animate-fade-up delay-1200"
          >
            Go to Dashboard
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
