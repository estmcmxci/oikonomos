// Phase 5: Agent Launcher Handler
// Endpoint for launching new AI agents with token creation
// P3: Now includes ENS, ERC-8004, and Nostr integrations

import { type Address } from 'viem';
import type { Env } from '../index';
import {
  generateAgentWallet,
  deriveNostrKeys,
  storeAgentKeys,
  getStoredAgent,
} from './keychain';
import {
  registerAgentERC8004,
  registerENSSubname,
  isSubnameAvailable,
} from './registration';
import {
  launchAgentOnNostr,
  getNostrPublicKey,
} from './nostr';

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
    // Get proper public key if nostr-tools available
    let nostrPubkey = nostrKeys.publicKey;
    try {
      nostrPubkey = getNostrPublicKey(nostrKeys.privateKey);
    } catch {
      // Keep derived key as fallback
    }

    steps.push({
      step: 'Derive Nostr keys',
      status: 'completed',
      details: `npub: ${nostrPubkey.slice(0, 16)}...`,
    });

    // 3. Check ENS subname availability
    const ensName = `${agentName}.oikonomos.eth`;
    const a2aUrl = `https://${agentName}.oikonomos.workers.dev/.well-known/agent-card.json`;

    const ensAvailable = await isSubnameAvailable(env, agentName);
    if (!ensAvailable) {
      steps.push({
        step: 'Check ENS availability',
        status: 'failed',
        details: `${ensName} is already registered`,
      });
    } else {
      steps.push({
        step: 'Check ENS availability',
        status: 'completed',
        details: `${ensName} is available`,
      });
    }

    // 4. Register in ERC-8004 (creates identity NFT)
    let erc8004Id: number | undefined;
    const erc8004Result = await registerAgentERC8004(env, agentWallet.privateKey, {
      name: tokenName,
      description,
      ensName,
      a2aUrl,
      imageUrl: body.imageUrl,
    });

    if (erc8004Result.success) {
      erc8004Id = erc8004Result.erc8004Id;
      steps.push({
        step: 'Register in ERC-8004',
        status: 'completed',
        details: `Agent ID: ${erc8004Id}`,
        txHash: erc8004Result.txHash,
      });
    } else {
      steps.push({
        step: 'Register in ERC-8004',
        status: 'failed',
        details: erc8004Result.error || 'Registration failed',
      });
    }

    // 5. Register ENS subname (requires ERC-8004 ID)
    if (ensAvailable && erc8004Id !== undefined) {
      const ensResult = await registerENSSubname(env, agentWallet.privateKey, {
        label: agentName,
        agentId: BigInt(erc8004Id),
        a2aUrl,
      });

      if (ensResult.success) {
        steps.push({
          step: 'Register ENS subname',
          status: 'completed',
          details: ensResult.ensName,
          txHash: ensResult.txHash,
        });
      } else {
        steps.push({
          step: 'Register ENS subname',
          status: 'failed',
          details: ensResult.error || 'ENS registration failed',
        });
      }
    } else {
      steps.push({
        step: 'Register ENS subname',
        status: 'pending',
        details: ensAvailable ? 'Requires ERC-8004 ID' : 'Name unavailable',
      });
    }

    // 6. Create Nostr profile + post !clawnch
    const nostrResult = await launchAgentOnNostr(nostrKeys.privateKey, {
      tokenName,
      tokenSymbol,
      description,
      imageUrl: body.imageUrl,
      platform: body.platform || 'clawstr',
      agentWallet: agentWallet.address,
      ensName,
    });

    if (nostrResult.success) {
      steps.push({
        step: 'Create Nostr profile',
        status: 'completed',
        details: `Event ID: ${nostrResult.profileEventId?.slice(0, 16)}...`,
      });
      steps.push({
        step: 'Post !clawnch',
        status: 'completed',
        details: `Event ID: ${nostrResult.clawnchEventId?.slice(0, 16)}...`,
      });
    } else {
      // Events created but may need manual relay publishing
      steps.push({
        step: 'Create Nostr profile',
        status: nostrResult.profileEventId ? 'completed' : 'failed',
        details: nostrResult.error || 'Events created, relay publishing pending',
      });
      steps.push({
        step: 'Post !clawnch',
        status: nostrResult.clawnchEventId ? 'completed' : 'failed',
        details: `Platform: ${body.platform || 'clawstr'}`,
      });
    }

    // 7. Store agent keys in KV
    await storeAgentKeys(
      env.TREASURY_KV,
      userAddress,
      agentName,
      agentWallet,
      {
        ensName,
        erc8004Id,
        nostrPubkey,
      }
    );

    steps.push({
      step: 'Store agent keys',
      status: 'completed',
      details: 'Securely stored in KV',
    });

    // Build response
    const failedSteps = steps.filter(s => s.status === 'failed');
    const pendingSteps = steps.filter(s => s.status === 'pending');

    const response: LaunchAgentResponse = {
      success: failedSteps.length === 0,
      agent: {
        wallet: agentWallet.address,
        ensName,
        erc8004Id,
        nostrPubkey,
      },
      steps,
    };

    // Add note about issues
    if (failedSteps.length > 0) {
      response.error = `${failedSteps.length} step(s) failed: ${failedSteps.map(s => s.step).join(', ')}`;
    } else if (pendingSteps.length > 0) {
      response.error = `${pendingSteps.length} step(s) pending: ${pendingSteps.map(s => s.step).join(', ')}`;
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
