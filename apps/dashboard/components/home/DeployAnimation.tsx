'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  WalletIcon,
  ENSIcon,
  IdentityIcon,
  NostrIcon,
  TokenIcon,
  A2AIcon,
  DelegationIcon,
} from '@/components/keychain/KeychainRow'

// ── Step definitions ──────────────────────────────────────────────

type StepType = 'phase' | 'action' | 'summary' | 'delegation'

interface TimelineStep {
  type: StepType
  label: string
  value?: string
  accent?: 'cyan' | 'blue' | 'amber' | 'purple' | 'pink'
  icon?: React.ReactNode
  delay: number
}

const ICON_COLORS: Record<string, string> = {
  cyan: 'bg-accent-cyan/10 border-accent-cyan/20',
  blue: 'bg-accent-blue/10 border-accent-blue/20',
  amber: 'bg-[#F5AC37]/10 border-[#F5AC37]/20',
  purple: 'bg-[#A78BFA]/10 border-[#A78BFA]/20',
  pink: 'bg-[#FF007A]/10 border-[#FF007A]/20',
}

const DOT_COLORS: Record<string, string> = {
  cyan: '#00D4AA',
  blue: '#5298FF',
  amber: '#F5AC37',
  purple: '#A78BFA',
  pink: '#FF007A',
}

const TIMELINE: TimelineStep[] = [
  // Treasury Agent
  { type: 'phase', label: 'TREASURY AGENT', delay: 600 },
  { type: 'action', label: 'Wallet', value: '0xB6Af...6fE1', accent: 'cyan', icon: <WalletIcon />, delay: 500 },
  { type: 'action', label: 'ERC-8004', value: 'ID #231 · Base Sepolia', accent: 'amber', icon: <IdentityIcon />, delay: 500 },
  { type: 'action', label: 'ENS Subname', value: 'alphagotreasury.oikonomosapp.eth', accent: 'blue', icon: <ENSIcon />, delay: 500 },
  { type: 'action', label: 'A2A Endpoint', value: '/.well-known/agent-card.json', accent: 'cyan', icon: <A2AIcon />, delay: 500 },
  { type: 'summary', label: 'Treasury Agent deployed', delay: 600 },

  // DeFi Agent
  { type: 'phase', label: 'DEFI AGENT', delay: 700 },
  { type: 'action', label: 'Wallet', value: '0x1F57...285C', accent: 'cyan', icon: <WalletIcon />, delay: 500 },
  { type: 'action', label: 'ERC-8004', value: 'ID #232 · Base Sepolia', accent: 'amber', icon: <IdentityIcon />, delay: 500 },
  { type: 'action', label: 'ENS + Records', value: 'alphago.oikonomosapp.eth', accent: 'blue', icon: <ENSIcon />, delay: 500 },
  { type: 'action', label: 'Nostr Keypair', value: 'npub19bb9...bf6d', accent: 'purple', icon: <NostrIcon />, delay: 500 },
  { type: 'action', label: 'Token Launch', value: '$ALPHAGO on Base', accent: 'pink', icon: <TokenIcon />, delay: 500 },
  { type: 'summary', label: 'DeFi Agent deployed', delay: 600 },

  // Delegation
  { type: 'delegation', label: 'Delegation active', value: 'DeFi → Treasury · 80% to deployer', accent: 'cyan', icon: <DelegationIcon />, delay: 700 },
]

// ── Component ─────────────────────────────────────────────────────

