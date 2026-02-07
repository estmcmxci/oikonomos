'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAccount, useBalance, useSendTransaction } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatEther, parseEther, erc20Abi, type Address } from 'viem'
import { useReadContract } from 'wagmi'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WalletButton } from '@/components/WalletButton'
import { SummaryCards } from '@/components/fees/SummaryCards'
import { ClaimHistory } from '@/components/fees/ClaimHistory'
import {
  listAgents,
  getFeeStatus,
  claimFees,
  withdrawFees,
  updateDistribution,
  type AgentInfo,
  type AgentFeeInfo,
  type DistributionSchedule,
} from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────

interface AgentPair {
  baseName: string
  treasury?: AgentInfo
  defi?: AgentInfo
  createdAt: number
}

type PanelType = 'deposit' | 'withdraw' | 'schedule' | null

const ITEMS_PER_PAGE = 10

// ── Pairing Logic ────────────────────────────────────────────────────

function pairAgents(agents: AgentInfo[]): AgentPair[] {
  const pairMap = new Map<string, AgentPair>()

  for (const agent of agents) {
    const isTreasury =
      agent.agentType === 'treasury' || agent.agentName.endsWith('treasury')
    const baseName = isTreasury
      ? agent.agentName.replace(/treasury$/, '')
      : agent.agentName

    if (!pairMap.has(baseName)) {
      pairMap.set(baseName, { baseName, createdAt: agent.createdAt })
    }

    const pair = pairMap.get(baseName)!
    if (isTreasury) {
      pair.treasury = agent
    } else {
      pair.defi = agent
    }
    if (agent.createdAt > pair.createdAt) {
      pair.createdAt = agent.createdAt
    }
  }

  return Array.from(pairMap.values())
    .filter((p) => p.defi)
    .sort((a, b) => b.createdAt - a.createdAt)
}

// ── Page ─────────────────────────────────────────────────────────────

export default function KeychainPage() {
  const { address, isConnected } = useAccount()

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents', address],
    queryFn: () => listAgents(address!),
    enabled: !!address,
    refetchInterval: 30_000,
  })

  const agents = data?.agents ?? []
  const pairs = useMemo(() => pairAgents(agents), [agents])

  return (
    <div className="container">
      <Header showNav showWallet />

      <section className="py-12 opacity-0 animate-fade-up delay-300">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="font-mono text-[0.625rem] font-medium text-accent-cyan uppercase tracking-[0.2em] mb-2">
              Agent Keychain
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Your Deployed Agents
            </h1>
          </div>
          {isConnected && (
            <Link href="/launch" className="btn-primary text-sm px-5 py-3">
              Deploy New
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          )}
        </div>

        {!isConnected ? (
          <ConnectWalletState />
        ) : isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={String(error)} />
        ) : agents.length === 0 ? (
          <EmptyState />
        ) : (
          <UnifiedDashboard pairs={pairs} userAddress={address!} />
        )}
      </section>

      <Footer />
    </div>
  )
}

// ── Unified Dashboard ────────────────────────────────────────────────

