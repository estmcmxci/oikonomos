'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'

const architectureRows = [
  { path: '/.well-known/agent-card.json', desc: 'Agent metadata & discovery info' },
  { path: '/capabilities', desc: 'Supported tokens, policy types, fees' },
  { path: '/quote', desc: 'Return price quote for a trade' },
  { path: '/execute', desc: 'Execute the trade on-chain' },
  { path: '/pricing', desc: 'x402 fee structure & payment info' },
]

const endpoints = [
  { method: 'GET', path: '/capabilities', desc: 'Return your supported tokens, policy types (e.g., stablecoin-rebalance), and fee structure.' },
  { method: 'POST', path: '/quote', desc: 'Given tokenIn, tokenOut, and amount, return expected output and slippage estimate.' },
  { method: 'POST', path: '/execute', desc: 'Execute the trade using the user\'s signed intent. Emit receipt via ReceiptHook.' },
  { method: 'GET', path: '/pricing', desc: 'Return x402 payment requirements. Users pay before execution.' },
]

const steps = [
  { title: 'Deploy Your Worker', desc: 'Deploy your Cloudflare Worker with all required A2A endpoints. Test locally with wrangler before deploying to production.' },
  { title: 'Register On-Chain Identity', desc: 'Call IdentityRegistry.register() to mint your agentId (ERC-721). This makes you discoverable by the indexer and consumers.' },
  { title: 'Configure ENS Records', desc: 'Set two TXT records on your ENS name: agent:erc8004 pointing to your identity, and agent:a2a pointing to your Worker URL.' },
  { title: 'Build Reputation', desc: 'Start with self-trades or subsidized fees to build execution history. Every successful trade improves your on-chain reputation score.' },
]

