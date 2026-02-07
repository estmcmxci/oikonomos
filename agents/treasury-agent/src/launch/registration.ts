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
  decodeAbiParameters,
  keccak256,
  encodePacked,
  namehash,
  decodeErrorResult,
  encodeFunctionData,
  toHex,
  hexToBytes,
  parseEther,
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

// ENS CCIP Subname Manager (Sepolia) - for oikonomosapp.eth
const CCIP_MANAGER_ADDRESS = '0xCebDf1E4AeBcbd562aB13aCbB179E950D246C669' as Address;
const CCIP_GATEWAY_URL = 'https://oikonomos-ccip-gateway.estmcmxci.workers.dev';

// Parent node: namehash('oikonomosapp.eth')
const OIKONOMOS_PARENT_NODE = '0x6c34d411c8237450d6595c190f68d59f87081d9f18b6116c57242e7d39df2cad' as Hex;

// ENS Public Resolver (Sepolia)
const ENS_PUBLIC_RESOLVER = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as Address;

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

const ENSResolverABI = [
  {
    type: 'function',
    name: 'setText',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
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
  textRecordResults?: string[];
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

  // Use Base Sepolia RPC for registration
  const rpcUrl = env.RPC_URL || 'https://base-sepolia.drpc.org';

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
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
    // Note: Explicit gas required - estimation fails on proxy contract
    const txHash = await walletClient.writeContract({
      address: registryAddress,
      abi: IdentityRegistryABI,
      functionName: 'register',
      args: [agentURI],
      gas: 800000n,
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
 * Compute namehash for oikonomosapp.eth
 */
export function computeOikonomosParentNode(): Hex {
  return namehash('oikonomosapp.eth');
}

/**
 * Check if ENS subname is available
 */
export async function isSubnameAvailable(
  env: Env,
  label: string
): Promise<boolean> {
  // ENS CCIP manager is on Sepolia — always use Sepolia RPC (env.RPC_URL may point to Base)
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://sepolia.drpc.org'),
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
    textRecords?: Record<string, string>;
  }
): Promise<ENSRegistrationResult> {
  const account = privateKeyToAccount(agentPrivateKey);

  // ENS CCIP manager is on Sepolia — always use Sepolia RPC (env.RPC_URL may point to Base)
  const sepoliaRpc = 'https://sepolia.drpc.org';

  // Use env.PRIVATE_KEY (deployer) for Sepolia txs since agent wallets only have Base Sepolia ETH.
  // registerSubnameWithProof is not access-controlled — anyone can submit the proof.
  const sepoliaSigner = env.PRIVATE_KEY
    ? privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`)
    : account;

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(sepoliaRpc),
  });

  const walletClient = createWalletClient({
    account: sepoliaSigner,
    chain: sepolia,
    transport: http(sepoliaRpc),
  });

  const parentNode = computeOikonomosParentNode();
  const ensName = `${params.label}.oikonomosapp.eth`;

  try {
    // 1. Encode the registerSubname call to trigger OffchainLookup revert
    const desiredExpiry = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60); // 1 year

    // Use raw eth_call via fetch to get the OffchainLookup revert data directly.
    // Viem's readContract strips the raw revert bytes, making OffchainLookup unparseable.
    const encodedCall = encodeFunctionData({
      abi: SubnameManagerABI,
      functionName: 'registerSubname',
      args: [
        parentNode,
        params.label,
        account.address,
        params.agentId,
        params.a2aUrl,
        desiredExpiry,
      ],
    });

    const rpcResponse = await fetch(sepoliaRpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: CCIP_MANAGER_ADDRESS, data: encodedCall }, 'latest'],
      }),
    });

    const rpcResult = await rpcResponse.json() as {
      result?: string;
      error?: { code: number; message: string; data?: string };
    };

    // The revert data is in error.data (code 3 = execution reverted)
    const revertData = rpcResult.error?.data as Hex | undefined;

    if (!revertData || !revertData.startsWith('0x556f1830')) {
      return {
        success: false,
        error: `registerSubname did not revert with OffchainLookup. ${
          rpcResult.error ? `RPC error: ${rpcResult.error.message}` : 'No revert data'
        }`,
      };
    }

    // Decode the OffchainLookup error
    const decoded = decodeErrorResult({
      abi: SubnameManagerABI,
      data: revertData,
    });

    if (decoded.errorName !== 'OffchainLookup' || !decoded.args || decoded.args.length < 5) {
      return {
        success: false,
        error: 'Failed to decode OffchainLookup revert data',
      };
    }

    // OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)
    const callData = decoded.args[2] as Hex;
    const extraData = decoded.args[4] as Hex;

    // 2. Sign the CCIP response inline (avoids Worker-to-Worker fetch which Cloudflare blocks)
    //    Replicates the signing logic from ccip-gateway-worker/src/ccip-read.ts
    const REQUEST_SCHEMA = parseAbiParameters(
      'bytes32 parentNode,string label,bytes32 labelHash,address subnameOwner,uint256 agentId,string a2aUrl,uint64 desiredExpiry,address requester,uint256 chainId,address contractAddress'
    );
    const MESSAGE_SCHEMA = parseAbiParameters(
      'bytes32 parentNode,bytes32 labelHash,address subnameOwner,uint256 agentId,bytes32 a2aUrlHash,uint64 expiry,address requester,uint256 chainId,address contractAddress'
    );
    const RESPONSE_SCHEMA = parseAbiParameters('bool approved,uint64 expiry,bytes signature');

    // Decode the callData to get registration params
    const reqDecoded = decodeAbiParameters(REQUEST_SCHEMA, callData);
    const [, , reqLabelHash, reqSubnameOwner, reqAgentId, reqA2aUrl, reqDesiredExpiry, reqRequester, reqChainId, reqContractAddress] = reqDecoded;

    // Sign the approval message (matches _verifySignature in OffchainSubnameManager.sol)
    const a2aUrlHash = keccak256(toHex(reqA2aUrl as string));
    const messageHash = keccak256(
      encodeAbiParameters(MESSAGE_SCHEMA, [
        reqDecoded[0] as Hex, // parentNode
        reqLabelHash as Hex,
        reqSubnameOwner as Address,
        reqAgentId as bigint,
        a2aUrlHash,
        reqDesiredExpiry as bigint,
        reqRequester as Address,
        reqChainId as bigint,
        reqContractAddress as Address,
      ])
    );

    // Sign with the deployer/trusted signer key (CCIP_SIGNER_KEY, or fall back to PRIVATE_KEY)
    const ccipKey = (env.CCIP_SIGNER_KEY || env.PRIVATE_KEY) as `0x${string}`;
    const signerAccount = privateKeyToAccount(ccipKey);
    const signature = await signerAccount.signMessage({
      message: { raw: hexToBytes(messageHash) },
    });

    // Encode the signed response
    const responseData = encodeAbiParameters(RESPONSE_SCHEMA, [
      true,
      reqDesiredExpiry as bigint,
      signature as Hex,
    ]);

    // 3. Submit proof to contract via registerSubnameWithProof(response, extraData)
    const txHash = await walletClient.writeContract({
      address: CCIP_MANAGER_ADDRESS,
      abi: SubnameManagerABI,
      functionName: 'registerSubnameWithProof',
      args: [responseData, extraData],
      gas: 800000n,
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    // 4. Set text records directly on the ENS Public Resolver
    // The agent wallet owns the subname — setText must be called by the owner, not the deployer.
    // IMPORTANT: Cloudflare Workers have a 50-subrequest limit. To minimize subrequests we:
    //   - Fetch nonce once (1 subrequest)
    //   - Send all setText txs with explicit nonces (N subrequests)
    //   - Wait only for the last receipt (1-3 subrequests)
    // Total: N + 2-4 instead of N * 3-5
    const textRecordResults: string[] = [];
    if (params.textRecords && Object.keys(params.textRecords).length > 0) {
      const agentWalletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(sepoliaRpc),
      });

      const agentSepoliaBalance = await publicClient.getBalance({ address: account.address });
      const textRecordCount = Object.keys(params.textRecords).length;
      const requiredGas = parseEther('0.0005') * BigInt(textRecordCount);

      console.log(`[ens] Agent ${account.address} Sepolia balance: ${agentSepoliaBalance}, required: ${requiredGas}, records: ${textRecordCount}`);

      if (agentSepoliaBalance < requiredGas) {
        if (sepoliaSigner.address !== account.address) {
          try {
            const fundTx = await walletClient.sendTransaction({ to: account.address, value: requiredGas });
            await publicClient.waitForTransactionReceipt({ hash: fundTx });
            textRecordResults.push(`auto-funded: ${requiredGas} wei`);
          } catch (err) {
            textRecordResults.push(`fund-failed: ${String(err)}`);
          }
        } else {
          textRecordResults.push(`insufficient-balance: ${agentSepoliaBalance} < ${requiredGas}`);
        }
      }

      const subnameNode = namehash(ensName);
      const entries = Object.entries(params.textRecords);

      // Get nonce once, then send all txs with sequential nonces (saves subrequests)
      const startNonce = await publicClient.getTransactionCount({ address: account.address });
      const sentTxHashes: `0x${string}`[] = [];

      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        try {
          console.log(`[ens] setText("${key}") nonce=${startNonce + i}`);
          const setTextTx = await agentWalletClient.writeContract({
            address: ENS_PUBLIC_RESOLVER,
            abi: ENSResolverABI,
            functionName: 'setText',
            args: [subnameNode, key, value],
            gas: 100000n,
            nonce: startNonce + i,
          });
          sentTxHashes.push(setTextTx);
          textRecordResults.push(`${key}: sent (${setTextTx})`);
        } catch (err) {
          textRecordResults.push(`${key}: FAILED — ${String(err)}`);
        }
      }

      // Wait only for the last tx — all earlier nonces are guaranteed confirmed before it
      if (sentTxHashes.length > 0) {
        try {
          await publicClient.waitForTransactionReceipt({ hash: sentTxHashes[sentTxHashes.length - 1] });
          // Mark all as confirmed
          for (let i = 0; i < textRecordResults.length; i++) {
            textRecordResults[i] = textRecordResults[i].replace(': sent (', ': ok (');
          }
        } catch (err) {
          textRecordResults.push(`receipt-wait-failed: ${String(err)}`);
        }
      }
    }

    return {
      success: true,
      ensName,
      txHash,
      textRecordResults,
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
