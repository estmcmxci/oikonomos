import { handleAgentCard } from './a2a/agent-card';
import { handleQuote } from './a2a/quote';
import { handleExecute } from './a2a/execute';
import { handlePricing } from './x402/pricing';

export interface Env {
  CHAIN_ID: string;
  POOL_MANAGER: string;
  QUOTER: string;
  PRIVATE_KEY: string;
  RPC_URL: string;
  // OIK-37: Execute endpoint requirements
  INTENT_ROUTER: string;
  RECEIPT_HOOK: string;
  STRATEGY_KV: KVNamespace;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // A2A Protocol Endpoints
      if (url.pathname === '/.well-known/agent-card.json' || url.pathname === '/a2a') {
        return handleAgentCard(env, CORS_HEADERS);
      }

      if (url.pathname === '/quote' && request.method === 'POST') {
        return handleQuote(request, env, CORS_HEADERS);
      }

      if (url.pathname === '/execute' && request.method === 'POST') {
        return handleExecute(request, env, CORS_HEADERS);
      }

      // x402 Endpoints
      if (url.pathname === '/pricing') {
        return handlePricing(env, CORS_HEADERS);
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
};
