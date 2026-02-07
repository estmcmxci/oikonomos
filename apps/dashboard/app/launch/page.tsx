'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ProgressIndicator, launchSteps } from '@/components/ProgressIndicator'
import { WalletGate } from '@/components/WalletGate'
import { useLaunch, type FormData, type TokenInfo } from '@/lib/launch-context'
import type { LaunchStep } from '@/lib/api'
import { parseEther, formatEther, type Address } from 'viem'
import { useSendTransaction, useWaitForTransactionReceipt, useSwitchChain, useBalance, useChainId } from 'wagmi'

const stageToStep: Record<string, number> = {
  form: 1,
  funding: 2,
  launching: 3,
  discovering: 3,
  ens: 4,
  result: 5,
}

export default function LaunchPage() {
  const { state } = useLaunch()

  return (
    <div className="container">
      <Header showNav showWallet />
      <ProgressIndicator steps={launchSteps} currentStep={stageToStep[state.stage] ?? 1} />

      <WalletGate stepNumber={1} stepLabel="Connect Wallet">
        {state.stage === 'form' && <LaunchForm />}
        {state.stage === 'funding' && <FundingStep />}
        {state.stage === 'launching' && <LaunchProgress />}
        {state.stage === 'discovering' && <TokenDiscoveryStep />}
        {state.stage === 'ens' && <ENSProgress />}
        {state.stage === 'result' && <LaunchResult />}
      </WalletGate>

      <Footer />
    </div>
  )
}

// ── Launch Form ─────────────────────────────────────────────────────

