import type { Address, Hex } from 'viem';
import type { Env } from '../index';
import type { Policy } from '../policy/templates';
import { checkDrift } from '../triggers/drift';
import { buildAndSignIntent, submitIntent, getNonce } from '../modes/intentMode';

interface RebalanceRequest {
  userAddress: Address;
  policy: Policy;
  signature: string; // User's signed intent authorization
}

interface TradeResult {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  expectedAmountOut: string;
  quoteId: string;
  txHash?: string;
  status: 'pending' | 'executed' | 'failed';
}

interface RebalanceResult {
  success: boolean;
  needsRebalance: boolean;
  trades: TradeResult[];
  receipts: string[];
  error?: string;
}

// Default pool configuration - in production, this would be fetched from config or strategy agent
const DEFAULT_POOL_KEY = {
  // Aave test tokens on Sepolia
  currency0: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address, // USDC
  currency1: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' as Address, // DAI
  fee: 3000,       // 0.3% fee tier - matches our initialized pool
  tickSpacing: 60, // tick spacing for 0.3% fee tier
  hooks: '0x15d3b7CbC9463f92a88cE7B1B384277DA741C040' as Address, // ReceiptHook
};

export async function handleRebalance(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: RebalanceRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body.userAddress || !body.policy || !body.signature) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: userAddress, policy, signature' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await executeRebalance(env, body);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Rebalance error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Rebalance failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function executeRebalance(env: Env, request: RebalanceRequest): Promise<RebalanceResult> {
  // 1. Check drift
  const driftResult = await checkDrift(env, request.userAddress, request.policy);

  if (!driftResult.hasDrift) {
    return {
      success: true,
      needsRebalance: false,
      trades: [],
      receipts: [],
    };
  }

  // 2. Get quotes from strategy agent for each required trade
  const trades: TradeResult[] = [];
  const receipts: string[] = [];

  for (const drift of driftResult.drifts) {
    if (drift.action === 'sell') {
      // Find a token to buy (one that needs buying)
      const buyToken = driftResult.drifts.find((d) => d.action === 'buy');
      if (!buyToken) continue;

      try {
        // Get quote from strategy agent
        const quoteResponse = await fetch(`${env.STRATEGY_AGENT_URL}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenIn: drift.token,
            tokenOut: buyToken.token,
            amountIn: drift.amount.toString(),
            maxSlippageBps: request.policy.maxSlippageBps,
          }),
        });

        if (!quoteResponse.ok) {
          console.error('Quote request failed:', await quoteResponse.text());
          continue;
        }

        const quote = (await quoteResponse.json()) as {
          quoteId: string;
          expectedAmountOut: string;
        };

        const trade: TradeResult = {
          tokenIn: drift.token,
          tokenOut: buyToken.token,
          amountIn: drift.amount.toString(),
          expectedAmountOut: quote.expectedAmountOut,
          quoteId: quote.quoteId,
          status: 'pending',
        };

        trades.push(trade);

        // 3. Execute via IntentRouter
        try {
          // Get current nonce for user
          const nonce = await getNonce(env, request.userAddress);

          // Build and sign intent
          const signedIntent = await buildAndSignIntent(env, {
            user: request.userAddress,
            tokenIn: drift.token,
            tokenOut: buyToken.token,
            amountIn: drift.amount,
            maxSlippageBps: request.policy.maxSlippageBps,
            strategyId: (env.STRATEGY_ID || '0x0000000000000000000000000000000000000000000000000000000000000001') as Hex,
            nonce,
            ttlSeconds: 3600, // 1 hour validity
          });

          // Determine pool key based on token pair
          // In production, this would query the strategy agent or a pool registry
          const poolKey = getPoolKeyForPair(drift.token, buyToken.token);

          // Submit intent to IntentRouter
          const txHash = await submitIntent(
            env,
            signedIntent,
            poolKey,
            quote.quoteId as Hex
          );

          trade.txHash = txHash;
          trade.status = 'executed';
          receipts.push(txHash);

          console.log(`Trade executed successfully: ${txHash}`);
        } catch (error) {
          console.error('Intent execution failed:', error);
          trade.status = 'failed';
        }
      } catch (error) {
        console.error('Error processing trade:', error);
      }
    }
  }

  return {
    success: true,
    needsRebalance: true,
    trades,
    receipts,
  };
}

/**
 * Get the pool key for a token pair
 * In production, this would query a pool registry or the strategy agent
 */
function getPoolKeyForPair(tokenIn: Address, tokenOut: Address) {
  // Ensure currency0 < currency1 (required by Uniswap v4)
  const isToken0First = tokenIn.toLowerCase() < tokenOut.toLowerCase();

  return {
    currency0: isToken0First ? tokenIn : tokenOut,
    currency1: isToken0First ? tokenOut : tokenIn,
    fee: DEFAULT_POOL_KEY.fee,
    tickSpacing: DEFAULT_POOL_KEY.tickSpacing,
    hooks: DEFAULT_POOL_KEY.hooks,
  };
}
