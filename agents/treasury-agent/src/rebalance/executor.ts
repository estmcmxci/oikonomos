import type { Address } from 'viem';
import type { Env } from '../index';
import type { Policy } from '../policy/templates';
import { checkDrift } from '../triggers/drift';

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

        const quote = await quoteResponse.json() as {
          quoteId: string;
          expectedAmountOut: string;
        };

        trades.push({
          tokenIn: drift.token,
          tokenOut: buyToken.token,
          amountIn: drift.amount.toString(),
          expectedAmountOut: quote.expectedAmountOut,
          quoteId: quote.quoteId,
          status: 'pending',
        });

        // 3. Execute via IntentRouter (simplified for MVP)
        // In production:
        // - Build intent with user's nonce
        // - Sign with agent's key (if authorized) or use user's signature
        // - Submit to IntentRouter contract
        // - Wait for confirmation
        // - Record receipt

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
