'use client';

import { getEtherscanUrl } from '@/lib/api';
import { CardLabel } from '@/components/ui/Card';

interface ProofLinksProps {
  txHash: `0x${string}`;
  blockNumber: bigint;
  chainId?: number;
}

export function ProofLinks({ txHash, blockNumber, chainId = 11155111 }: ProofLinksProps) {
  return (
    <div className="space-y-2">
      <CardLabel className="mb-2 block">Proof Links</CardLabel>
      <div className="flex flex-col gap-2 text-sm">
        <a
          href={getEtherscanUrl(txHash, chainId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] flex items-center gap-2 transition-colors"
        >
          <span>View on Etherscan</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <span className="text-[var(--color-text-tertiary)] font-mono tabular-nums">
          Block #{blockNumber.toString()}
        </span>
      </div>
    </div>
  );
}
