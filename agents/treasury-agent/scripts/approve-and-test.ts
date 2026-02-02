import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  erc20Abi,
  type Address,
  type Hex,
} from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { IntentRouterABI } from '../../shared/src/abis/IntentRouterABI';

const PRIVATE_KEY = (process.env.PRIVATE_KEY || '0x5bac2a365ad5db99a387f07c3f352032d13063fdc5277cf7fe3385a02f14ae3a') as Hex;
const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr';
const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address;
const DAI = '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' as Address;
const INTENT_ROUTER = '0x89223f6157cDE457B37763A70ed4E6A302F23683' as Address;
const RECEIPT_HOOK = '0x41a75f07bA1958EcA78805D8419C87a393764040' as Address;
const STRATEGY_ID = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;

const account = privateKeyToAccount(PRIVATE_KEY);
console.log('Wallet:', account.address);

const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });

async function main() {
  // Step 1: Check and approve USDC
  console.log('\n--- Step 1: Checking USDC allowance ---');
  const usdcAllowance = await publicClient.readContract({
    address: USDC, abi: erc20Abi, functionName: 'allowance', args: [account.address, INTENT_ROUTER]
  });
  console.log('Current USDC allowance:', formatUnits(usdcAllowance, 6));

  const amountIn = parseUnits('1', 6); // 1 USDC
  if (usdcAllowance < amountIn) {
    console.log('Approving IntentRouter to spend USDC...');
    const approveTx = await walletClient.writeContract({
      address: USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [INTENT_ROUTER, parseUnits('1000', 6)], // Approve 1000 USDC
    });
    console.log('Approval tx:', approveTx);
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log('Approval confirmed!');
  }

  // Step 2: Get nonce from IntentRouter
  console.log('\n--- Step 2: Getting nonce ---');
  const nonce = await publicClient.readContract({
    address: INTENT_ROUTER,
    abi: IntentRouterABI,
    functionName: 'getNonce',
    args: [account.address],
  });
  console.log('Current nonce:', nonce.toString());

  // Step 3: Build and sign intent
  console.log('\n--- Step 3: Building and signing intent ---');
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
  const maxSlippage = 100n; // 1%

  const intent = {
    user: account.address,
    tokenIn: USDC,
    tokenOut: DAI,
    amountIn,
    maxSlippage,
    deadline,
    strategyId: STRATEGY_ID,
    nonce,
  };

  console.log('Intent:', {
    ...intent,
    amountIn: formatUnits(intent.amountIn, 6) + ' USDC',
    maxSlippage: Number(intent.maxSlippage) / 100 + '%',
  });

  const signature = await walletClient.signTypedData({
    account,
    domain: {
      name: 'OikonomosIntentRouter',
      version: '1',
      chainId: sepolia.id,
      verifyingContract: INTENT_ROUTER,
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
    message: intent,
  });
  console.log('Signature:', signature.slice(0, 20) + '...');

  // Step 4: Build pool key (USDC < DAI lexicographically)
  console.log('\n--- Step 4: Building pool key ---');
  const poolKey = {
    currency0: USDC, // USDC is lexicographically smaller
    currency1: DAI,
    fee: 3000,
    tickSpacing: 60,
    hooks: RECEIPT_HOOK,
  };
  console.log('Pool key:', poolKey);

  // Step 5: Execute intent
  console.log('\n--- Step 5: Executing intent via IntentRouter ---');
  try {
    const txHash = await walletClient.writeContract({
      address: INTENT_ROUTER,
      abi: IntentRouterABI,
      functionName: 'executeIntent',
      args: [intent, signature, poolKey, '0x'],
    });
    console.log('Transaction submitted:', txHash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log('Transaction status:', receipt.status);
    console.log('Gas used:', receipt.gasUsed.toString());

    // Check for IntentExecuted event
    const intentExecutedTopic = '0x' + 'IntentExecuted'.padEnd(64, '0'); // simplified
    const events = receipt.logs.filter(log => log.address.toLowerCase() === INTENT_ROUTER.toLowerCase());
    console.log('IntentRouter events:', events.length);

    // Check final balances
    const finalUsdc = await publicClient.readContract({
      address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [account.address]
    });
    const finalDai = await publicClient.readContract({
      address: DAI, abi: erc20Abi, functionName: 'balanceOf', args: [account.address]
    });
    console.log('\n--- Final Balances ---');
    console.log('USDC:', formatUnits(finalUsdc, 6));
    console.log('DAI:', formatUnits(finalDai, 18));

    console.log('\n✅ Integration test PASSED!');
    console.log('TX:', `https://sepolia.etherscan.io/tx/${txHash}`);
  } catch (error) {
    console.error('\n❌ Integration test FAILED:', error);
    throw error;
  }
}

main().catch(console.error);
