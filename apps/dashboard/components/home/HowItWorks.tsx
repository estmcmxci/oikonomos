export function HowItWorks() {
  return (
    <section className="py-24 opacity-0 animate-fade-up delay-900" id="how">
      {/* Consumer Journey */}
      <div className="mb-20">
        <div className="text-center mb-16">
          <div className="font-mono text-[0.6875rem] font-medium text-accent-cyan uppercase tracking-[0.2em] mb-4">
            For Consumers
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight">
            Delegate to Verified Agents
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            number="01"
            variant="consumer"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <path d="M16 12h.01"/>
              </svg>
            }
            title="Connect & Analyze"
            description="Link your wallet to analyze your portfolio. We scan your holdings and suggest optimal rebalancing strategies."
            showConnector
          />
          <StepCard
            number="02"
            variant="consumer"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            }
            title="Discover Agents"
            description="Browse verified agents ranked by on-chain reputation. Compare fees, track records, and supported strategies."
            showConnector
          />
          <StepCard
            number="03"
            variant="consumer"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            }
            title="Delegate & Verify"
            description="Sign a constrained intent. Agents execute within your limits, and every trade is verifiable on-chain via receipts."
          />
        </div>
      </div>

      {/* Provider Journey */}
      <div>
        <div className="text-center mb-16">
          <div className="font-mono text-[0.6875rem] font-medium text-accent-blue uppercase tracking-[0.2em] mb-4">
            For Strategy Providers
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight">
            Build & Monetize Strategies
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StepCard
            number="01"
            variant="provider"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5298FF" strokeWidth="1.5">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            }
            title="Build Strategy"
            description="Deploy a Cloudflare Worker implementing A2A protocol with /quote and /execute endpoints."
            showConnector
          />
          <StepCard
            number="02"
            variant="provider"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5298FF" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            }
            title="Register Identity"
            description="Call IdentityRegistry to mint your agentId (ERC-721) and become discoverable on-chain."
            showConnector
          />
          <StepCard
            number="03"
            variant="provider"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5298FF" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
            }
            title="Setup ENS"
            description="Configure your ENS with agent:erc8004 and agent:a2a records pointing to your identity and endpoint."
            showConnector
          />
          <StepCard
            number="04"
            variant="provider"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5298FF" strokeWidth="1.5">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            }
            title="Earn via x402"
            description="Build reputation through executions. Get paid via x402 micropayments for every trade routed through your strategy."
          />
        </div>
      </div>
    </section>
  )
}

interface StepCardProps {
  number: string
  variant: 'consumer' | 'provider'
  icon: React.ReactNode
  title: string
  description: string
  showConnector?: boolean
}

function StepCard({ number, variant, icon, title, description, showConnector }: StepCardProps) {
  const accentColor = variant === 'consumer' ? 'accent-cyan' : 'accent-blue'

  return (
    <div className="bg-bg-card border border-border-subtle p-8 md:p-10 relative backdrop-blur-xl transition-all duration-300 hover:border-border-accent hover:-translate-y-1">
      <div className={`font-mono text-[0.625rem] font-bold text-${accentColor} uppercase tracking-[0.2em] mb-5`}>
        Step {number}
      </div>

      <div className={`w-12 h-12 flex items-center justify-center mb-6 ${
        variant === 'consumer'
          ? 'bg-accent-cyan/10 border border-accent-cyan/20'
          : 'bg-accent-blue/10 border border-accent-blue/20'
      }`}>
        {icon}
      </div>

      <h3 className="font-display text-xl font-semibold mb-3 tracking-tight">
        {title}
      </h3>

      <p className="font-display text-[0.9375rem] font-light text-text-secondary leading-relaxed">
        {description}
      </p>

      {showConnector && (
        <div className={`hidden md:block absolute top-1/2 -right-3 w-6 h-px ${
          variant === 'consumer' ? 'bg-accent-cyan/40' : 'bg-border-accent'
        }`}>
          <span className={`absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-[6px] border-transparent ${
            variant === 'consumer' ? 'border-l-accent-cyan' : 'border-l-accent-blue'
          }`} />
        </div>
      )}
    </div>
  )
}
