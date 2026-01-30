export interface AgentCard {
  name: string;
  description: string;
  version: string;
  chainId: number;
  mode?: 'intent-only' | 'safe-roles';
  capabilities: string[];
  endpoints: Record<string, string>;
  supportedTokens: string[];
  constraints?: {
    maxSlippageBps?: number;
    minAmountUsd?: number;
    maxAmountUsd?: number;
  };
  pricing?: {
    model: 'free' | 'per-quote' | 'subscription';
    feesBps?: number;
  };
  policyTemplates?: PolicyTemplate[];
  contact?: {
    ens?: string;
    url?: string;
  };
}

export interface PolicyTemplate {
  name: string;
  description: string;
  params: string[];
}

export interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  maxSlippageBps?: number;
  sender?: string;
}

export interface QuoteResponse {
  quoteId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  estimatedSlippageBps: number;
  route: RouteStep[];
  hookData: string;
  expiresAt: number;
}

export interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
}

export interface ExecuteRequest {
  quoteId: string;
  signature: string;
  userAddress: string;
}

export interface ExecuteResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}
