/**
 * Approve IntentRouter to spend tokens for auto-rebalancing
 *
 * Usage:
 *   npx tsx scripts/approve-intent-router.ts
 *   npx tsx scripts/approve-intent-router.ts --check
 */
import { createPublicClient, createWalletClient, http, type Address, erc20Abi, maxUint256 } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const INTENT_ROUTER = (process.env.INTENT_ROUTER || '0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf') as Address;

if (!PRIVATE_KEY) {
  console.error('Error: PRIVATE_KEY environment variable required');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL),
});

// Tokens to approve (Aave Sepolia test tokens)
const TOKENS: Array<{ address: Address; symbol: string }> = [
  { address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', symbol: 'USDC' },
  { address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', symbol: 'DAI' },
  { address: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', symbol: 'WETH' },
];

async function checkAllowances() {
  console.log('\n=== Current Allowances ===\n');
  console.log('Wallet:', account.address);
  console.log('IntentRouter:', INTENT_ROUTER);
  console.log('');

  for (const token of TOKENS) {
    const allowance = await publicClient.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [account.address, INTENT_ROUTER],
    });

    const balance = await publicClient.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const isApproved = allowance > 0n;
    const status = isApproved ? '✅ Approved' : '❌ Not approved';

    console.log(`${token.symbol}:`);
    console.log(`  Balance:   ${balance.toString()}`);
    console.log(`  Allowance: ${allowance.toString()}`);
    console.log(`  Status:    ${status}`);
    console.log('');
  }
}

async function approveTokens() {
  console.log('\n=== Approving Tokens for IntentRouter ===\n');
  console.log('Wallet:', account.address);
  console.log('IntentRouter:', INTENT_ROUTER);
  console.log('');

  for (const token of TOKENS) {
    // Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [account.address, INTENT_ROUTER],
    });

    if (currentAllowance >= maxUint256 / 2n) {
      console.log(`${token.symbol}: Already approved (allowance: ${currentAllowance.toString()})`);
      continue;
    }

    console.log(`${token.symbol}: Approving max allowance...`);

    try {
      const hash = await walletClient.writeContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [INTENT_ROUTER, maxUint256],
      });

      console.log(`  Tx hash: ${hash}`);
      console.log('  Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
      console.log('');
    } catch (error) {
      console.error(`  ❌ Failed to approve ${token.symbol}:`, error);
    }
  }

  console.log('\n=== Approval Complete ===\n');
  console.log('The IntentRouter can now transfer your tokens for rebalancing.');
  console.log('Run with --check to verify allowances.');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--check')) {
    await checkAllowances();
  } else {
    await approveTokens();
    await checkAllowances();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
