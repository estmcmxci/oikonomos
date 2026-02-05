'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'
import { ProgressIndicator, consumerSteps } from '@/components/ProgressIndicator'

export default function ConfigurePage() {
  const [drift, setDrift] = useState(5)
  const [slippage, setSlippage] = useState(50)
  const [frequency, setFrequency] = useState('4')

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

      <ProgressIndicator steps={consumerSteps} currentStep={4} />

      <div className="py-8 pb-6 opacity-0 animate-fade-up delay-300">
        <div className="font-mono text-[0.6875rem] font-medium text-accent-blue uppercase tracking-[0.2em] mb-2">
          Step 4
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Configure Policy</h1>
      </div>

      {/* Agent Summary */}
      <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-bg-card border border-border-subtle backdrop-blur-xl mb-6 gap-4 opacity-0 animate-fade-up delay-400">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/20 font-mono font-bold text-accent-blue">
            TO
          </div>
          <div>
            <h3 className="font-mono font-medium">treasury.oikonomos.eth</h3>
            <div className="flex gap-4 font-mono text-[0.6875rem] text-text-tertiary">
              <span>Reputation: <strong className="text-text-secondary">85/100</strong></span>
              <span>Fee: <strong className="text-text-secondary">0.1%</strong></span>
              <span>Agent #643</span>
            </div>
          </div>
        </div>
        <Link href="/discover" className="font-mono text-[0.6875rem] text-accent-blue flex items-center gap-1 hover:text-[#6aa5ff] transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Change Agent
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 pb-12">
        {/* Config Card */}
        <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-500">
          <div className="flex items-center justify-between p-5 border-b border-border-subtle">
            <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-text-secondary">
              Policy Parameters
            </span>
            <span className="px-2.5 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 font-mono text-[0.625rem] font-medium text-accent-cyan uppercase tracking-wider">
              Stablecoin Rebalance
            </span>
          </div>

          <div className="p-6 space-y-8">
            {/* Target Allocation */}
            <div>
              <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider mb-3">
                Target Allocation
              </div>
              <div className="flex gap-3">
                <div className="flex-1 p-4 bg-black/20 border border-border-subtle text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-6 h-6 flex items-center justify-center bg-color-usdc/10 border border-color-usdc/30 font-mono text-[0.625rem] font-bold text-color-usdc">U</div>
                    <span className="font-mono text-xs text-text-secondary">USDC</span>
                  </div>
                  <div className="font-mono text-2xl font-bold">50<span className="text-base text-text-tertiary">%</span></div>
                </div>
                <div className="flex-1 p-4 bg-black/20 border border-border-subtle text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-6 h-6 flex items-center justify-center bg-color-dai/10 border border-color-dai/30 font-mono text-[0.625rem] font-bold text-color-dai">D</div>
                    <span className="font-mono text-xs text-text-secondary">DAI</span>
                  </div>
                  <div className="font-mono text-2xl font-bold">50<span className="text-base text-text-tertiary">%</span></div>
                </div>
              </div>
            </div>

            {/* Drift Threshold Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider">
                  Drift Threshold
                </span>
                <span className="font-mono font-bold text-accent-blue">
                  {drift}<span className="text-xs font-normal text-text-tertiary">%</span>
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={drift}
                onChange={(e) => setDrift(Number(e.target.value))}
                className="w-full h-2 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent-blue [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bg-base [&::-webkit-slider-thumb]:cursor-grab"
              />
              <div className="flex justify-between mt-2">
                <span className="font-mono text-[0.5625rem] text-text-tertiary">1%</span>
                <span className="font-mono text-[0.5625rem] text-text-tertiary">10%</span>
              </div>
            </div>

            {/* Max Slippage Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider">
                  Max Slippage
                </span>
                <span className="font-mono font-bold text-accent-blue">
                  {slippage}<span className="text-xs font-normal text-text-tertiary">bps</span>
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={slippage}
                onChange={(e) => setSlippage(Number(e.target.value))}
                className="w-full h-2 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent-blue [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bg-base [&::-webkit-slider-thumb]:cursor-grab"
              />
              <div className="flex justify-between mt-2">
                <span className="font-mono text-[0.5625rem] text-text-tertiary">10 bps</span>
                <span className="font-mono text-[0.5625rem] text-text-tertiary">100 bps</span>
              </div>
            </div>

            {/* Check Frequency */}
            <div>
              <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider mb-3">
                Check Frequency
              </div>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-border-subtle font-mono text-sm text-text-primary cursor-pointer outline-none focus:border-border-accent appearance-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2712%27%20height%3D%2712%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%235298FF%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27M6%209l6%206%206-6%27%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]"
              >
                <option value="1">Every 1 hour</option>
                <option value="4">Every 4 hours</option>
                <option value="12">Every 12 hours</option>
                <option value="24">Every 24 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Bounds Visualization */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-6 opacity-0 animate-fade-up delay-600">
            <div className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-text-secondary mb-5">
              Rebalancing Bounds
            </div>
            <div className="relative h-32 mb-4">
              {/* Bars */}
              <div className="absolute left-[15%] bottom-0 w-[30%] flex flex-col items-center">
                <div className="w-full h-20 bg-gradient-to-t from-color-usdc to-color-usdc/50 relative">
                  <div className="absolute -left-2.5 -right-2.5 top-0 h-0.5 bg-accent-cyan">
                    <span className="absolute -right-10 -top-1.5 font-mono text-[0.5rem] text-accent-cyan">{50 + drift}%</span>
                  </div>
                  <div className="absolute -left-2.5 -right-2.5 bottom-0 h-0.5 bg-accent-cyan">
                    <span className="absolute -right-10 -bottom-1.5 font-mono text-[0.5rem] text-accent-cyan">{50 - drift}%</span>
                  </div>
                </div>
                <span className="font-mono text-[0.625rem] text-text-tertiary mt-2">USDC</span>
                <span className="font-mono text-sm font-bold">50%</span>
              </div>
              <div className="absolute right-[15%] bottom-0 w-[30%] flex flex-col items-center">
                <div className="w-full h-20 bg-gradient-to-t from-color-dai to-color-dai/50 relative">
                  <div className="absolute -left-2.5 -right-2.5 top-0 h-0.5 bg-accent-cyan" />
                  <div className="absolute -left-2.5 -right-2.5 bottom-0 h-0.5 bg-accent-cyan" />
                </div>
                <span className="font-mono text-[0.625rem] text-text-tertiary mt-2">DAI</span>
                <span className="font-mono text-sm font-bold">50%</span>
              </div>
            </div>
            <div className="flex justify-center gap-5 pt-4 border-t border-border-subtle">
              <div className="flex items-center gap-1.5 font-mono text-[0.625rem] text-text-tertiary">
                <div className="w-2 h-2 bg-accent-cyan" />
                <span>Rebalance trigger</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[0.625rem] text-text-tertiary">
                <div className="w-2 h-2 border border-dashed border-text-tertiary" />
                <span>Target allocation</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-bg-card border border-border-accent backdrop-blur-xl opacity-0 animate-fade-up delay-700">
            <div className="p-4 border-b border-border-subtle">
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-text-secondary">
                Policy Summary
              </span>
            </div>
            <div className="p-5">
              <p className="font-display text-[0.9375rem] font-light text-text-secondary leading-relaxed mb-5">
                When USDC or DAI allocation drifts more than <strong className="text-text-primary font-medium">{drift}%</strong> from the 50/50 target,{' '}
                <strong className="text-text-primary font-medium">treasury.oikonomos.eth</strong> will automatically rebalance your portfolio.
                Maximum slippage allowed: <strong className="text-text-primary font-medium">{slippage} bps</strong>.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1">
                    Est. Annual Fee
                  </div>
                  <div className="font-mono font-bold">~$12<span className="text-xs font-normal text-text-tertiary">/yr</span></div>
                </div>
                <div className="p-3 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1">
                    Est. Rebalances
                  </div>
                  <div className="font-mono font-bold">~12<span className="text-xs font-normal text-text-tertiary">/yr</span></div>
                </div>
              </div>

              <Link href="/authorize" className="btn-primary w-full justify-center">
                Review & Authorize
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
