/**
 * Contract ABIs and Direct Contract Call Utilities
 *
 * For write operations and real-time reads, we use direct contract calls.
 * ENS subgraph is used for indexed read operations (profile, list, etc.)
 */

import type { Address } from "viem";
import { encodeFunctionData, keccak256, encodePacked } from "viem";
import { normalize } from "viem/ens";
import { getNetworkConfig, getCoinType } from "../config/deployments";
import { getPublicClient, getWalletClient } from "./viem";
import { calculateEnsNode } from "./node";

// ============================================================================
// ABI Definitions
// ============================================================================

export const REGISTRY_ABI = [
  {
    name: "resolver",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "setSubnodeRecord",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "labelHash", type: "bytes32" },
      { name: "owner", type: "address" },
      { name: "resolver", type: "address" },
      { name: "ttl", type: "uint64" },
    ],
    outputs: [],
  },
  {
    name: "setOwner",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "owner", type: "address" },
    ],
    outputs: [],
  },
] as const;

export const RESOLVER_ABI = [
  {
    name: "addr",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "text",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ type: "string" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "string" }],
  },
  {
    name: "setAddr",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "addr", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "setText",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "multicall",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "data", type: "bytes[]" }],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
  // Overloaded setAddr with coin type (for multi-chain support)
  {
    name: "setAddr",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "coinType", type: "uint256" },
      { name: "addr", type: "bytes" },
    ],
    outputs: [],
  },
  // Overloaded addr read with coin type
  {
    name: "addr",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "coinType", type: "uint256" },
    ],
    outputs: [{ type: "bytes" }],
  },
] as const;

export const REGISTRAR_CONTROLLER_ABI = [
  {
    name: "available",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "rentPrice",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "base", type: "uint256" },
          { name: "premium", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "makeCommitment",
    type: "function",
    stateMutability: "pure",
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "resolver", type: "address" },
      { name: "data", type: "bytes[]" },
      { name: "reverseRecord", type: "bool" },
      { name: "ownerControlledFuses", type: "uint16" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "commit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitment", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "register",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "resolver", type: "address" },
      { name: "data", type: "bytes[]" },
      { name: "reverseRecord", type: "bool" },
      { name: "ownerControlledFuses", type: "uint16" },
    ],
    outputs: [],
  },
] as const;

export const REVERSE_REGISTRAR_ABI = [
  {
    name: "node",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "setName",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "setNameForAddr",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "addr", type: "address" },
      { name: "owner", type: "address" },
      { name: "resolver", type: "address" },
      { name: "name", type: "string" },
    ],
    outputs: [{ type: "bytes32" }],
  },
] as const;

