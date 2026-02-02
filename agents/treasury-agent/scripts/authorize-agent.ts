/**
 * Authorize the Treasury Agent to execute trades on your behalf
 *
 * Usage:
 *   npx tsx scripts/authorize-agent.ts
 *   npx tsx scripts/authorize-agent.ts --revoke
 *   npx tsx scripts/authorize-agent.ts --check
 */
import { createWalletClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const TREASURY_AGENT_URL = process.env.TREASURY_AGENT_URL || 'https://oikonomos-treasury-agent.estmcmxci.workers.dev';

// Authorization parameters
const AUTHORIZATION_DAYS = 30; // How long the authorization is valid
const MAX_DAILY_USD = 1000; // Maximum daily trading volume in USD

// Tokens the agent is allowed to trade (empty = all tokens)
const ALLOWED_TOKENS: Address[] = [
  '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC (Aave Sepolia)
  '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // DAI (Aave Sepolia)
  '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', // WETH (Aave Sepolia)
];

if (!PRIVATE_KEY) {
  console.error('Error: PRIVATE_KEY environment variable required');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
console.log('Wallet:', account.address);
console.log('Treasury Agent:', TREASURY_AGENT_URL);

// EIP-712 Domain and Types for Authorization
const EIP712_DOMAIN = {
  name: 'Oikonomos Treasury Agent',
  version: '1',
  chainId: 11155111, // Sepolia
};

const EIP712_TYPES = {
  Authorization: [
    { name: 'user', type: 'address' },
    { name: 'expiry', type: 'uint256' },
    { name: 'maxDailyUsd', type: 'uint256' },
    { name: 'allowedTokens', type: 'address[]' },
  ],
} as const;

async function signAuthorization(expiry: number, maxDailyUsd: number, allowedTokens: Address[]) {
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const message = {
    user: account.address,
    expiry: BigInt(expiry),
    maxDailyUsd: BigInt(maxDailyUsd),
    allowedTokens,
  };

  const signature = await walletClient.signTypedData({
    domain: EIP712_DOMAIN,
    types: EIP712_TYPES,
    primaryType: 'Authorization',
    message,
  });

  return signature;
}

async function authorize() {
  console.log('\n=== Authorizing Treasury Agent ===\n');

  const expiry = Date.now() + AUTHORIZATION_DAYS * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(expiry);

  console.log('Parameters:');
  console.log('  Expiry:', expiryDate.toISOString(), `(${AUTHORIZATION_DAYS} days)`);
  console.log('  Max Daily USD:', MAX_DAILY_USD);
  console.log('  Allowed Tokens:', ALLOWED_TOKENS.length > 0 ? ALLOWED_TOKENS.join(', ') : 'All tokens');

  // Sign the authorization
  console.log('\nSigning EIP-712 authorization...');
  const signature = await signAuthorization(expiry, MAX_DAILY_USD, ALLOWED_TOKENS);
  console.log('Signature:', signature.slice(0, 20) + '...');

  // Submit to treasury agent
  console.log('\nSubmitting authorization to treasury agent...');
  const response = await fetch(`${TREASURY_AGENT_URL}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: account.address,
      signature,
      expiry,
      maxDailyUsd: MAX_DAILY_USD,
      allowedTokens: ALLOWED_TOKENS,
    }),
  });

  const result = await response.json();

  if (response.ok && (result as { success: boolean }).success) {
    console.log('\n✅ Authorization successful!');
    console.log('  Expiry:', new Date((result as { expiry: number }).expiry).toISOString());
    console.log('  Max Daily USD:', (result as { maxDailyUsd: number }).maxDailyUsd);
    console.log('\nThe treasury agent will now automatically execute rebalances when drift is detected.');
  } else {
    console.error('\n❌ Authorization failed:', (result as { error?: string }).error || 'Unknown error');
    process.exit(1);
  }
}

async function revoke() {
  console.log('\n=== Revoking Treasury Agent Authorization ===\n');

  const response = await fetch(`${TREASURY_AGENT_URL}/authorize?userAddress=${account.address}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (response.ok && (result as { success: boolean }).success) {
    console.log('✅ Authorization revoked successfully');
    console.log('The treasury agent will no longer execute trades automatically.');
  } else {
    console.error('❌ Revocation failed:', (result as { error?: string }).error || 'Unknown error');
    process.exit(1);
  }
}

async function checkStatus() {
  console.log('\n=== Checking Treasury Agent Status ===\n');

  // Check health
  const healthResponse = await fetch(`${TREASURY_AGENT_URL}/health`);
  const health = await healthResponse.json() as { status: string; timestamp: number };
  console.log('Agent Health:', health.status);
  console.log('Timestamp:', new Date(health.timestamp).toISOString());

  // Check portfolio
  console.log('\nFetching portfolio...');
  const portfolioResponse = await fetch(`${TREASURY_AGENT_URL}/portfolio?address=${account.address}`);
  const portfolio = await portfolioResponse.json();
  console.log('Portfolio:', JSON.stringify(portfolio, null, 2));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--revoke')) {
    await revoke();
  } else if (args.includes('--check')) {
    await checkStatus();
  } else {
    await authorize();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
