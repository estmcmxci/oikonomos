/**
 * CCIP Subname Registration for oikonomos.eth
 *
 * Provides functions for registering and managing subnames under oikonomos.eth
 * using CCIP-Read (EIP-3668).
 */

import {
  type PublicClient,
  type WalletClient,
  type Address,
  type Hex,
  namehash,
  keccak256,
  toBytes,
  encodeFunctionData,
  decodeAbiParameters,
  parseAbiParameters,
} from "viem";
import { normalize } from "viem/ens";

// ============================================================================
// Types
// ============================================================================

export interface SubnameRegistrationParams {
  /** Subname label (e.g., "treasury" for "treasury.oikonomos.eth") */
  label: string;
  /** Address that will own the subname */
  subnameOwner: Address;
  /** ERC-8004 agent ID to associate with this subname */
  agentId: bigint;
  /** A2A protocol endpoint URL (e.g., "https://treasury.oikonomos.workers.dev") */
  a2aUrl: string;
  /** Optional expiry timestamp (0 for no expiry) */
  desiredExpiry?: bigint;
}

export interface CCIPConfig {
  /** OffchainSubnameManager contract address */
  managerAddress: Address;
  /** CCIP-Read gateway URL */
  gatewayUrl: string;
  /** namehash of oikonomos.eth */
  parentNode: Hex;
  /** RPC URL for read operations */
  rpcUrl?: string;
}

export interface SubnameRecord {
  owner: Address;
  agentId: bigint;
  a2aUrl: string;
  expiry: bigint;
  registeredAt: bigint;
}

// ============================================================================
// ABI
// ============================================================================

