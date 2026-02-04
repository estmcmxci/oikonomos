// OIK-53: Receipt Verification Endpoint
// Allows consumers to verify execution receipts with explorer links

import type { Env } from '../index';

interface Receipt {
  id: string;
  strategyId: string;
  user: string;
  amount0: string;
  amount1: string;
  actualSlippage: string;
  policyCompliant: boolean;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

interface VerificationResponse {
  verified: boolean;
  receipt?: Receipt;
  proof?: {
    transactionHash: string;
    blockNumber: string;
    explorerUrl: string;
  };
  error?: string;
}

/**
 * Get block explorer base URL for a given chain ID
 */
function getExplorerUrl(chainId: number): string {
  switch (chainId) {
    case 84532:
      return 'https://sepolia.basescan.org';
    case 11155111:
      return 'https://sepolia.etherscan.io';
    case 8453:
      return 'https://basescan.org';
    case 1:
      return 'https://etherscan.io';
    default:
      return 'https://etherscan.io';
  }
}

/**
 * Handle receipt verification requests
 * Fetches receipt from indexer and returns verification response with explorer link
 */
export async function handleVerifyReceipt(
  receiptId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const indexerUrl = env.INDEXER_URL || 'https://indexer-production-323e.up.railway.app';

  try {
    // Validate receiptId format
    if (!receiptId || receiptId.length < 10) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: 'Invalid receipt ID format',
        } satisfies VerificationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`${indexerUrl}/receipt/${receiptId}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({
            verified: false,
            error: 'Receipt not found',
          } satisfies VerificationResponse),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Indexer returned ${response.status}`);
    }

    const receipt = (await response.json()) as Receipt;

    // Determine explorer URL based on chain
    const chainId = parseInt(env.CHAIN_ID || '84532');
    const explorerBase = getExplorerUrl(chainId);

    const result: VerificationResponse = {
      verified: true,
      receipt: {
        id: receipt.id,
        strategyId: receipt.strategyId,
        user: receipt.user,
        amount0: receipt.amount0,
        amount1: receipt.amount1,
        actualSlippage: receipt.actualSlippage,
        policyCompliant: receipt.policyCompliant,
        timestamp: receipt.timestamp,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.transactionHash,
      },
      proof: {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `${explorerBase}/tx/${receipt.transactionHash}`,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[verify] Error fetching receipt:', error);
    return new Response(
      JSON.stringify({
        verified: false,
        error: 'Failed to verify receipt',
      } satisfies VerificationResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
