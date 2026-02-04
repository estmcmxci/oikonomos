import { type Address, type Hex } from 'viem';

export interface SessionKeyConfig {
  /** Agent wallet address that will use the session key */
  agentAddress: Address;
  /** Contract addresses the agent can interact with */
  allowedTargets: Address[];
  /** Functions the agent can call */
  allowedFunctions: string[];
  /** Session validity start (unix timestamp) */
  validAfter: number;
  /** Session validity end (unix timestamp) */
  validUntil: number;
  /** Maximum gas cost the paymaster will sponsor */
  maxGasCost?: bigint;
  /** Maximum daily spend in USD (for UI display) */
  maxDailyUsd?: number;
}

export interface SessionKey {
  /** The session key address */
  address: Address;
  /** Serialized session key for storage */
  serialized: Hex;
  /** Configuration used to create the key */
  config: SessionKeyConfig;
  /** Smart account address this key is bound to */
  smartAccountAddress: Address;
}

export interface SmartAccountInfo {
  address: Address;
  chainId: number;
  isDeployed: boolean;
  passkeyId?: string;
}

export interface PermissionEntry {
  target: Address;
  functionName: string;
  valueLimit?: bigint;
}