function UnifiedDashboard({
  pairs,
  userAddress,
}: {
  pairs: AgentPair[]
  userAddress: Address
}) {
  const queryClient = useQueryClient()
  const [claiming, setClaiming] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [openPanel, setOpenPanel] = useState<{ row: string; type: PanelType }>({ row: '', type: null })

  const { data: feeData } = useQuery({
    queryKey: ['feeStatus', userAddress],
    queryFn: () => getFeeStatus(userAddress),
    refetchInterval: 30_000,
  })

  const feeByAddress = useMemo(() => {
    const map = new Map<string, AgentFeeInfo>()
    for (const a of feeData?.agents ?? []) {
      map.set(a.agentAddress.toLowerCase(), a)
    }
    return map
  }, [feeData])

  const totalPages = Math.max(1, Math.ceil(pairs.length / ITEMS_PER_PAGE))
  const pagedPairs = pairs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleClaim = useCallback(async () => {
    setClaiming(true)
    try {
      await claimFees(userAddress)
      queryClient.invalidateQueries({ queryKey: ['feeStatus', userAddress] })
    } catch (err) {
      console.error('Claim failed:', err)
    } finally {
      setClaiming(false)
    }
  }, [userAddress, queryClient])

  const handleWithdraw = useCallback(async (agentName: string, amount?: string, type: 'eth' | 'weth' = 'weth') => {
    setWithdrawing(true)
    try {
      const result = await withdrawFees(userAddress, amount, type, agentName)
      queryClient.invalidateQueries({ queryKey: ['feeStatus', userAddress] })
      return result
    } catch (err) {
      console.error('Withdraw failed:', err)
      return { amount: '0', success: false, error: String(err) }
    } finally {
      setWithdrawing(false)
    }
  }, [userAddress, queryClient])

  const handleSaveSchedule = useCallback(
    async (mode: 'auto' | 'manual', schedule?: DistributionSchedule) => {
      setSaving(true)
      try {
        await updateDistribution(userAddress, mode, schedule)
        queryClient.invalidateQueries({ queryKey: ['feeStatus', userAddress] })
      } catch (err) {
        console.error('Save settings failed:', err)
      } finally {
        setSaving(false)
      }
    },
    [userAddress, queryClient],
  )

  const togglePanel = (row: string, type: PanelType) => {
    if (openPanel.row === row && openPanel.type === type) {
      setOpenPanel({ row: '', type: null })
    } else {
      setOpenPanel({ row, type })
    }
  }

  const primaryFee = feeData?.agents?.find((a) => a.agentType === 'defi') ?? feeData?.agents?.[0]

  return (
    <div className="space-y-4">
      <SummaryCards
        totalClaimable={feeData?.totalClaimableWeth ?? '0'}
        totalInWallets={feeData?.totalWalletWeth ?? '0'}
        totalDistributed={feeData?.totalDistributed ?? '0'}
      />

      {/* Main table */}
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/40 to-transparent" />

        <div className="flex items-center justify-between px-4 border-b border-border-subtle">
          <div className="py-3 font-mono text-[0.6875rem] font-medium text-text-primary uppercase tracking-[0.12em]">
            Portfolios
            <span className="ml-1.5 text-accent-cyan">{pairs.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-7 h-7 flex items-center justify-center text-text-tertiary hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="font-mono text-[0.6875rem] text-text-secondary tabular-nums min-w-[60px] text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-7 h-7 flex items-center justify-center text-text-tertiary hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle/50">
              <ColHeader label="Pair" />
              <ColHeader label="ENS" />
              <ColHeader label="Token" />
              <ColHeader label="Claimable" align="right" />
              <ColHeader label="Balance" align="right" />
              <ColHeader label="Schedule" />
              <ColHeader label="Actions" align="right" />
            </tr>
          </thead>
          <tbody>
            {pagedPairs.map((pair, i) => {
              const feeInfo = pair.defi ? feeByAddress.get(pair.defi.address.toLowerCase()) : undefined
              const isOpen = openPanel.row === pair.baseName
              const activePanel = isOpen ? openPanel.type : null

              return (
                <PairRow
                  key={pair.baseName}
                  pair={pair}
                  index={i}
                  feeInfo={feeInfo}
                  activePanel={activePanel}
                  onTogglePanel={(type) => togglePanel(pair.baseName, type)}
                  onClaim={handleClaim}
                  claiming={claiming}
                  onWithdraw={handleWithdraw}
                  withdrawing={withdrawing}
                  currentMode={primaryFee?.distributionMode ?? 'auto'}
                  currentSchedule={primaryFee?.distributionSchedule}
                  feeSplit={primaryFee?.feeSplit ?? 85}
                  onSaveSchedule={handleSaveSchedule}
                  saving={saving}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Claim history */}
      <ClaimHistory claims={feeData?.recentClaims ?? []} />
    </div>
  )
}

// ── Pair Row ─────────────────────────────────────────────────────────

function PairRow({
  pair,
  index,
  feeInfo,
  activePanel,
  onTogglePanel,
  onClaim,
  claiming,
  onWithdraw,
  withdrawing,
  currentMode,
  currentSchedule,
  feeSplit,
  onSaveSchedule,
  saving,
}: {
  pair: AgentPair
  index: number
  feeInfo?: AgentFeeInfo
  activePanel: PanelType
  onTogglePanel: (type: PanelType) => void
  onClaim: () => void
  claiming: boolean
  onWithdraw: (agentName: string, amount?: string, type?: 'eth' | 'weth') => Promise<{ amount: string; success: boolean; error?: string }>
  withdrawing: boolean
  currentMode: 'auto' | 'manual'
  currentSchedule?: DistributionSchedule
  feeSplit: number
  onSaveSchedule: (mode: 'auto' | 'manual', schedule?: DistributionSchedule) => Promise<void>
  saving: boolean
}) {
  const claimable = parseFloat(feeInfo?.claimableWeth ?? '0')
  const stripe = index % 2 === 1 ? 'bg-white/[0.01]' : ''

  return (
    <>
      <tr
        className={`border-b border-border-subtle/20 transition-colors hover:bg-accent-blue/[0.04] cursor-default ${stripe} ${activePanel ? '!border-b-0' : ''}`}
      >
        {/* Pair name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-1">
              {pair.treasury && <div className="w-2 h-2 rounded-full bg-accent-cyan" />}
              {pair.defi && <div className="w-2 h-2 rounded-full bg-accent-blue" />}
            </div>
            <span className="font-mono text-[0.8125rem] text-text-primary font-medium">
              {pair.baseName}
            </span>
          </div>
        </td>

        {/* ENS */}
        <td className="px-4 py-3">
          {pair.defi?.ensName ? (
            <a
              href={`https://sepolia.app.ens.domains/${pair.defi.ensName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.75rem] text-accent-blue hover:underline truncate block"
            >
              {pair.defi.ensName}
            </a>
          ) : (
            <Dash />
          )}
        </td>

        {/* Token */}
        <td className="px-4 py-3">
          {pair.defi?.tokenSymbol ? (
            pair.defi.tokenAddress ? (
              <a
                href={`https://clanker.world/clanker/${pair.defi.tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.8125rem] text-[#FF007A] hover:underline"
              >
                ${pair.defi.tokenSymbol}
              </a>
            ) : (
              <span className="font-mono text-[0.8125rem] text-[#FF007A]">
                ${pair.defi.tokenSymbol}
              </span>
            )
          ) : (
            <Dash />
          )}
        </td>

        {/* Claimable WETH */}
        <td className="px-4 py-3 text-right">
          <span className={`font-mono text-[0.8125rem] tabular-nums ${claimable > 0 ? 'text-accent-cyan font-medium' : 'text-text-tertiary'}`}>
            {claimable === 0 ? '0' : claimable < 0.0001 ? '<0.0001' : claimable.toFixed(4)}
          </span>
        </td>

        {/* Balance */}
        <td className="px-4 py-3 text-right">
          {pair.defi ? <BalanceBadge address={pair.defi.address} /> : <Dash />}
        </td>

        {/* Schedule — visible inline */}
        <td className="px-4 py-3">
          <button
            onClick={() => onTogglePanel('schedule')}
            className={`inline-flex items-center gap-1.5 font-mono text-[0.6875rem] transition-colors ${
              activePanel === 'schedule'
                ? 'text-accent-cyan'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
              currentMode === 'auto' ? 'bg-accent-cyan' : 'bg-amber-400'
            }`} />
            {currentMode === 'auto'
              ? `Auto · ${currentSchedule?.type === 'custom'
                  ? `${currentSchedule.customDays}d`
                  : (currentSchedule?.type ?? 'weekly').charAt(0).toUpperCase() + (currentSchedule?.type ?? 'weekly').slice(1)
                }`
              : 'Manual'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </td>

        {/* Actions — always visible */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onTogglePanel('deposit')}
              className={`font-mono text-[0.6875rem] px-2.5 py-1 border transition-colors ${
                activePanel === 'deposit'
                  ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                  : 'border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-blue/30'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => onTogglePanel('withdraw')}
              className={`font-mono text-[0.6875rem] px-2.5 py-1 border transition-colors ${
                activePanel === 'withdraw'
                  ? 'bg-amber-400/15 border-amber-400/40 text-amber-400'
                  : 'border-border-subtle text-text-secondary hover:text-text-primary hover:border-amber-400/30'
              }`}
            >
              Withdraw
            </button>
            {claimable > 0 && (
              <button
                onClick={onClaim}
                disabled={claiming}
                className="font-mono text-[0.6875rem] px-2.5 py-1 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
              >
                {claiming ? '...' : 'Claim'}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded deposit panel */}
      {activePanel === 'deposit' && (
        <tr className={stripe}>
          <td colSpan={7} className="px-4 pb-4 pt-0 border-b border-border-subtle/20">
            <DepositPanel
              pair={pair}
              onClose={() => onTogglePanel(null)}
            />
          </td>
        </tr>
      )}

      {/* Expanded withdraw panel */}
      {activePanel === 'withdraw' && (
        <tr className={stripe}>
          <td colSpan={7} className="px-4 pb-4 pt-0 border-b border-border-subtle/20">
            <WithdrawPanel
              pair={pair}
              onWithdraw={onWithdraw}
              withdrawing={withdrawing}
              onClose={() => onTogglePanel(null)}
            />
          </td>
        </tr>
      )}

      {/* Expanded schedule panel */}
      {activePanel === 'schedule' && (
        <tr className={stripe}>
          <td colSpan={7} className="px-4 pb-4 pt-0 border-b border-border-subtle/20">
            <SchedulePanel
              currentMode={currentMode}
              currentSchedule={currentSchedule}
              feeSplit={feeSplit}
              onSave={onSaveSchedule}
              saving={saving}
              onClaim={onClaim}
              claiming={claiming}
              claimable={claimable}
              onClose={() => onTogglePanel(null)}
            />
          </td>
        </tr>
      )}
    </>
  )
}

// ── Deposit Panel ────────────────────────────────────────────────────

function DepositPanel({
  pair,
  onClose,
}: {
  pair: AgentPair
  onClose: () => void
}) {
  const [target, setTarget] = useState<'treasury' | 'defi'>('treasury')
  const [amount, setAmount] = useState('')
  const { sendTransaction, isPending, isSuccess, isError } = useSendTransaction()

  const targetAddress = target === 'treasury' ? pair.treasury?.address : pair.defi?.address

  const handleSend = () => {
    if (!targetAddress || !amount || parseFloat(amount) <= 0) return
    sendTransaction({
      to: targetAddress,
      value: parseEther(amount),
      chainId: 84532,
    })
  }

  return (
    <div className="border border-border-subtle/40 bg-white/[0.01] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest">
          Deposit ETH
          <span className="ml-2 normal-case tracking-normal text-accent-blue">Base Sepolia</span>
        </span>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        {/* Target selector */}
        <div>
          <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-1">Send to</div>
          <div className="flex border border-border-subtle">
            {pair.treasury && (
              <button
                onClick={() => setTarget('treasury')}
                className={`px-3 py-1.5 font-mono text-[0.6875rem] font-medium transition-colors border-r border-border-subtle ${
                  target === 'treasury'
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                Treasury
              </button>
            )}
            {pair.defi && (
              <button
                onClick={() => setTarget('defi')}
                className={`px-3 py-1.5 font-mono text-[0.6875rem] font-medium transition-colors ${
                  target === 'defi'
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                DeFi
              </button>
            )}
          </div>
        </div>

        {/* Address (copyable) */}
        {targetAddress && (
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-1">Address</div>
            <CopyableAddressFull address={targetAddress} />
          </div>
        )}

        {/* Amount + Send */}
        <div className="flex items-end gap-2">
          <div>
            <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-1">Amount</div>
            <input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              className="w-28 bg-transparent border border-border-subtle px-2.5 py-1.5 font-mono text-[0.75rem] text-text-primary tabular-nums focus:outline-none focus:border-accent-blue/50 placeholder:text-text-tertiary/40"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isPending || !amount || parseFloat(amount) <= 0 || !targetAddress}
            className="px-4 py-1.5 font-mono text-[0.75rem] font-medium bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Sending...' : 'Send ETH'}
          </button>
        </div>

        {isSuccess && <span className="font-mono text-[0.6875rem] text-[#00D4AA] pb-1.5">Sent!</span>}
        {isError && <span className="font-mono text-[0.6875rem] text-red-400 pb-1.5">Failed</span>}
      </div>
    </div>
  )
}

// ── Withdraw Panel ───────────────────────────────────────────────────

function WithdrawPanel({
  pair,
  onWithdraw,
  withdrawing,
  onClose,
}: {
  pair: AgentPair
  onWithdraw: (agentName: string, amount?: string, type?: 'eth' | 'weth') => Promise<{ amount: string; success: boolean; error?: string }>
  withdrawing: boolean
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [withdrawType, setWithdrawType] = useState<'eth' | 'weth'>('eth')
  const [target, setTarget] = useState<'treasury' | 'defi'>(pair.defi ? 'defi' : 'treasury')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const targetName = target === 'treasury'
    ? pair.treasury?.agentName
    : pair.defi?.agentName

  const handleWithdraw = async () => {
    if (!targetName) return
    setError('')
    setSuccess(false)
    const result = await onWithdraw(targetName, amount || undefined, withdrawType)
    if (result.success) {
      setSuccess(true)
      setAmount('')
    } else {
      setError(result.error ?? 'Withdraw failed')
    }
  }

  return (
    <div className="border border-border-subtle/40 bg-white/[0.01] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest">
          Withdraw to Deployer
        </span>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        {/* Agent selector */}
        <div>
          <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-1">From</div>
          <div className="flex border border-border-subtle">
            {pair.treasury && (
              <button
                onClick={() => setTarget('treasury')}
                className={`px-3 py-1.5 font-mono text-[0.6875rem] font-medium transition-colors border-r border-border-subtle ${
                  target === 'treasury'
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                Treasury
              </button>
            )}
            {pair.defi && (
              <button
                onClick={() => setTarget('defi')}
                className={`px-3 py-1.5 font-mono text-[0.6875rem] font-medium transition-colors ${
                  target === 'defi'
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                DeFi
              </button>
            )}
          </div>
        </div>

        {/* Asset type toggle */}
        <div>
          <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-1">Asset</div>
          <div className="flex border border-border-subtle">
            <button
              onClick={() => setWithdrawType('eth')}
              className={`px-3 py-1.5 font-mono text-[0.6875rem] font-medium transition-colors border-r border-border-subtle ${
                withdrawType === 'eth'
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              ETH
            </button>
            <button
              onClick={() => setWithdrawType('weth')}
              className={`px-3 py-1.5 font-mono text-[0.6875rem] font-medium transition-colors ${
                withdrawType === 'weth'
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              WETH
            </button>
          </div>
        </div>

        <div>
          <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-1">
            Amount <span className="normal-case tracking-normal text-text-tertiary/60">(empty = all)</span>
          </div>
          <input
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`All ${withdrawType.toUpperCase()}`}
            className="w-32 bg-transparent border border-border-subtle px-2.5 py-1.5 font-mono text-[0.75rem] text-text-primary tabular-nums focus:outline-none focus:border-amber-400/50 placeholder:text-text-tertiary/40"
          />
        </div>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || !targetName}
          className="px-4 py-1.5 font-mono text-[0.75rem] font-medium bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {withdrawing ? 'Withdrawing...' : `Withdraw ${withdrawType.toUpperCase()}`}
        </button>

        {success && <span className="font-mono text-[0.6875rem] text-[#00D4AA] pb-1.5">Withdrawn!</span>}
        {error && <span className="font-mono text-[0.6875rem] text-red-400 pb-1.5 max-w-[200px] truncate">{error}</span>}
      </div>
    </div>
  )
}

// ── Schedule Panel ───────────────────────────────────────────────────

const SCHEDULE_OPTIONS: { label: string; value: DistributionSchedule['type'] }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
]

function SchedulePanel({
  currentMode,
  currentSchedule,
  feeSplit,
  onSave,
  saving,
  onClaim,
  claiming,
  claimable,
  onClose,
}: {
  currentMode: 'auto' | 'manual'
  currentSchedule?: DistributionSchedule
  feeSplit: number
  onSave: (mode: 'auto' | 'manual', schedule?: DistributionSchedule) => Promise<void>
  saving: boolean
  onClaim: () => void
  claiming: boolean
  claimable: number
  onClose: () => void
}) {
  const [mode, setMode] = useState<'auto' | 'manual'>(currentMode)
  const [scheduleType, setScheduleType] = useState<DistributionSchedule['type']>(
    currentSchedule?.type ?? 'weekly',
  )
  const [customDays, setCustomDays] = useState(currentSchedule?.customDays ?? 10)

  const handleSave = async () => {
    const schedule: DistributionSchedule | undefined =
      mode === 'auto'
        ? { type: scheduleType, ...(scheduleType === 'custom' && { customDays }) }
        : undefined
    await onSave(mode, schedule)
    onClose()
  }

  return (
    <div className="border border-border-subtle/40 bg-white/[0.01] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-widest">
          Distribution Schedule
        </span>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        {/* Mode toggle */}
        <div>
          <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-1">Mode</div>
          <div className="flex border border-border-subtle">
            <button
              onClick={() => setMode('auto')}
              className={`px-3 py-1.5 font-mono text-[0.6875rem] font-medium transition-colors border-r border-border-subtle ${
                mode === 'auto' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              AUTO
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 font-mono text-[0.6875rem] font-medium transition-colors ${
                mode === 'manual' ? 'bg-amber-400/10 text-amber-400' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              MANUAL
            </button>
          </div>
        </div>

        {/* Schedule (auto only) */}
        {mode === 'auto' && (
          <div>
            <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest mb-1">Frequency</div>
            <div className="flex border border-border-subtle">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScheduleType(opt.value)}
                  className={`px-2.5 py-1.5 font-mono text-[0.6875rem] transition-colors border-r border-border-subtle last:border-r-0 ${
                    scheduleType === opt.value
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom days */}
        {mode === 'auto' && scheduleType === 'custom' && (
          <div className="flex items-end gap-1.5">
            <span className="font-mono text-[0.6875rem] text-text-tertiary pb-1.5">Every</span>
            <input
              type="number"
              min={1}
              max={90}
              value={customDays}
              onChange={(e) => setCustomDays(Math.max(1, Math.min(90, parseInt(e.target.value) || 1)))}
              className="w-14 bg-transparent border border-border-subtle px-2 py-1.5 font-mono text-[0.75rem] text-text-primary tabular-nums focus:outline-none focus:border-accent-blue/50"
            />
            <span className="font-mono text-[0.6875rem] text-text-tertiary pb-1.5">days</span>
          </div>
        )}

        {/* Fee split */}
        <div className="flex items-end">
          <span className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-widest pb-2">
            Split {feeSplit}/{100 - feeSplit}
          </span>
        </div>

        {/* Manual claim button */}
        {mode === 'manual' && claimable > 0 && (
          <button
            onClick={onClaim}
            disabled={claiming}
            className="px-4 py-1.5 font-mono text-[0.75rem] font-medium bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20 transition-colors disabled:opacity-40"
          >
            {claiming ? 'Claiming...' : `Claim ${claimable.toFixed(4)} WETH`}
          </button>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 font-mono text-[0.75rem] font-medium bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Column Header ────────────────────────────────────────────────────

function ColHeader({ label, align }: { label: string; align?: 'right' }) {
  return (
    <th
      className={`px-4 py-2.5 font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest text-left ${
        align === 'right' ? '!text-right' : ''
      }`}
    >
      {label && (
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30 shrink-0">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="14" y2="12" />
            <line x1="4" y1="18" x2="8" y2="18" />
          </svg>
          {label}
        </div>
      )}
    </th>
  )
}

// ── Shared Components ────────────────────────────────────────────────

function CopyableAddressFull({ address }: { address: Address }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[0.75rem] text-text-secondary truncate">{address}</span>
      <button onClick={handleCopy} className="text-text-tertiary hover:text-text-primary transition-colors shrink-0">
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
        )}
      </button>
    </div>
  )
}

const BASE_SEPOLIA_CHAIN_ID = 84532
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as Address

function BalanceBadge({ address }: { address: Address }) {
  const { data: ethData } = useBalance({
    address,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    query: { refetchInterval: 30_000 },
  })

  const { data: wethRaw } = useReadContract({
    address: WETH_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
    chainId: BASE_SEPOLIA_CHAIN_ID,
    query: { refetchInterval: 30_000 },
  })

  if (!ethData) {
    return <span className="font-mono text-[0.8125rem] text-text-tertiary">&mdash;</span>
  }

  const ethVal = parseFloat(formatEther(ethData.value))
  const ethFormatted = ethVal < 0.0001 && ethVal > 0 ? '<0.0001' : ethVal.toFixed(4)

  const wethVal = wethRaw ? parseFloat(formatEther(wethRaw)) : 0
  const wethFormatted = wethVal < 0.0001 && wethVal > 0 ? '<0.0001' : wethVal.toFixed(4)

  return (
    <span className="font-mono text-[0.75rem] text-text-primary tabular-nums leading-tight">
      {ethFormatted}<span className="text-text-tertiary text-[0.5625rem] ml-0.5">ETH</span>
      <span className="text-text-tertiary/40 mx-1">/</span>
      {wethFormatted}<span className="text-text-tertiary text-[0.5625rem] ml-0.5">wETH</span>
    </span>
  )
}

function Dash() {
  return <span className="font-mono text-[0.8125rem] text-text-tertiary/50">&mdash;</span>
}

// ── State Screens ────────────────────────────────────────────────────

function ConnectWalletState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-10 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/40 to-transparent" />
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/30">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="16" cy="12" r="2" />
            <path d="M6 12h4" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold tracking-tight mb-2">Connect Wallet</h2>
        <p className="font-display text-sm font-light text-text-secondary mb-8">
          Connect your wallet to view your deployed agents
        </p>
        <div className="flex justify-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm text-text-secondary">Loading agents...</p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-bg-card border border-red-500/20 backdrop-blur-xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-red-500/10 border border-red-500/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-bold tracking-tight mb-2">Failed to Load</h2>
        <p className="font-mono text-xs text-red-400 break-all">{message}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-10 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold tracking-tight mb-2">No Agents Yet</h2>
        <p className="font-display text-sm font-light text-text-secondary mb-8">
          Launch your first treasury + DeFi agent pair to get started.
        </p>
        <Link href="/launch" className="btn-primary">
          Launch Agent
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
