'use client'

interface SummaryCardsProps {
  totalClaimable: string
  totalInWallets: string
  totalDistributed: string
}

export function SummaryCards({ totalClaimable, totalInWallets, totalDistributed }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <StatCard label="Claimable WETH" value={totalClaimable} accent="cyan" />
      <StatCard label="In Agent Wallets" value={totalInWallets} accent="blue" />
      <StatCard label="Lifetime Distributed" value={totalDistributed} accent="green" />
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'cyan' | 'blue' | 'green'
}) {
  const val = parseFloat(value)
  const formatted = val === 0 ? '0' : val < 0.0001 ? '<0.0001' : val.toFixed(6)

  const accentColor = {
    cyan: 'text-accent-cyan',
    blue: 'text-accent-blue',
    green: 'text-[#00D4AA]',
  }[accent]

  const borderColor = {
    cyan: 'border-accent-cyan/20',
    blue: 'border-accent-blue/20',
    green: 'border-[#00D4AA]/20',
  }[accent]

  return (
    <div className={`bg-bg-card border ${borderColor} p-4 relative overflow-hidden`}>
      <div className="font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className={`font-mono text-xl font-bold tabular-nums ${accentColor}`}>
        {formatted}
      </div>
      <div className="font-mono text-[0.625rem] text-text-tertiary mt-0.5">WETH</div>
    </div>
  )
}
