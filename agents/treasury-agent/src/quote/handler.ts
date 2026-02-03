import { createPublicClient, http, encodeFunctionData, decodeFunctionResult, type Address, type Hex } from 'viem';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';
import { QuoterV4ABI } from '../../../shared/src/abis/QuoterV4ABI';
import { getPaymentAddress, NETWORK, PAYMENT_TOKEN, DEFAULT_FEE_BPS } from '../x402/config';

export interface QuoteRequest {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  user?: Address;
  maxSlippageBps?: number;
}

export interface QuoteResponse {
  quoteId: string;
  amountOut: string;
  expectedAmountOut: string; // Alias for executor compatibility
  slippage: number;
  validUntil: number;
  route: 'direct' | 'multi-hop';
  pricing: {
    feeType: 'percentage' | 'fixed';
    feeValue: string; // e.g., "0.1%"
    fee: string; // Alias for backward compatibility
    feeAmount: string;
    paymentToken: string;
    paymentAddress: string;
    network: string; // CAIP-2 format
  };
}

interface StoredQuote extends QuoteResponse {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  createdAt: number;
}

interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

// Known pools on Sepolia - USDC/DAI with ReceiptHook
const KNOWN_POOLS: Record<string, PoolKey> = {
  // Aave USDC / Aave DAI pool with ReceiptHook
  'usdc-dai': {
    currency0: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC (Aave)
    currency1: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // DAI (Aave)
    fee: 500, // 0.05%
    tickSpacing: 10,
    hooks: '0x41a75f07bA1958EcA78805D8419C87a393764040', // ReceiptHook
  },
};

// Token addresses mapping (lowercase)
const TOKEN_INFO: Record<string, { symbol: string; decimals: number }> = {
  '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8': { symbol: 'USDC', decimals: 6 },
  '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357': { symbol: 'DAI', decimals: 18 },
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC', decimals: 6 },
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': { symbol: 'WETH', decimals: 18 },
};

/**
 * Handle POST /quote requests
 * Returns a quote for swapping tokenIn -> tokenOut
 */
export async function handleQuote(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: QuoteRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body.tokenIn || !body.tokenOut || !body.amountIn) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: tokenIn, tokenOut, amountIn' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const quote = await generateQuote(env, body);

    // Store quote in KV for later validation
    const storedQuote: StoredQuote = {
      ...quote,
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amountIn: body.amountIn,
      createdAt: Date.now(),
    };

    await env.TREASURY_KV.put(`quote:${quote.quoteId}`, JSON.stringify(storedQuote), {
      expirationTtl: 300, // 5 minutes
    });

    return new Response(JSON.stringify(quote), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Quote generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to generate quote', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Generate a quote for the given swap request
 */
async function generateQuote(env: Env, request: QuoteRequest): Promise<QuoteResponse> {
  const quoteId = generateQuoteId();
  const amountIn = BigInt(request.amountIn);
  const slippageBps = request.maxSlippageBps || 50; // Default 0.5%

  // Find pool for token pair
  const poolKey = findPoolForPair(request.tokenIn, request.tokenOut);

  if (!poolKey) {
    console.log('No pool found for pair, using simulated quote');
    const paymentAddress = getPaymentAddress(env as { AGENT_WALLET?: string });
    return generateSimulatedQuote(quoteId, amountIn, slippageBps, request.tokenIn, request.tokenOut, paymentAddress);
  }

  // Determine swap direction
  const zeroForOne = request.tokenIn.toLowerCase() === poolKey.currency0.toLowerCase();

  // Try to get quote from Uniswap V4 Quoter
  if (env.QUOTER_V4 && env.RPC_URL) {
    try {
      const onchainQuote = await getOnchainQuote(
        env,
        poolKey,
        zeroForOne,
        amountIn
      );

      if (onchainQuote) {
        const feeRate = poolKey.fee / 1_000_000; // Convert from bps to decimal
        const feeAmount = (amountIn * BigInt(poolKey.fee)) / BigInt(1_000_000);
        const paymentAddress = getPaymentAddress(env as { AGENT_WALLET?: string });

        return {
          quoteId,
          amountOut: onchainQuote.toString(),
          expectedAmountOut: onchainQuote.toString(),
          slippage: slippageBps,
          validUntil: Math.floor(Date.now() / 1000) + 300, // Valid for 5 minutes
          route: 'direct',
          pricing: {
            feeType: 'percentage',
            feeValue: `${(feeRate * 100).toFixed(2)}%`,
            fee: `${(feeRate * 100).toFixed(2)}%`, // Backward compatibility
            feeAmount: feeAmount.toString(),
            paymentToken: PAYMENT_TOKEN,
            paymentAddress,
            network: NETWORK,
          },
        };
      }
    } catch (error) {
      console.error('Onchain quote failed, falling back to simulation:', error);
    }
  }

  // Fallback to simulated quote
  const paymentAddress = getPaymentAddress(env as { AGENT_WALLET?: string });
  return generateSimulatedQuote(quoteId, amountIn, slippageBps, request.tokenIn, request.tokenOut, paymentAddress);
}

/**
 * Get quote from Uniswap V4 Quoter contract
 */
async function getOnchainQuote(
  env: Env,
  poolKey: PoolKey,
  zeroForOne: boolean,
  amountIn: bigint
): Promise<bigint | null> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  try {
    // Encode the call to quoteExactInputSingle
    const callData = encodeFunctionData({
      abi: QuoterV4ABI,
      functionName: 'quoteExactInputSingle',
      args: [
        {
          poolKey: {
            currency0: poolKey.currency0,
            currency1: poolKey.currency1,
            fee: poolKey.fee,
            tickSpacing: poolKey.tickSpacing,
            hooks: poolKey.hooks,
          },
          zeroForOne,
          exactAmount: amountIn,
          sqrtPriceLimitX96: BigInt(0), // No price limit
          hookData: '0x' as Hex,
        },
      ],
    });

    // Call the quoter (it reverts with the result, we need to simulate)
    const result = await client.call({
      to: env.QUOTER_V4 as Address,
      data: callData,
    });

    if (result.data) {
      const decoded = decodeFunctionResult({
        abi: QuoterV4ABI,
        functionName: 'quoteExactInputSingle',
        data: result.data,
      });

      // Returns [amountOut, gasEstimate]
      return decoded[0];
    }

    return null;
  } catch (error) {
    // Quoter reverts with custom error containing the quote
    // Try to extract from revert data
    const errorMessage = String(error);
    console.log('Quoter call error (expected for revert-style quoting):', errorMessage);

    // For V4 quoter, we may need to handle the revert differently
    // Fall back to simulation for now
    return null;
  }
}

