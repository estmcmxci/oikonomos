'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

interface Agent {
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

interface AgentTableProps {
  agents: Agent[]
  recommendedId?: string
}

export function AgentTable({ agents, recommendedId }: AgentTableProps) {
  const tableRef = useRef<HTMLTableElement>(null)

  useEffect(() => {
    // Animate score bars after render
    const timeout = setTimeout(() => {
      const bars = tableRef.current?.querySelectorAll('.score-fill[data-width]')
      bars?.forEach((bar) => {
        const element = bar as HTMLElement
        element.style.width = element.dataset.width || '0%'
      })
    }, 800)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="bg-bg-card border border-border-subtle backdrop-blur-xl mb-12 opacity-0 animate-fade-up delay-600">
      <table ref={tableRef} className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-3.5 text-left font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider bg-black/20 border-b border-border-subtle">
              Agent
            </th>
            <th className="px-4 py-3.5 text-left font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider bg-black/20 border-b border-border-subtle">
              Reputation
            </th>
            <th className="px-4 py-3.5 text-right font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider bg-black/20 border-b border-border-subtle">
              Executions
            </th>
            <th className="px-4 py-3.5 text-right font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider bg-black/20 border-b border-border-subtle">
              Avg Slippage
            </th>
            <th className="px-4 py-3.5 text-right font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider bg-black/20 border-b border-border-subtle">
              Success
            </th>
            <th className="px-4 py-3.5 text-left font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider bg-black/20 border-b border-border-subtle">
              Tokens
            </th>
            <th className="px-4 py-3.5 text-right font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-wider bg-black/20 border-b border-border-subtle">
              Fee
            </th>
            <th className="px-4 py-3.5 bg-black/20 border-b border-border-subtle" />
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => {
            const isRecommended = agent.id === recommendedId
            const scoreClass = agent.score >= 80 ? 'high' : agent.score >= 60 ? 'medium' : 'low'

            return (
              <tr
                key={agent.id}
                className={`border-b border-white/[0.04] hover:bg-accent-blue/5 ${
                  isRecommended ? 'bg-accent-cyan/5 hover:bg-accent-cyan/[0.08]' : ''
                }`}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/20 font-mono text-[0.6875rem] font-bold text-accent-blue">
                      {agent.avatar}
                    </div>
                    <div>
                      <div className="font-mono text-[0.8125rem] font-medium text-text-primary">
                        {agent.name}
                        {isRecommended && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent-cyan/10 border border-accent-cyan/30 font-mono text-[0.5rem] font-medium text-accent-cyan uppercase tracking-wide">
                            <span>★</span> Best
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[0.5625rem] text-text-tertiary mt-0.5">
                        Agent #{agent.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="score-bar">
                      <div
                        className={`score-fill ${scoreClass}`}
                        style={{ width: 0 }}
                        data-width={`${agent.score}%`}
                      />
                    </div>
                    <span className="font-mono text-[0.8125rem] font-bold text-text-primary min-w-[24px]">
                      {agent.score}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-mono text-[0.8125rem] text-text-primary">
                  {agent.executions}
                </td>
                <td className="px-4 py-4 text-right font-mono text-[0.8125rem] text-text-primary">
                  {agent.slippage}<span className="text-text-tertiary text-[0.6875rem]">bps</span>
                </td>
                <td className="px-4 py-4 text-right font-mono text-[0.8125rem] text-text-primary">
                  {agent.success}<span className="text-text-tertiary text-[0.6875rem]">%</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {agent.tokens.map((token) => (
                      <span
                        key={token}
                        className="px-1.5 py-0.5 bg-white/5 border border-border-subtle font-mono text-[0.5625rem] text-text-secondary"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-mono text-sm font-bold text-accent-cyan">
                  {agent.fee}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/configure/${agent.id}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[0.625rem] font-medium no-underline transition-all duration-200 ${
                      isRecommended
                        ? 'bg-accent-blue border border-accent-blue text-bg-base'
                        : 'bg-transparent border border-border-subtle text-text-secondary hover:bg-accent-blue hover:border-accent-blue hover:text-bg-base'
                    }`}
                  >
                    Select
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
