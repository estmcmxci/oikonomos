import { createPublicClient, http, erc20Abi, formatUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';

interface TokenInfo {
  address: Address;
  symbol: string;
  decimals: number;
}

interface PortfolioToken {
  address: Address;
  symbol: string;
  balance: string;
  balanceRaw: string;
  percentage: number;
}

interface PortfolioResponse {
  userAddress: Address;
  tokens: PortfolioToken[];
  ethBalance: string;
  ethBalanceRaw: string;
  totalValueUsd: string | null;
  timestamp: number;
}

const DEFAULT_TOKENS: TokenInfo[] = [
  { address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', symbol: 'USDC', decimals: 6 },
  { address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', symbol: 'DAI', decimals: 18 },
  { address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', symbol: 'WETH', decimals: 18 },
];

export async function handlePortfolio(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const userAddress = url.searchParams.get('address') as Address | null;

  if (!userAddress) {
    return new Response(
      JSON.stringify({ error: 'Missing address query parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Parse custom tokens from query params if provided
  const tokensParam = url.searchParams.get('tokens');
  let tokens: TokenInfo[] = DEFAULT_TOKENS;

  if (tokensParam) {
    try {
      tokens = JSON.parse(tokensParam);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid tokens JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    const portfolio = await getPortfolio(env, userAddress, tokens);
    return new Response(JSON.stringify(portfolio), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch portfolio', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getPortfolio(
  env: Env,
  userAddress: Address,
  tokens: TokenInfo[]
): Promise<PortfolioResponse> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  // Fetch ETH balance
  const ethBalance = await client.getBalance({ address: userAddress });

  // Fetch all token balances in parallel
  const balances = await Promise.all(
    tokens.map(async (token) => {
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

  // Calculate total value (normalized to 18 decimals for percentage calc)
  // Note: This is simplified - production would use price oracle
  const normalizedBalances = balances.map((t) => {
    const multiplier = 10n ** BigInt(18 - t.decimals);
    return { ...t, normalizedBalance: t.balance * multiplier };
  });

  const totalNormalized = normalizedBalances.reduce(
    (sum, t) => sum + t.normalizedBalance,
    0n
  );

  // Build response
  const portfolioTokens: PortfolioToken[] = normalizedBalances.map((t) => ({
    address: t.address,
    symbol: t.symbol,
    balance: formatUnits(t.balance, t.decimals),
    balanceRaw: t.balance.toString(),
    percentage:
      totalNormalized > 0n
        ? Number((t.normalizedBalance * 10000n) / totalNormalized) / 100
        : 0,
  }));

  return {
    userAddress,
    tokens: portfolioTokens,
    ethBalance: formatUnits(ethBalance, 18),
    ethBalanceRaw: ethBalance.toString(),
    totalValueUsd: null, // Would need price oracle
    timestamp: Date.now(),
  };
}