function LaunchForm() {
  const { startLaunch, state } = useLaunch()
  const [agentName, setAgentName] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenDescription, setTokenDescription] = useState('')
  const [platform, setPlatform] = useState<FormData['platform']>('clawstr')
  const [feeSplit, setFeeSplit] = useState(80)
  const [nameError, setNameError] = useState('')

  const validateName = useCallback((val: string) => {
    if (val && !/^[a-z0-9]+$/.test(val)) {
      setNameError('Lowercase alphanumeric only')
    } else {
      setNameError('')
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agentName || !tokenName || !tokenSymbol || nameError) return
    startLaunch({
      agentName,
      tokenName,
      tokenSymbol,
      tokenDescription,
      platform,
      feeSplit,
    })
  }

  return (
    <div className="max-w-xl mx-auto py-8 md:py-12 opacity-0 animate-fade-up delay-300">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-5 md:p-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/40 to-transparent" />

        <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-1">
          Configure Agent
        </h2>
        <p className="font-display text-sm font-light text-text-secondary mb-6 md:mb-8">
          Two API calls create a treasury + DeFi agent pair with wallets, ENS subnames, and on-chain identity.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Agent Name */}
          <div>
            <label className="block font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => {
                const v = e.target.value.toLowerCase()
                setAgentName(v)
                validateName(v)
              }}
              placeholder="myagent"
              required
              className="w-full bg-bg-base border border-border-subtle px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-accent-blue transition-colors"
            />
            {nameError && (
              <p className="font-mono text-[0.625rem] text-red-400 mt-1">{nameError}</p>
            )}
          </div>

          {/* Token Name */}
          <div>
            <label className="block font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
              Token Name
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="My Agent Token"
              required
              className="w-full bg-bg-base border border-border-subtle px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
              placeholder="AGENT"
              required
              maxLength={10}
              className="w-full bg-bg-base border border-border-subtle px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          {/* Token Description */}
          <div>
            <label className="block font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              value={tokenDescription}
              onChange={(e) => setTokenDescription(e.target.value)}
              placeholder="What does your agent do?"
              rows={3}
              className="w-full bg-bg-base border border-border-subtle px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-accent-blue transition-colors resize-none"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as FormData['platform'])}
              className="w-full bg-bg-base border border-border-subtle px-4 py-3 font-mono text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors appearance-none"
            >
              <option value="clawstr">Clawstr (default)</option>
              <option value="moltbook">Moltbook</option>
              <option value="4claw">4Claw</option>
              <option value="moltx">MoltX</option>
            </select>
          </div>

          {/* Fee Split */}
          <div>
            <label className="block font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
              Fee Split &mdash; {feeSplit}% to deployer
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={feeSplit}
              onChange={(e) => setFeeSplit(Number(e.target.value))}
              className="w-full accent-accent-blue"
            />
            <div className="flex justify-between font-mono text-[0.5625rem] text-text-tertiary mt-1">
              <span>0% (agent keeps all)</span>
              <span>100% (deployer keeps all)</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!agentName || !tokenName || !tokenSymbol || !!nameError || state.isGeneratingWallets}
            className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent-blue disabled:hover:shadow-none mt-4"
          >
            {state.isGeneratingWallets ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating Wallets...
              </>
            ) : (
              <>
                Deploy Agent Pair
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>

          {state.generateWalletsError && (
            <p className="font-mono text-sm text-red-400 mt-3 text-center">{state.generateWalletsError}</p>
          )}
          {state.launchError && (
            <p className="font-mono text-sm text-red-400 mt-3 text-center">{state.launchError}</p>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Funding Step ─────────────────────────────────────────────────────

const BASE_SEPOLIA_CHAIN_ID = 84532

function FundingStep() {
  const { state, dispatch, confirmLaunch } = useLaunch()
  const { walletInfo, fundingStatus } = state
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const autoAdvancedRef = useRef(false)

  const isWrongChain = currentChainId !== BASE_SEPOLIA_CHAIN_ID

  // Poll treasury wallet balance on Base Sepolia
  const { data: treasuryBalanceData } = useBalance({
    address: walletInfo?.treasuryWallet.address,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    query: { refetchInterval: 5000 },
  })

  // Poll defi wallet balance on Base Sepolia
  const { data: defiBalanceData } = useBalance({
    address: walletInfo?.defiWallet.address,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    query: { refetchInterval: 5000 },
  })

  const requiredAmount = parseEther(walletInfo?.requiredFunding.amountPerWallet || '0.01')
  const treasuryFunded = (treasuryBalanceData?.value ?? BigInt(0)) >= requiredAmount
  const defiFunded = (defiBalanceData?.value ?? BigInt(0)) >= requiredAmount
  const bothFunded = treasuryFunded && defiFunded

  // Update funding status based on balance polling
  useEffect(() => {
    if (treasuryFunded && fundingStatus.treasury !== 'funded') {
      dispatch({ type: 'FUNDING_UPDATE', wallet: 'treasury', status: 'funded' })
    }
  }, [treasuryFunded, fundingStatus.treasury, dispatch])

  useEffect(() => {
    if (defiFunded && fundingStatus.defi !== 'funded') {
      dispatch({ type: 'FUNDING_UPDATE', wallet: 'defi', status: 'funded' })
    }
  }, [defiFunded, fundingStatus.defi, dispatch])

  // Auto-advance when both wallets are funded
  useEffect(() => {
    if (bothFunded && !autoAdvancedRef.current) {
      autoAdvancedRef.current = true
      // Small delay so user can see the "funded" state
      const timer = setTimeout(() => confirmLaunch(), 1500)
      return () => clearTimeout(timer)
    }
  }, [bothFunded, confirmLaunch])

  if (!walletInfo) return null

  return (
    <div className="max-w-xl mx-auto py-8 md:py-12 opacity-0 animate-fade-up delay-300">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-5 md:p-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />

        <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-1">
          Fund Agent Wallets
        </h2>
        <p className="font-display text-sm font-light text-text-secondary mb-6">
          Each agent needs {walletInfo.requiredFunding.amountPerWallet} {walletInfo.requiredFunding.chainName} ETH for on-chain identity registration (ERC-8004).
        </p>

        {/* Chain switch banner */}
        {isWrongChain && (
          <div className="mb-6 p-3 md:p-4 bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-amber-400">Wrong network</p>
              <p className="font-mono text-[0.625rem] text-text-tertiary mt-1">
                Switch to {walletInfo.requiredFunding.chainName} to fund wallets
              </p>
            </div>
            <button
              onClick={() => switchChain({ chainId: BASE_SEPOLIA_CHAIN_ID })}
              className="btn-primary text-sm px-4 py-2 shrink-0"
            >
              Switch Chain
            </button>
          </div>
        )}

        {/* Wallet funding cards */}
        <div className="space-y-4 mb-6">
          <WalletFundCard
            label="Treasury Agent"
            address={walletInfo.treasuryWallet.address}
            name={walletInfo.treasuryWallet.name}
            balance={treasuryBalanceData?.value ?? BigInt(0)}
            isFunded={treasuryFunded}
            requiredAmount={walletInfo.requiredFunding.amountPerWallet}
            disabled={isWrongChain}
          />
          <WalletFundCard
            label="DeFi Agent"
            address={walletInfo.defiWallet.address}
            name={walletInfo.defiWallet.name}
            balance={defiBalanceData?.value ?? BigInt(0)}
            isFunded={defiFunded}
            requiredAmount={walletInfo.requiredFunding.amountPerWallet}
            disabled={isWrongChain}
          />
        </div>

        {/* Auto-advance indicator */}
        {bothFunded && (
          <div className="text-center p-4 bg-accent-cyan/5 border border-accent-cyan/20">
            <div className="w-6 h-6 mx-auto mb-2 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-sm text-accent-cyan">Both wallets funded — starting deployment...</p>
          </div>
        )}
      </div>
    </div>
  )
}

function WalletFundCard({
  label,
  address,
  name,
  balance,
  isFunded,
  requiredAmount,
  disabled,
}: {
  label: string
  address: Address
  name: string
  balance: bigint
  isFunded: boolean
  requiredAmount: string
  disabled: boolean
}) {
  const { sendTransaction, isPending: isSending, data: txHash } = useSendTransaction()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash })
  const [copied, setCopied] = useState(false)

  const handleSend = () => {
    sendTransaction({
      to: address,
      value: parseEther(requiredAmount),
      chainId: BASE_SEPOLIA_CHAIN_ID,
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isInProgress = isSending || isConfirming

  return (
    <div className={`p-4 md:p-5 border transition-colors ${isFunded ? 'bg-accent-cyan/5 border-accent-cyan/20' : 'bg-bg-base/50 border-border-subtle'}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          {isFunded ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : isInProgress ? (
            <div className="w-4 h-4 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="w-4 h-4 rounded-full border border-border-subtle" />
          )}
          <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-[0.2em]">
            {label}
          </span>
        </div>
        <span className="font-mono text-[0.625rem] text-text-tertiary truncate">
          {name}.oikonomosapp.eth
        </span>
      </div>

      {/* Address + copy */}
      <div className="flex items-center gap-2 mb-3">
        <code className="font-mono text-sm text-text-primary flex-1 truncate">
          {address}
        </code>
        <button
          onClick={handleCopy}
          className="text-text-tertiary hover:text-text-primary transition-colors shrink-0"
          title="Copy address"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          )}
        </button>
      </div>

      {/* Balance */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span className="font-mono text-[0.625rem] text-text-tertiary">
          Balance: {formatEther(balance)} ETH
        </span>

        {isFunded ? (
          <span className="font-mono text-[0.625rem] text-accent-cyan font-medium">Funded</span>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled || isInProgress}
            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : `Send ${requiredAmount} ETH`}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Launch Progress ─────────────────────────────────────────────────

// Steps remaining after user-funded wallets (funding steps removed)
const EXPECTED_STEPS: { name: string; duration: number }[] = [
  { name: 'Generate treasury wallet', duration: 2 },
  { name: 'Register treasury ERC-8004', duration: 15 },
  { name: 'Store treasury in KV', duration: 2 },
  { name: 'Generate DeFi wallet', duration: 2 },
  { name: 'Register DeFi ERC-8004', duration: 15 },
  { name: 'Generate Nostr keys', duration: 2 },
  { name: 'Launch token on platform', duration: 20 },
  { name: 'Sign delegation', duration: 5 },
  { name: 'Register treasury ENS', duration: 15 },
  { name: 'Register DeFi ENS', duration: 3 },
]

// Build cumulative time thresholds: step i completes at thresholds[i] seconds
const STEP_THRESHOLDS = EXPECTED_STEPS.reduce<number[]>((acc, step, i) => {
  acc.push((acc[i - 1] ?? 0) + step.duration)
  return acc
}, [])

function useSimulatedSteps(elapsed: number): LaunchStep[] {
  return EXPECTED_STEPS.map((step, i) => {
    const completedAt = STEP_THRESHOLDS[i]
    const startedAt = STEP_THRESHOLDS[i - 1] ?? 0

    let status: LaunchStep['status']
    if (elapsed >= completedAt) {
      status = 'completed'
    } else if (elapsed >= startedAt) {
      status = 'pending' // "in progress" — currently running
    } else {
      status = 'pending'
    }

    return { step: step.name, status }
  })
}

function LaunchProgress() {
  const { state, startTokenDiscovery } = useLaunch()
  const { portfolioResult, isLaunching } = state
  const [elapsed, setElapsed] = useState(0)
  const deployComplete = !!portfolioResult && !isLaunching

  useEffect(() => {
    if (deployComplete) return // Stop timer once deploy finishes
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [deployComplete])

  // Use real steps once API returns, otherwise simulate
  const realSteps = portfolioResult?.steps
  const simulatedSteps = useSimulatedSteps(elapsed)
  const steps = realSteps ?? simulatedSteps

  // Count how many simulated steps are "active" (the one currently running)
  const activeSimIndex = !realSteps
    ? STEP_THRESHOLDS.findIndex((t) => elapsed < t)
    : -1

  return (
    <div className="max-w-xl mx-auto py-8 md:py-12 opacity-0 animate-fade-up delay-300">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-5 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight">
            {deployComplete ? 'Deployment Complete' : 'Deploying...'}
          </h2>
          <span className="font-mono text-xs text-text-tertiary">{elapsed}s</span>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <StepRow
              key={i}
              step={step}
              index={i}
              active={!realSteps && i === activeSimIndex}
              pulse={!realSteps && i === activeSimIndex}
            />
          ))}
        </div>

        {state.launchError && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20">
            <p className="font-mono text-sm text-red-400">{state.launchError}</p>
          </div>
        )}

        {/* Continue button — shown after deploy completes */}
        {deployComplete && !state.launchError && (
          <button
            onClick={startTokenDiscovery}
            className="btn-primary w-full justify-center mt-6"
          >
            Discover Token
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function StepRow({
  step,
  index,
  active,
  pulse,
}: {
  step: LaunchStep
  index: number
  active?: boolean
  pulse?: boolean
}) {
  const completedIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
  const failedIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
  const deferredIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5298FF" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  )
  const spinnerIcon = (
    <div className="w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
  )
  const pendingIcon = (
    <div className={`w-4 h-4 rounded-full border border-border-subtle ${pulse ? 'animate-pulse-dot' : ''}`} />
  )

  let icon: React.ReactNode
  if (active) {
    icon = spinnerIcon
  } else if (step.status === 'completed') {
    icon = completedIcon
  } else if (step.status === 'failed') {
    icon = failedIcon
  } else if (step.status === 'deferred') {
    icon = deferredIcon
  } else {
    icon = pendingIcon
  }

  // Dim rows that haven't started yet (only during simulation)
  const dimmed = !active && step.status === 'pending'

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-bg-base/30 border border-border-subtle/30 opacity-0 animate-fade-up transition-opacity duration-300 ${
        dimmed ? 'opacity-40' : ''
      } ${active ? '!border-accent-cyan/30 bg-accent-cyan/5' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`font-mono text-sm ${active ? 'text-accent-cyan' : 'text-text-primary'}`}>{step.step}</span>
        {step.details && (
          <span className="font-mono text-[0.625rem] text-text-tertiary ml-2">{step.details}</span>
        )}
      </div>
      {step.txHash && (
        <a
          href={explorerUrl(step.txHash, step.step)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[0.625rem] text-accent-blue hover:underline shrink-0"
        >
          {step.txHash.slice(0, 6)}...{step.txHash.slice(-4)}
        </a>
      )}
    </div>
  )
}

// ── Token Discovery ─────────────────────────────────────────────────

function TokenDiscoveryStep() {
  const { state, registerDeFiENS, dispatch } = useLaunch()
  const { isDiscoveringToken, tokenPollAttempt, tokenInfo, hasDeferredENS, formData } = state
  const maxAttempts = 18
  const elapsedSecs = tokenPollAttempt * 10

  const defiEnsName = formData ? `${formData.agentName}.oikonomosapp.eth` : ''

  // Build the ENS records that will be written
  const ensRecords = tokenInfo
    ? [
        { key: 'agent:token:symbol', value: tokenInfo.tokenSymbol },
        { key: 'agent:token:address', value: tokenInfo.tokenAddress },
        { key: 'agent:token:clanker', value: tokenInfo.clankerUrl },
        { key: 'agent:erc8004', value: '(auto)' },
        { key: 'agent:a2a', value: '(auto)' },
      ].filter((r) => r.value)
    : []

  const handleSkipENS = () => {
    dispatch({ type: 'ENS_SUCCESS', result: { success: true } })
  }

  return (
    <div className="max-w-xl mx-auto py-8 md:py-12 opacity-0 animate-fade-up delay-300">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-5 md:p-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/40 to-transparent" />

        {isDiscoveringToken ? (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
            <h2 className="font-display text-xl font-bold tracking-tight mb-2">
              Discovering Token
            </h2>
            <p className="font-display text-sm font-light text-text-secondary mb-6">
              Waiting for Clawnch to deploy your token on Base...
            </p>

            {/* Progress bar */}
            <div className="w-full h-1 bg-bg-base/50 border border-border-subtle/30 mb-3 overflow-hidden">
              <div
                className="h-full bg-accent-blue transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min((tokenPollAttempt / maxAttempts) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[0.625rem] text-text-tertiary">
              <span>Attempt {tokenPollAttempt}/{maxAttempts}</span>
              <span>~{elapsedSecs}s elapsed</span>
            </div>
          </div>
        ) : tokenInfo && hasDeferredENS ? (
          <ENSRegistrationPrompt
            tokenInfo={tokenInfo}
            defiEnsName={defiEnsName}
            ensRecords={ensRecords}
            defiAgentAddress={state.portfolioResult?.defiAgent?.address}
            onRegister={registerDeFiENS}
            onSkip={handleSkipENS}
          />

        ) : tokenInfo ? (
          /* Token found but no deferred ENS — auto-advancing to result */
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight mb-2">Token Found</h2>
            <p className="font-mono text-sm text-accent-cyan">${tokenInfo.tokenSymbol}</p>
          </div>
        ) : hasDeferredENS ? (
          /* Token timed out but ENS still deferred — let user register without token records */
          <ENSRegistrationPrompt
            tokenInfo={null}
            defiEnsName={defiEnsName}
            ensRecords={[
              { key: 'agent:erc8004', value: '(auto)' },
              { key: 'agent:a2a', value: '(auto)' },
            ]}
            defiAgentAddress={state.portfolioResult?.defiAgent?.address}
            onRegister={registerDeFiENS}
            onSkip={handleSkipENS}
            timedOut
          />
        ) : (
          /* Token timed out, no deferred ENS */
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight mb-2">
              Token Not Found Yet
            </h2>
            <p className="font-display text-sm font-light text-text-secondary">
              Clawnch may still be deploying your token. It should appear on your agent&apos;s ENS record once deployed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ENS Registration Prompt (with Sepolia funding) ──────────────────

const SEPOLIA_CHAIN_ID = 11155111
const ENS_FUNDING_AMOUNT = '0.002' // ~0.002 ETH covers CCIP registration + 3-5 setText calls

function ENSRegistrationPrompt({
  tokenInfo,
  defiEnsName,
  ensRecords,
  defiAgentAddress,
  onRegister,
  onSkip,
  timedOut,
}: {
  tokenInfo: TokenInfo | null
  defiEnsName: string
  ensRecords: { key: string; value: string }[]
  defiAgentAddress?: Address
  onRegister: () => void
  onSkip: () => void
  timedOut?: boolean
}) {
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { sendTransaction, isPending: isSending, data: txHash } = useSendTransaction()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash })
  const [copied, setCopied] = useState(false)

  const isWrongChain = currentChainId !== SEPOLIA_CHAIN_ID

  // Poll agent wallet balance on Sepolia
  const { data: agentBalanceData } = useBalance({
    address: defiAgentAddress,
    chainId: SEPOLIA_CHAIN_ID,
    query: { refetchInterval: 5000 },
  })

  const requiredAmount = parseEther(ENS_FUNDING_AMOUNT)
  const isFunded = (agentBalanceData?.value ?? BigInt(0)) >= requiredAmount

  const handleSend = () => {
    if (!defiAgentAddress) return
    sendTransaction({
      to: defiAgentAddress,
      value: requiredAmount,
      chainId: SEPOLIA_CHAIN_ID,
    })
  }

  const handleCopy = () => {
    if (!defiAgentAddress) return
    navigator.clipboard.writeText(defiAgentAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* Token header */}
      <div className="text-center mb-6">
        {timedOut ? (
          <>
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight mb-1">
              Token Not Found Yet
            </h2>
            <p className="font-display text-sm font-light text-text-secondary">
              Clawnch may still be deploying. You can register the DeFi agent&apos;s ENS now (without token records) or skip.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight mb-1">
              Token Discovered
            </h2>
            <p className="font-mono text-sm text-accent-cyan">
              ${tokenInfo?.tokenSymbol}
            </p>
          </>
        )}
      </div>

      {/* Token details (only shown when token was found) */}
      {tokenInfo && (
        <div className="space-y-3 p-4 bg-bg-base/50 border border-border-subtle mb-6">
          <ResultField label="Token Address" value={tokenInfo.tokenAddress} mono truncate />
          <ResultField label="Symbol" value={tokenInfo.tokenSymbol} />
          {tokenInfo.clankerUrl && (
            <div>
              <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest">Clanker</div>
              <a href={tokenInfo.clankerUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-accent-blue hover:underline break-all">
                {tokenInfo.clankerUrl}
              </a>
            </div>
          )}
          {tokenInfo.dexScreenerUrl && (
            <div>
              <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest">DexScreener</div>
              <a href={tokenInfo.dexScreenerUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-accent-blue hover:underline break-all">
                {tokenInfo.dexScreenerUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {/* ENS Records Preview */}
      <div className="mb-6">
        <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-[0.2em] mb-3">
          ENS Records for {defiEnsName}
        </div>
        <div className="space-y-2">
          {ensRecords.map(({ key, value }) => (
            <div key={key} className="flex items-start gap-3 p-2.5 bg-bg-base/30 border border-border-subtle/30">
              <span className="font-mono text-[0.625rem] text-accent-blue shrink-0 pt-0.5">{key}</span>
              <span className="font-mono text-[0.625rem] text-text-primary break-all">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sepolia funding step */}
      {defiAgentAddress && !isFunded && (
        <div className="mb-6 p-4 bg-bg-base/50 border border-border-subtle">
          <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-[0.2em] mb-3">
            Fund Agent for ENS Registration
          </div>
          <p className="font-display text-sm font-light text-text-secondary mb-4">
            The agent wallet needs {ENS_FUNDING_AMOUNT} Sepolia ETH to write text records on-chain.
          </p>

          {/* Chain switch banner */}
          {isWrongChain && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-amber-400">Switch to Sepolia</p>
                <p className="font-mono text-[0.625rem] text-text-tertiary mt-0.5">
                  ENS text records are written on Ethereum Sepolia
                </p>
              </div>
              <button
                onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
                className="btn-primary text-sm px-4 py-2"
              >
                Switch
              </button>
            </div>
          )}

          {/* Agent address + balance */}
          <div className="flex items-center gap-2 mb-3">
            <code className="font-mono text-sm text-text-primary flex-1 truncate">
              {defiAgentAddress}
            </code>
            <button onClick={handleCopy} className="text-text-tertiary hover:text-text-primary transition-colors shrink-0">
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.625rem] text-text-tertiary">
              Balance: {formatEther(agentBalanceData?.value ?? BigInt(0))} ETH (Sepolia)
            </span>
            <button
              onClick={handleSend}
              disabled={isWrongChain || isSending || isConfirming}
              className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : `Send ${ENS_FUNDING_AMOUNT} ETH`}
            </button>
          </div>
        </div>
      )}

      {/* Funded indicator */}
      {isFunded && (
        <div className="mb-6 p-3 bg-accent-cyan/5 border border-accent-cyan/20 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span className="font-mono text-[0.625rem] text-accent-cyan">
            Agent funded on Sepolia ({formatEther(agentBalanceData?.value ?? BigInt(0))} ETH)
          </span>
        </div>
      )}

      {/* Register button — enabled only when funded */}
      <button
        onClick={onRegister}
        disabled={!isFunded}
        className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Register ENS Records
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>

      <button
        onClick={onSkip}
        className="w-full text-center mt-3 font-mono text-[0.6875rem] text-text-tertiary hover:text-text-secondary transition-colors"
      >
        Skip ENS registration
      </button>
    </div>
  )
}

// ── ENS Progress ────────────────────────────────────────────────────

function ENSProgress() {
  const { state } = useLaunch()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!state.isRegisteringENS) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [state.isRegisteringENS])

  return (
    <div className="max-w-xl mx-auto py-8 md:py-12 opacity-0 animate-fade-up delay-300">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-5 md:p-8 text-center">
        {state.isRegisteringENS ? (
          <>
            <div className="w-12 h-12 mx-auto mb-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
            <h2 className="font-display text-xl font-bold tracking-tight mb-2">
              Registering DeFi ENS Subname
            </h2>
            <p className="font-display text-sm font-light text-text-secondary mb-4">
              Registering subname via CCIP and writing text records on Sepolia...
            </p>
            <p className="font-mono text-xs text-text-tertiary">
              {elapsed}s — this may take up to 60s (multiple on-chain transactions)
            </p>
          </>
        ) : state.ensError ? (
          <>
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight mb-2">
              ENS Registration Failed
            </h2>
            <p className="font-mono text-sm text-red-400">{state.ensError}</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight mb-2">
              ENS Registered
            </h2>
            {state.ensResult?.ensName && (
              <p className="font-mono text-sm text-accent-cyan">{state.ensResult.ensName}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Launch Result ───────────────────────────────────────────────────

function LaunchResult() {
  const { state, dispatch } = useLaunch()
  const { portfolioResult, ensResult, tokenInfo } = state

  if (!portfolioResult) return null

  const treasury = portfolioResult.treasuryAgent
  const defi = portfolioResult.defiAgent
  const delegation = portfolioResult.delegation

  // Collect all tx hashes from steps
  const txHashes = portfolioResult.steps
    .filter((s) => s.txHash)
    .map((s) => ({ label: s.step, hash: s.txHash!, stepName: s.step }))

  // Add ENS tx if present
  if (ensResult?.txHash) {
    txHashes.push({ label: 'DeFi ENS Registration', hash: ensResult.txHash, stepName: 'ens' })
  }

  return (
    <div className="max-w-3xl mx-auto py-8 md:py-12 opacity-0 animate-fade-up delay-300">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-5 md:p-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Deployment Complete
            </h2>
            <p className="font-display text-sm font-light text-text-secondary">
              Your agent pair is live and the treasury agent is managing fees.
            </p>
          </div>
        </div>

        {/* Two-column agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Treasury Agent */}
          <div className="p-5 bg-bg-base/50 border border-border-subtle">
            <div className="font-mono text-[0.625rem] font-medium text-accent-cyan uppercase tracking-[0.2em] mb-4">
              Treasury Agent
            </div>
            {treasury && (
              <div className="space-y-3">
                <ResultField label="Wallet" value={treasury.address} mono truncate />
                {treasury.ensName && (
                  <ResultField label="ENS" value={treasury.ensName} />
                )}
                {treasury.erc8004Id !== undefined && (
                  <ResultField label="ERC-8004 ID" value={`#${treasury.erc8004Id}`} />
                )}
              </div>
            )}
          </div>

          {/* DeFi Agent */}
          <div className="p-5 bg-bg-base/50 border border-border-subtle">
            <div className="font-mono text-[0.625rem] font-medium text-accent-blue uppercase tracking-[0.2em] mb-4">
              DeFi Agent
            </div>
            {defi && (
              <div className="space-y-3">
                <ResultField label="Wallet" value={defi.address} mono truncate />
                {(defi.ensName || ensResult?.ensName) && (
                  <ResultField label="ENS" value={ensResult?.ensName || defi.ensName} />
                )}
                {defi.erc8004Id !== undefined && (
                  <ResultField label="ERC-8004 ID" value={`#${defi.erc8004Id}`} />
                )}
                {(defi.tokenAddress || tokenInfo?.tokenAddress) && (
                  <ResultField
                    label="Token"
                    value={`${tokenInfo?.tokenSymbol || defi.tokenSymbol} (${tokenInfo?.tokenAddress || defi.tokenAddress})`}
                    mono
                    truncate
                  />
                )}
                {tokenInfo?.clankerUrl && (
                  <div>
                    <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest">
                      Clanker
                    </div>
                    <a
                      href={tokenInfo.clankerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[0.625rem] text-accent-blue hover:underline break-all"
                    >
                      View on Clanker
                    </a>
                  </div>
                )}
                {tokenInfo?.dexScreenerUrl && (
                  <div>
                    <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest">
                      DexScreener
                    </div>
                    <a
                      href={tokenInfo.dexScreenerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[0.625rem] text-accent-blue hover:underline break-all"
                    >
                      View Chart
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delegation */}
        {delegation && (
          <div className="p-4 bg-bg-base/50 border border-border-subtle mb-6">
            <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
              Delegation
            </div>
            <span className="font-mono text-sm text-text-primary">
              Fee split: {delegation.feeSplit}% to deployer
            </span>
          </div>
        )}

        {/* Transaction Hashes */}
        {txHashes.length > 0 && (
          <div className="mb-6">
            <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest mb-3">
              Transactions
            </div>
            <div className="space-y-2">
              {txHashes.map(({ label, hash, stepName }) => (
                <div key={hash} className="flex items-center justify-between p-2 bg-bg-base/30 border border-border-subtle/30">
                  <span className="font-mono text-[0.6875rem] text-text-secondary">{label}</span>
                  <a
                    href={explorerUrl(hash, stepName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[0.6875rem] text-accent-blue hover:underline"
                  >
                    {hash.slice(0, 10)}...{hash.slice(-6)}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <Link
          href="/keychain"
          className="btn-primary w-full justify-center mt-4"
        >
          View Keychain
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="btn-secondary w-full justify-center mt-2"
        >
          Launch Another Agent
        </button>
      </div>
    </div>
  )
}

// ── Result Field ────────────────────────────────────────────────────

function ResultField({
  label,
  value,
  mono,
  truncate,
}: {
  label: string
  value: string
  mono?: boolean
  truncate?: boolean
}) {
  return (
    <div>
      <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest">
        {label}
      </div>
      <div
        className={`text-sm text-text-primary ${mono ? 'font-mono' : 'font-display'} ${
          truncate ? 'truncate' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}

// ── Explorer URL helper ─────────────────────────────────────────────

function explorerUrl(txHash: string, stepName: string): string {
  const lower = stepName.toLowerCase()
  // ENS operations are on Sepolia
  if (lower.includes('ens')) {
    return `https://sepolia.etherscan.io/tx/${txHash}`
  }
  // ERC-8004 and funding are on Base Sepolia
  if (lower.includes('8004') || lower.includes('fund')) {
    return `https://sepolia.basescan.org/tx/${txHash}`
  }
  // Default to Sepolia Etherscan
  return `https://sepolia.etherscan.io/tx/${txHash}`
}
