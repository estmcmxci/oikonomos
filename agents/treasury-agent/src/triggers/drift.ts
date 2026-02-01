import { createPublicClient, http, erc20Abi, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';
import type { Policy, TokenAllocation } from '../policy/templates';

interface Allocation {
  token: Address;
  symbol: string;
  balance: string; // BigInt as string for JSON serialization
  percentage: number;
  targetPercentage: number;
}

interface DriftItem {
  token: Address;
  symbol: string;
  currentPercentage: number;
  targetPercentage: number;
  drift: number;
  action: 'buy' | 'sell';
  amount: string; // BigInt as string for JSON serialization
}

interface DriftResult {
  hasDrift: boolean;
  drifts: DriftItem[];
  allocations: Allocation[];
  totalValueWei: string; // BigInt as string for JSON serialization
}

interface TriggerCheckRequest {
  userAddress: Address;
  policy: Policy;
}

export async function handleTriggerCheck(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: TriggerCheckRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body.userAddress || !body.policy) {
    return new Response(
      JSON.stringify({ error: 'Missing userAddress or policy' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await checkDrift(env, body.userAddress, body.policy);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Drift check error:', error);
    return new Response(
      JSON.stringify({ error: 'Drift check failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export async function checkDrift(
  env: Env,
  userAddress: Address,
  policy: Policy
): Promise<DriftResult> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  // Get current balances
  const balances = await Promise.all(
    policy.tokens.map(async (token) => {
      try {
        const balance = await client.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress],
        });
        const decimals = token.decimals ?? 18;
        return { ...token, balance, decimals };
      } catch (error) {
        console.error(`Error fetching balance for ${token.symbol}:`, error);
        const decimals = token.decimals ?? 18;
        return { ...token, balance: 0n, decimals };
      }
    })
  );

  // Normalize balances to 18 decimals for comparison
  // This ensures proper percentage calculations across different token decimals
  const normalizedBalances = balances.map((t) => {
    const multiplier = 10n ** BigInt(18 - t.decimals);
    return { ...t, normalizedBalance: t.balance * multiplier };
  });

  // Calculate total value using normalized balances
  // Note: This assumes 1:1 value. In production, use price oracle for accurate USD values
  const totalNormalized = normalizedBalances.reduce((sum, t) => sum + t.normalizedBalance, 0n);

  if (totalNormalized === 0n) {
    return {
      hasDrift: false,
      drifts: [],
      allocations: [],
      totalValueWei: '0',
    };
  }

  // Calculate current allocations using normalized balances
  const allocations: Allocation[] = normalizedBalances.map((token) => ({
    token: token.address,
    symbol: token.symbol,
    balance: token.balance.toString(),
    percentage: Number((token.normalizedBalance * 10000n) / totalNormalized) / 100,
    targetPercentage: token.targetPercentage,
  }));

  // Find drifts exceeding threshold
  const drifts: DriftItem[] = normalizedBalances
    .map((token) => {
      const percentage = Number((token.normalizedBalance * 10000n) / totalNormalized) / 100;
      const drift = Math.abs(percentage - token.targetPercentage);
      const action: 'buy' | 'sell' = percentage > token.targetPercentage ? 'sell' : 'buy';

      // Calculate amount to trade to reach target (in original token decimals)
      const targetNormalized = (totalNormalized * BigInt(Math.floor(token.targetPercentage * 100))) / 10000n;
      const normalizedDiff = token.normalizedBalance > targetNormalized
        ? token.normalizedBalance - targetNormalized
        : targetNormalized - token.normalizedBalance;
      // Convert back to original token decimals
      const divisor = 10n ** BigInt(18 - token.decimals);
      const amountDiff = normalizedDiff / divisor;

      return {
        token: token.address,
        symbol: token.symbol,
        currentPercentage: percentage,
        targetPercentage: token.targetPercentage,
        drift,
        action,
        amount: amountDiff.toString(),
      };
    })
    .filter((d) => d.drift > policy.driftThreshold);

  return {
    hasDrift: drifts.length > 0,
    drifts,
    allocations,
    totalValueWei: totalNormalized.toString(),
  };
}
