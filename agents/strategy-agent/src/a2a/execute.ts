import {
  createWalletClient,
  createPublicClient,
  http,
  getContract,
  decodeEventLog,
  type Address,
  type Hex,
  type Log,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';
import { IntentRouterABI } from '../../../shared/src/abis/IntentRouterABI';
import { encodeHookData, decodeHookData, generateStrategyId as encodeStrategyId } from '../utils/hookData';

// ReceiptHook ABI for parsing ExecutionReceipt events
const ReceiptHookABI = [
  {
    type: 'event',
    name: 'ExecutionReceipt',
    inputs: [
      { name: 'strategyId', type: 'bytes32', indexed: true },
      { name: 'quoteId', type: 'bytes32', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'router', type: 'address', indexed: false },
      { name: 'amount0', type: 'int128', indexed: false },
      { name: 'amount1', type: 'int128', indexed: false },
      { name: 'actualSlippage', type: 'uint256', indexed: false },
      { name: 'policyCompliant', type: 'bool', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * OIK-37: Execute endpoint request schema
 * Matches the A2A protocol specification
 */
export interface ExecuteRequest {
  quoteId: string;
  intent: {
    user: Address;
    tokenIn: Address;
    tokenOut: Address;
    amountIn: string;
    minAmountOut: string;
    deadline: number;
    nonce: number;
  };
  signature: Hex;
  x402Payment?: {
    txHash: Hex;
  };
}

/**
 * OIK-37: Execute endpoint response schema
 */
export interface ExecuteResponse {
  success: boolean;
  txHash?: Hex;
  receiptId?: string;
  actualSlippage?: number;
  amountOut?: string;
  error?: string;
}

/**
 * Stored quote structure (matches what /quote endpoint stores)
 */
interface StoredQuote {
  quoteId: string;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  expectedAmountOut: string;
  estimatedSlippageBps: number;
  hookData: Hex;
  expiresAt: number;
  route: Array<{
    pool: string;
    tokenIn: string;
    tokenOut: string;
    fee: number;
  }>;
}

/**
 * Pool key structure for IntentRouter
 */
interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

// Known pools on Sepolia - USDC/DAI with ReceiptHook
const KNOWN_POOLS: Record<string, PoolKey> = {
  'usdc-dai': {
    currency0: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC (Aave)
    currency1: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // DAI (Aave)
    fee: 500, // 0.05%
    tickSpacing: 10,
    hooks: '0x41a75f07bA1958EcA78805D8419C87a393764040', // ReceiptHook
  },
};

/**
 * Handle POST /execute requests
 * Executes a swap based on a previously generated quote
 */
export async function handleExecute(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: ExecuteRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate required fields
  if (!body.quoteId || !body.signature || !body.intent) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required fields: quoteId, signature, intent',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate intent structure
  const { intent } = body;
  if (!intent.user || !intent.tokenIn || !intent.tokenOut || !intent.amountIn) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid intent: missing user, tokenIn, tokenOut, or amountIn',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Step 1: Validate quoteId matches stored quote
    const storedQuote = await validateQuote(env, body.quoteId);
    if (!storedQuote) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired quoteId',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify quote parameters match intent
    if (
      storedQuote.tokenIn.toLowerCase() !== intent.tokenIn.toLowerCase() ||
      storedQuote.tokenOut.toLowerCase() !== intent.tokenOut.toLowerCase() ||
      storedQuote.amountIn !== intent.amountIn
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Intent parameters do not match stored quote',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Verify x402 payment (if required)
    if (body.x402Payment?.txHash) {
      const paymentValid = await verifyX402Payment(env, body.x402Payment.txHash);
      if (!paymentValid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid x402 payment',
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 3: Execute intent via IntentRouter
    const result = await executeIntent(env, body, storedQuote);

    // Step 4: Mark quote as used
    await env.STRATEGY_KV.delete(`quote:${body.quoteId}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Execute error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Execution failed',
        details: String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Validate a quote ID and return the stored quote
 */
async function validateQuote(env: Env, quoteId: string): Promise<StoredQuote | null> {
  const stored = await env.STRATEGY_KV.get(`quote:${quoteId}`);
  if (!stored) {
    return null;
  }

  const quote: StoredQuote = JSON.parse(stored);

  // Check if quote has expired
  if (quote.expiresAt < Date.now()) {
    await env.STRATEGY_KV.delete(`quote:${quoteId}`);
    return null;
  }

  return quote;
}

/**
 * Verify x402 payment transaction
 * TODO: Implement actual verification against ReceiptHook events
 */
async function verifyX402Payment(env: Env, txHash: Hex): Promise<boolean> {
  // For MVP, we trust the payment hash if provided
  // In production, verify against ReceiptHook PaymentReceived events
  console.log(`Verifying x402 payment: ${txHash}`);
  return true;
}

/**
 * Execute the intent via IntentRouter contract
 */
async function executeIntent(
  env: Env,
  request: ExecuteRequest,
  quote: StoredQuote
): Promise<ExecuteResponse> {
  const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  // Find pool for token pair
  const poolKey = findPoolForPair(request.intent.tokenIn, request.intent.tokenOut, env);

  if (!poolKey) {
    throw new Error('No pool found for token pair');
  }

  // Extract strategyId from the stored quote's hookData
  let strategyId: `0x${string}`;
  let quoteIdBytes32: `0x${string}`;

  try {
    const decoded = decodeHookData(quote.hookData);
    strategyId = decoded.strategyId;
    quoteIdBytes32 = decoded.quoteId;
  } catch {
    // Fallback: generate from ENS name if hookData is invalid
    strategyId = encodeStrategyId('strategy.router.oikonomos.eth');
    quoteIdBytes32 = request.quoteId.startsWith('0x')
      ? (request.quoteId.padEnd(66, '0').slice(0, 66) as `0x${string}`)
      : (`0x${request.quoteId}`.padEnd(66, '0').slice(0, 66) as `0x${string}`);
  }

  // Calculate max slippage in basis points
  const amountInBig = BigInt(request.intent.amountIn);
  const minAmountOutBig = BigInt(request.intent.minAmountOut);
  const maxSlippageBps = amountInBig > 0n
    ? ((amountInBig - minAmountOutBig) * 10000n) / amountInBig
    : 50n; // Default 0.5% if amountIn is 0

  // Build intent struct for contract
  const intentStruct = {
    user: request.intent.user,
    tokenIn: request.intent.tokenIn,
    tokenOut: request.intent.tokenOut,
    amountIn: amountInBig,
    maxSlippage: maxSlippageBps,
    deadline: BigInt(request.intent.deadline),
    strategyId: strategyId as Hex,
    nonce: BigInt(request.intent.nonce),
  };

  // Build hookData with strategyId, quoteId, maxSlippage for ReceiptHook
  const hookData = encodeHookData(
    strategyId,
    quoteIdBytes32,
    Number(maxSlippageBps)
  ) as Hex;

  const intentRouter = getContract({
    address: env.INTENT_ROUTER as Address,
    abi: IntentRouterABI,
    client: { public: publicClient, wallet: walletClient },
  });

  console.log('Executing intent via IntentRouter:', {
    intentRouter: env.INTENT_ROUTER,
    user: intentStruct.user,
    tokenIn: intentStruct.tokenIn,
    tokenOut: intentStruct.tokenOut,
    amountIn: intentStruct.amountIn.toString(),
  });

  try {
    // Estimate gas first
    const gasEstimate = await intentRouter.estimateGas.executeIntent([
      intentStruct,
      request.signature,
      {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
      },
      hookData,
    ]);

    console.log('Gas estimate:', gasEstimate.toString());

    // Execute transaction with 20% gas buffer
    const txHash = await intentRouter.write.executeIntent(
      [
        intentStruct,
        request.signature,
        {
          currency0: poolKey.currency0,
          currency1: poolKey.currency1,
          fee: poolKey.fee,
          tickSpacing: poolKey.tickSpacing,
          hooks: poolKey.hooks,
        },
        hookData,
      ],
      { gas: gasEstimate + gasEstimate / 5n }
    );

    console.log('Transaction submitted:', txHash);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === 'reverted') {
      return {
        success: false,
        error: 'Transaction reverted',
        txHash,
      };
    }

    // Parse IntentExecuted event to get actual amountOut
    const { amountOut: actualOut, receiptId } = parseExecutionEvents(
      receipt.logs,
      env.INTENT_ROUTER as Address,
      env.RECEIPT_HOOK as Address,
      BigInt(quote.expectedAmountOut)
    );

    // Calculate actual slippage
    const expectedOut = BigInt(quote.expectedAmountOut);
    const actualSlippage = expectedOut > 0n
      ? Number(((expectedOut - actualOut) * 10000n) / expectedOut)
      : 0;

    return {
      success: true,
      txHash,
      receiptId: receiptId || `${request.quoteId}-${txHash.slice(0, 10)}`,
      actualSlippage,
      amountOut: actualOut.toString(),
    };
  } catch (error) {
    console.error('IntentRouter execution failed:', error);
    throw error;
  }
}

/**
 * Find the appropriate pool for a token pair
 */
function findPoolForPair(
  tokenIn: Address,
  tokenOut: Address,
  env: Pick<Env, 'RECEIPT_HOOK'>
): PoolKey | null {
  const tokenInLower = tokenIn.toLowerCase();
  const tokenOutLower = tokenOut.toLowerCase();

  // Check USDC/DAI pool
  const usdcDaiPool = KNOWN_POOLS['usdc-dai'];

  // Update hooks address from env if available
  const poolWithHook: PoolKey = {
    ...usdcDaiPool,
    hooks: (env.RECEIPT_HOOK || usdcDaiPool.hooks) as Address,
  };

  const currency0Lower = poolWithHook.currency0.toLowerCase();
  const currency1Lower = poolWithHook.currency1.toLowerCase();

  if (
    (tokenInLower === currency0Lower && tokenOutLower === currency1Lower) ||
    (tokenInLower === currency1Lower && tokenOutLower === currency0Lower)
  ) {
    return poolWithHook;
  }

  return null;
}

/**
 * Parse execution events from transaction logs
 * Extracts amountOut from IntentExecuted and receiptId from ExecutionReceipt
 */
function parseExecutionEvents(
  logs: Log[],
  intentRouterAddress: Address,
  receiptHookAddress: Address,
  expectedAmountOut: bigint
): { amountOut: bigint; receiptId: string | null } {
  let amountOut = expectedAmountOut; // Default to expected if event not found
  let receiptId: string | null = null;

  for (const log of logs) {
    // Parse IntentExecuted from IntentRouter
    if (log.address.toLowerCase() === intentRouterAddress.toLowerCase()) {
      try {
        const decoded = decodeEventLog({
          abi: IntentRouterABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === 'IntentExecuted') {
          const args = decoded.args as {
            intentHash: Hex;
            user: Address;
            strategyId: Hex;
            amountIn: bigint;
            amountOut: bigint;
          };
          // amountOut from IntentRouter is signed (can be negative for exact output swaps)
          // Take absolute value for our purposes
          amountOut = args.amountOut < 0n ? -args.amountOut : args.amountOut;
          console.log('Parsed IntentExecuted event:', {
            intentHash: args.intentHash,
            amountOut: amountOut.toString(),
          });
        }
      } catch (e) {
        // Not an IntentExecuted event, continue
        console.log('Failed to parse IntentRouter event:', e);
      }
    }

    // Parse ExecutionReceipt from ReceiptHook
    if (log.address.toLowerCase() === receiptHookAddress.toLowerCase()) {
      try {
        const decoded = decodeEventLog({
          abi: ReceiptHookABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === 'ExecutionReceipt') {
          const args = decoded.args as {
            strategyId: Hex;
            quoteId: Hex;
            user: Address;
            router: Address;
            amount0: bigint;
            amount1: bigint;
            actualSlippage: bigint;
            policyCompliant: boolean;
            timestamp: bigint;
          };
          // Build receiptId from quoteId and timestamp
          receiptId = `${args.quoteId.slice(0, 18)}-${args.timestamp.toString()}`;
          console.log('Parsed ExecutionReceipt event:', {
            quoteId: args.quoteId,
            policyCompliant: args.policyCompliant,
            actualSlippage: args.actualSlippage.toString(),
          });
        }
      } catch (e) {
        // Not an ExecutionReceipt event, continue
        console.log('Failed to parse ReceiptHook event:', e);
      }
    }
  }

  return { amountOut, receiptId };
}
