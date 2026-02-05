/**
 * Meta-Treasury Provider Worker
 *
 * Cloudflare Worker implementing A2A protocol for meta-treasury management.
 * Provides fee claiming and policy execution services for users with
 * multiple Clawnch-launched AI agent tokens.
 *
 * @see PIVOT_SUMMARY.md
 * @see STRATEGY_PROVIDER_JOURNEY.md
 */

import type { Env } from './types';
import { handleCapabilities, handleQuote, handleExecute } from './routes';

/**
 * A2A Agent Card (ERC-8004 compatible)
 */
const AGENT_CARD = {
  type: 'meta-treasury-provider',
  name: 'Oikonomos Reference Provider',
  description: 'Reference implementation of meta-treasury management for Clawnch-launched AI agent tokens',
  version: '1.0.0',
  services: [
    {
      name: 'A2A',
      endpoint: '/', // Will be populated with actual URL
      version: '1.0.0',
    },
    {
      name: 'capabilities',
      endpoint: '/capabilities',
      version: '1.0.0',
    },
    {
      name: 'quote',
      endpoint: '/quote',
      version: '1.0.0',
    },
    {
      name: 'execute',
      endpoint: '/execute',
      version: '1.0.0',
    },
  ],
  supportedChains: [84532], // Base Sepolia
};

/**
 * Handle CORS preflight requests
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return handleOptions();
    }

    // Route handling
    try {
      // A2A Agent Card
      if (path === '/.well-known/agent-card.json' || path === '/agent-card.json') {
        const card = { ...AGENT_CARD };
        // Update endpoints with actual URL
        card.services = card.services.map(s => ({
          ...s,
          endpoint: `${url.origin}${s.endpoint}`,
        }));
        return new Response(JSON.stringify(card), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Capabilities endpoint
      if (path === '/capabilities' && method === 'GET') {
        return handleCapabilities();
      }

      // Quote endpoint
      if (path === '/quote' && method === 'POST') {
        return handleQuote(request, env);
      }

      // Execute endpoint
      if (path === '/execute' && method === 'POST') {
        return handleExecute(request, env);
      }

      // Health check
      if (path === '/health' || path === '/') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            type: 'meta-treasury-provider',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // 404 for unknown routes
      return new Response(
        JSON.stringify({ error: 'Not found', path }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      console.error('[worker] Unhandled error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
