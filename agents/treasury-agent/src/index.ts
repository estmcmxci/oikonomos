import { handleAgentCard } from './a2a/agent-card';
import { handleConfigure } from './policy/parser';
import { handleTriggerCheck } from './triggers/drift';
import { handleRebalance } from './rebalance/executor';
import { handlePortfolio } from './portfolio/handler';
import { handleSuggestPolicy } from './suggestion/handler';
import { handleQuote } from './quote/handler';
import { handleExecute, handlePrepareExecute } from './execute/handler';
import { getFeeAnalytics, getRecentEarnings } from './x402/analytics';
import { handleScheduledTrigger, handleEventsWebhook, savePolicy, saveAuthorization, deleteAuthorization, type UserAuthorization } from './observation';

export interface Env {
  CHAIN_ID: string;
  INTENT_ROUTER: string;
  STRATEGY_AGENT_URL: string;
  PRIVATE_KEY: string;
  RPC_URL: string;
  STRATEGY_ID?: string; // Optional: Default strategy ID for this agent
  RECEIPT_HOOK?: string; // ReceiptHook address for verifying receipts
  INDEXER_URL?: string; // OIK-34: Indexer URL for marketplace discovery
  QUOTER_V4?: string; // OIK-36: Uniswap V4 Quoter address
  POOL_MANAGER?: string; // Uniswap V4 PoolManager address
  AGENT_WALLET?: string; // OIK-40: Agent wallet address for x402 fee collection
  TREASURY_KV: KVNamespace; // KV namespace for state and policy storage
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // OIK-52: Allow x402 payment headers (PAYMENT-SIGNATURE, X-PAYMENT)
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, PAYMENT-SIGNATURE, X-PAYMENT',
};

// In-memory lock for preventing concurrent rebalances per user
// Note: In production, use Durable Objects or KV for distributed locking
const activeRebalances = new Set<string>();

interface AuthorizeRequest {
  userAddress: string;
  signature: string;
  expiry: number;
  maxDailyUsd: number;
  allowedTokens?: string[];
}

