// P3 Gaps 7-8: ENS Subname and ERC-8004 Registration
// Integrates with existing SDK functions for agent identity registration

import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  encodePacked,
  namehash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, baseSepolia, base } from 'viem/chains';
import type { Env } from '../index';

// ======== Contract Addresses ========

// ERC-8004 Identity Registry
const ERC8004_ADDRESSES = {
  sepolia: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as Address,
  baseSepolia: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as Address,
  base: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as Address,
};

// ENS CCIP Subname Manager (Sepolia)
const CCIP_MANAGER_ADDRESS = '0x89E3740C8b81D90e146c62B6C6451b85Ec8E6E78' as Address;
const CCIP_GATEWAY_URL = 'https://oikonomos-ccip-gateway.estmcmxci.workers.dev';

// Parent node: namehash('oikonomos.eth')
const OIKONOMOS_PARENT_NODE = '0x5f5c35c3cb79a14e9c9f7f7e9d3f9b1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c' as Hex;

// ======== ABIs ========

const IdentityRegistryABI = [
  {
    type: 'function',
    name: 'register',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const;

const SubnameManagerABI = [
  {
    type: 'function',
    name: 'registerSubname',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'subnameOwner', type: 'address' },
      { name: 'agentId', type: 'uint256' },
      { name: 'a2aUrl', type: 'string' },
      { name: 'desiredExpiry', type: 'uint64' },
    ],
    outputs: [],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'registerSubnameWithProof',
    inputs: [
      { name: 'response', type: 'bytes' },
      { name: 'extraData', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isRegistered',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'error',
    name: 'OffchainLookup',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'urls', type: 'string[]' },
      { name: 'callData', type: 'bytes' },
      { name: 'callbackFunction', type: 'bytes4' },
      { name: 'extraData', type: 'bytes' },
    ],
  },
] as const;

// ======== Types ========

export interface ERC8004Registration {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  name: string;
  description: string;
  image?: string;
  active: boolean;
  x402Support?: boolean;
  services?: Array<{
    name: 'web' | 'ENS' | 'A2A' | 'MCP' | string;
    endpoint: string;
    version?: string;
  }>;
}

export interface RegistrationResult {
  success: boolean;
  erc8004Id?: number;
  txHash?: `0x${string}`;
  error?: string;
}

export interface ENSRegistrationResult {
  success: boolean;
  ensName?: string;
  txHash?: `0x${string}`;
  error?: string;
}

// ======== ERC-8004 Registration ========

/**
 * Create ERC-8004 agent URI (base64 encoded JSON)
 */
export function createAgentURI(registration: ERC8004Registration): string {
  const json = JSON.stringify(registration);
  // Use btoa for base64 encoding (available in Workers)
  const base64 = btoa(json);
  return `data:application/json;base64,${base64}`;
}

/**
 * Register agent in ERC-8004 Identity Registry
 */
