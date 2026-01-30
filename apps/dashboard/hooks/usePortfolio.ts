'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

export interface PortfolioPosition {
  token: string;
  symbol: string;
  balance: bigint;
  valueUsd: number;
  targetPercentage: number;
  currentPercentage: number;
  drift: number;
}

export interface PortfolioData {
  totalValueUsd: number;
  positions: PortfolioPosition[];
  lastRebalance?: Date;
}

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069';

export function usePortfolio(strategyId?: string) {
  const { address } = useAccount();

  const query = useQuery<PortfolioData | null>({
    queryKey: ['portfolio', address, strategyId],
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch(
        `${PONDER_URL}/portfolio/${address}${strategyId ? `?strategyId=${strategyId}` : ''}`
      );

      if (!response.ok) {
        // Return mock data for demo
        return {
          totalValueUsd: 10000,
          positions: [
            {
              token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
              symbol: 'USDC',
              balance: BigInt(10000e6),
              valueUsd: 10000,
              targetPercentage: 100,
              currentPercentage: 100,
              drift: 0,
            },
          ],
        };
      }

      return response.json();
    },
    enabled: !!address,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    portfolio: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