// Name Wrapper ABI for wrapped names
export const NAME_WRAPPER_ABI = [
  {
    name: "setSubnodeRecord",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label", type: "string" },
      { name: "owner", type: "address" },
      { name: "resolver", type: "address" },
      { name: "ttl", type: "uint64" },
      { name: "fuses", type: "uint32" },
      { name: "expiry", type: "uint64" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "isWrapped",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
] as const;

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Check if an ENS name is available for registration
 */
export async function checkAvailable(label: string, network?: string): Promise<boolean> {
  const config = getNetworkConfig(network);
  const client = getPublicClient(network);

  // Normalize the label name (ENS normalization)
  const normalizedName = normalize(label);

  try {
    const isAvailable = await client.readContract({
      address: config.registrarController,
      abi: REGISTRAR_CONTROLLER_ABI,
      functionName: "available",
      args: [normalizedName],
    });

    return isAvailable as boolean;
  } catch (error) {
    const e = error as Error;
    if (e.message.includes("returned no data")) {
      throw new Error(
        `Contract call failed: The "available" function on ${config.registrarController} returned no data. ` +
          `Network: ${network || "sepolia (default)"}, Label: "${label}", Normalized: "${normalizedName}"`
      );
    }
    throw new Error(
      `Failed to check availability for "${label}" (normalized: "${normalizedName}") on ${config.registrarController}: ${e.message}`
    );
  }
}

/**
 * Get registration price for an ENS name
 */
export async function getRegisterPrice(
  label: string,
  durationSeconds: bigint,
  network?: string
): Promise<bigint> {
  const config = getNetworkConfig(network);
  const client = getPublicClient(network);

  // Normalize the label name (ENS normalization)
  const normalizedName = normalize(label);

  const price = (await client.readContract({
    address: config.registrarController,
    abi: REGISTRAR_CONTROLLER_ABI,
    functionName: "rentPrice",
    args: [normalizedName, durationSeconds],
  })) as { base: bigint; premium: bigint };

  return price.base + price.premium;
}

/**
 * Get resolver address for an ENS name
 */
export async function getResolver(node: `0x${string}`, network?: string): Promise<Address | null> {
  const config = getNetworkConfig(network);
  const client = getPublicClient(network);

  try {
    const resolver = await client.readContract({
      address: config.registry,
      abi: REGISTRY_ABI,
      functionName: "resolver",
      args: [node],
    });

    if (resolver === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return resolver as Address;
  } catch (error) {
    const e = error as Error;
    if (
      e.message.includes("timeout") ||
      e.message.includes("network") ||
      e.message.includes("ECONNREFUSED") ||
      e.message.includes("fetch failed")
    ) {
      throw new Error(`RPC error: ${e.message}. Check your network connection.`);
    }
    console.error(`getResolver error for node ${node}: ${e.message}`);
    return null;
  }
}

/**
 * Get owner address for an ENS name
 */
export async function getOwner(node: `0x${string}`, network?: string): Promise<Address | null> {
  const config = getNetworkConfig(network);
  const client = getPublicClient(network);

  try {
    const owner = await client.readContract({
      address: config.registry,
      abi: REGISTRY_ABI,
      functionName: "owner",
      args: [node],
    });

    if (owner === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return owner as Address;
  } catch {
    return null;
  }
}

/**
 * Get address record from resolver
 */
export async function getAddressRecord(
  resolverAddress: Address,
  node: `0x${string}`,
  network?: string
): Promise<Address | null> {
  const client = getPublicClient(network);

  try {
    const addr = await client.readContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: "addr",
      args: [node],
    });

    if (addr && addr !== "0x0000000000000000000000000000000000000000") {
      return addr as Address;
    }
  } catch {
    // Continue to return null
  }

  return null;
}

/**
 * Get text record from resolver
 */
export async function getTextRecord(
  resolverAddress: Address,
  node: `0x${string}`,
  key: string,
  network?: string
): Promise<string | null> {
  const client = getPublicClient(network);

  try {
    const value = await client.readContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: "text",
      args: [node, key],
    });

    return value || null;
  } catch {
    return null;
  }
}

/**
 * Get primary name (reverse resolution) for an address
 */