async function handleAuthorize(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: AuthorizeRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body.userAddress || !body.signature || !body.expiry || body.maxDailyUsd === undefined) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: userAddress, signature, expiry, maxDailyUsd' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate expiry is in the future
  if (body.expiry <= Date.now()) {
    return new Response(
      JSON.stringify({ success: false, error: 'Expiry must be in the future' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // TODO: In production, verify the signature is valid EIP-712 signed by userAddress
  // For MVP, we trust the signature

  const auth: UserAuthorization = {
    signature: body.signature,
    expiry: body.expiry,
    maxDailyUsd: body.maxDailyUsd,
    allowedTokens: (body.allowedTokens || []) as `0x${string}`[],
    createdAt: Date.now(),
  };

  try {
    await saveAuthorization(env.TREASURY_KV, body.userAddress as `0x${string}`, auth);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Authorization saved',
        expiry: auth.expiry,
        maxDailyUsd: auth.maxDailyUsd,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error saving authorization:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to save authorization' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleRevokeAuthorization(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const userAddress = url.searchParams.get('userAddress');

  if (!userAddress) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing userAddress query parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    await deleteAuthorization(env.TREASURY_KV, userAddress as `0x${string}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Authorization revoked' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error revoking authorization:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to revoke authorization' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // A2A Endpoints
      if (url.pathname === '/.well-known/agent-card.json' || url.pathname === '/a2a') {
        return handleAgentCard(env, CORS_HEADERS);
      }

      // Policy Configuration
      if (url.pathname === '/configure' && request.method === 'POST') {
        // Also save policy to KV for observation loop
        const response = await handleConfigure(request, env, CORS_HEADERS);
        if (response.ok) {
          // Clone and parse the response to get the saved policy
          const clonedResponse = response.clone();
          const result = await clonedResponse.json() as { userAddress?: string; policy?: unknown };
          if (result.userAddress && result.policy) {
            await savePolicy(env.TREASURY_KV, result.userAddress as `0x${string}`, result.policy as import('./policy/templates').Policy);
          }
        }
        return response;
      }

      // Events Webhook (from Ponder indexer)
      if (url.pathname === '/events' && request.method === 'POST') {
        return handleEventsWebhook(request, env, env.TREASURY_KV, CORS_HEADERS);
      }

      // User Authorization for auto-execution
      if (url.pathname === '/authorize' && request.method === 'POST') {
        return handleAuthorize(request, env, CORS_HEADERS);
      }

      // Revoke Authorization
      if (url.pathname === '/authorize' && request.method === 'DELETE') {
        return handleRevokeAuthorization(request, env, CORS_HEADERS);
      }

      // Trigger Check (called by scheduler or manually)
      if (url.pathname === '/check-triggers' && request.method === 'POST') {
        return handleTriggerCheck(request, env, CORS_HEADERS);
      }

      // Execute Rebalance (with concurrency protection)
      if (url.pathname === '/rebalance' && request.method === 'POST') {
        // Clone request to read body for user address extraction
        const body = await request.clone().json() as { userAddress?: string };
        const userAddress = body.userAddress?.toLowerCase();

        if (!userAddress) {
          return new Response(
            JSON.stringify({ error: 'Missing userAddress' }),
            { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        // Check for concurrent rebalance
        if (activeRebalances.has(userAddress)) {
          return new Response(
            JSON.stringify({ error: 'Rebalance already in progress for this address' }),
            { status: 409, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        // Acquire lock
        activeRebalances.add(userAddress);

        try {
          const response = await handleRebalance(request, env, CORS_HEADERS);
          return response;
        } finally {
          // Release lock
          activeRebalances.delete(userAddress);
        }
      }

      // Portfolio State
      if (url.pathname === '/portfolio' && request.method === 'GET') {
        return handlePortfolio(request, env, CORS_HEADERS);
      }

      // Policy Suggestion (OIK-33)
      if (url.pathname === '/suggest-policy' && request.method === 'POST') {
        return handleSuggestPolicy(request, env, CORS_HEADERS);
      }

      // Quote endpoint (OIK-36)
      if (url.pathname === '/quote' && request.method === 'POST') {
        return handleQuote(request, env, CORS_HEADERS);
      }

      // Prepare execute endpoint (OIK-52: Returns EIP-712 data for user to sign)
      if (url.pathname === '/prepare-execute' && request.method === 'POST') {
        return handlePrepareExecute(request, env, CORS_HEADERS);
      }

      // Execute endpoint (OIK-40: x402 payment-gated execution)
      if (url.pathname === '/execute' && request.method === 'POST') {
        return handleExecute(request, env, CORS_HEADERS);
      }

      // Fee analytics endpoint (OIK-40)
      if (url.pathname === '/analytics' && request.method === 'GET') {
        const totals = await getFeeAnalytics(env.TREASURY_KV);
        const recent = await getRecentEarnings(env.TREASURY_KV, 10);
        return new Response(
          JSON.stringify({ totals, recentEarnings: recent }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Provider earnings endpoint (OIK-49)
      if (url.pathname === '/earnings' && request.method === 'GET') {
        const totals = await getFeeAnalytics(env.TREASURY_KV);
        const earnings = totals?.totalEarnings || '0';
        // x402 fees are paid in USDC on Base Sepolia
        return new Response(
          JSON.stringify({
            earnings,
            currency: 'USDC',
            chainId: parseInt(env.CHAIN_ID || '84532'),
            executionCount: totals?.totalExecutions || 0,
            lastUpdated: totals?.lastUpdated || null,
            // x402 pays directly to agent wallet, no withdrawal needed
            withdrawable: false,
            withdrawalNote: 'Fees are paid directly via x402 protocol to agent wallet',
          }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Withdrawal info endpoint (OIK-49)
      if (url.pathname === '/withdraw' && request.method === 'POST') {
        // x402 fees are paid directly to the agent wallet, no withdrawal needed
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No withdrawal needed - x402 pays fees directly to agent wallet',
            details: {
              paymentMethod: 'x402',
              description: 'The x402 protocol facilitates micropayments where consumers pay fees directly to the agent wallet address at execution time. There is no escrow or accumulated balance to withdraw.',
              agentWallet: env.AGENT_WALLET || 'Not configured',
              checkBalance: 'Use a block explorer or wallet to check your USDC balance on Base Sepolia',
            },
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Capabilities endpoint (OIK-34: Dynamic marketplace capabilities)
      if (url.pathname === '/capabilities' && request.method === 'GET') {
        return new Response(
          JSON.stringify({
            supportedTokens: ['USDC', 'DAI', 'WETH'],
            policyTypes: ['stablecoin-rebalance', 'threshold-rebalance'],
            pricing: {
              type: 'percentage',
              value: '0.1%',
              description: 'Fee charged per execution via x402 protocol',
            },
            x402Support: true,
            description: 'Treasury rebalancing for stablecoin portfolios',
            version: '1.0.0',
            chainId: env.CHAIN_ID || '11155111',
            mode: 'intent-only',
          }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Health check
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({ status: 'ok', timestamp: Date.now() }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', details: String(error) }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  },

  // Scheduled trigger (Cloudflare Cron)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduledTrigger(env, env.TREASURY_KV));
  },
};
