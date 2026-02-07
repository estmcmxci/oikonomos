'use client'

import type { AgentFeeInfo } from '@/lib/api'

interface FeeTableProps {
  agents: AgentFeeInfo[]
  onClaim: (agentName: string) => void
  claiming: boolean
}

export function FeeTable({ agents, onClaim, claiming }: FeeTableProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-8 text-text-tertiary font-mono text-sm">
        No agents with fee data
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-border-subtle/50">
            <Th>Agent</Th>
            <Th>Type</Th>
            <Th>Token</Th>
            <Th align="right">Claimable</Th>
            <Th align="right">Wallet</Th>
            <Th>Mode</Th>
            <Th align="right">Action</Th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent, i) => (
            <FeeRow
              key={agent.agentAddress}
              agent={agent}
              index={i}
              onClaim={onClaim}
              claiming={claiming}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FeeRow({
  agent,
  index,
  onClaim,
  claiming,
}: {
  agent: AgentFeeInfo
  index: number
  onClaim: (agentName: string) => void
  claiming: boolean
}) {
  const claimable = parseFloat(agent.claimableWeth)
  const walletBal = parseFloat(agent.walletWethBalance)
  const isManual = agent.distributionMode === 'manual'
  const canClaim = isManual && claimable > 0

  // Countdown for auto mode
  let nextDistLabel = ''
  if (!isManual && agent.nextDistributionTime) {
    const diff = agent.nextDistributionTime - Date.now()
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      nextDistLabel = `${hours}h ${mins}m`
    } else {
      nextDistLabel = 'Due'
    }
  }

  return (
    <tr
      className={`
        border-b border-border-subtle/20 transition-colors hover:bg-accent-blue/[0.04]
        ${index % 2 === 1 ? 'bg-white/[0.01]' : ''}
      `}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-[0.8125rem] text-text-primary">{agent.agentName}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`font-mono text-[0.6875rem] ${agent.agentType === 'treasury' ? 'text-accent-cyan' : 'text-accent-blue'}`}>
          {agent.agentType === 'treasury' ? 'Treasury' : 'DeFi'}
        </span>
      </td>
      <td className="px-4 py-3">
        {agent.tokenSymbol ? (
          <span className="font-mono text-[0.8125rem] text-[#FF007A]">${agent.tokenSymbol}</span>
        ) : (
          <span className="font-mono text-[0.8125rem] text-text-tertiary/50">&mdash;</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-[0.8125rem] text-text-primary tabular-nums">
          {claimable === 0 ? '0' : claimable < 0.0001 ? '<0.0001' : claimable.toFixed(6)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-[0.8125rem] text-text-secondary tabular-nums">
          {walletBal === 0 ? '0' : walletBal < 0.0001 ? '<0.0001' : walletBal.toFixed(6)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`font-mono text-[0.6875rem] px-2 py-0.5 border ${
          isManual
            ? 'text-amber-400 border-amber-400/30 bg-amber-400/5'
            : 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5'
        }`}>
          {isManual ? 'MANUAL' : 'AUTO'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {canClaim ? (
          <button
            onClick={() => onClaim(agent.agentName)}
            disabled={claiming}
            className="font-mono text-[0.6875rem] px-3 py-1 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
          >
            {claiming ? 'Claiming...' : 'Claim'}
          </button>
        ) : !isManual && nextDistLabel ? (
          <span className="font-mono text-[0.6875rem] text-text-tertiary tabular-nums">
            {nextDistLabel}
          </span>
        ) : (
          <span className="font-mono text-[0.8125rem] text-text-tertiary/50">&mdash;</span>
        )}
      </td>
    </tr>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th className={`px-4 py-2.5 font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest text-left ${align === 'right' ? '!text-right' : ''}`}>
      {children}
    </th>
  )
}
