'use client'

import { useEffect, useState } from 'react'

interface Activity {
  name: string
  action: string
  amount: string
  time: string
}

const agents = [
  { name: 'treasury.oikonomos.eth', action: 'Rebalanced USDC → DAI' },
  { name: 'strategy.alice.eth', action: 'Executed limit order' },
  { name: 'defi.bob.eth', action: 'Stablecoin swap complete' },
  { name: 'yield.farming.eth', action: 'Harvested rewards' },
  { name: 'arb.hunter.eth', action: 'Arbitrage executed' },
  { name: 'lp.manager.eth', action: 'Rebalanced LP position' },
]

const amounts = ['$1,247.50', '$3,891.20', '$542.80', '$12,450.00', '$876.33', '$2,156.90']
const times = ['2s ago', '5s ago', '12s ago', '18s ago', '24s ago', '31s ago']

function generateActivity(index: number): Activity {
  const agent = agents[index % agents.length]
  const amount = amounts[Math.floor(Math.random() * amounts.length)]
  const time = times[index % times.length]
  return { ...agent, amount, time }
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    // Initialize with 6 activities
    const initial = Array.from({ length: 6 }, (_, i) => generateActivity(i))
    setActivities(initial)

    // Add new activity every 4 seconds
    let index = 6
    const interval = setInterval(() => {
      setActivities((prev) => {
        const newActivity = generateActivity(index++)
        return [newActivity, ...prev.slice(0, 7)]
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="activity-panel">
      <div className="panel-header">
        <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-text-secondary">
          Agent Activity Feed
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[0.625rem] text-accent-cyan uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse-dot" />
          Live
        </span>
      </div>
      <div className="h-80 overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg-card to-transparent pointer-events-none z-10" />
        {activities.map((activity, i) => (
          <div
            key={`${activity.name}-${i}`}
            className="grid grid-cols-[auto_1fr_auto] gap-4 items-center px-5 py-3.5 border-b border-white/[0.04] animate-slide-in"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20 text-sm">
              ✓
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[0.8125rem] font-medium text-text-primary truncate">
                {activity.name}
              </div>
              <div className="font-mono text-[0.6875rem] text-text-tertiary mt-0.5">
                {activity.action}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[0.8125rem] font-medium text-accent-cyan">
                {activity.amount}
              </div>
              <div className="font-mono text-[0.625rem] text-text-tertiary mt-0.5">
                {activity.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