export async function getPrimaryNameOnChain(address: Address, network?: string): Promise<string | null> {
  const config = getNetworkConfig(network);
  const client = getPublicClient(network);

  try {
    // Get reverse node for address
    const reverseNode = await client.readContract({
      address: config.reverseRegistrar,
      abi: REVERSE_REGISTRAR_ABI,
      functionName: "node",
      args: [address],
    });

    if (reverseNode === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      return null;
    }

    // Get name from resolver
    const name = await client.readContract({
      address: config.resolver,
      abi: RESOLVER_ABI,
      functionName: "name",
      args: [reverseNode as `0x${string}`],
    });

    return name || null;
  } catch {
    return null;
  }
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Set a text record
 */
export async function setTextRecordOnChain(
  node: `0x${string}`,
  key: string,
  value: string,
  resolverAddress?: Address,
  network?: string,
  useLedger?: boolean,
  accountIndex?: number
): Promise<`0x${string}`> {
  const config = getNetworkConfig(network);
  const wallet = await getWalletClient(network, useLedger, accountIndex);

  if (!wallet) {
    throw new Error("Wallet not configured. Set ENS_PRIVATE_KEY environment variable or use --ledger flag.");
  }

  const resolver = resolverAddress || config.resolver;

  const txHash = await wallet.writeContract({
    address: resolver,
    abi: RESOLVER_ABI,
    functionName: "setText",
    args: [node, key, value],
  });

  return txHash;
}

/**
 * Set address record
 */
export async function setAddressRecordOnChain(
  node: `0x${string}`,
  address: Address,
  resolverAddress?: Address,
  network?: string,
  useLedger?: boolean,
  accountIndex?: number
): Promise<`0x${string}`> {
  const config = getNetworkConfig(network);
  const wallet = await getWalletClient(network, useLedger, accountIndex);

  if (!wallet) {
    throw new Error("Wallet not configured. Set ENS_PRIVATE_KEY environment variable or use --ledger flag.");
  }

  const resolver = resolverAddress || config.resolver;

  const txHash = await wallet.writeContract({
    address: resolver,
    abi: RESOLVER_ABI,
    functionName: "setAddr",
    args: [node, address],
  });

  return txHash;
}

/**
 * Set primary name (reverse record)
 */
export async function setPrimaryNameOnChain(
  name: string,
  network?: string,
  useLedger?: boolean,
  accountIndex?: number
): Promise<`0x${string}`> {
  const config = getNetworkConfig(network);
  const wallet = await getWalletClient(network, useLedger, accountIndex);

  if (!wallet) {
    throw new Error("Wallet not configured. Set ENS_PRIVATE_KEY environment variable or use --ledger flag.");
  }

  const signerAddress = wallet.account.address;

  const txHash = await wallet.writeContract({
    address: config.reverseRegistrar,
    abi: REVERSE_REGISTRAR_ABI,
    functionName: "setNameForAddr",
    args: [signerAddress, signerAddress, config.resolver, name],
  });

  return txHash;
}

/**
 * Build resolver data for setting records during registration
 */
export function buildResolverData(
  node: `0x${string}`,
  addressToSet?: Address,
  textRecords?: Record<string, string>
): `0x${string}`[] {
  const data: `0x${string}`[] = [];

  // Add setAddr call
  if (addressToSet) {
    data.push(
      encodeFunctionData({
        abi: RESOLVER_ABI,
        functionName: "setAddr",
        args: [node, addressToSet],
      })
    );
  }

  // Add setText calls
  if (textRecords) {
    for (const [key, value] of Object.entries(textRecords)) {
      data.push(
        encodeFunctionData({
          abi: RESOLVER_ABI,
          functionName: "setText",
          args: [node, key, value],
        })
      );
    }
  }

  return data;
}

// ============================================================================
// Subname Utilities (for creating subnames under owned domains)
// ============================================================================

/**
 * Check if the signer owns the parent domain
 */
export async function checkParentOwnership(
  parentNode: `0x${string}`,
  network?: string,
  useLedger?: boolean,
  accountIndex?: number
): Promise<boolean> {
  const wallet = await getWalletClient(network, useLedger, accountIndex);
  if (!wallet) {
    throw new Error("Wallet not configured. Set ENS_PRIVATE_KEY environment variable or use --ledger flag.");
  }

  const signerAddress = wallet.account.address;
  const ownerAddress = await getOwner(parentNode, network);

  return ownerAddress?.toLowerCase() === signerAddress.toLowerCase();
}

/**
 * Get resolver from parent node with fallback to public resolver
 */
export async function getResolverFromParent(parentNode: `0x${string}`, network?: string): Promise<Address> {
  const config = getNetworkConfig(network);
  const parentResolver = await getResolver(parentNode, network);

  return parentResolver || config.resolver;
}

/**
 * Create a subname under a parent domain
 * Uses Registry.setSubnodeRecord which is free if you own the parent
 */
export async function createSubname(
  parentNode: `0x${string}`,
  labelHashValue: `0x${string}`,
  network?: string,
  useLedger?: boolean,
  accountIndex?: number
): Promise<`0x${string}` | null> {
  const config = getNetworkConfig(network);
  const wallet = await getWalletClient(network, useLedger, accountIndex);
  const client = getPublicClient(network);

  if (!wallet) {
    throw new Error("Wallet not configured. Set ENS_PRIVATE_KEY environment variable or use --ledger flag.");
  }

  const signerAddress = wallet.account.address;

  // Calculate subname node
  const subnameNode = keccak256(
    encodePacked(["bytes32", "bytes32"], [parentNode, labelHashValue])
  ) as `0x${string}`;

  // Check if subname already exists
  const existingOwner = await getOwner(subnameNode, network);

  // If exists and owned by signer, skip (idempotent)
  if (existingOwner && existingOwner.toLowerCase() === signerAddress.toLowerCase()) {
    return null; // Already owned by signer
  }

  // If exists and owned by different address, throw error
  if (existingOwner && existingOwner !== "0x0000000000000000000000000000000000000000") {
    throw new Error(
      `Subname already exists and is owned by ${existingOwner}. ` +
        `You cannot overwrite a subname owned by another address.`
    );
  }

  // Get resolver from parent
  const resolver = await getResolverFromParent(parentNode, network);

  // Create subname via Registry
  const txHash = await wallet.writeContract({
    address: config.registry,
    abi: REGISTRY_ABI,
    functionName: "setSubnodeRecord",
    args: [parentNode, labelHashValue, signerAddress, resolver, 0n],
  });

  // Wait for confirmation
  await client.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 2,
  });

  return txHash;
}

