export interface BaseEnv {
  CHAIN_ID: string;
  PRIVATE_KEY: string;
  RPC_URL: string;
}

export interface StrategyAgentEnv extends BaseEnv {
  POOL_MANAGER: string;
  QUOTER: string;
}

export interface TreasuryAgentEnv extends BaseEnv {
  INTENT_ROUTER: string;
  STRATEGY_AGENT_URL: string;
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

export function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}
