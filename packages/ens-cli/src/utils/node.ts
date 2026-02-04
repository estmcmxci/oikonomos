/**
 * ENS Node Calculation Utilities
 *
 * Standard ENS namehash implementation for L1 Ethereum.
 * Uses recursive keccak256 hashing as per EIP-137.
 */

import { keccak256, encodePacked, toBytes, namehash } from "viem";
import { normalize } from "viem/ens";
import { getNetworkConfig } from "../config/deployments";

/**
 * Calculate the root node for the parent domain
 * e.g., "eth" -> namehash("eth")
 */
export function getParentNode(network?: string): `0x${string}` {
  const config = getNetworkConfig(network);
  return namehash(config.parentDomain) as `0x${string}`;
}

/**
 * Calculate the label hash for a single label
 * e.g., "vitalik" -> keccak256(toBytes("vitalik"))
 */
export function labelHash(label: string): `0x${string}` {
  const normalizedLabel = normalize(label);
  return keccak256(toBytes(normalizedLabel));
}

/**
 * Calculate the node hash for an ENS name using standard namehash
 * e.g., "vitalik.eth" -> namehash("vitalik.eth")
 */
export function calculateEnsNode(name: string): `0x${string}` {
  return namehash(name) as `0x${string}`;
}

// calculateSubnameNode is exported from contracts.ts to avoid duplication

/**
 * Extract the label(s) from a full ENS name
 * e.g., "vitalik.eth" -> "vitalik"
 * e.g., "sub.vitalik.eth" -> "sub.vitalik"
 */
export function extractLabel(fullName: string, network?: string): string {
  const config = getNetworkConfig(network);
  const parentSuffix = `.${config.parentDomain}`;

  // Remove parent domain suffix if present
  let name = fullName;
  if (name.toLowerCase().endsWith(parentSuffix.toLowerCase())) {
    name = name.slice(0, -parentSuffix.length);
  }

  // Return the full label path (supports subnames)
  return name;
}

/**
 * Check if a name is a subname (has multiple labels before the parent domain)
 * e.g., "sub.vitalik.eth" -> true
 * e.g., "vitalik.eth" -> false
 */
export function isSubname(input: string, network?: string): boolean {
  const label = extractLabel(input, network);
  return label.includes(".");
}

/**
 * Get the full ENS name from a label or label path
 * e.g., "vitalik" -> "vitalik.eth"
 * e.g., "sub.vitalik" -> "sub.vitalik.eth"
 */
export function getFullEnsName(labelPath: string, network?: string): string {
  const config = getNetworkConfig(network);
  // Normalize each label in the path separately
  const parts = labelPath.split(".");
  const normalizedParts = parts.map((part) => normalize(part));
  return `${normalizedParts.join(".")}.${config.parentDomain}`;
}

/**
 * Check if a string is likely a full ENS name (has parent domain)
 */
export function isFullEnsName(name: string, network?: string): boolean {
  const config = getNetworkConfig(network);
  return name.toLowerCase().endsWith(`.${config.parentDomain.toLowerCase()}`);
}

/**
 * Normalize and validate an ENS name input
 * Returns the normalized label and full name with node hash
 */
export function normalizeEnsName(input: string, network?: string): {
  label: string;
  fullName: string;
  node: `0x${string}`;
} {
  const labelPath = extractLabel(input, network);
  const fullName = getFullEnsName(labelPath, network);

  // For L1 ENS, always use standard namehash
  const node = namehash(fullName) as `0x${string}`;

  return { label: labelPath, fullName, node };
}

// Backwards compatibility aliases
export const calculateBasenameNode = calculateEnsNode;
export const normalizeBasename = normalizeEnsName;
export const getFullBasename = getFullEnsName;
export const isFullBasename = isFullEnsName;
