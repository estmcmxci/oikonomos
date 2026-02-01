import {
  createWalletClient,
  createPublicClient,
  http,
  getContract,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';
import { IntentRouterABI } from '../../../shared/src/abis/IntentRouterABI';

interface IntentParams {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  maxSlippageBps: number;
  ttlSeconds: number;
  strategyId: Hex;
  nonce: bigint;
}

interface SignedIntentData extends IntentParams {
  deadline: bigint;
}

interface SignedIntent {
  intent: SignedIntentData;
  signature: Hex;
}

interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

export async function buildAndSignIntent(
  env: Env,
  params: IntentParams
): Promise<SignedIntent> {
  const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + params.ttlSeconds);

  const intent = {
    ...params,
    deadline,
  };

  // Sign the intent using EIP-712
  const signature = await walletClient.signTypedData({
    account,
    domain: {
      name: 'OikonomosIntentRouter',
      version: '1',
      chainId: parseInt(env.CHAIN_ID),
      verifyingContract: env.INTENT_ROUTER as Address,
    },
    types: {
      Intent: [
        { name: 'user', type: 'address' },
        { name: 'tokenIn', type: 'address' },
        { name: 'tokenOut', type: 'address' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'maxSlippage', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'strategyId', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'Intent',
    message: {
      user: intent.user,
      tokenIn: intent.tokenIn,
      tokenOut: intent.tokenOut,
      amountIn: intent.amountIn,
      maxSlippage: BigInt(intent.maxSlippageBps),
      deadline: intent.deadline,
      strategyId: intent.strategyId,
      nonce: intent.nonce,
    },
  });

  return {
    intent: { ...params, deadline },
    signature,
  };
}

/**
 * Submit a signed intent to the IntentRouter contract
 * @param env Environment variables including INTENT_ROUTER address
 * @param signedIntent The signed intent from buildAndSignIntent
 * @param poolKey The Uniswap v4 pool key
 * @param strategyData Additional strategy-specific data
 * @returns Transaction hash
 */
export async function submitIntent(
  env: Env,
  signedIntent: SignedIntent,
  poolKey: PoolKey,
  strategyData: Hex = '0x'
): Promise<Hex> {
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

  // Create contract instance
  const intentRouter = getContract({
    address: env.INTENT_ROUTER as Address,
    abi: IntentRouterABI,
    client: { public: publicClient, wallet: walletClient },
  });

  // Prepare intent struct for contract call
  const intentStruct = {
    user: signedIntent.intent.user,
    tokenIn: signedIntent.intent.tokenIn,
    tokenOut: signedIntent.intent.tokenOut,
    amountIn: signedIntent.intent.amountIn,
    maxSlippage: BigInt(signedIntent.intent.maxSlippageBps),
    deadline: signedIntent.intent.deadline,
    strategyId: signedIntent.intent.strategyId as Hex,
    nonce: signedIntent.intent.nonce,
  };

  // Prepare poolKey struct for contract call
  const poolKeyStruct = {
    currency0: poolKey.currency0,
    currency1: poolKey.currency1,
    fee: poolKey.fee,
    tickSpacing: poolKey.tickSpacing,
    hooks: poolKey.hooks,
  };

  console.log('Submitting intent to IntentRouter:', {
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
      signedIntent.signature,
      poolKeyStruct,
      strategyData,
    ]);

    console.log('Gas estimate:', gasEstimate.toString());

    // Execute transaction with 10% gas buffer
    const hash = await intentRouter.write.executeIntent(
      [intentStruct, signedIntent.signature, poolKeyStruct, strategyData],
      { gas: gasEstimate + gasEstimate / 10n }
    );

    console.log('Transaction submitted:', hash);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'reverted') {
      throw new Error(`Transaction reverted: ${hash}`);
    }

    console.log('Intent executed successfully:', hash);
    return hash;
  } catch (error) {
    console.error('Failed to submit intent:', error);
    throw error;
  }
}

/**
 * Get the current nonce for a user
 * @param env Environment variables
 * @param user User address
 * @returns Current nonce
 */
export async function getNonce(env: Env, user: Address): Promise<bigint> {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const intentRouter = getContract({
    address: env.INTENT_ROUTER as Address,
    abi: IntentRouterABI,
    client: publicClient,
  });

  return await intentRouter.read.getNonce([user]);
}
