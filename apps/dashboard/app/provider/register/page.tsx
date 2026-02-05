'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'
import { ProgressIndicator, providerSteps } from '@/components/ProgressIndicator'

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'

export default function ProviderRegisterPage() {
  const [agentUri, setAgentUri] = useState('')
  const [endpointUrl, setEndpointUrl] = useState('')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const validateEndpoint = async () => {
    if (!endpointUrl) return

    setValidationState('validating')

    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1500))

    const isValid = endpointUrl.includes('workers.dev') || endpointUrl.includes('localhost')
    setValidationState(isValid ? 'valid' : 'invalid')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 2500))
    setIsRegistered(true)
  }

  const canSubmit = agentUri && validationState === 'valid'

  return (
    <div className="container max-w-[720px]">
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

      <ProgressIndicator steps={providerSteps} currentStep={1} />

      <div className="text-center py-8 pb-10 opacity-0 animate-fade-up delay-300">
        <div className="font-mono text-[0.6875rem] font-medium text-accent-blue uppercase tracking-[0.2em] mb-2">
          Step 1 of 2
        </div>
        <h1 className="font-display text-[2.25rem] font-bold tracking-tight mb-3">Register On-Chain Identity</h1>
        <p className="font-display text-base font-light text-text-secondary max-w-[500px] mx-auto">
          Mint your agentId (ERC-721) to become discoverable on the Oikonomos marketplace.
        </p>
      </div>

      {/* Form content */}
      {!isRegistered && (
        <div className="pb-16">
          {/* Agent URI Card */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl mb-6 opacity-0 animate-fade-up delay-400">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Agent Identity
              </span>
            </div>
            <div className="p-6">
              <div>
                <label className="block font-mono text-[0.6875rem] font-medium text-text-secondary uppercase tracking-wider mb-2.5">
                  Agent URI (ENS Name)
                </label>
                <input
                  type="text"
                  value={agentUri}
                  onChange={(e) => setAgentUri(e.target.value)}
                  placeholder="strategy.yourname.eth"
                  className="w-full px-4 py-3.5 bg-black/40 border border-border-subtle font-mono text-sm text-text-primary outline-none transition-all focus:border-accent-blue focus:shadow-[0_0_0_3px_rgba(82,152,255,0.1)] placeholder:text-text-tertiary"
                />
                <p className="font-display text-xs font-light text-text-tertiary mt-2">
                  This will be your public identifier. Use an ENS name you own or plan to register.
                </p>
              </div>
            </div>
          </div>

          {/* Endpoint Validation Card */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl mb-6 opacity-0 animate-fade-up delay-500">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Strategy Endpoint
              </span>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block font-mono text-[0.6875rem] font-medium text-text-secondary uppercase tracking-wider mb-2.5">
                  Worker URL
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={endpointUrl}
                    onChange={(e) => {
                      setEndpointUrl(e.target.value)
                      setValidationState('idle')
                    }}
                    placeholder="https://my-strategy.workers.dev"
                    className={`flex-1 px-4 py-3.5 bg-black/40 border font-mono text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary ${
                      validationState === 'valid' ? 'border-accent-cyan' :
                      validationState === 'invalid' ? 'border-accent-red' :
                      'border-border-subtle focus:border-accent-blue'
                    } focus:shadow-[0_0_0_3px_rgba(82,152,255,0.1)]`}
                  />
                  <button
                    onClick={validateEndpoint}
                    disabled={validationState === 'validating'}
                    className={`flex items-center justify-center gap-2 px-5 py-3.5 border font-mono text-xs font-medium whitespace-nowrap transition-all ${
                      validationState === 'validating' ? 'border-accent-blue text-accent-blue pointer-events-none' :
                      validationState === 'valid' ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan' :
                      validationState === 'invalid' ? 'bg-accent-red/10 border-accent-red text-accent-red' :
                      'border-border-subtle text-text-secondary hover:border-border-accent hover:text-text-primary'
                    }`}
                  >
                    {validationState === 'validating' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"/>
                        </svg>
                        Checking...
                      </>
                    ) : validationState === 'valid' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Valid
                      </>
                    ) : validationState === 'invalid' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Failed
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Validate
                      </>
                    )}
                  </button>
                </div>
                <p className="font-display text-xs font-light text-text-tertiary mt-2">
                  Your Cloudflare Worker must implement the A2A protocol endpoints.
                </p>
              </div>

              {/* Validation Result */}
              {validationState !== 'idle' && validationState !== 'validating' && (
                <div className={`p-4 border ${
                  validationState === 'valid'
                    ? 'bg-accent-cyan/5 border-accent-cyan/20'
                    : 'bg-accent-red/5 border-accent-red/20'
                }`}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={validationState === 'valid' ? 'text-accent-cyan' : 'text-accent-red'}>
                      {validationState === 'valid' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      )}
                    </div>
                    <span className={`font-mono text-[0.8125rem] font-medium ${
                      validationState === 'valid' ? 'text-accent-cyan' : 'text-accent-red'
                    }`}>
                      {validationState === 'valid' ? 'A2A Compliant' : 'Validation Failed'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {validationState === 'valid' ? (
                      ['/.well-known/agent-card.json found', '/capabilities endpoint responding', '/quote endpoint responding', '/execute endpoint responding'].map((check, i) => (
                        <div key={i} className="flex items-center gap-2 font-mono text-xs text-text-secondary">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-cyan">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {check}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 font-mono text-xs text-text-secondary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-red">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Could not reach endpoint
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Preview Card */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl mb-6 opacity-0 animate-fade-up delay-600">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
                Transaction Preview
              </span>
            </div>
            <div className="p-6">
              <div className="bg-black/40 border border-border-subtle p-5">
                {[
                  { label: 'Contract', value: 'IdentityRegistry', isAddress: true },
                  { label: 'Method', value: 'register(agentURI, metadata)', isMethod: true },
                  { label: 'Agent URI', value: agentUri || '—' },
                  { label: 'Network', value: 'Sepolia' },
                  { label: 'Est. Gas', value: '~85,000' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2.5 border-b border-white/[0.04] last:border-b-0">
                    <span className="font-mono text-[0.6875rem] text-text-tertiary">{row.label}</span>
                    <span className={`font-mono text-[0.8125rem] font-medium ${
                      row.isAddress ? 'text-accent-blue' :
                      row.isMethod ? 'text-color-dai' :
                      'text-text-primary'
                    }`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="opacity-0 animate-fade-up delay-700">
            <div className="flex items-start gap-3 p-4 bg-accent-blue/5 border border-accent-blue/15 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-blue flex-shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="font-display text-[0.8125rem] text-text-secondary leading-relaxed">
                <strong className="text-text-primary">This will mint an ERC-721 token.</strong>{' '}
                Your agentId becomes your on-chain identity. You'll need to configure ENS records in the next step.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="btn-primary w-full justify-center py-5 text-[0.9375rem] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"/>
                  </svg>
                  Awaiting confirmation...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Register Agent
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {isRegistered && (
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

          <h2 className="font-display text-2xl font-bold mb-3 opacity-0 animate-fade-up delay-900">Agent Registered</h2>
          <p className="font-display text-base font-light text-text-secondary mb-8 opacity-0 animate-fade-up delay-1000">
            Your on-chain identity has been minted. Now configure your ENS records.
          </p>

          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-5 mb-8 text-left opacity-0 animate-fade-up delay-1100">
            {[
              { label: 'Agent ID', value: '#642', highlight: 'cyan' },
              { label: 'Agent URI', value: agentUri, highlight: 'blue' },
              { label: 'Transaction', value: '0x8f3a...c2d1', highlight: 'blue' },
              { label: 'Status', value: 'Confirmed', highlight: 'cyan' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2.5 border-b border-white/[0.04] last:border-b-0">
                <span className="font-mono text-[0.6875rem] text-text-tertiary">{row.label}</span>
                <span className={`font-mono text-[0.8125rem] font-medium ${
                  row.highlight === 'cyan' ? 'text-accent-cyan' : 'text-accent-blue'
                }`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/provider/ens"
            className="inline-flex items-center gap-2.5 px-8 py-4.5 bg-accent-blue text-bg-base font-mono text-sm font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-[#6aa5ff] hover:shadow-[0_0_40px_rgba(82,152,255,0.3)] opacity-0 animate-fade-up delay-1200"
          >
            Configure ENS
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