export function DeployAnimation() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [fading, setFading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let timeouts: ReturnType<typeof setTimeout>[] = []

    function runCycle() {
      if (cancelled) return
      setVisibleCount(0)
      setActiveIndex(-1)
      setFading(false)
      if (scrollRef.current) scrollRef.current.scrollTop = 0

      let cumulativeDelay = 800

      for (let i = 0; i < TIMELINE.length; i++) {
        const step = TIMELINE[i]

        if (step.type === 'action' || step.type === 'delegation') {
          // Show spinner first
          timeouts.push(setTimeout(() => {
            if (cancelled) return
            setActiveIndex(i)
            setVisibleCount(i)
            requestAnimationFrame(scrollToBottom)
          }, cumulativeDelay))

          cumulativeDelay += step.delay

          // Then reveal completed
          timeouts.push(setTimeout(() => {
            if (cancelled) return
            setActiveIndex(-1)
            setVisibleCount(i + 1)
            requestAnimationFrame(scrollToBottom)
          }, cumulativeDelay))
        } else {
          cumulativeDelay += step.delay
          timeouts.push(setTimeout(() => {
            if (cancelled) return
            setActiveIndex(-1)
            setVisibleCount(i + 1)
            requestAnimationFrame(scrollToBottom)
          }, cumulativeDelay))
        }

        cumulativeDelay += 150
      }

      // Hold then fade
      cumulativeDelay += 4000
      timeouts.push(setTimeout(() => {
        if (cancelled) return
        setFading(true)
      }, cumulativeDelay))

      cumulativeDelay += 800
      timeouts.push(setTimeout(() => {
        if (cancelled) return
        runCycle()
      }, cumulativeDelay))
    }

    runCycle()
    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [scrollToBottom])

  const stepsToRender = TIMELINE.slice(0, visibleCount)
  const showSpinner = activeIndex >= 0

  return (
    <div className="h-[480px] relative overflow-hidden">
      {/* Scrollable body */}
      <div
        ref={scrollRef}
        className="h-full overflow-hidden transition-opacity duration-700 relative z-10"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <div className="relative pl-5">
          {/* Vertical timeline line */}
          <div
            className="absolute left-[3px] top-1 w-px transition-all duration-500 ease-out"
            style={{
              height: stepsToRender.length > 0 ? 'calc(100% - 0.5rem)' : '0px',
              background: 'linear-gradient(to bottom, rgba(82,152,255,0.25), rgba(0,212,170,0.15), transparent)',
            }}
          />

          {/* Steps */}
          <div>
            {stepsToRender.map((step, i) => (
              <TimelineRow key={i} step={step} index={i} />
            ))}
            {showSpinner && activeIndex < TIMELINE.length && (
              <SpinnerRow step={TIMELINE[activeIndex]} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Phase Header ──────────────────────────────────────────────────

function PhaseRow({ step, index }: { step: TimelineStep; index: number }) {
  const isTreasury = index < 7
  return (
    <div className="relative pt-1 pb-2 animate-[timelineIn_0.3s_ease-out]">
      {/* Diamond marker */}
      <div
        className="absolute left-[-17px] top-[10px] w-[9px] h-[9px] rotate-45 border z-10"
        style={{
          borderColor: isTreasury ? 'rgba(0,212,170,0.5)' : 'rgba(82,152,255,0.5)',
          background: isTreasury ? 'rgba(0,212,170,0.15)' : 'rgba(82,152,255,0.15)',
        }}
      />
      <div
        className="font-mono text-[0.5625rem] font-bold uppercase tracking-[0.2em]"
        style={{ color: isTreasury ? '#00D4AA' : '#5298FF' }}
      >
        {step.label}
      </div>
    </div>
  )
}

// ── Summary Row ───────────────────────────────────────────────────

function SummaryRow({ step }: { step: TimelineStep }) {
  return (
    <div className="relative py-2 mb-5 animate-[timelineIn_0.3s_ease-out]">
      <div className="absolute left-[-16px] top-[50%] -translate-y-1/2 w-[7px] h-[7px] rounded-full bg-[#00D4AA] z-10 shadow-[0_0_10px_rgba(0,212,170,0.5)]" />
      <div className="font-mono text-[0.6875rem] font-medium text-[#00D4AA] animate-[summaryFlash_1.2s_ease-out] pl-1">
        {step.label} ✓
      </div>
    </div>
  )
}

// ── Action Row (bordered panel with icon) ─────────────────────────

function ActionRow({ step }: { step: TimelineStep }) {
  const accent = step.accent || 'cyan'
  const iconClass = ICON_COLORS[accent]

  return (
    <div className="relative py-1 animate-[timelineIn_0.25s_ease-out]">
      {/* Dot on timeline */}
      <div
        className="absolute left-[-15px] top-[50%] -translate-y-1/2 w-[5px] h-[5px] rounded-full z-10"
        style={{ background: DOT_COLORS[accent] }}
      />
      {/* Bordered sub-row panel */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-bg-base/30 border border-border-subtle/30 ml-1">
        <div className={`w-7 h-7 flex items-center justify-center border shrink-0 ${iconClass}`}>
          {step.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[0.5rem] font-medium text-text-tertiary uppercase tracking-widest leading-none mb-0.5">
            {step.label}
          </div>
          <div className="font-mono text-[0.75rem] text-text-primary truncate leading-tight">
            {step.value}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Delegation Row ────────────────────────────────────────────────

function DelegationRow({ step }: { step: TimelineStep }) {
  const accent = step.accent || 'cyan'
  const iconClass = ICON_COLORS[accent]

  return (
    <div className="relative py-1 animate-[timelineIn_0.25s_ease-out]">
      <div className="absolute left-[-15px] top-[50%] -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-[#5298FF] z-10 shadow-[0_0_8px_rgba(82,152,255,0.4)]" />
      <div className="flex items-center gap-3 px-3 py-2.5 bg-accent-blue/5 border border-accent-blue/15 ml-1">
        <div className={`w-7 h-7 flex items-center justify-center border shrink-0 ${iconClass}`}>
          {step.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[0.5rem] font-medium text-text-tertiary uppercase tracking-widest leading-none mb-0.5">
            {step.label}
          </div>
          <div className="font-mono text-[0.75rem] text-[#5298FF] truncate leading-tight">
            {step.value}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Spinner Row ───────────────────────────────────────────────────

function SpinnerRow({ step }: { step: TimelineStep }) {
  if (step.type === 'phase' || step.type === 'summary') return null

  const accent = step.accent || 'cyan'
  const dotColor = DOT_COLORS[accent]

  return (
    <div className="relative py-1 animate-[timelineIn_0.2s_ease-out]">
      {/* Pulsing dot */}
      <div className="absolute left-[-15px] top-[50%] -translate-y-1/2 z-10 flex items-center justify-center">
        <div className="w-[5px] h-[5px] rounded-full animate-ping" style={{ background: dotColor }} />
        <div className="absolute w-[5px] h-[5px] rounded-full" style={{ background: dotColor }} />
      </div>
      {/* Loading panel */}
      <div className="flex items-center gap-3 px-3 py-2.5 border border-border-subtle/20 ml-1" style={{ background: 'rgba(0,212,170,0.02)' }}>
        <div className="w-7 h-7 flex items-center justify-center border border-border-subtle/30 bg-bg-base/20 shrink-0">
          <div className="w-3 h-3 border-[1.5px] border-accent-cyan/50 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[0.5rem] font-medium text-text-tertiary uppercase tracking-widest leading-none mb-0.5">
            {step.label}
          </div>
          <div className="font-mono text-[0.75rem] text-text-tertiary animate-pulse leading-tight">
            deploying…
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Router ────────────────────────────────────────────────────────

function TimelineRow({ step, index }: { step: TimelineStep; index: number }) {
  switch (step.type) {
    case 'phase': return <PhaseRow step={step} index={index} />
    case 'summary': return <SummaryRow step={step} />
    case 'delegation': return <DelegationRow step={step} />
    case 'action': return <ActionRow step={step} />
    default: return null
  }
}
