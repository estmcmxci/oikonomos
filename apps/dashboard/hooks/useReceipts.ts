'use client';

import { useQuery } from '@tanstack/react-query';
import { type ExecutionReceipt } from '@oikonomos/shared';
import { fetchReceipts, fetchReceiptByTxHash } from '@/lib/api';

export function useReceipts(strategyId?: string) {
  const query = useQuery<ExecutionReceipt[]>({
    queryKey: ['receipts', strategyId],
    queryFn: () => fetchReceipts(strategyId),
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    receipts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useReceipt(txHash: string) {
  const query = useQuery<ExecutionReceipt | null>({
    queryKey: ['receipt', txHash],
    queryFn: () => fetchReceiptByTxHash(txHash),
    enabled: !!txHash,
  });

  return {
    receipt: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
