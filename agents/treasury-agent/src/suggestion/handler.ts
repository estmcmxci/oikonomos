// OIK-33: Suggest Policy Handler
// Main endpoint handler for /suggest-policy
// Extended for unified treasury (Phases 1-2): stablecoins + agent tokens + fees

import { createPublicClient, http, erc20Abi, formatUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';
import { getChain } from '../config/chain';

// Sepolia RPC for portfolio discovery (stablecoins are on Eth Sepolia)
const SEPOLIA_RPC = 'https://sepolia.drpc.org';
import { classifyToken, analyzeComposition, type PortfolioComposition } from './classifier';
import { findCompatiblePools, hasReceiptHookPool, type PoolMatch } from './pools';
import { matchPolicy, type PolicyMatch, type RiskProfile } from './matcher';
import { discoverMarketplaceAgents, formatMatchedAgents, type MarketplaceAgent } from './marketplace';
import type { Policy, TokenAllocation } from '../policy/templates';
import {
  discoverAgentTokens,
  getAggregateFees,
  getAgentWallets,
  type AgentToken,
  type DiscoveredPortfolio,
  type PortfolioToken as ClawnchPortfolioToken,
} from './clawnch';

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

interface StrategyAgentInfo {
  ens: string;
  agentId: number;
  compliance?: string;
  avgSlippage?: string;
  entrypoint: string;
}

interface SuggestPolicyRequest {
  walletAddress: string;
  /** Optional: Agent wallets to discover tokens for. If not provided, will query KV for stored agents. */
  agentWallets?: string[];
  /** Optional: Include agent tokens from Clawnch (default: true) */
  includeAgentTokens?: boolean;
}

interface MatchedAgent {
  ens: string;
  agentId: string;
  trustScore: number;
  pricing: string | undefined;
  supportedTokens: string[];
  policyTypes: string[];
  description: string | undefined;
  entrypoint: string | undefined;
}

interface SuggestPolicyResponse {
  suggestedPolicy: {
    type: Policy['type'];
    template: RiskProfile;
    tokens: TokenAllocation[];
    driftThreshold: number;
    maxSlippageBps: number;
    maxDailyUsd?: number;
  };
  reasoning: string;
  confidence: number;
  compatiblePools: Array<{
    pair: string;
    poolId: string;
    fee: string;
    hasLiquidity: boolean;
    hasReceiptHook: boolean;
  }>;
  strategyAgent: StrategyAgentInfo;
  matchedAgents: MatchedAgent[]; // OIK-34: Multi-agent marketplace results
  portfolio: {
    composition: string;
    stablecoinPercentage: number;
    volatilePercentage: number;
    ethPercentage: number;
    totalTokens: number;
    tokens: PortfolioToken[];
  };
  // Phase 1: Unified portfolio extension
  agentTokens?: AgentToken[];
  unclaimedFees?: {
    weth: string;
    wethRaw: string;
    tokens: Array<{
      address: string;
      symbol: string;
      wethAmount: string;
      tokenAmount: string;
    }>;
  };
  timestamp: number;
}

// Default tokens to check on Sepolia
const DEFAULT_TOKENS: TokenInfo[] = [
  { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC', decimals: 6 },
  { address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', symbol: 'USDC', decimals: 6 },
  { address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', symbol: 'DAI', decimals: 18 },
  { address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', symbol: 'WETH', decimals: 18 },
];

// Default strategy agent (treasury.oikonomos.eth)
const DEFAULT_STRATEGY_AGENT: StrategyAgentInfo = {
  ens: 'treasury.oikonomos.eth',
  agentId: 642,
  entrypoint: 'https://oikonomos-treasury-agent.estmcmxci.workers.dev',
};

export async function handleSuggestPolicy(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Parse request body
  let body: SuggestPolicyRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { walletAddress, agentWallets: requestAgentWallets, includeAgentTokens = true } = body;

  if (!walletAddress) {
    return new Response(
      JSON.stringify({ error: 'Missing walletAddress in request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Fetch stablecoin/volatile portfolio
    const portfolio = await fetchPortfolio(env, walletAddress as Address, DEFAULT_TOKENS);

    // 1b. Discover agent tokens from Clawnch (Phase 1)
    let agentTokens: AgentToken[] = [];
    let unclaimedFees: SuggestPolicyResponse['unclaimedFees'] | undefined;

    if (includeAgentTokens) {
      // Get agent wallets from request or KV storage
      const storedAgentWallets = await getAgentWallets(env.TREASURY_KV, walletAddress as Address);
      const agentWalletsToQuery = requestAgentWallets?.map(w => w as Address) || storedAgentWallets;

      // Discover agent tokens and fees
      agentTokens = await discoverAgentTokens(env, walletAddress as Address, agentWalletsToQuery);

      if (agentTokens.length > 0) {
        const fees = await getAggregateFees(env, agentTokens);
        unclaimedFees = {
          weth: fees.weth,
          wethRaw: fees.wethRaw,
          tokens: fees.tokens.map(t => ({
            address: t.address,
            symbol: t.symbol,
            wethAmount: t.wethAmount,
            tokenAmount: t.tokenAmount,
          })),
        };
      }
    }

    // 2. Filter tokens with non-zero balance
    const activeTokens = portfolio.filter(t => parseFloat(t.balance) > 0);

    if (activeTokens.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Empty portfolio',
          message: 'No supported tokens found in wallet. Please ensure you have USDC, DAI, or WETH.',
          supportedTokens: DEFAULT_TOKENS.map(t => ({ symbol: t.symbol, address: t.address })),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Analyze composition
    const composition = analyzeComposition(
      activeTokens.map(t => ({ address: t.address, percentage: t.percentage }))
    );

    // 4. Find compatible pools
    const tokenAddresses = activeTokens.map(t => t.address);
    const compatiblePools = findCompatiblePools(tokenAddresses);
    const hasHookPool = hasReceiptHookPool(compatiblePools);

    // 5. Match to policy
    const policyMatch = matchPolicy({
      composition,
      compatiblePools,
      tokens: activeTokens.map(t => ({
        address: t.address,
        symbol: t.symbol,
        percentage: t.percentage,
      })),
    });

    // 6. Discover compatible marketplace agents (OIK-34)
    const tokenSymbols = activeTokens.map(t => t.symbol);
    const marketplaceAgents = await discoverMarketplaceAgents(env, {
      tokens: tokenSymbols,
      policyType: policyMatch.policy.type,
    });
    const matchedAgents = formatMatchedAgents(marketplaceAgents);

    // 7. Build response
    // Use top matched agent if available, otherwise fall back to default
    const topAgent = matchedAgents[0];
    const selectedAgent: StrategyAgentInfo = topAgent
      ? {
          ens: topAgent.ens,
          agentId: parseInt(topAgent.agentId, 10),
          entrypoint: topAgent.entrypoint || DEFAULT_STRATEGY_AGENT.entrypoint,
          compliance: hasHookPool ? '100%' : undefined,
          avgSlippage: hasHookPool ? '< 50 bps' : undefined,
        }
      : {
          ...DEFAULT_STRATEGY_AGENT,
          compliance: hasHookPool ? '100%' : undefined,
          avgSlippage: hasHookPool ? '< 50 bps' : undefined,
        };

    // Build reasoning with agent token info
    let extendedReasoning = policyMatch.reasoning;
    if (agentTokens.length > 0) {
      const totalFees = unclaimedFees?.weth || '0';
      extendedReasoning += ` Additionally, found ${agentTokens.length} agent token(s) with ${totalFees} WETH in unclaimed fees.`;
    }

    const response: SuggestPolicyResponse = {
      suggestedPolicy: {
        type: policyMatch.policy.type,
        template: policyMatch.template,
        tokens: policyMatch.policy.tokens,
        driftThreshold: policyMatch.policy.driftThreshold,
        maxSlippageBps: policyMatch.policy.maxSlippageBps,
        maxDailyUsd: policyMatch.policy.maxDailyUsd,
      },
      reasoning: extendedReasoning,
      confidence: policyMatch.confidence,
      compatiblePools: compatiblePools.map(p => ({
        pair: p.pair,
        poolId: p.poolId,
        fee: p.feeFormatted,
        hasLiquidity: p.hasLiquidity,
        hasReceiptHook: p.hooks.toLowerCase() === '0x41a75f07ba1958eca78805d8419c87a393764040',
      })),
      strategyAgent: selectedAgent,
      matchedAgents, // OIK-34: All compatible agents ranked by trust score
      portfolio: {
        composition: formatComposition(composition),
        stablecoinPercentage: composition.stablecoinPercentage,
        volatilePercentage: composition.volatilePercentage,
        ethPercentage: composition.ethPercentage,
        totalTokens: activeTokens.length,
        tokens: activeTokens,
      },
      // Phase 1: Agent tokens and fees
      agentTokens: agentTokens.length > 0 ? agentTokens : undefined,
      unclaimedFees,
      timestamp: Date.now(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in suggest-policy:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to suggest policy', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function fetchPortfolio(
  env: Env,
  userAddress: Address,
  tokens: TokenInfo[]
): Promise<PortfolioToken[]> {
  // Use Eth Sepolia for portfolio discovery (stablecoins are on Sepolia)
  const client = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC),
  });

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

  // Calculate total value (normalized to 18 decimals)
  const normalizedBalances = balances.map((t) => {
    const multiplier = 10n ** BigInt(18 - t.decimals);
    return { ...t, normalizedBalance: t.balance * multiplier };
  });

  const totalNormalized = normalizedBalances.reduce(
    (sum, t) => sum + t.normalizedBalance,
    0n
  );

  // Build response
  return normalizedBalances.map((t) => ({
    address: t.address,
    symbol: t.symbol,
    balance: formatUnits(t.balance, t.decimals),
    balanceRaw: t.balance.toString(),
    percentage:
      totalNormalized > 0n
        ? Number((t.normalizedBalance * 10000n) / totalNormalized) / 100
        : 0,
  }));
}

function formatComposition(composition: PortfolioComposition): string {
  const parts: string[] = [];

  if (composition.stablecoinPercentage > 0) {
    parts.push(`${composition.stablecoinPercentage.toFixed(0)}% stablecoins`);
  }
  if (composition.volatilePercentage > 0) {
    parts.push(`${composition.volatilePercentage.toFixed(0)}% volatile`);
  }
  if (composition.ethPercentage > 0) {
    parts.push(`${composition.ethPercentage.toFixed(0)}% ETH`);
  }

  return parts.join(', ') || '0% (empty portfolio)';
}
