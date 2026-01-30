'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { resolveAgent, type AgentRecord } from '@oikonomos/sdk';

export function useAgent(ensName: string | undefined) {
  const client = usePublicClient();

  const query = useQuery<AgentRecord | null>({
    queryKey: ['agent', ensName],
    queryFn: async () => {
      if (!ensName || !client) return null;
      return resolveAgent(client, ensName);
    },
    enabled: !!ensName && !!client,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    agent: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
