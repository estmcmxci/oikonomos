import { keccak256, toBytes } from 'viem';

export function generateQuoteId(): `0x${string}` {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  const entropyHex = Array.from(entropy).map(b => b.toString(16).padStart(2, '0')).join('');

  return keccak256(toBytes(timestamp + random + entropyHex));
}

export function isQuoteExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export function getQuoteExpiryTimestamp(ttlMs: number = 60000): number {
  return Date.now() + ttlMs;
}
