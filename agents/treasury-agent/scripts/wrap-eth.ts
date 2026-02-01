/**
 * Wrap ETH to WETH on Sepolia
 * Usage: npx tsx scripts/wrap-eth.ts <amount_in_eth>
 * Example: npx tsx scripts/wrap-eth.ts 0.5
 */
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env from project root
const envPath = resolve(__dirname, '../../../.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
}

const WETH_SEPOLIA = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9' as const;

const WETH_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

async function main() {
  const amountArg = process.argv[2];
  if (!amountArg) {
    console.error('Usage: npx tsx scripts/wrap-eth.ts <amount_in_eth>');
    console.error('Example: npx tsx scripts/wrap-eth.ts 0.5');
    process.exit(1);
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.AGENT_EXECUTOR_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!privateKey) {
    console.error('No private key found. Set DEPLOYER_PRIVATE_KEY in .env');
    process.exit(1);
  }

  if (!rpcUrl) {
    console.error('SEPOLIA_RPC_URL not found in .env');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const amount = parseEther(amountArg);

  console.log('=== Wrap ETH to WETH ===');
  console.log('Address:', account.address);
  console.log('Amount:', amountArg, 'ETH');
  console.log('WETH Contract:', WETH_SEPOLIA);
  console.log('');

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl)
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl)
  });

  // Check ETH balance
  const ethBalance = await publicClient.getBalance({ address: account.address });
  console.log('ETH Balance:', formatEther(ethBalance), 'ETH');

  if (ethBalance < amount) {
    console.error(`Insufficient ETH. Have ${formatEther(ethBalance)}, need ${amountArg}`);
    process.exit(1);
  }

  // Check WETH balance before
  const wethBefore = await publicClient.readContract({
    address: WETH_SEPOLIA,
    abi: WETH_ABI,
    functionName: 'balanceOf',
    args: [account.address]
  });
  console.log('WETH Balance (before):', formatEther(wethBefore), 'WETH');
  console.log('');

  // Wrap ETH
  console.log('Wrapping ETH...');
  const hash = await walletClient.writeContract({
    address: WETH_SEPOLIA,
    abi: WETH_ABI,
    functionName: 'deposit',
    value: amount
  });

  console.log('TX Hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Status:', receipt.status === 'success' ? '✅ Success' : '❌ Failed');
  console.log('Block:', receipt.blockNumber.toString());
  console.log('');

  // Check WETH balance after
  const wethAfter = await publicClient.readContract({
    address: WETH_SEPOLIA,
    abi: WETH_ABI,
    functionName: 'balanceOf',
    args: [account.address]
  });
  console.log('WETH Balance (after):', formatEther(wethAfter), 'WETH');

  const ethAfter = await publicClient.getBalance({ address: account.address });
  console.log('ETH Balance (after):', formatEther(ethAfter), 'ETH');
}

main().catch(console.error);
