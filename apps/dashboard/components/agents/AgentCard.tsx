import Link from 'next/link'

interface AgentCardProps {
  agent: {
    id: string
    name: string
    avatar: string
    score: number
    executions: number
    slippage: number
    success: number
    tokens: string[]
    fee: string
  }
  recommended?: boolean
}

export function AgentCard({ agent, recommended = false }: AgentCardProps) {
  const scoreClass = agent.score >= 80 ? 'high' : agent.score >= 60 ? 'medium' : 'low'
  const maxGaugeLength = 63
  const fillLength = (agent.score / 100) * maxGaugeLength

  return (
    <div
      className={`bg-bg-card border backdrop-blur-xl transition-all duration-300 relative ${
        recommended
          ? 'border-accent-cyan shadow-[0_0_40px_rgba(0,212,170,0.1)]'
          : 'border-border-subtle hover:border-border-accent'
      } hover:-translate-y-1`}
    >
      {recommended && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-cyan to-accent-blue" />
      )}

      {/* Header */}
      <div className="relative p-5 pb-4 border-b border-border-subtle">
        {recommended && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-accent-cyan/10 border border-accent-cyan/30 font-mono text-[0.5625rem] font-medium text-accent-cyan uppercase tracking-wider">
            <span>★</span> Best Match
          </span>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/20 font-mono text-sm font-bold text-accent-blue">
            {agent.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-medium text-text-primary truncate">
              {agent.name}
            </div>
            <div className="font-mono text-[0.625rem] text-text-tertiary mt-0.5">
              Agent #{agent.id}
            </div>
          </div>
        </div>

        {/* Reputation */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-7">
            <svg viewBox="0 0 56 28" width="56" height="28">
              <path className="gauge-bg" d="M 4 24 A 20 20 0 0 1 52 24" />
              <path
                className={`gauge-fill ${scoreClass}`}
                d="M 4 24 A 20 20 0 0 1 52 24"
                strokeDasharray={`${fillLength} ${maxGaugeLength}`}
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-mono text-xl font-bold text-text-primary">
              {agent.score}<span className="text-xs font-normal text-text-tertiary">/100</span>
            </div>
            <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider">
              Reputation
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-black/20 border border-border-subtle">
            <div className="font-mono text-base font-bold text-text-primary leading-none">
              {agent.executions}
            </div>
            <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wide mt-1.5">
              Executions
            </div>
          </div>
          <div className="text-center p-3 bg-black/20 border border-border-subtle">
            <div className="font-mono text-base font-bold text-text-primary leading-none">
              {agent.slippage}<span className="text-xs font-normal text-text-tertiary">bps</span>
            </div>
            <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wide mt-1.5">
              Avg Slippage
            </div>
          </div>
          <div className="text-center p-3 bg-black/20 border border-border-subtle">
            <div className="font-mono text-base font-bold text-text-primary leading-none">
              {agent.success}<span className="text-xs font-normal text-text-tertiary">%</span>
            </div>
            <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wide mt-1.5">
              Success
            </div>
          </div>
        </div>

        <div>
          <div className="font-mono text-[0.5625rem] text-text-tertiary uppercase tracking-wider mb-2">
            Supported Tokens
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {agent.tokens.map((token) => (
              <span
                key={token}
                className="px-2 py-1 bg-white/5 border border-border-subtle font-mono text-[0.625rem] text-text-secondary"
              >
                {token}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-border-subtle flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-xl font-bold text-accent-cyan">{agent.fee}</span>
          <span className="font-mono text-[0.625rem] text-text-tertiary">fee</span>
        </div>
        <Link
          href={`/configure/${agent.id}`}
          className={`inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[0.6875rem] font-medium no-underline transition-all duration-200 ${
            recommended
              ? 'bg-accent-blue border border-accent-blue text-bg-base hover:bg-[#6aa5ff] hover:shadow-[0_0_20px_rgba(82,152,255,0.3)]'
              : 'bg-transparent border border-border-subtle text-text-secondary hover:bg-accent-blue hover:border-accent-blue hover:text-bg-base'
          }`}
        >
          Select Agent
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}
