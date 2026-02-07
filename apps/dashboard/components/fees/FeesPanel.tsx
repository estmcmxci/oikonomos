'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import {
  getFeeStatus,
  updateDistribution,
  claimFees,
  type DistributionSchedule,
} from '@/lib/api'
import { SummaryCards } from './SummaryCards'
import { FeeTable } from './FeeTable'
import { ClaimHistory } from './ClaimHistory'
import { DistributionSettings } from './DistributionSettings'
import { DepositCard } from './DepositCard'

interface FeesPanelProps {
  userAddress: Address
}

export function FeesPanel({ userAddress }: FeesPanelProps) {
  const queryClient = useQueryClient()
  const [claiming, setClaiming] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['feeStatus', userAddress],
    queryFn: () => getFeeStatus(userAddress),
    refetchInterval: 30_000,
  })

  const handleClaim = useCallback(async (_agentName: string) => {
    setClaiming(true)
    try {
      await claimFees(userAddress)
      queryClient.invalidateQueries({ queryKey: ['feeStatus', userAddress] })
    } catch (err) {
      console.error('Claim failed:', err)
    } finally {
      setClaiming(false)
    }
  }, [userAddress, queryClient])

  const handleSaveSettings = useCallback(async (
    mode: 'auto' | 'manual',
    schedule?: DistributionSchedule
  ) => {
    setSaving(true)
    try {
      await updateDistribution(userAddress, mode, schedule)
      queryClient.invalidateQueries({ queryKey: ['feeStatus', userAddress] })
    } catch (err) {
      console.error('Save settings failed:', err)
    } finally {
      setSaving(false)
    }
  }, [userAddress, queryClient])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-[0.75rem] text-text-secondary">Loading fee data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="font-mono text-[0.75rem] text-red-400">
          Failed to load fee status: {String(error)}
        </p>
      </div>
    )
  }

  if (!data || data.agents.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="font-mono text-[0.8125rem] text-text-secondary">
          No agents deployed yet. Deploy a portfolio to start earning fees.
        </p>
      </div>
    )
  }

  // Only show DeFi agents with tokens in the fee table (hide treasury + legacy test agents)
  const defiAgents = data.agents.filter(a => a.tokenSymbol)

  // Derive current settings from first agent with a distribution mode
  const primaryAgent = data.agents.find(a => a.distributionMode) ?? data.agents[0]
  const currentMode = primaryAgent?.distributionMode ?? 'auto'
  const currentSchedule = primaryAgent?.distributionSchedule
  const feeSplit = primaryAgent?.feeSplit ?? 85

  return (
    <div className="p-4 space-y-4">
      {/* Summary stats */}
      <SummaryCards
        totalClaimable={data.totalClaimableWeth}
        totalInWallets={data.totalWalletWeth}
        totalDistributed={data.totalDistributed}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Fee table + claim history */}
        <div className="lg:col-span-2 space-y-4">
          <FeeTable
            agents={defiAgents}
            onClaim={handleClaim}
            claiming={claiming}
          />
          <ClaimHistory claims={data.recentClaims} />
        </div>

        {/* Right: Settings + deposit */}
        <div className="space-y-4">
          <div className="border border-border-subtle p-4">
            <DistributionSettings
              currentMode={currentMode}
              currentSchedule={currentSchedule}
              feeSplit={feeSplit}
              onSave={handleSaveSettings}
              saving={saving}
            />
          </div>
          <DepositCard
            depositAddress={data.depositAddress}
            chainId={data.depositChainId}
          />
        </div>
      </div>
    </div>
  )
}
