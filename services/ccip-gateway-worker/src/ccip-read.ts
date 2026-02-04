/**
 * CCIP-Read (EIP-3668) Gateway Implementation for Oikonomos
 *
 * Handles OffchainLookup requests for oikonomos.eth subname registration.
 * Extended to support agentId for ERC-8004 integration.
 */

import type { Hex } from "viem";
import {
  decodeAbiParameters,
  encodeAbiParameters,
  hexToBytes,
  keccak256,
  parseAbiParameters,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Env, DecodedRequest, CCIPReadRequest } from "./types";

// ============================================================================
// ABI Schemas
// ============================================================================

/**
 * ABI schema for decoding OffchainLookup callData
 * Extended to include agentId for Oikonomos
 *
 * Matches the encoding in OffchainSubnameManager.sol:
 * abi.encode(
 *   parentNode,      // bytes32
 *   label,           // string
 *   labelHash,       // bytes32
 *   subnameOwner,    // address
 *   agentId,         // uint256
 *   desiredExpiry,   // uint64
 *   requester,       // address (msg.sender)
 *   chainId,         // uint256 (block.chainid)
 *   contractAddress  // address (address(this))
 * )
 */
const REQUEST_SCHEMA = parseAbiParameters(
  "bytes32 parentNode,string label,bytes32 labelHash,address subnameOwner,uint256 agentId,uint64 desiredExpiry,address requester,uint256 chainId,address contractAddress"
);

/**
 * ABI schema for the message that gets signed
 * Extended to include agentId
 */
const MESSAGE_SCHEMA = parseAbiParameters(
  "bytes32 parentNode,bytes32 labelHash,address subnameOwner,uint256 agentId,uint64 expiry,address requester,uint256 chainId,address contractAddress"
);

/**
 * ABI schema for encoding CCIP-Read response
 */
const RESPONSE_SCHEMA = parseAbiParameters(
  "bool approved,uint64 expiry,bytes signature"
);

// ============================================================================
// Helper Functions
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Creates a JSON HTTP response with CORS headers
 */
export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Parses allowlist from environment variable
 */
export function parseAllowlist(raw?: string | null): Set<string> | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === "*") return null;

  try {
    if (trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed) as string[];
      return new Set(parsed.map((addr) => addr.toLowerCase()));
    }
  } catch {
    // Fall through to comma parsing
  }

  return new Set(
    trimmed
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((addr) => addr.toLowerCase())
  );
}

// ============================================================================
// callData Decoding
// ============================================================================

/**
 * Decodes CCIP-Read callData from OffchainLookup error
 */
export function decodeCallData(
  callData: Hex,
  env: Env
): { data?: DecodedRequest; error?: Response } {
  let decoded;
  try {
    decoded = decodeAbiParameters(REQUEST_SCHEMA, callData);
  } catch (error) {
    return {
      error: jsonResponse(400, {
        error: "Unable to decode OffchainLookup calldata",
        details: (error as Error).message,
      }),
    };
  }

  const [
    parentNode,
    label,
    labelHash,
    subnameOwner,
    agentId,
    desiredExpiry,
    requester,
    chainId,
    contractAddress,
  ] = decoded;

  return {
    data: {
      parentNode: parentNode as `0x${string}`,
      label: label as string,
      labelHash: labelHash as `0x${string}`,
      subnameOwner: subnameOwner as `0x${string}`,
      agentId: agentId as bigint,
      desiredExpiry: desiredExpiry as bigint,
      requester: requester as `0x${string}`,
      chainId: chainId as bigint,
      contractAddress: contractAddress as `0x${string}`,
    },
  };
}

// ============================================================================
// Response Construction
// ============================================================================

/**
 * Builds and signs a CCIP-Read response
 */