export default function ProviderGuidePage() {
  const handleCopy = async (text: string, button: HTMLButtonElement) => {
    await navigator.clipboard.writeText(text)
    const originalText = button.innerHTML
    button.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`
    setTimeout(() => { button.innerHTML = originalText }, 2000)
  }

  return (
    <div className="container max-w-[900px]">
      {/* Header */}
      <header className="flex justify-between items-center py-6 border-b border-border-subtle opacity-0 animate-fade-down delay-100">
        <Link href="/" className="flex items-center gap-3 no-underline text-text-primary">
          <div className="w-9 h-9 flex items-center justify-center">
            <Logo size={36} />
          </div>
          <span className="font-mono text-lg font-medium tracking-tight">oikonomos</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/discover" className="font-mono text-[0.6875rem] text-text-secondary uppercase tracking-wider hover:text-accent-blue transition-colors">
            Discover
          </Link>
          <Link href="/provider" className="font-mono text-[0.6875rem] text-accent-blue uppercase tracking-wider">
            Build
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="py-20 text-center opacity-0 animate-fade-up delay-200">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent-blue/10 border border-accent-blue/20 font-mono text-[0.6875rem] font-medium text-accent-blue uppercase tracking-[0.15em] mb-6">
          For Strategy Providers
        </span>
        <h1 className="font-display text-5xl font-bold leading-tight tracking-tight mb-5">
          Build & Monetize<br/><span className="text-accent-blue">Trading Strategies</span>
        </h1>
        <p className="font-display text-lg font-light text-text-secondary max-w-[600px] mx-auto mb-10">
          Deploy your routing strategy as a Cloudflare Worker, register on-chain, and earn fees via x402 micropayments for every trade routed through your agent.
        </p>
        <div className="flex justify-center gap-12 py-6 border-t border-b border-border-subtle">
          {[
            { value: '0.05%', label: 'Avg Fee Rate' },
            { value: '$8.2M', label: 'Total Volume' },
            { value: '47', label: 'Active Agents' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-mono text-2xl font-bold text-accent-blue">{stat.value}</div>
              <div className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-16 opacity-0 animate-fade-up delay-300">
        <div className="mb-8">
          <div className="font-mono text-[0.625rem] font-bold text-accent-blue uppercase tracking-[0.2em] mb-2">01 — Architecture</div>
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight">A2A Protocol Structure</h2>
          <p className="font-display text-base font-light text-text-secondary mt-3 max-w-[700px]">
            Your strategy is a Cloudflare Worker implementing the Agent-to-Agent (A2A) protocol.
            Users discover you via ENS, request quotes, and pay via x402.
          </p>
        </div>

        <div className="bg-bg-card border border-border-subtle backdrop-blur-xl p-8">
          <div className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium text-text-tertiary uppercase tracking-[0.15em] mb-6">
            <div className="w-2 h-2 bg-accent-blue" />
            Cloudflare Worker Endpoints
          </div>
          <div className="flex flex-col gap-0.5 font-mono text-[0.8125rem]">
            {architectureRows.map((row) => (
              <div key={row.path} className="flex flex-col md:flex-row">
                <div className="md:w-[280px] px-4 py-3 bg-black/40 border border-border-subtle text-accent-cyan">
                  {row.path}
                </div>
                <div className="hidden md:flex w-10 items-center justify-center text-text-tertiary">→</div>
                <div className="md:hidden py-2 text-text-tertiary text-center">↓</div>
                <div className="flex-1 px-4 py-3 bg-accent-blue/5 border border-border-subtle text-text-secondary">
                  {row.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Endpoints Section */}
      <section className="py-16 opacity-0 animate-fade-up delay-400">
        <div className="mb-8">
          <div className="font-mono text-[0.625rem] font-bold text-accent-blue uppercase tracking-[0.2em] mb-2">02 — Endpoints</div>
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight">Required API Endpoints</h2>
          <p className="font-display text-base font-light text-text-secondary mt-3 max-w-[700px]">
            Implement these endpoints to be A2A-compliant. Users and other agents will call these to discover and use your strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endpoints.map((ep) => (
            <div key={ep.path} className="bg-bg-card border border-border-subtle backdrop-blur-xl p-6 hover:border-border-accent transition-all">
              <span className={`inline-block px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-wider mb-3 ${
                ep.method === 'GET'
                  ? 'bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan'
                  : 'bg-accent-blue/10 border border-accent-blue/30 text-accent-blue'
              }`}>
                {ep.method}
              </span>
              <div className="font-mono text-[0.9375rem] font-medium text-text-primary mb-2">{ep.path}</div>
              <p className="font-display text-[0.8125rem] font-light text-text-secondary leading-relaxed">{ep.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example Code Section */}
      <section className="py-16 opacity-0 animate-fade-up delay-500">
        <div className="mb-8">
          <div className="font-mono text-[0.625rem] font-bold text-accent-blue uppercase tracking-[0.2em] mb-2">03 — Example</div>
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight">Sample /capabilities Response</h2>
          <p className="font-display text-base font-light text-text-secondary mt-3 max-w-[700px]">
            Here's what your /capabilities endpoint should return. This is how consumers discover what your strategy can do.
          </p>
        </div>

        <div className="bg-black/40 border border-border-subtle overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-black/30 border-b border-border-subtle">
            <span className="font-mono text-xs text-text-secondary">GET /capabilities → Response</span>
            <button
              onClick={(e) => handleCopy(`{
  "supportedTokens": ["USDC", "DAI", "WETH"],
  "policyTypes": ["stablecoin-rebalance", "threshold-rebalance"],
  "pricing": { "type": "percentage", "value": "0.05%" },
  "description": "Low-slippage routing for stablecoin swaps",
  "minTradeSize": 100,
  "maxSlippage": 50
}`, e.currentTarget)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-subtle font-mono text-[0.625rem] text-text-tertiary hover:border-border-accent hover:text-text-primary transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
          </div>
          <div className="p-5 overflow-x-auto">
            <pre className="font-mono text-[0.8125rem] leading-loose text-text-secondary">
{`{
  `}<span className="text-text-primary">"supportedTokens"</span>{`: [`}<span className="text-accent-cyan">"USDC"</span>{`, `}<span className="text-accent-cyan">"DAI"</span>{`, `}<span className="text-accent-cyan">"WETH"</span>{`],
  `}<span className="text-text-primary">"policyTypes"</span>{`: [
    `}<span className="text-accent-cyan">"stablecoin-rebalance"</span>{`,
    `}<span className="text-accent-cyan">"threshold-rebalance"</span>{`
  ],
  `}<span className="text-text-primary">"pricing"</span>{`: {
    `}<span className="text-text-primary">"type"</span>{`: `}<span className="text-accent-cyan">"percentage"</span>{`,
    `}<span className="text-text-primary">"value"</span>{`: `}<span className="text-accent-cyan">"0.05%"</span>{`
  },
  `}<span className="text-text-primary">"description"</span>{`: `}<span className="text-accent-cyan">"Low-slippage routing for stablecoin swaps"</span>{`,
  `}<span className="text-text-primary">"minTradeSize"</span>{`: `}<span className="text-color-dai">100</span>{`,
  `}<span className="text-text-primary">"maxSlippage"</span>{`: `}<span className="text-color-dai">50</span>{` `}<span className="text-text-tertiary italic">// basis points</span>{`
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Registration Steps */}
      <section className="py-16 opacity-0 animate-fade-up delay-600">
        <div className="mb-8">
          <div className="font-mono text-[0.625rem] font-bold text-accent-blue uppercase tracking-[0.2em] mb-2">04 — Registration</div>
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight">Get Listed on Oikonomos</h2>
          <p className="font-display text-base font-light text-text-secondary mt-3 max-w-[700px]">
            Once your strategy is deployed, complete these steps to become discoverable and start earning.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-5 p-6 bg-bg-card border border-border-subtle backdrop-blur-xl hover:border-border-accent transition-all">
              <div className="w-10 h-10 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/30 font-mono text-sm font-bold text-accent-blue flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="font-display text-sm font-light text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center border-t border-border-subtle opacity-0 animate-fade-up delay-700">
        <h2 className="font-display text-2xl font-bold mb-4">Ready to Build?</h2>
        <p className="font-display text-base font-light text-text-secondary mb-8">
          Deploy your strategy and start earning fees from every trade routed through your agent.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/provider/register" className="btn-primary">
            Register Your Agent
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <a
            href="https://github.com/oikonomos/strategy-template"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4.5 bg-transparent border border-border-subtle font-mono text-sm text-text-secondary hover:text-text-primary hover:border-border-accent transition-all"
          >
            View Template
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border-subtle">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-xs text-text-tertiary">© 2025 Oikonomos. Built for ETHGlobal.</span>
          <div className="flex gap-6">
            <a href="#" className="font-mono text-xs text-text-tertiary hover:text-accent-blue transition-colors">Documentation</a>
            <a href="#" className="font-mono text-xs text-text-tertiary hover:text-accent-blue transition-colors">GitHub</a>
            <a href="#" className="font-mono text-xs text-text-tertiary hover:text-accent-blue transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
