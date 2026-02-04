import { type Address } from 'viem';
import type { PermissionEntry } from './types';

export const OIKONOMOS_PERMISSION_SCOPE = {
  /**
   * Allowed operations for Oikonomos agents
   */
  allowed: (addresses: {
    intentRouter: Address;
    universalRouter: Address;
    positionManager: Address;
  }): PermissionEntry[] => [
    {
      target: addresses.intentRouter,
      functionName: 'executeIntent',
      valueLimit: 0n,
    },
    {
      target: addresses.universalRouter,
      functionName: 'execute',
      valueLimit: 0n,
    },
    {
      target: addresses.positionManager,
      functionName: 'modifyLiquidity',
      valueLimit: 0n,
    },
    {
      target: addresses.positionManager,
      functionName: 'collect',
      valueLimit: 0n,
    },
  ],

  /**
   * Explicitly blocked functions (defense in depth)
   */
  blocked: [
    'transfer',
    'transferFrom',
    'approve',
    'burn',
  ] as const,

  /**
   * Default session configuration
   */
  defaults: {
    /** 30 days in seconds */
    validityPeriod: 30 * 24 * 60 * 60,
    /** Maximum daily spend in USD */
    maxDailyUsd: 10_000,
  },
} as const;