export async function buildCCIPReadResponse(
  parentNode: `0x${string}`,
  labelHash: `0x${string}`,
  subnameOwner: `0x${string}`,
  agentId: bigint,
  expiry: bigint,
  requester: `0x${string}`,
  chainId: bigint,
  contractAddress: `0x${string}`,
  env: Env
): Promise<{ data?: Hex; error?: Response }> {
  // Create message hash that will be signed (includes agentId)
  const messageHash = keccak256(
    encodeAbiParameters(MESSAGE_SCHEMA, [
      parentNode,
      labelHash,
      subnameOwner,
      agentId,
      expiry,
      requester,
      chainId,
      contractAddress,
    ])
  );

  // Create account from private key
  const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

  // Verify signer matches expected trusted signer
  if (account.address.toLowerCase() !== env.TRUSTED_SIGNER.toLowerCase()) {
    return {
      error: jsonResponse(500, {
        error:
          "Trusted signer mismatch between PRIVATE_KEY and TRUSTED_SIGNER",
      }),
    };
  }

  // Sign the message hash
  const signature = await account.signMessage({
    message: { raw: hexToBytes(messageHash) },
  });

  // Encode the response: (approved: true, expiry, signature)
  const responseData = encodeAbiParameters(RESPONSE_SCHEMA, [
    true,
    expiry,
    signature,
  ]);

  return { data: responseData };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Main CCIP-Read endpoint handler
 */
export async function handleCCIPReadRequest(
  request: Request,
  env: Env
): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  // Validate configuration
  if (!env.PRIVATE_KEY || !env.TRUSTED_SIGNER) {
    return jsonResponse(500, {
      error: "Gateway misconfigured: missing signer credentials",
    });
  }

  // Parse request body
  let payload: CCIPReadRequest = {};
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  // Validate callData field
  if (
    !payload.data ||
    typeof payload.data !== "string" ||
    !payload.data.startsWith("0x")
  ) {
    return jsonResponse(400, {
      error: "Missing `data` field from OffchainLookup request",
    });
  }

  // Decode callData
  const decoded = decodeCallData(payload.data as Hex, env);
  if (decoded.error) {
    return decoded.error;
  }

  const {
    parentNode,
    label,
    labelHash,
    subnameOwner,
    agentId,
    desiredExpiry,
    requester,
    chainId,
    contractAddress,
  } = decoded.data!;

  // Validate chain ID
  const expectedChainId = BigInt(env.CHAIN_ID ?? "0");
  if (chainId !== expectedChainId) {
    return jsonResponse(400, {
      error: `Invalid chainId. Expected ${expectedChainId}, got ${chainId}`,
    });
  }

  // Validate contract address
  if (contractAddress.toLowerCase() !== env.CONTRACT_ADDRESS.toLowerCase()) {
    return jsonResponse(400, {
      error: "Request not intended for this contract",
    });
  }

  // Validate parent node
  if (
    env.PARENT_NODE &&
    parentNode.toLowerCase() !== env.PARENT_NODE.toLowerCase()
  ) {
    return jsonResponse(400, {
      error: `Unsupported parent node ${parentNode}`,
    });
  }

  // Check allowlist
  const allowlist = parseAllowlist(env.ALLOWLIST);
  if (allowlist && !allowlist.has(requester.toLowerCase())) {
    return jsonResponse(403, {
      error: "Requester not on allowlist",
    });
  }

  // Validate label format (3-32 chars, lowercase alphanumeric + hyphens)
  const labelRegex = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;
  if (!labelRegex.test(label) && label.length !== 3) {
    // Allow exactly 3-char labels too
    if (label.length < 3 || label.length > 32) {
      return jsonResponse(400, {
        error: "Label must be 3-32 characters",
      });
    }
    if (!/^[a-z0-9-]+$/.test(label)) {
      return jsonResponse(400, {
        error:
          "Label must contain only lowercase letters, numbers, and hyphens",
      });
    }
  }

  // Approve the registration
  const expiry = desiredExpiry;

  // Build and sign response
  const response = await buildCCIPReadResponse(
    parentNode,
    labelHash,
    subnameOwner,
    agentId,
    expiry,
    requester,
    chainId,
    contractAddress,
    env
  );

  if (response.error) {
    return response.error;
  }

  return jsonResponse(200, {
    data: response.data,
    meta: {
      label,
      subnameOwner,
      agentId: agentId.toString(),
      fullName: `${label}.oikonomos.eth`,
    },
  });
}
