const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069';

export async function fetchReceipts(strategyId?: string) {
  const url = strategyId
    ? `${PONDER_URL}/receipts/${strategyId}`
    : `${PONDER_URL}/receipts`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch receipts');
  }
  return response.json();
}

export async function fetchReceiptByTxHash(txHash: string) {
  const response = await fetch(`${PONDER_URL}/receipts?txHash=${txHash}`);
  if (!response.ok) {
    return null;
  }
  const receipts = await response.json();
  return receipts[0] ?? null;
}

export function getEtherscanUrl(txHash: string, chainId: number = 11155111): string {
  const baseUrl = chainId === 1
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io';
  return `${baseUrl}/tx/${txHash}`;
}

export function getEtherscanAddressUrl(address: string, chainId: number = 11155111): string {
  const baseUrl = chainId === 1
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io';
  return `${baseUrl}/address/${address}`;
}
