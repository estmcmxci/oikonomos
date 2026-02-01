import { handleAgentCard } from './a2a/agent-card';
import { handleConfigure } from './policy/parser';
import { handleTriggerCheck } from './triggers/drift';
import { handleRebalance } from './rebalance/executor';
import { handlePortfolio } from './portfolio/handler';
import { handleScheduledTrigger, handleEventsWebhook, savePolicy } from './observation';

export interface Env {
  CHAIN_ID: string;
  INTENT_ROUTER: string;
  STRATEGY_AGENT_URL: string;
  PRIVATE_KEY: string;
  RPC_URL: string;
  STRATEGY_ID?: string; // Optional: Default strategy ID for this agent
  RECEIPT_HOOK?: string; // ReceiptHook address for verifying receipts
  TREASURY_KV: KVNamespace; // KV namespace for state and policy storage
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// In-memory lock for preventing concurrent rebalances per user
// Note: In production, use Durable Objects or KV for distributed locking
const activeRebalances = new Set<string>();

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