export const OffchainSubnameManagerABI = [
  {
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label", type: "string" },
      { name: "subnameOwner", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "a2aUrl", type: "string" },
      { name: "desiredExpiry", type: "uint64" },
    ],
    name: "registerSubname",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "response", type: "bytes" },
      { name: "extraData", type: "bytes" },
    ],
    name: "registerSubnameWithProof",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label", type: "string" },
    ],
    name: "isRegistered",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label", type: "string" },
    ],
    name: "getSubnameRecord",
    outputs: [
      {
        components: [
          { name: "owner", type: "address" },
          { name: "agentId", type: "uint256" },
          { name: "a2aUrl", type: "string" },
          { name: "expiry", type: "uint64" },
          { name: "registeredAt", type: "uint64" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGatewayURLs",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  // OffchainLookup error
  {
    inputs: [
      { name: "sender", type: "address" },
      { name: "urls", type: "string[]" },
      { name: "callData", type: "bytes" },
      { name: "callbackFunction", type: "bytes4" },
      { name: "extraData", type: "bytes" },
    ],
    name: "OffchainLookup",
    type: "error",
  },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate subname label format
 */
export function validateLabel(label: string): { valid: boolean; error?: string } {
  if (label.length < 3) {
    return { valid: false, error: "Label must be at least 3 characters" };
  }
  if (label.length > 32) {
    return { valid: false, error: "Label must be at most 32 characters" };
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(label) && label.length > 2) {
    if (!/^[a-z0-9]+$/.test(label)) {
      return {
        valid: false,
        error: "Label must contain only lowercase letters, numbers, and hyphens",
      };
    }
  }
  if (label.startsWith("-") || label.endsWith("-")) {
    return { valid: false, error: "Label cannot start or end with a hyphen" };
  }
  return { valid: true };
}

/**
 * Get the full ENS name from a label
 */
export function getFullSubname(label: string): string {
  return `${label}.oikonomos.eth`;
}

/**
 * Get the namehash for a subname
 */
export function getSubnameNamehash(label: string, parentNode: Hex): Hex {
  const labelHash = keccak256(toBytes(label));
  return keccak256(
    `0x${parentNode.slice(2)}${labelHash.slice(2)}` as Hex
  );
}

// ============================================================================
// Read Functions
// ============================================================================

/**
 * Check if a subname is available for registration
 */
export async function isSubnameAvailable(
  client: PublicClient,
  label: string,
  config: CCIPConfig
): Promise<boolean> {
  const isRegistered = await client.readContract({
    address: config.managerAddress,
    abi: OffchainSubnameManagerABI,
    functionName: "isRegistered",
    args: [config.parentNode, label],
  });

  return !isRegistered;
}

/**
 * Get the record for a registered subname
 */
export async function getSubnameRecord(
  client: PublicClient,
  label: string,
  config: CCIPConfig
): Promise<SubnameRecord | null> {
  try {
    const record = await client.readContract({
      address: config.managerAddress,
      abi: OffchainSubnameManagerABI,
      functionName: "getSubnameRecord",
      args: [config.parentNode, label],
    });

    if (record.owner === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    return {
      owner: record.owner,
      agentId: record.agentId,
      a2aUrl: record.a2aUrl,
      expiry: record.expiry,
      registeredAt: record.registeredAt,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Registration Functions
// ============================================================================

/**
 * Execute CCIP-Read registration flow for a subname
 *
 * This function handles the full CCIP-Read flow:
 * 1. Call registerSubname to trigger OffchainLookup
 * 2. Catch the error and extract callData
 * 3. POST to the gateway for signed approval
 * 4. Call registerSubnameWithProof with the response
 *
 * @returns Transaction hash of the successful registration
 */
export async function registerSubname(
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: SubnameRegistrationParams,
  config: CCIPConfig
): Promise<Hex> {
  const { label, subnameOwner, agentId, a2aUrl, desiredExpiry = 0n } = params;

  // Validate label
  const validation = validateLabel(label);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check availability first
  const available = await isSubnameAvailable(publicClient, label, config);
  if (!available) {
    throw new Error(`Subname "${label}.oikonomos.eth" is already registered`);
  }

  // Validate a2aUrl format
  if (!a2aUrl || !a2aUrl.startsWith("https://")) {
    throw new Error("a2aUrl must be a valid HTTPS URL");
  }

  // OffchainLookup error selector
  const OFFCHAIN_LOOKUP_SELECTOR = "0x556f1830";

  // Get RPC URL from the public client's transport
  const rpcUrl = config.rpcUrl || (publicClient.transport as { url?: string }).url;
  if (!rpcUrl) {
    throw new Error("RPC URL required for CCIP-Read flow");
  }

  // Step 1: Encode the registerSubname call
  const callData = encodeFunctionData({
    abi: OffchainSubnameManagerABI,
    functionName: "registerSubname",
    args: [config.parentNode, label, subnameOwner, agentId, a2aUrl, desiredExpiry],
  });

  // Step 2: Make raw JSON-RPC call to trigger OffchainLookup
  // Using raw RPC instead of viem's call() to get proper error data
  const rpcResponse = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: config.managerAddress, data: callData }, "latest"],
      id: 1,
    }),
  });

  const rpcResult = (await rpcResponse.json()) as {
    error?: { data?: string };
    result?: string;
  };

  if (!rpcResult.error?.data) {
    throw new Error("Expected OffchainLookup error but call succeeded or returned different error");
  }

  const errorData = rpcResult.error.data as Hex;
  if (!errorData.startsWith(OFFCHAIN_LOOKUP_SELECTOR)) {
    throw new Error(`Unexpected error selector: ${errorData.slice(0, 10)}`);
  }

  // Step 3: Decode OffchainLookup error
  const decoded = decodeAbiParameters(
    parseAbiParameters("address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData"),
    `0x${errorData.slice(10)}` as Hex
  );

  const [sender, urls, lookupCallData, callbackFunction, extraData] = decoded;

  // Step 4: Query the gateway
  const gatewayUrl = config.gatewayUrl || (urls as string[])[0];
  const gatewayResponse = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: sender,
      data: lookupCallData,
    }),
  });

  if (!gatewayResponse.ok) {
    const errorBody = await gatewayResponse.text();
    throw new Error(`Gateway request failed: ${gatewayResponse.status} ${errorBody}`);
  }

  const gatewayResult = (await gatewayResponse.json()) as { data: Hex };
  if (!gatewayResult.data) {
    throw new Error("Gateway response missing data field");
  }

  // Step 5: Call registerSubnameWithProof with the gateway response
  // Use the wallet client's account directly for local signing
  if (!walletClient.account) {
    throw new Error("Wallet client must have an account configured for signing");
  }

  const hash = await walletClient.writeContract({
    account: walletClient.account,
    chain: walletClient.chain,
    address: config.managerAddress,
    abi: OffchainSubnameManagerABI,
    functionName: "registerSubnameWithProof",
    args: [gatewayResult.data, extraData as Hex],
  });

  return hash;
}

// ============================================================================
// Configuration Helpers
// ============================================================================

/**
 * Default CCIP configuration for Sepolia
 * Note: managerAddress should be updated after deployment
 */
export const SEPOLIA_CCIP_CONFIG: Partial<CCIPConfig> = {
  gatewayUrl: "https://oikonomos-ccip.workers.dev",
  // parentNode will be computed from namehash("oikonomos.eth")
};

/**
 * Compute the parent node for oikonomos.eth
 */
export function computeOikonomosParentNode(): Hex {
  return namehash(normalize("oikonomos.eth"));
}
