import { handleAgentCard } from './a2a/agent-card';
import { handleConfigure } from './policy/parser';
import { handleTriggerCheck } from './triggers/drift';
import { handleRebalance } from './rebalance/executor';

export interface Env {
  CHAIN_ID: string;
  INTENT_ROUTER: string;
  STRATEGY_AGENT_URL: string;
  PRIVATE_KEY: string;
  RPC_URL: string;
  STRATEGY_ID?: string; // Optional: Default strategy ID for this agent
  RECEIPT_HOOK?: string; // ReceiptHook address for verifying receipts
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
        return handleConfigure(request, env, CORS_HEADERS);
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
    ctx.waitUntil(checkAndRebalance(env));
  },
};

async function checkAndRebalance(env: Env) {
  console.log('Scheduled drift check running at:', new Date().toISOString());
  // In production: Iterate through configured users/policies and check drift
}
