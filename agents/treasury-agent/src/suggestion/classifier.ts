// OIK-33: Token Classification
// Classifies tokens as stablecoin, volatile, or native ETH

import type { Address } from 'viem';

export type TokenClassification = 'stablecoin' | 'volatile' | 'native-eth' | 'wrapped-eth' | 'unknown';

// Known token addresses on Sepolia
const STABLECOINS: Address[] = [
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC (Circle)
  '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC (Aave)
  '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // DAI (Aave)
];

const WRAPPED_ETH: Address[] = [
  '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // WETH (Sepolia)
  '0xc558dbdd856501fcd9aaf1e62eae57a9f0629a3c', // WETH (Aave)
];

const NATIVE_ETH = '0x0000000000000000000000000000000000000000' as Address;

export function classifyToken(address: Address): TokenClassification {
  const normalized = address.toLowerCase() as Address;

  if (normalized === NATIVE_ETH) {
    return 'native-eth';
  }

  if (STABLECOINS.map(a => a.toLowerCase()).includes(normalized)) {
    return 'stablecoin';
  }

  if (WRAPPED_ETH.map(a => a.toLowerCase()).includes(normalized)) {
    return 'wrapped-eth';
  }

  return 'volatile';
}

export function isStablecoin(address: Address): boolean {
  return classifyToken(address) === 'stablecoin';
}

export function isETH(address: Address): boolean {
  const classification = classifyToken(address);
  return classification === 'native-eth' || classification === 'wrapped-eth';
}

export interface PortfolioComposition {
  stablecoinPercentage: number;
  volatilePercentage: number;
  ethPercentage: number;
  dominantClass: TokenClassification;
}

export function analyzeComposition(
  tokens: Array<{ address: Address; percentage: number }>
): PortfolioComposition {
  let stablecoinPercentage = 0;
  let volatilePercentage = 0;
  let ethPercentage = 0;

  for (const token of tokens) {
    const classification = classifyToken(token.address);
    switch (classification) {
      case 'stablecoin':
        stablecoinPercentage += token.percentage;
        break;
      case 'native-eth':
      case 'wrapped-eth':
        ethPercentage += token.percentage;
        break;
      default:
        volatilePercentage += token.percentage;
    }
  }

  // Determine dominant class
  let dominantClass: TokenClassification = 'unknown';
  const max = Math.max(stablecoinPercentage, volatilePercentage, ethPercentage);
  if (max === stablecoinPercentage) dominantClass = 'stablecoin';
  else if (max === ethPercentage) dominantClass = 'native-eth';
  else dominantClass = 'volatile';

  return {
    stablecoinPercentage,
    volatilePercentage,
    ethPercentage,
    dominantClass,
  };
}
