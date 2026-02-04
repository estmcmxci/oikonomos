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
  encodeFunctionData,
  decodeErrorResult,
  keccak256,
  toBytes,
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

  // Step 1: Encode the registerSubname call to trigger OffchainLookup
  const callData = encodeFunctionData({
    abi: OffchainSubnameManagerABI,
    functionName: "registerSubname",
    args: [
      config.parentNode,
      label,
      subnameOwner,
      agentId,
      a2aUrl,
      desiredExpiry,
    ],
  });

  // Step 2: Make the call and catch OffchainLookup error
  let offchainLookupData: {
    sender: Address;
    urls: string[];
    callData: Hex;
    callbackFunction: Hex;
    extraData: Hex;
  };

  try {
    await publicClient.call({
      to: config.managerAddress,
      data: callData,
    });
    // If we get here, something is wrong - registerSubname should always revert
    throw new Error("Expected OffchainLookup revert, but call succeeded");
  } catch (error: unknown) {
    // Parse the OffchainLookup error
    const errorData = (error as { data?: Hex })?.data;
    if (!errorData) {
      throw new Error("Failed to get OffchainLookup error data");
    }

    try {
      const decoded = decodeErrorResult({
        abi: OffchainSubnameManagerABI,
        data: errorData,
      });

      if (decoded.errorName !== "OffchainLookup") {
        throw new Error(`Unexpected error: ${decoded.errorName}`);
      }

      const [sender, urls, lookupCallData, callbackFunction, extraData] =
        decoded.args as [Address, string[], Hex, Hex, Hex];

      offchainLookupData = {
        sender,
        urls,
        callData: lookupCallData,
        callbackFunction,
        extraData,
      };
    } catch (decodeError) {
      throw new Error(
        `Failed to decode OffchainLookup error: ${(decodeError as Error).message}`
      );
    }
  }

  // Step 3: Query the gateway
  const gatewayUrl = config.gatewayUrl || offchainLookupData.urls[0];
  const gatewayResponse = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: offchainLookupData.sender,
      data: offchainLookupData.callData,
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

  // Step 4: Call registerSubnameWithProof with the gateway response
  const accounts = await walletClient.getAddresses();
  if (!accounts.length) {
    throw new Error("No accounts available in wallet client");
  }

  const hash = await walletClient.writeContract({
    account: accounts[0],
    chain: walletClient.chain,
    address: config.managerAddress,
    abi: OffchainSubnameManagerABI,
    functionName: "registerSubnameWithProof",
    args: [gatewayResult.data, offchainLookupData.extraData],
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
