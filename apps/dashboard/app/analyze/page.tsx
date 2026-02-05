'use client'

import { useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { baseSepolia } from 'wagmi/chains'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'
import { ProgressIndicator, consumerSteps } from '@/components/ProgressIndicator'

// Base Sepolia token addresses
const TOKEN_ADDRESSES = {
  USDC: '0x944a6D90b3111884CcCbfcc45B381b7C864D7943' as `0x${string}`,
  DAI: '0xCE728786975c72711e810aDCD9BC233A2a55d7C1' as `0x${string}`,
  WETH: '0x4200000000000000000000000000000000000006' as `0x${string}`,
}

const erc20Abi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const capabilities = [
  { label: 'Token Balances', icon: '◈' },
  { label: 'Asset Classification', icon: '◇' },
  { label: 'Risk Profile', icon: '△' },
  { label: 'Strategy Match', icon: '○' },
]

// Mock prices (in production, fetch from oracle/API)
const TOKEN_PRICES: Record<string, number> = {
  USDC: 1,
  DAI: 1,
  WETH: 3200,
  ETH: 3200,
}

export default function AnalyzePage() {
  const { isConnected, address } = useAccount()
  const barsRef = useRef<HTMLDivElement>(null)

  // Fetch native ETH balance
  const { data: ethBalance } = useBalance({
    address,
    chainId: baseSepolia.id,
  })

  // Fetch ERC-20 token balances
  const { data: tokenBalances, isLoading: isLoadingTokens } = useReadContracts({
    contracts: [
      {
        address: TOKEN_ADDRESSES.USDC,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: baseSepolia.id,
      },
      {
        address: TOKEN_ADDRESSES.DAI,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: baseSepolia.id,
      },
      {
        address: TOKEN_ADDRESSES.WETH,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: baseSepolia.id,
      },
    ],
    query: {
      enabled: !!address,
    },
  })

  // Process token data
  const tokens = useMemo(() => {
    if (!tokenBalances && !ethBalance) return []

    const result: Array<{
      symbol: string
      name: string
      balance: string
      rawBalance: number
      value: string
      valueNum: number
      percent: number
      color: string
      decimals: number
    }> = []

    // USDC (6 decimals)
    if (tokenBalances?.[0]?.result !== undefined) {
      const raw = Number(formatUnits(tokenBalances[0].result as bigint, 6))
      const value = raw * TOKEN_PRICES.USDC
      result.push({
        symbol: 'USDC',
        name: 'USD Coin',
        balance: raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        rawBalance: raw,
        value: `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        valueNum: value,
        percent: 0,
        color: 'usdc',
        decimals: 6,
      })
    }

    // DAI (18 decimals)
    if (tokenBalances?.[1]?.result !== undefined) {
      const raw = Number(formatUnits(tokenBalances[1].result as bigint, 18))
      const value = raw * TOKEN_PRICES.DAI
      result.push({
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        balance: raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        rawBalance: raw,
        value: `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        valueNum: value,
        percent: 0,
        color: 'dai',
        decimals: 18,
      })
    }

    // WETH (18 decimals)
    if (tokenBalances?.[2]?.result !== undefined) {
      const raw = Number(formatUnits(tokenBalances[2].result as bigint, 18))
      const value = raw * TOKEN_PRICES.WETH
      result.push({
        symbol: 'WETH',
        name: 'Wrapped Ether',
        balance: raw.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        rawBalance: raw,
        value: `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        valueNum: value,
        percent: 0,
        color: 'weth',
        decimals: 18,
      })
    }

    // ETH
    if (ethBalance) {
      const raw = Number(formatUnits(ethBalance.value, 18))
      const value = raw * TOKEN_PRICES.ETH
      result.push({
        symbol: 'ETH',
        name: 'Ether',
        balance: raw.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        rawBalance: raw,
        value: `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        valueNum: value,
        percent: 0,
        color: 'weth',
        decimals: 18,
      })
    }

    // Calculate percentages
    const totalValue = result.reduce((sum, t) => sum + t.valueNum, 0)
    if (totalValue > 0) {
      result.forEach(t => {
        t.percent = Math.round((t.valueNum / totalValue) * 100)
      })
    }

    // Filter out zero balances and sort by value
    return result.filter(t => t.rawBalance > 0).sort((a, b) => b.valueNum - a.valueNum)
  }, [tokenBalances, ethBalance])

  // Calculate totals
  const totalValue = tokens.reduce((sum, t) => sum + t.valueNum, 0)
  const stablecoinPercent = tokens
    .filter(t => ['USDC', 'DAI'].includes(t.symbol))
    .reduce((sum, t) => sum + t.percent, 0)
  const volatilePercent = 100 - stablecoinPercent

  useEffect(() => {
    if (!isConnected || isLoadingTokens) return
    const timeout = setTimeout(() => {
      barsRef.current?.querySelectorAll('[data-width]').forEach((el) => {
        const element = el as HTMLElement
        element.style.width = element.dataset.width || '0%'
      })
    }, 500)
    return () => clearTimeout(timeout)
  }, [isConnected, isLoadingTokens, tokens])

  return (
    <div className="container" ref={barsRef}>
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

      <ProgressIndicator steps={consumerSteps} currentStep={2} />

      <div className="py-12 pb-8 opacity-0 animate-fade-up delay-300">
        <div className="font-mono text-[0.6875rem] font-medium text-accent-blue uppercase tracking-[0.2em] mb-2">
          Step 2
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Portfolio Analysis</h1>
      </div>

      {/* Pre-connect State */}
      {!isConnected ? (
        <div className="pb-16">
          {/* Main Visual Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 mb-12">

            {/* Left: Animated Portfolio Visualization */}
            <div className="relative opacity-0 animate-fade-up delay-400">
              {/* Visualization Container */}
              <div className="relative bg-bg-card border border-border-subtle backdrop-blur-xl overflow-hidden min-h-[420px]">
                {/* Scanning Line Animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue to-transparent"
                    style={{
                      animation: 'scanLine 3s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Abstract Portfolio Shapes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Outer Ring */}
                  <div
                    className="absolute w-72 h-72 border border-border-subtle rounded-full"
                    style={{ animation: 'pulse 4s ease-in-out infinite' }}
                  />

                  {/* Middle Ring with Segments */}
                  <svg className="absolute w-64 h-64" viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="24" />

                    {/* USDC segment */}
                    <circle
                      cx="100" cy="100" r="80"
                      fill="none"
                      stroke="var(--color-usdc)"
                      strokeWidth="24"
                      strokeDasharray="251.2 502.4"
                      strokeDashoffset="0"
                      className="opacity-30"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                        animation: 'segmentPulse 3s ease-in-out infinite'
                      }}
                    />

                    {/* DAI segment */}
                    <circle
                      cx="100" cy="100" r="80"
                      fill="none"
                      stroke="var(--color-dai)"
                      strokeWidth="24"
                      strokeDasharray="241.15 502.4"
                      strokeDashoffset="-251.2"
                      className="opacity-30"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                        animation: 'segmentPulse 3s ease-in-out infinite 0.5s'
                      }}
                    />

                    {/* WETH segment */}
                    <circle
                      cx="100" cy="100" r="80"
                      fill="none"
                      stroke="var(--color-weth)"
                      strokeWidth="24"
                      strokeDasharray="10.05 502.4"
                      strokeDashoffset="-492.35"
                      className="opacity-30"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                        animation: 'segmentPulse 3s ease-in-out infinite 1s'
                      }}
                    />
                  </svg>

                  {/* Center Content */}
                  <div className="relative z-10 text-center">
                    <div className="font-mono text-[0.5625rem] uppercase tracking-[0.3em] text-text-tertiary mb-2">
                      Awaiting
                    </div>
                    <div className="font-mono text-4xl font-bold text-text-primary/20">
                      ? ? ?
                    </div>
                    <div className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-text-tertiary mt-2">
                      Connect to reveal
                    </div>
                  </div>
                </div>

                {/* Floating Token Indicators */}
                <div className="absolute top-6 left-6 flex items-center gap-2 opacity-0 animate-fade-up delay-600">
                  <div className="w-2 h-2 bg-color-usdc rounded-full animate-pulse-dot" />
                  <span className="font-mono text-[0.625rem] text-text-tertiary">USDC</span>
                </div>
                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 animate-fade-up delay-700">
                  <div className="w-2 h-2 bg-color-dai rounded-full animate-pulse-dot" />
                  <span className="font-mono text-[0.625rem] text-text-tertiary">DAI</span>
                </div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2 opacity-0 animate-fade-up delay-800">
                  <div className="w-2 h-2 bg-color-weth rounded-full animate-pulse-dot" />
                  <span className="font-mono text-[0.625rem] text-text-tertiary">WETH</span>
                </div>

                {/* Bottom Label */}
                <div className="absolute bottom-6 right-6 opacity-0 animate-fade-up delay-900">
                  <span className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest px-2 py-1 border border-border-subtle bg-black/20">
                    Portfolio Visualization
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Connect CTA */}
            <div className="flex flex-col gap-6 opacity-0 animate-fade-up delay-500">
              {/* Main CTA Card */}
              <div className="bg-bg-card border border-accent-blue/30 backdrop-blur-xl p-8 relative overflow-hidden flex-1">
                {/* Glow Effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-blue/20 blur-3xl rounded-full pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-14 h-14 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/30 mb-6">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="1.5">
                      <rect x="2" y="6" width="20" height="12" rx="2"/>
                      <circle cx="16" cy="12" r="2"/>
                      <path d="M6 12h4"/>
                    </svg>
                  </div>

                  <h2 className="font-display text-2xl font-bold mb-3 tracking-tight">
                    Connect to Analyze
                  </h2>

                  <p className="font-display text-sm font-light text-text-secondary leading-relaxed mb-8">
                    Link your wallet to scan token balances, classify your holdings, and receive AI-powered strategy recommendations tailored to your portfolio.
                  </p>

                  {/* Capabilities List */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {capabilities.map((cap, i) => (
                      <div
                        key={cap.label}
                        className="flex items-center gap-2 opacity-0 animate-fade-up"
                        style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                      >
                        <span className="text-accent-cyan font-mono text-sm">{cap.icon}</span>
                        <span className="font-mono text-[0.6875rem] text-text-secondary">{cap.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connect Button */}
                  <div className="space-y-4">
                    <WalletButton />
                    <p className="font-mono text-[0.625rem] text-text-tertiary">
                      Read-only access · No transactions · Your keys, your control
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-3 opacity-0 animate-fade-up delay-1000">
                <div className="bg-bg-card/50 border border-border-subtle p-4 text-center">
                  <div className="font-mono text-lg font-bold text-accent-cyan">100%</div>
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider">Client-Side</div>
                </div>
                <div className="bg-bg-card/50 border border-border-subtle p-4 text-center">
                  <div className="font-mono text-lg font-bold text-accent-blue">0</div>
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider">Data Stored</div>
                </div>
                <div className="bg-bg-card/50 border border-border-subtle p-4 text-center">
                  <div className="font-mono text-lg font-bold text-text-primary">ERC-20</div>
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider">Compatible</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: What You'll See */}
          <div className="opacity-0 animate-fade-up delay-1100">
            <div className="flex items-center gap-4 mb-6">
              <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-[0.2em]">
                What you'll see after connecting
              </div>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Preview Card 1 */}
              <div className="bg-bg-card/50 border border-border-subtle p-5 relative overflow-hidden group hover:border-border-accent transition-all">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-color-usdc via-color-dai to-color-weth opacity-50" />
                <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-3">Holdings</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-text-secondary">USDC</span>
                    <span className="font-mono text-xs text-text-tertiary">••••••</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-text-secondary">DAI</span>
                    <span className="font-mono text-xs text-text-tertiary">••••••</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-text-secondary">WETH</span>
                    <span className="font-mono text-xs text-text-tertiary">••••••</span>
                  </div>
                </div>
              </div>

              {/* Preview Card 2 */}
              <div className="bg-bg-card/50 border border-border-subtle p-5 relative overflow-hidden group hover:border-border-accent transition-all">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-cyan/50" />
                <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-3">Classification</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-text-secondary">Stablecoins</span>
                    <div className="w-16 h-1.5 bg-white/10 overflow-hidden">
                      <div className="h-full w-3/4 bg-accent-cyan/50" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-text-secondary">Volatile</span>
                    <div className="w-16 h-1.5 bg-white/10 overflow-hidden">
                      <div className="h-full w-1/4 bg-color-weth/50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Card 3 */}
              <div className="bg-bg-card/50 border border-border-subtle p-5 relative overflow-hidden group hover:border-border-accent transition-all">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-blue/50" />
                <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-3">Recommendation</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full" />
                  <span className="font-mono text-xs text-accent-cyan">Best Match</span>
                </div>
                <div className="font-mono text-sm text-text-secondary">Stablecoin Rebalance</div>
                <div className="font-mono text-[0.625rem] text-text-tertiary mt-1">5% drift threshold</div>
              </div>
            </div>
          </div>

          {/* Inline CSS for custom animations */}
          <style jsx>{`
            @keyframes scanLine {
              0%, 100% { top: 0; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            @keyframes segmentPulse {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 pb-12">
        {/* Portfolio Card */}
        <div className="bg-bg-card border border-border-subtle backdrop-blur-xl opacity-0 animate-fade-up delay-400">
          <div className="flex justify-between items-center p-5 border-b border-border-subtle">
            <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-text-secondary">
              Token Holdings
            </span>
            <div className="text-right">
              <div className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider">
                Total Value
              </div>
              {isLoadingTokens ? (
                <div className="font-mono text-2xl font-bold text-text-tertiary">Loading...</div>
              ) : (
                <div className="font-mono text-2xl font-bold">
                  <span className="text-accent-blue">$</span>
                  {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/^\$/, '').split('.')[0]}
                  <span className="text-accent-blue">.{totalValue.toFixed(2).split('.')[1]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Token Table */}
          {isLoadingTokens ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mb-4" />
              <div className="font-mono text-sm text-text-tertiary">Scanning wallet...</div>
            </div>
          ) : tokens.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/30 text-accent-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div className="font-mono text-sm text-text-secondary mb-2">No tokens found</div>
              <div className="font-mono text-xs text-text-tertiary">
                Your wallet has no supported tokens on Base Sepolia.<br/>
                Get test tokens from a faucet to continue.
              </div>
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_120px] gap-4 items-center px-6 py-3 bg-black/20">
                <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider">Asset</span>
                <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider">Balance</span>
                <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider">Value</span>
                <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider">Allocation</span>
              </div>

              {tokens.map((token) => (
                <div
                  key={token.symbol}
                  className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_120px] gap-3 md:gap-4 items-center px-6 py-4 border-b border-white/[0.04] hover:bg-accent-blue/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 flex items-center justify-center font-mono text-xs font-bold border ${
                      token.color === 'usdc' ? 'bg-color-usdc/10 border-color-usdc/30 text-color-usdc' :
                      token.color === 'dai' ? 'bg-color-dai/10 border-color-dai/30 text-color-dai' :
                      'bg-color-weth/10 border-color-weth/30 text-color-weth'
                    }`}>
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="font-mono text-sm font-medium">{token.symbol}</div>
                      <div className="font-mono text-[0.6875rem] text-text-tertiary">{token.name}</div>
                    </div>
                  </div>
                  <div className="font-mono text-sm text-text-primary">{token.balance}</div>
                  <div className="font-mono text-sm text-text-secondary">{token.value}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          token.color === 'usdc' ? 'bg-color-usdc' :
                          token.color === 'dai' ? 'bg-color-dai' : 'bg-color-weth'
                        }`}
                        style={{ width: 0 }}
                        data-width={`${token.percent}%`}
                      />
                    </div>
                    <span className="font-mono text-xs font-medium text-text-secondary min-w-[40px] text-right">
                      {token.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Classification */}
          {tokens.length > 0 && (
            <div className="p-6 border-t border-border-subtle">
              <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-4">
                Portfolio Classification
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="font-mono text-xs text-text-secondary">Stablecoins</span>
                    <span className="font-mono text-xs font-bold text-text-primary">{stablecoinPercent}%</span>
                  </div>
                  <div className="h-2 bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-color-usdc to-color-dai transition-all duration-1000"
                      style={{ width: 0 }}
                      data-width={`${stablecoinPercent}%`}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="font-mono text-xs text-text-secondary">Volatile</span>
                    <span className="font-mono text-xs font-bold text-text-primary">{volatilePercent}%</span>
                  </div>
                  <div className="h-2 bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-color-weth transition-all duration-1000"
                      style={{ width: 0 }}
                      data-width={`${volatilePercent}%`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Summary */}
          <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-6 opacity-0 animate-fade-up delay-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                {isLoadingTokens ? (
                  <div className="font-mono text-3xl font-bold text-text-tertiary">...</div>
                ) : (
                  <div className="font-mono text-3xl font-bold">
                    <span className="text-accent-blue">$</span>
                    {totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                )}
                <div className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider mt-1">
                  Portfolio Value
                </div>
              </div>
              <span className="font-mono text-[0.5625rem] text-accent-cyan uppercase tracking-wider px-2 py-1 bg-accent-cyan/10 border border-accent-cyan/20">
                {tokens.length} Asset{tokens.length !== 1 ? 's' : ''}
              </span>
            </div>

            {tokens.length > 0 && (
              <>
                <div className="mb-4">
                  <div className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider mb-2">
                    Allocation
                  </div>
                  <div className="flex h-3 bg-white/5 overflow-hidden">
                    {tokens.map((token) => (
                      <div
                        key={token.symbol}
                        className={`transition-all duration-1000 ${
                          token.color === 'usdc' ? 'bg-color-usdc' :
                          token.color === 'dai' ? 'bg-color-dai' : 'bg-color-weth'
                        }`}
                        style={{ width: 0 }}
                        data-width={`${token.percent}%`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-5 border-t border-border-subtle">
                  {tokens.map((token) => (
                    <div key={token.symbol} className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 ${
                        token.color === 'usdc' ? 'bg-color-usdc' :
                        token.color === 'dai' ? 'bg-color-dai' : 'bg-color-weth'
                      }`} />
                      <span className="font-mono text-xs text-text-secondary">{token.symbol}</span>
                      <div className="ml-auto flex gap-4">
                        <span className="font-mono text-xs text-text-tertiary min-w-[70px] text-right">{token.value}</span>
                        <span className="font-mono text-xs font-medium text-text-primary min-w-[36px] text-right">{token.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Policy Suggestion */}
          <div className="bg-bg-card border border-border-accent backdrop-blur-xl opacity-0 animate-fade-up delay-600">
            <div className="flex items-center justify-between p-5 border-b border-border-subtle">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 font-mono text-[0.625rem] font-medium text-accent-cyan uppercase tracking-wider">
                <span>✓</span> Recommended
              </span>
              <span className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest">
                AI Suggested
              </span>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold mb-1">Stablecoin Rebalance</h3>
              <p className="font-display text-sm font-light text-text-secondary mb-6">
                Maintain equal allocation between USDC and DAI with automatic rebalancing when drift exceeds threshold.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1">
                    Drift Threshold
                  </div>
                  <div className="font-mono text-base font-bold">
                    5<span className="text-text-tertiary font-normal text-xs">%</span>
                  </div>
                </div>
                <div className="p-3 bg-black/20 border border-border-subtle">
                  <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-1">
                    Max Slippage
                  </div>
                  <div className="font-mono text-base font-bold">
                    50<span className="text-text-tertiary font-normal text-xs">bps</span>
                  </div>
                </div>
              </div>

              <Link href="/discover" className="btn-primary w-full justify-center">
                Find Matching Agents
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
