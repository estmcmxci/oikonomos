import type { Address, Hex } from 'viem';
import type { Env } from '../index';
import type { Policy } from '../policy/templates';
import { checkDrift } from '../triggers/drift';
import { buildAndSignIntent, submitIntent, getNonce } from '../modes/intentMode';
import { requirePoolForPair, type PoolConfig } from '../config/pools';
import { validateAuthorization, trackSpending, hasValidAuthorization } from '../auth';

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
    const result = await executeRebalance(env, body, corsHeaders);

    // Return 403 if authorization failed
    if (!result.success && result.error?.includes('Authorization')) {
      return new Response(JSON.stringify(result), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

async function executeRebalance(
  env: Env,
  request: RebalanceRequest,
  _corsHeaders: Record<string, string>
): Promise<RebalanceResult> {
  // OIK-42: Check basic authorization before any operations
  const hasAuth = await hasValidAuthorization(env.TREASURY_KV, request.userAddress);
  if (!hasAuth) {
    return {
      success: false,
      needsRebalance: false,
      trades: [],
      receipts: [],
      error: 'Authorization failed: No valid authorization found or authorization has expired',
    };
  }

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

      // OIK-42: Estimate USD value for authorization check
      // For stablecoins (6 decimals), divide by 1e6 to get USD value
      const estimatedUsdValue = Number(drift.amount) / 1e6;

      // OIK-42: Validate authorization before executing trade
      const authResult = await validateAuthorization(
        env.TREASURY_KV,
        request.userAddress,
        drift.token,
        buyToken.token,
        estimatedUsdValue
      );

      if (!authResult.valid) {
        console.error(`Authorization validation failed: ${authResult.error}`);
        return {
          success: false,
          needsRebalance: true,
          trades: [],
          receipts: [],
          error: `Authorization failed: ${authResult.error}`,
        };
      }

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
            amountIn: BigInt(drift.amount), // Convert string back to bigint
            maxSlippageBps: request.policy.maxSlippageBps,
            strategyId: (env.STRATEGY_ID || '0x0000000000000000000000000000000000000000000000000000000000000001') as Hex,
            nonce,
            ttlSeconds: 3600, // 1 hour validity
          });

          // Get pool configuration from registry (OIK-39)
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

          // OIK-42: Track spending after successful trade
          await trackSpending(env.TREASURY_KV, request.userAddress, estimatedUsdValue);

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
 * Get the pool key for a token pair from the pool registry.
 * Only pools initialized with ReceiptHook are supported.
 *
 * @see agents/treasury-agent/src/config/pools.ts
 */
function getPoolKeyForPair(tokenIn: Address, tokenOut: Address): PoolConfig {
  return requirePoolForPair(tokenIn, tokenOut);
}
