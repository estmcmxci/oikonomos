/**
 * CCIP Gateway Worker Type Definitions
 */

/**
 * Environment variables interface for the CCIP-Read gateway
 */
export interface Env {
  /** Private key for signing responses (hex string with 0x prefix) */
  PRIVATE_KEY: string;
  /** Address that must match the address derived from PRIVATE_KEY */
  TRUSTED_SIGNER: string;
  /** Expected contract address in requests */
  CONTRACT_ADDRESS: string;
  /** Expected chain ID */
  CHAIN_ID: string;
  /** Parent node to validate against (namehash of oikonomos.eth) */
  PARENT_NODE: string;
  /** ERC-8004 Identity Registry address */
  IDENTITY_REGISTRY: string;
  /** Optional: Comma-separated or JSON array of allowed requester addresses */
  ALLOWLIST?: string;
}

/**
 * Decoded request parameters from OffchainLookup callData
 * Extended to include agentId for Oikonomos
 */
export interface DecodedRequest {
  parentNode: `0x${string}`;
  label: string;
  labelHash: `0x${string}`;
  subnameOwner: `0x${string}`;
  agentId: bigint;
  desiredExpiry: bigint;
  requester: `0x${string}`;
  chainId: bigint;
  contractAddress: `0x${string}`;
}

/**
 * CCIP-Read request payload format
 */
export interface CCIPReadRequest {
  /** Contract address that initiated the OffchainLookup */
  sender?: string;
  /** ABI-encoded callData from the OffchainLookup error */
  data?: string;
}
