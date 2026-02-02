import { createPublicClient, http, formatEther, formatUnits, erc20Abi } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x5bac2a365ad5db99a387f07c3f352032d13063fdc5277cf7fe3385a02f14ae3a';
const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr';
const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';
const DAI = '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357';
const INTENT_ROUTER = '0x855B735aC495f06E46cf01A1607706dF43c82348';

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
console.log('Wallet:', account.address);

const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

async function check() {
  const ethBalance = await client.getBalance({ address: account.address });
  console.log('ETH:', formatEther(ethBalance));

  const usdcBalance = await client.readContract({
    address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [account.address]
  });
  console.log('USDC:', formatUnits(usdcBalance, 6));

  const daiBalance = await client.readContract({
    address: DAI, abi: erc20Abi, functionName: 'balanceOf', args: [account.address]
  });
  console.log('DAI:', formatUnits(daiBalance, 18));

  const usdcAllowance = await client.readContract({
    address: USDC, abi: erc20Abi, functionName: 'allowance', args: [account.address, INTENT_ROUTER]
  });
  console.log('USDC allowance to IntentRouter:', formatUnits(usdcAllowance, 6));

  const daiAllowance = await client.readContract({
    address: DAI, abi: erc20Abi, functionName: 'allowance', args: [account.address, INTENT_ROUTER]
  });
  console.log('DAI allowance to IntentRouter:', formatUnits(daiAllowance, 18));
}

check().catch(console.error);
