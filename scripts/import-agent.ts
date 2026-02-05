/**
 * Import an existing agent wallet into the treasury agent's KV storage
 *
 * Usage:
 *   PRIVATE_KEY=0x... DEPLOYER=0x... npx tsx scripts/import-agent.ts
 */

import { config } from 'dotenv';
import { privateKeyToAccount } from 'viem/accounts';
import type { Address } from 'viem';

config({ path: '.dev.vars' });
config({ path: 'agents/treasury-agent/.dev.vars' });

const TREASURY_AGENT_URL = process.env.TREASURY_AGENT_URL || 'http://localhost:8787';

// Agent to import
const AGENT_PRIVATE_KEY = '0xc02954be3eb77727da2d85d316b748e27ab139294922f9635ebae2b545ed30d8' as const;
const DEPLOYER_ADDRESS = (process.env.DEPLOYER || '0xeb0ABB367540f90B57b3d5719fd2b9c740a15022') as Address;
const AGENT_NAME = process.env.AGENT_NAME || 'oikg-gamma';

// OIKG token address
const TOKEN_ADDRESS = '0x9e443ca2dB7F25c7869395B8Bd204F3F4E5B5442' as Address;

async function main() {
  const account = privateKeyToAccount(AGENT_PRIVATE_KEY);

  console.log('='.repeat(60));
  console.log('Import Agent Wallet into Treasury Agent');
  console.log('='.repeat(60));
  console.log('');
  console.log('Agent Details:');
  console.log(`  Address:    ${account.address}`);
  console.log(`  Name:       ${AGENT_NAME}`);
  console.log(`  Deployer:   ${DEPLOYER_ADDRESS}`);
  console.log(`  Token:      ${TOKEN_ADDRESS}`);
  console.log('');

  // The treasury agent stores agents in KV with this structure:
  // Key: agent:{userAddress}:{agentName}
  // Value: { address, encryptedKey, agentName, ensName, tokenAddress, createdAt }

  // We'll call a custom import endpoint or directly use the launch endpoint
  // with the existing key

  // First, check if agent already exists
  console.log('Checking if agent already exists...');
  const listRes = await fetch(`${TREASURY_AGENT_URL}/agents?userAddress=${DEPLOYER_ADDRESS}`);
  const listData = await listRes.json() as { agents?: Array<{ address: string; agentName: string }> };

  if (listData.agents?.some(a => a.address.toLowerCase() === account.address.toLowerCase())) {
    console.log('Agent already registered!');
    return;
  }

  // Import via a direct KV write (we'll need to add an import endpoint)
  // For now, let's use a workaround: call a special import endpoint

  console.log('Registering agent...');

  // Try the import endpoint (we need to add this)
  const importRes = await fetch(`${TREASURY_AGENT_URL}/import-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: DEPLOYER_ADDRESS,
      agentName: AGENT_NAME,
      agentPrivateKey: AGENT_PRIVATE_KEY,
      tokenAddress: TOKEN_ADDRESS,
      ensName: `${AGENT_NAME}.oikonomos.eth`,
    }),
  });

  if (importRes.ok) {
    const result = await importRes.json();
    console.log('Import successful:', result);
  } else {
    const error = await importRes.text();
    console.log('Import endpoint not available:', importRes.status);
    console.log('Response:', error);
    console.log('');
    console.log('Adding import endpoint to treasury agent...');
  }
}

main().catch(console.error);
