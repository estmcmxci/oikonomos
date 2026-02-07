import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { BuiltWith } from '@/components/home/BuiltWith'
import { DeployAnimation } from '@/components/home/DeployAnimation'

export default function HomePage() {
  return (
    <div className="container">
      <Header showNav showWallet />

      {/* Hero Section */}
      <section className="py-12 md:py-24 pb-12 md:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 items-center">
        <div className="opacity-0 animate-fade-up delay-300">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <Badge>Live on Sepolia</Badge>
          </div>

          <h1 className="font-display text-3xl md:text-5xl lg:text-[4rem] font-bold leading-[1.05] tracking-tight mb-4 md:mb-6">
            Agent Keychain &<br />
            <span className="text-accent-blue">Portfolio Manager</span>
          </h1>

          <p className="font-display text-base md:text-lg font-light leading-relaxed text-text-secondary mb-8 md:mb-10 max-w-[480px]">
            AI agents launching tokens across platforms end up with scattered wallets and unclaimed fees.
            Two API calls create a treasury + DeFi agent pair &mdash; each with a deterministic wallet, ENS subname, and on-chain identity. Then the treasury agent autonomously manages Uniswap V4 fees.
          </p>

          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <Link href="/launch" className="btn-primary">
              Launch Agent
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link href="/keychain" className="btn-secondary">
              View Keychain
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Animated Deploy Simulation — hidden on small screens */}
        <div className="opacity-0 animate-fade-up delay-500 hidden md:block">
          <DeployAnimation />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-24 opacity-0 animate-fade-up delay-900" id="how">
        <div className="text-center mb-10 md:mb-16">
          <div className="font-mono text-[0.6875rem] font-medium text-accent-cyan uppercase tracking-[0.2em] mb-4">
            How It Works
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight">
            Three Steps to Deploy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            number="01"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            }
            title="Configure"
            description="Name your agent, choose a token symbol, set your fee split. The form validates and prepares everything for a single API call."
            showConnector
          />
          <StepCard
            number="02"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <path d="M22 4L12 14.01l-3-3"/>
              </svg>
            }
            title="Deploy"
            description="Each agent gets a wallet, ERC-8004 identity, ENS subname, and Nostr keys. A second API call registers the DeFi agent's token records on ENS."
            showConnector
          />
          <StepCard
            number="03"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            }
            title="Manage"
            description="The treasury agent runs autonomously &mdash; claiming Uniswap V4 fees from your DeFi agent and distributing them back to your wallet."
          />
        </div>
      </section>

      <BuiltWith />
      <Footer />
    </div>
  )
}

// ── Step Card ───────────────────────────────────────────────────────

function StepCard({
  number,
  icon,
  title,
  description,
  showConnector,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
  showConnector?: boolean
}) {
  return (
    <div className="bg-bg-card border border-border-subtle p-6 md:p-10 relative backdrop-blur-xl transition-all duration-300 hover:border-border-accent hover:-translate-y-1">
      <div className="font-mono text-[0.625rem] font-bold text-accent-cyan uppercase tracking-[0.2em] mb-5">
        Step {number}
      </div>

      <div className="w-12 h-12 flex items-center justify-center mb-6 bg-accent-cyan/10 border border-accent-cyan/20">
        {icon}
      </div>

      <h3 className="font-display text-xl font-semibold mb-3 tracking-tight">{title}</h3>

      <p className="font-display text-[0.9375rem] font-light text-text-secondary leading-relaxed">
        {description}
      </p>

      {showConnector && (
        <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-accent-cyan/40">
          <span className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-[6px] border-transparent border-l-accent-cyan" />
        </div>
      )}
    </div>
  )
}

