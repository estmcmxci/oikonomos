import { createPublicClient, createWalletClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

export function getPublicClient(rpcUrl: string, chain: Chain = sepolia) {
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export function getWalletClient(privateKey: string, rpcUrl: string, chain: Chain = sepolia) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
}

export function getAccount(privateKey: string) {
  return privateKeyToAccount(privateKey as `0x${string}`);
}
