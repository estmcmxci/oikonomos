import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Env } from '../index';
import { getChain } from '../config/chain';
import { IntentRouterABI } from '../../../shared/src/abis/IntentRouterABI';
import type { StoredSessionKey } from '../session/storage';

interface IntentStruct {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  maxSlippage: bigint;
  deadline: bigint;
  strategyId: Hex;
  nonce: bigint;
}

interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

export interface ExecuteWithSessionKeyParams {
  sessionKey: StoredSessionKey;
  intent: IntentStruct;
  signature: Hex;
  poolKey: PoolKey;
  strategyData?: Hex;
}

export interface UserOperationResult {
  userOpHash: string;
  txHash?: string;
  success: boolean;
  error?: string;
}

/**
 * Execute an intent using a session key via ZeroDev's bundler
 *
 * This sends a UserOperation to the bundler which will be executed
 * using the user's smart account with the agent's session key permissions.
 */
export async function executeWithSessionKey(
  env: Env,
  params: ExecuteWithSessionKeyParams
): Promise<UserOperationResult> {
  const { sessionKey, intent, signature, poolKey, strategyData = '0x' } = params;

  // Validate session key is still valid
  const now = Math.floor(Date.now() / 1000);
  if (sessionKey.config.validUntil <= now) {
    return {
      userOpHash: '',
      success: false,
      error: 'Session key has expired',
    };
  }

  if (sessionKey.config.validAfter > now) {
    return {
      userOpHash: '',
      success: false,
      error: 'Session key is not yet valid',
    };
  }

  // Validate the operation is allowed
  const intentRouterAddress = env.INTENT_ROUTER as Address;
  if (!sessionKey.config.allowedTargets.some(
    (t: string) => t.toLowerCase() === intentRouterAddress.toLowerCase()
  )) {
    return {
      userOpHash: '',
      success: false,
      error: 'IntentRouter not in allowed targets',
    };
  }

  if (!sessionKey.config.allowedFunctions.includes('executeIntent')) {
    return {
      userOpHash: '',
      success: false,
      error: 'executeIntent not in allowed functions',
    };
  }

  // Encode the executeIntent call
  const callData = encodeFunctionData({
    abi: IntentRouterABI,
    functionName: 'executeIntent',
    args: [
      intent,
      signature,
      poolKey,
      strategyData,
    ],
  });

  // Get agent signer for signing the UserOperation
  const agentAccount = privateKeyToAccount(env.PRIVATE_KEY as Hex);

  const chain = getChain(env);
  const publicClient = createPublicClient({
    chain,
    transport: http(env.RPC_URL),
  });

  // Check if bundler URL is configured
  if (!env.ZERODEV_BUNDLER_URL) {
    console.log('[sessionMode] No bundler URL configured, falling back to direct execution');
    return await executeDirectly(env, params);
  }

  try {
    // Build UserOperation
    // Note: In production, this should use the full ZeroDev SDK flow
    // For now, we construct the UserOp manually and send to bundler
    const userOp = await buildUserOperation(
      publicClient,
      sessionKey.smartAccountAddress,
      intentRouterAddress,
      callData,
      agentAccount,
      env
    );

    // Send to bundler
    const userOpHash = await sendUserOperation(env.ZERODEV_BUNDLER_URL, userOp, chain.id);

    console.log('[sessionMode] UserOperation submitted:', userOpHash);

    // Optionally wait for receipt
    const receipt = await waitForUserOperationReceipt(
      env.ZERODEV_BUNDLER_URL,
      userOpHash,
      chain.id
    );

    return {
      userOpHash,
      txHash: receipt?.transactionHash,
      success: true,
    };
  } catch (error) {
    console.error('[sessionMode] UserOperation failed:', error);
    return {
      userOpHash: '',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fallback: Execute directly without bundler (for testing)
 * This bypasses the session key and executes directly from agent wallet
 */
async function executeDirectly(
  env: Env,
  params: ExecuteWithSessionKeyParams
): Promise<UserOperationResult> {
  const { intent, signature, poolKey, strategyData = '0x' } = params;

  const agentAccount = privateKeyToAccount(env.PRIVATE_KEY as Hex);
  const chain = getChain(env);

  const publicClient = createPublicClient({
    chain,
    transport: http(env.RPC_URL),
  });

  const walletClient = createWalletClient({
    account: agentAccount,
    chain,
    transport: http(env.RPC_URL),
  });

  try {
    const hash = await walletClient.writeContract({
      address: env.INTENT_ROUTER as Address,
      abi: IntentRouterABI,
      functionName: 'executeIntent',
      args: [intent, signature, poolKey, strategyData],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      userOpHash: hash,
      txHash: hash,
      success: receipt.status === 'success',
    };
  } catch (error) {
    return {
      userOpHash: '',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Build a UserOperation for the session key execution
 */
async function buildUserOperation(
  publicClient: ReturnType<typeof createPublicClient>,
  smartAccountAddress: Address,
  target: Address,
  callData: Hex,
  signer: ReturnType<typeof privateKeyToAccount>,
  env: Env
): Promise<Record<string, unknown>> {
  // Get nonce from smart account
  // Note: Kernel accounts use a custom nonce scheme
  const nonce = await publicClient.readContract({
    address: smartAccountAddress,
    abi: [
      {
        name: 'getNonce',
        type: 'function',
        inputs: [],
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'getNonce',
  }).catch(() => 0n);

  // Encode the call for the smart account
  // Kernel accounts have a specific call encoding
  const executeCallData = encodeFunctionData({
    abi: [
      {
        name: 'execute',
        type: 'function',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ],
    functionName: 'execute',
    args: [target, 0n, callData],
  });

  // Build UserOperation
  const userOp = {
    sender: smartAccountAddress,
    nonce: `0x${nonce.toString(16)}`,
    initCode: '0x', // Account already deployed
    callData: executeCallData,
    callGasLimit: '0x50000',
    verificationGasLimit: '0x30000',
    preVerificationGas: '0x10000',
    maxFeePerGas: '0x3B9ACA00', // 1 gwei
    maxPriorityFeePerGas: '0x3B9ACA00',
    paymasterAndData: env.ZERODEV_PAYMASTER_URL ? '0x' : '0x', // Will be filled by paymaster
    signature: '0x', // Will be signed
  };

  // Sign the UserOperation
  // Note: In production, use proper ERC-4337 UserOp signing
  const userOpHash = '0x' + 'placeholder_hash'; // TODO: Compute proper hash
  const signature = await signer.signMessage({ message: { raw: userOpHash as Hex } });
  userOp.signature = signature;

  return userOp;
}

/**
 * Send UserOperation to bundler
 */
async function sendUserOperation(
  bundlerUrl: string,
  userOp: Record<string, unknown>,
  chainId: number
): Promise<string> {
  const response = await fetch(bundlerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendUserOperation',
      params: [userOp, `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`], // EntryPoint v0.6
    }),
  });

  const result = await response.json() as { result?: string; error?: { message: string } };

  if (result.error) {
    throw new Error(`Bundler error: ${result.error.message}`);
  }

  return result.result || '';
}

/**
 * Wait for UserOperation receipt
 */
async function waitForUserOperationReceipt(
  bundlerUrl: string,
  userOpHash: string,
  chainId: number,
  timeout: number = 60000
): Promise<{ transactionHash: string } | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const response = await fetch(bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash],
      }),
    });

    const result = await response.json() as { result?: { receipt: { transactionHash: string } } };

    if (result.result) {
      return { transactionHash: result.result.receipt.transactionHash };
    }

    // Wait 2 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return null;
}
