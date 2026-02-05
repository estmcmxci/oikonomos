import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { ActivityFeed } from '@/components/ActivityFeed'
import { StatsSection } from '@/components/home/StatsSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { BuiltWith } from '@/components/home/BuiltWith'

export default function HomePage() {
  return (
    <div className="container">
      <Header />

      {/* Hero Section */}
      <section className="py-24 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="opacity-0 animate-fade-up delay-300">
          <div className="flex items-center gap-3 mb-6">
            <Badge>Live on Base Sepolia</Badge>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0052FF]/10 border border-[#0052FF]/20">
              <svg width="16" height="16" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
                <path d="M55.5 22C37 22 22 37 22 55.5C22 74 37 89 55.5 89C74 89 89 74 89 55.5C89 37 74 22 55.5 22ZM55.5 79.5C42.5 79.5 32 69 32 55.5C32 42 42.5 31.5 55.5 31.5C68.5 31.5 79 42 79 55.5C79 69 68.5 79.5 55.5 79.5Z" fill="white"/>
              </svg>
              <span className="font-mono text-[0.625rem] font-medium text-[#0052FF] uppercase tracking-wider">Base</span>
            </div>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-[4rem] font-bold leading-[1.05] tracking-tight mb-6">
            Autonomous DeFi<br />
            <span className="text-accent-blue">Strategy Agents</span>
          </h1>

          <p className="font-display text-lg font-light leading-relaxed text-text-secondary mb-10 max-w-[480px]">
            Discover verified agents, delegate trading authority with cryptographic constraints, and verify every execution on-chain. Built on Base Sepolia testnet.
          </p>

          {/* Path Choice Cards */}
          <div className="flex gap-4 mt-2">
            <Link
              href="/analyze"
              className="flex-1 p-6 bg-bg-card border border-border-subtle backdrop-blur-xl no-underline text-text-primary transition-all duration-300 relative overflow-hidden group hover:border-border-accent hover:-translate-y-0.5"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-blue to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="w-10 h-10 flex items-center justify-center mb-4 bg-accent-cyan/10 border border-accent-cyan/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <path d="M16 12h.01"/>
                </svg>
              </div>

              <div className="font-mono text-[0.5625rem] font-medium uppercase tracking-widest text-text-tertiary mb-1">
                I want to
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Delegate to Agents</h3>
              <p className="font-display text-[0.8125rem] font-light text-text-secondary leading-relaxed">
                Connect your wallet, discover verified strategies, and automate your portfolio management.
              </p>

              <div className="absolute bottom-5 right-5 text-text-tertiary group-hover:text-accent-blue group-hover:translate-x-1 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            <Link
              href="/provider"
              className="flex-1 p-6 bg-bg-card border border-border-subtle backdrop-blur-xl no-underline text-text-primary transition-all duration-300 relative overflow-hidden group hover:border-border-accent hover:-translate-y-0.5"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-blue to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="w-10 h-10 flex items-center justify-center mb-4 bg-accent-blue/10 border border-accent-blue/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5298FF" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>

              <div className="font-mono text-[0.5625rem] font-medium uppercase tracking-widest text-text-tertiary mb-1">
                I want to
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Build & Sell Strategies</h3>
              <p className="font-display text-[0.8125rem] font-light text-text-secondary leading-relaxed">
                Deploy your trading strategy, register on-chain, and earn fees through x402 micropayments.
              </p>

              <div className="absolute bottom-5 right-5 text-text-tertiary group-hover:text-accent-blue group-hover:translate-x-1 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Link href="#how" className="btn-secondary">
              How it works
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l10-10M7 7h10v10"/>
              </svg>
            </Link>
          </div>
        </div>

        <div className="opacity-0 animate-fade-up delay-500">
          <ActivityFeed />
        </div>
      </section>

      <StatsSection />
      <HowItWorks />
      <BuiltWith />
      <Footer />
    </div>
  )
}
