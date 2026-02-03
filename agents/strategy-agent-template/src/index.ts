/**
 * Strategy Agent Worker Template
 *
 * A template for building strategy agents on Oikonomos.
 * Implements the A2A protocol with x402 payment support.
 *
 * Customize the TEMPLATE_CONFIG below and implement your strategy logic.
 */

import { handleAgentCard } from './a2a/agent-card';
import { handleCapabilities } from './a2a/capabilities';
import { handleQuote } from './quote/handler';
import { handleExecute } from './execute/handler';
import { handlePricing } from './x402/pricing';

// ============================================================================
// TEMPLATE CONFIGURATION - Customize these values for your agent
// ============================================================================

export const TEMPLATE_CONFIG = {
  // Agent identity
  name: 'My Strategy Agent',
  description: 'A custom strategy agent for Uniswap v4 swaps',
  ensName: 'mystrategy.oikonomos.eth', // Your ENS name
  version: '1.0.0',

  // Pricing (x402)
  feeBps: 10, // 0.1% fee (10 basis points)
  feeType: 'percentage' as const,

  // Supported tokens (Sepolia addresses)
  supportedTokens: [
    { address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', symbol: 'USDC' },
    { address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', symbol: 'DAI' },
    { address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', symbol: 'WETH' },
  ],

  // Policy types this agent supports
  policyTypes: ['stablecoin-rebalance', 'threshold-rebalance'],

  // Constraints
  maxSlippageBps: 100, // 1% max slippage
  minAmountUsd: 1,
  maxAmountUsd: 100000,
};

// ============================================================================
// Environment Variables (set in wrangler.toml or via wrangler secret)
// ============================================================================

export interface Env {
  // Chain configuration
  CHAIN_ID: string;
  RPC_URL: string;

  // Contract addresses
  POOL_MANAGER: string;
  INTENT_ROUTER: string;
  RECEIPT_HOOK: string;

  // Agent wallet (for signing and receiving fees)
  PRIVATE_KEY: string;
  AGENT_WALLET: string;

  // KV storage for quotes
  STRATEGY_KV: KVNamespace;
}

// ============================================================================
// Worker Entry Point
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Payment-Token',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // ─────────────────────────────────────────────────────────────────────
      // A2A Protocol Endpoints
      // ─────────────────────────────────────────────────────────────────────

      // Agent Card (ERC-8004 metadata)
      if (url.pathname === '/.well-known/agent-card.json' || url.pathname === '/a2a') {
        return handleAgentCard(env, CORS_HEADERS);
      }

      // Capabilities
      if (url.pathname === '/capabilities' && request.method === 'GET') {
        return handleCapabilities(CORS_HEADERS);
      }

      // Quote generation
      if (url.pathname === '/quote' && request.method === 'POST') {
        return handleQuote(request, env, CORS_HEADERS);
      }

      // Trade execution (x402-gated)
      if (url.pathname === '/execute' && request.method === 'POST') {
        return handleExecute(request, env, CORS_HEADERS);
      }

      // ─────────────────────────────────────────────────────────────────────
      // x402 Payment Endpoints
      // ─────────────────────────────────────────────────────────────────────

      // Pricing information
      if (url.pathname === '/pricing' && request.method === 'GET') {
        return handlePricing(env, CORS_HEADERS);
      }

      // ─────────────────────────────────────────────────────────────────────
      // Utility Endpoints
      // ─────────────────────────────────────────────────────────────────────

      // Health check
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            agent: TEMPLATE_CONFIG.name,
            version: TEMPLATE_CONFIG.version,
            timestamp: Date.now(),
          }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // 404 for unknown routes
      return new Response(
        JSON.stringify({ error: 'Not Found' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', details: String(error) }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  },
};