/**
 * Set address record with coin type
 * For L1 ENS, coin type 60 is ETH
 */
export async function setAddressRecordWithCoinType(
  node: `0x${string}`,
  address: Address,
  coinType: bigint,
  resolverAddress: Address,
  network?: string,
  useLedger?: boolean,
  accountIndex?: number
): Promise<`0x${string}` | null> {
  const wallet = await getWalletClient(network, useLedger, accountIndex);
  const client = getPublicClient(network);

  if (!wallet) {
    throw new Error("Wallet not configured. Set ENS_PRIVATE_KEY environment variable or use --ledger flag.");
  }

  // For ETH (coin type 60), use the simple setAddr signature
  if (coinType === 60n) {
    // Check if address record already matches (idempotent)
    try {
      const existingAddr = (await client.readContract({
        address: resolverAddress,
        abi: RESOLVER_ABI,
        functionName: "addr",
        args: [node],
      })) as Address;

      if (existingAddr && existingAddr.toLowerCase() === address.toLowerCase()) {
        return null; // Already set correctly
      }
    } catch {
      // Couldn't read, proceed with setting
    }

    const txHash = await wallet.writeContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: "setAddr",
      args: [node, address],
    });

    // Wait for confirmation
    await client.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 2,
    });

    return txHash;
  }

  // For other coin types, use the bytes encoding
  const encodedAddress = encodePacked(["address"], [address]);

  const txHash = await wallet.writeContract({
    address: resolverAddress,
    abi: RESOLVER_ABI,
    functionName: "setAddr",
    args: [node, coinType, encodedAddress],
  });

  await client.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 2,
  });

  return txHash;
}

/**
 * Set reverse resolution for an address
 * Uses L1-style setNameForAddr with 4 params
 */
export async function setReverseResolutionL2(
  contractAddress: Address,
  name: string,
  network?: string,
  useLedger?: boolean,
  accountIndex?: number
): Promise<`0x${string}` | null> {
  const config = getNetworkConfig(network);
  const wallet = await getWalletClient(network, useLedger, accountIndex);
  const client = getPublicClient(network);

  if (!wallet) {
    throw new Error("Wallet not configured. Set ENS_PRIVATE_KEY environment variable or use --ledger flag.");
  }

  const signerAddress = wallet.account.address;

  // Use setNameForAddr (addr, owner, resolver, name)
  const txHash = await wallet.writeContract({
    address: config.reverseRegistrar,
    abi: REVERSE_REGISTRAR_ABI,
    functionName: "setNameForAddr",
    args: [contractAddress, signerAddress, config.resolver, name],
  });

  // Wait for confirmation
  await client.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 2,
  });

  return txHash;
}

/**
 * Calculate subname node from parent node and label hash
 */
export function calculateSubnameNode(parentNode: `0x${string}`, labelHashValue: `0x${string}`): `0x${string}` {
  return keccak256(encodePacked(["bytes32", "bytes32"], [parentNode, labelHashValue])) as `0x${string}`;
}