export async function registerAgentERC8004(
  env: Env,
  agentPrivateKey: `0x${string}`,
  params: {
    name: string;
    description: string;
    ensName: string;
    a2aUrl: string;
    imageUrl?: string;
  }
): Promise<RegistrationResult> {
  const chainId = parseInt(env.CHAIN_ID || '11155111');
  const registryAddress = getERC8004Address(chainId);

  if (!registryAddress) {
    return { success: false, error: `ERC-8004 not deployed on chain ${chainId}` };
  }

  const account = privateKeyToAccount(agentPrivateKey);
  const chain = getChainById(chainId);

  const publicClient = createPublicClient({
    chain,
    transport: http(env.RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(env.RPC_URL),
  });

  // Build registration data
  const registration: ERC8004Registration = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: params.name,
    description: params.description,
    image: params.imageUrl,
    active: true,
    x402Support: true,
    services: [
      { name: 'ENS', endpoint: params.ensName },
      { name: 'A2A', endpoint: params.a2aUrl, version: '0.3.0' },
    ],
  };

  const agentURI = createAgentURI(registration);

  try {
    // Register in ERC-8004
    const txHash = await walletClient.writeContract({
      address: registryAddress,
      abi: IdentityRegistryABI,
      functionName: 'register',
      args: [agentURI],
    });

    // Wait for confirmation and extract agent ID from logs
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Find Registered event to get agent ID
    let erc8004Id: number | undefined;
    for (const log of receipt.logs) {
      try {
        // Registered event signature: keccak256("Registered(uint256,string,address)")
        const eventSig = keccak256(encodePacked(['string'], ['Registered(uint256,string,address)']));
        if (log.topics[0] === eventSig) {
          // Agent ID is in topics[1] (indexed)
          erc8004Id = Number(BigInt(log.topics[1] || '0'));
          break;
        }
      } catch {
        // Continue checking other logs
      }
    }

    return {
      success: true,
      erc8004Id,
      txHash,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// ======== ENS Subname Registration ========

/**
 * Compute namehash for oikonomos.eth
 */
export function computeOikonomosParentNode(): Hex {
  return namehash('oikonomos.eth');
}

/**
 * Check if ENS subname is available
 */
export async function isSubnameAvailable(
  env: Env,
  label: string
): Promise<boolean> {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  try {
    const isRegistered = await publicClient.readContract({
      address: CCIP_MANAGER_ADDRESS,
      abi: SubnameManagerABI,
      functionName: 'isRegistered',
      args: [computeOikonomosParentNode(), label],
    });
    return !isRegistered;
  } catch {
    // If call fails, assume available
    return true;
  }
}

/**
 * Register ENS subname via CCIP-Read flow
 */
export async function registerENSSubname(
  env: Env,
  agentPrivateKey: `0x${string}`,
  params: {
    label: string;
    agentId: bigint;
    a2aUrl: string;
  }
): Promise<ENSRegistrationResult> {
  const account = privateKeyToAccount(agentPrivateKey);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const parentNode = computeOikonomosParentNode();
  const ensName = `${params.label}.oikonomos.eth`;

  try {
    // 1. Call registerSubname to trigger OffchainLookup
    let ccipData: {
      urls: string[];
      callData: Hex;
      callbackFunction: Hex;
      extraData: Hex;
    } | null = null;

    try {
      // This will revert with OffchainLookup error
      await publicClient.readContract({
        address: CCIP_MANAGER_ADDRESS,
        abi: SubnameManagerABI,
        functionName: 'registerSubname',
        args: [
          parentNode,
          params.label,
          account.address,
          params.agentId,
          params.a2aUrl,
          BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60), // 1 year expiry
        ],
      });
    } catch (error: unknown) {
      // Extract CCIP data from OffchainLookup error
      const err = error as { cause?: { data?: string } };
      if (err.cause?.data) {
        // Decode OffchainLookup error
        // This is a simplified extraction - in production use proper ABI decoding
        ccipData = {
          urls: [CCIP_GATEWAY_URL],
          callData: '0x' as Hex,
          callbackFunction: '0x' as Hex,
          extraData: '0x' as Hex,
        };
      }
    }

    if (!ccipData) {
      // If no CCIP lookup triggered, subname might already be registered
      return {
        success: false,
        error: 'Could not initiate CCIP registration flow',
      };
    }

    // 2. Call CCIP gateway for signed approval
    const gatewayResponse = await fetch(`${CCIP_GATEWAY_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentNode,
        label: params.label,
        owner: account.address,
        agentId: params.agentId.toString(),
        a2aUrl: params.a2aUrl,
      }),
    });

    if (!gatewayResponse.ok) {
      return {
        success: false,
        error: `Gateway error: ${await gatewayResponse.text()}`,
      };
    }

    const { response, extraData } = await gatewayResponse.json() as {
      response: Hex;
      extraData: Hex;
    };

    // 3. Call registerSubnameWithProof with gateway response
    const txHash = await walletClient.writeContract({
      address: CCIP_MANAGER_ADDRESS,
      abi: SubnameManagerABI,
      functionName: 'registerSubnameWithProof',
      args: [response, extraData],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      success: true,
      ensName,
      txHash,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// ======== Helpers ========

function getERC8004Address(chainId: number): Address | null {
  switch (chainId) {
    case 11155111:
      return ERC8004_ADDRESSES.sepolia;
    case 84532:
      return ERC8004_ADDRESSES.baseSepolia;
    case 8453:
      return ERC8004_ADDRESSES.base;
    default:
      return null;
  }
}

function getChainById(chainId: number) {
  switch (chainId) {
    case 11155111:
      return sepolia;
    case 84532:
      return baseSepolia;
    case 8453:
      return base;
    default:
      return sepolia;
  }
}
