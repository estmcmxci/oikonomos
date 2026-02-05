// Phase 5: Agent Launcher Handler
// Endpoint for launching new AI agents with token creation

import { type Address } from 'viem';
import type { Env } from '../index';
import {
  generateAgentWallet,
  deriveNostrKeys,
  storeAgentKeys,
  getStoredAgent,
} from './keychain';

// ERC-8004 Registry on Sepolia
const ERC8004_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const;

/**
 * Request to launch a new agent
 */
export interface LaunchAgentRequest {
  /** User's wallet address */
  userAddress: Address;
  /** Agent name (becomes ENS subname: {name}.oikonomos.eth) */
  agentName: string;
  /** Token name */
  tokenName: string;
  /** Token symbol (without $) */
  tokenSymbol: string;
  /** Token/agent description */
  description: string;
  /** Optional image URL */
  imageUrl?: string;
  /** Platform to launch on */
  platform?: 'moltbook' | '4claw' | 'clawstr' | 'moltx';
}

/**
 * Response from launching an agent
 */
export interface LaunchAgentResponse {
  success: boolean;
  agent?: {
    wallet: Address;
    ensName: string;
    erc8004Id?: number;
    nostrPubkey: string;
  };
  token?: {
    address: Address;
    symbol: string;
    clankerUrl: string;
  };
  error?: string;
  steps?: LaunchStep[];
}

interface LaunchStep {
  step: string;
  status: 'completed' | 'failed' | 'pending';
  details?: string;
  txHash?: string;
}

/**
 * Handle /launch-agent endpoint
 */
export async function handleLaunchAgent(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: LaunchAgentRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate required fields
  const { userAddress, agentName, tokenName, tokenSymbol, description } = body;

  if (!userAddress || !agentName || !tokenName || !tokenSymbol || !description) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required fields: userAddress, agentName, tokenName, tokenSymbol, description',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate agent name (alphanumeric, lowercase, no spaces)
  if (!/^[a-z0-9]+$/.test(agentName)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Agent name must be lowercase alphanumeric only',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if agent already exists
  const existingAgent = await getStoredAgent(env.TREASURY_KV, userAddress, agentName);
  if (existingAgent) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Agent "${agentName}" already exists for this user`,
        agent: {
          wallet: existingAgent.address,
          ensName: existingAgent.ensName,
          erc8004Id: existingAgent.erc8004Id,
          nostrPubkey: existingAgent.nostrPubkey || '',
        },
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const steps: LaunchStep[] = [];

  try {
    // 1. Generate agent wallet
    const agentWallet = generateAgentWallet(
      userAddress,
      agentName,
      env.PRIVATE_KEY || 'default-salt' // Use env secret as salt
    );

    steps.push({
      step: 'Generate agent wallet',
      status: 'completed',
      details: agentWallet.address,
    });

    // 2. Derive Nostr keys
    const nostrKeys = deriveNostrKeys(agentWallet.privateKey, agentName);

    steps.push({
      step: 'Derive Nostr keys',
      status: 'completed',
      details: `npub: ${nostrKeys.publicKey.slice(0, 16)}...`,
    });

    // 3. Register ENS subname (placeholder - requires CCIP integration)
    const ensName = `${agentName}.oikonomos.eth`;

    steps.push({
      step: 'Register ENS subname',
      status: 'pending',
      details: `${ensName} (requires CCIP resolver)`,
    });

    // 4. Register in ERC-8004 (placeholder - requires contract call)
    steps.push({
      step: 'Register in ERC-8004',
      status: 'pending',
      details: `Registry: ${ERC8004_REGISTRY}`,
    });

    // 5. Create Nostr profile (placeholder - requires Nostr relay connection)
    steps.push({
      step: 'Create Nostr profile',
      status: 'pending',
      details: 'bot: true profile',
    });

    // 6. Post !clawnch (placeholder - requires Nostr posting)
    steps.push({
      step: 'Post !clawnch',
      status: 'pending',
      details: `Platform: ${body.platform || 'clawstr'}`,
    });

    // 7. Store agent keys in KV
    await storeAgentKeys(
      env.TREASURY_KV,
      userAddress,
      agentName,
      agentWallet,
      {
        ensName,
        nostrPubkey: nostrKeys.publicKey,
      }
    );

    steps.push({
      step: 'Store agent keys',
      status: 'completed',
      details: 'Securely stored in KV',
    });

    // Return success with pending steps noted
    const response: LaunchAgentResponse = {
      success: true,
      agent: {
        wallet: agentWallet.address,
        ensName,
        nostrPubkey: nostrKeys.publicKey,
      },
      steps,
    };

    // Add note about pending steps
    if (steps.some(s => s.status === 'pending')) {
      response.error = 'Some steps are pending manual completion (ENS, ERC-8004, Nostr)';
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        steps,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle GET /agents - List user's agents
 */
export async function handleListAgents(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const userAddress = url.searchParams.get('userAddress');

  if (!userAddress) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing userAddress query parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // List all agents for user
    const prefix = `agent:${userAddress.toLowerCase()}:`;
    const list = await env.TREASURY_KV.list({ prefix });

    const agents = [];

    for (const key of list.keys) {
      const data = await env.TREASURY_KV.get(key.name);
      if (data) {
        try {
          const agent = JSON.parse(data);
          // Don't expose private keys in list response
          agents.push({
            address: agent.address,
            agentName: agent.agentName,
            ensName: agent.ensName,
            erc8004Id: agent.erc8004Id,
            nostrPubkey: agent.nostrPubkey,
            tokenAddress: agent.tokenAddress,
            createdAt: agent.createdAt,
          });
        } catch {
          // Skip invalid entries
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        agents,
        count: agents.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
