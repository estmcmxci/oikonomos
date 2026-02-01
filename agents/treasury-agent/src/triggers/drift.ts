import { createPublicClient, http, erc20Abi, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';
import type { Policy, TokenAllocation } from '../policy/templates';

interface Allocation {
  token: Address;
  symbol: string;
  balance: bigint;
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
  amount: bigint;
}

interface DriftResult {
  hasDrift: boolean;
  drifts: DriftItem[];
  allocations: Allocation[];
  totalValueWei: bigint;
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
    // BigInt values need to be converted to strings for JSON serialization
    const serializable = JSON.stringify(result, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    return new Response(serializable, {
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
        return { ...token, balance };
      } catch (error) {
        console.error(`Error fetching balance for ${token.symbol}:`, error);
        return { ...token, balance: 0n };
      }
    })
  );

  // Calculate total value (simplified - assumes all tokens have same value per unit)
  // In production: Use price oracle for accurate USD values
  const totalBalance = balances.reduce((sum, t) => sum + t.balance, 0n);

  if (totalBalance === 0n) {
    return {
      hasDrift: false,
      drifts: [],
      allocations: [],
      totalValueWei: 0n,
    };
  }

  // Calculate current allocations
  const allocations: Allocation[] = balances.map((token) => ({
    token: token.address,
    symbol: token.symbol,
    balance: token.balance,
    percentage: Number((token.balance * 10000n) / totalBalance) / 100,
    targetPercentage: token.targetPercentage,
  }));

  // Find drifts exceeding threshold
  const drifts: DriftItem[] = allocations
    .map((alloc) => {
      const drift = Math.abs(alloc.percentage - alloc.targetPercentage);
      const action: 'buy' | 'sell' = alloc.percentage > alloc.targetPercentage ? 'sell' : 'buy';

      // Calculate amount to trade to reach target
      const targetBalance = (totalBalance * BigInt(Math.floor(alloc.targetPercentage * 100))) / 10000n;
      const amountDiff = alloc.balance > targetBalance
        ? alloc.balance - targetBalance
        : targetBalance - alloc.balance;

      return {
        token: alloc.token,
        symbol: alloc.symbol,
        currentPercentage: alloc.percentage,
        targetPercentage: alloc.targetPercentage,
        drift,
        action,
        amount: amountDiff,
      };
    })
    .filter((d) => d.drift > policy.driftThreshold);

  return {
    hasDrift: drifts.length > 0,
    drifts,
    allocations,
    totalValueWei: totalBalance,
  };
}
