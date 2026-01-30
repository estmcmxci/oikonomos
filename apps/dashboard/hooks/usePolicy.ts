'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface PolicyConfig {
  allocations: { token: string; symbol: string; percentage: number }[];
  driftThreshold: number;
  maxSlippageBps: number;
  maxDailyUsd: number;
  triggerType: 'drift' | 'periodic';
}

const DEFAULT_POLICY: PolicyConfig = {
  allocations: [
    { token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC', percentage: 100 },
  ],
  driftThreshold: 5,
  maxSlippageBps: 25,
  maxDailyUsd: 10000,
  triggerType: 'drift',
};

export function usePolicy(agentUrl?: string) {
  const { address } = useAccount();
  const [config, setConfig] = useState<PolicyConfig>(DEFAULT_POLICY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitPolicy = useCallback(async () => {
    if (!address || !agentUrl) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${agentUrl}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          policy: config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to configure policy');
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [address, agentUrl, config]);

  const updateAllocation = useCallback((index: number, percentage: number) => {
    setConfig((prev) => {
      const newAllocations = [...prev.allocations];
      newAllocations[index] = { ...newAllocations[index], percentage };
      return { ...prev, allocations: newAllocations };
    });
  }, []);

  const updateConstraint = useCallback(<K extends keyof PolicyConfig>(
    key: K,
    value: PolicyConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    config,
    setConfig,
    updateAllocation,
    updateConstraint,
    submitPolicy,
    isSubmitting,
    error,
    isConnected: !!address,
  };
}