/**
 * Generate a simulated quote based on 1:1 stablecoin rate
 */
function generateSimulatedQuote(
  quoteId: string,
  amountIn: bigint,
  slippageBps: number,
  tokenIn: Address,
  tokenOut: Address,
  paymentAddress: Address
): QuoteResponse {
  // Get token info for decimal adjustment
  const tokenInInfo = TOKEN_INFO[tokenIn.toLowerCase()] || { decimals: 18 };
  const tokenOutInfo = TOKEN_INFO[tokenOut.toLowerCase()] || { decimals: 18 };

  // Adjust for decimal differences (e.g., USDC has 6 decimals, DAI has 18)
  let adjustedAmount = amountIn;
  if (tokenInInfo.decimals !== tokenOutInfo.decimals) {
    const decimalDiff = tokenOutInfo.decimals - tokenInInfo.decimals;
    if (decimalDiff > 0) {
      adjustedAmount = amountIn * BigInt(10 ** decimalDiff);
    } else {
      adjustedAmount = amountIn / BigInt(10 ** Math.abs(decimalDiff));
    }
  }

  // Strategy fee: 0.1% (10 bps) - this is the x402 payment fee
  const feeAmount = (amountIn * BigInt(DEFAULT_FEE_BPS)) / BigInt(10000);
  const amountOut = adjustedAmount - feeAmount;

  return {
    quoteId,
    amountOut: amountOut.toString(),
    expectedAmountOut: amountOut.toString(),
    slippage: slippageBps,
    validUntil: Math.floor(Date.now() / 1000) + 300, // Valid for 5 minutes
    route: 'direct',
    pricing: {
      feeType: 'percentage',
      feeValue: '0.1%',
      fee: '0.1%', // Backward compatibility
      feeAmount: feeAmount.toString(),
      paymentToken: PAYMENT_TOKEN,
      paymentAddress,
      network: NETWORK,
    },
  };
}

/**
 * Find the appropriate pool for a token pair
 */
function findPoolForPair(tokenIn: Address, tokenOut: Address): PoolKey | null {
  const tokenInLower = tokenIn.toLowerCase();
  const tokenOutLower = tokenOut.toLowerCase();

  // Check USDC/DAI pool
  const usdcDaiPool = KNOWN_POOLS['usdc-dai'];
  const currency0Lower = usdcDaiPool.currency0.toLowerCase();
  const currency1Lower = usdcDaiPool.currency1.toLowerCase();

  if (
    (tokenInLower === currency0Lower && tokenOutLower === currency1Lower) ||
    (tokenInLower === currency1Lower && tokenOutLower === currency0Lower)
  ) {
    return usdcDaiPool;
  }

  return null;
}

/**
 * Generate a unique quote ID
 */
function generateQuoteId(): string {
  const timestamp = Date.now().toString(16).padStart(12, '0');
  const random = Math.random().toString(16).slice(2, 18).padStart(16, '0');
  return `0x${timestamp}${random}`;
}

/**
 * Validate a quote ID (called during execute)
 */
export async function validateQuote(
  env: Env,
  quoteId: string
): Promise<StoredQuote | null> {
  const stored = await env.TREASURY_KV.get(`quote:${quoteId}`);
  if (!stored) {
    return null;
  }

  const quote: StoredQuote = JSON.parse(stored);

  // Check if quote is still valid
  if (quote.validUntil < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return quote;
}
