// Phase 5: Agent Launcher Handler
// Endpoint for launching new AI agents with token creation
// P3: Now includes ENS, ERC-8004, and Nostr integrations

import {
  type Address,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, baseSepolia, base } from 'viem/chains';
import type { Env } from '../index';

// Default funding amount for new agent wallets (0.01 ETH)
const DEFAULT_FUNDING_AMOUNT = '0.01';
import {
  generateAgentWallet,
  deriveNostrKeys,
  storeAgentKeys,
  getStoredAgent,
  updateStoredAgent,
  findUserAgentByType,
  addDelegationIndex,
  addTreasuryAgentToGlobalIndex,
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
import { signAndSubmitDelegation } from './delegation';

// ERC-8004 Registry on Sepolia
const ERC8004_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const;

/**
 * Request to launch a new agent
 */
export interface LaunchAgentRequest {
  /** User's wallet address */
  userAddress: Address;
  /** Agent name (becomes ENS subname: {name}.oikonomosapp.eth) */
  agentName: string;
  /** Token name */
  tokenName: string;
  /** Token symbol (without $) */
  tokenSymbol: string;
  /** Token/agent description */
  description: string;
  /** Optional image URL */
  imageUrl?: string;
  /** Agent type */
  type?: 'treasury' | 'defi' | 'portfolio';
  /** Platform to launch on */
  platform?: 'moltbook' | '4claw' | 'clawstr' | 'moltx';
  /** Deployer's private key for funding the agent wallet (optional) */
  deployerPrivateKey?: `0x${string}`;
  /** Amount of ETH to fund agent wallet (default: 0.01 ETH) */
  fundingAmount?: string;
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
    delegationTxHash?: string;
    tokenAddress?: Address;
  };
  token?: {
    address: Address;
    symbol: string;
    clankerUrl: string;
  };
  error?: string;
  steps?: LaunchStep[];
}

export interface LaunchStep {
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

  // For DeFi agents, verify a treasury agent exists first
  const agentType = body.type || 'treasury';
  if (agentType === 'defi') {
    const treasuryAgent = await findUserAgentByType(env.TREASURY_KV, userAddress, 'treasury');
    if (!treasuryAgent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No treasury agent found. Launch a treasury agent first before creating a DeFi agent.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  const steps: LaunchStep[] = [];

  try {
    // ── Phase 1: Wallet derivation + funding ──

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

    // 2. Fund agent wallet from deployer key (request body or worker's env.PRIVATE_KEY)
    const fundingKey = body.deployerPrivateKey || env.PRIVATE_KEY as `0x${string}` | undefined;
    if (fundingKey) {
      const fundingResult = await fundAgentWallet(
        env,
        fundingKey,
        agentWallet.address,
        body.fundingAmount || DEFAULT_FUNDING_AMOUNT
      );

      if (fundingResult.success) {
        steps.push({
          step: 'Fund agent wallet',
          status: 'completed',
          details: `${fundingResult.amount} ETH sent`,
          txHash: fundingResult.txHash,
        });
      } else {
        steps.push({
          step: 'Fund agent wallet',
          status: 'failed',
          details: fundingResult.error || 'Funding failed',
        });
      }
    } else {
      steps.push({
        step: 'Fund agent wallet',
        status: 'pending',
        details: 'No deployer key available - fund manually',
      });
    }

    // 3. Derive Nostr keys
    const nostrKeys = deriveNostrKeys(agentWallet.privateKey, agentName);
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

    // ── Phase 2: ERC-8004 registration ──

    const ensName = `${agentName}.oikonomosapp.eth`;
    const a2aUrl = `https://oikonomos-treasury-agent.estmcmxci.workers.dev/.well-known/agent-card.json`;

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

    // ── Phase 3: Token deploy via Clawnch/Nostr ──

    // 5. Create Nostr profile + post !clawnch
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

    // ── Phase 3.5: Poll for token address (Clawnch deploys async) ──
    let tokenAddress: Address | null = null;
    if (agentType === 'defi') {
      tokenAddress = await pollClawnchForToken(tokenSymbol, agentWallet.address);
      if (tokenAddress) {
        steps.push({ step: 'Discover token address', status: 'completed', details: tokenAddress });
      } else {
        steps.push({ step: 'Discover token address', status: 'pending', details: 'Token not yet deployed by Clawnch — will be set later' });
      }
    }

    // ── Phase 4: Delegation (DelegationRouter signing for DeFi agents) ──
    let delegationTxHash: string | undefined;
    let treasuryAgentEnsName: string | undefined;

    if (agentType === 'defi' && tokenAddress && env.DELEGATION_ROUTER) {
      const treasuryAgent = await findUserAgentByType(env.TREASURY_KV, userAddress, 'treasury');
      // treasuryAgent guaranteed to exist — checked at line 156

      treasuryAgentEnsName = treasuryAgent!.ensName;

      const delegationResult = await signAndSubmitDelegation(env, {
        agentPrivateKey: agentWallet.privateKey,
        agentAddress: agentWallet.address,
        providerAddress: treasuryAgent!.address,
        tokens: [tokenAddress],
      });

      if (delegationResult.success) {
        delegationTxHash = delegationResult.txHash;
        steps.push({
          step: 'Sign delegation to treasury agent',
          status: 'completed',
          details: `Provider: ${treasuryAgent!.ensName}`,
          txHash: delegationResult.txHash,
        });
      } else {
        steps.push({
          step: 'Sign delegation to treasury agent',
          status: 'failed',
          details: delegationResult.error || 'Delegation signing failed',
        });
      }
    } else if (agentType === 'defi') {
      steps.push({
        step: 'Sign delegation to treasury agent',
        status: 'pending',
        details: !tokenAddress ? 'Requires token address' : 'DELEGATION_ROUTER not configured',
      });
    }

    // ── Phase 5: ENS subname registration (last, after all on-chain state exists) ──

    // 6. Check ENS subname availability
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

    // 7. Register ENS subname + set text records (requires ERC-8004 ID)
    if (ensAvailable && erc8004Id !== undefined) {
      // Build text records to set after subname registration
      const textRecords: Record<string, string> = {};
      if (tokenSymbol) {
        textRecords['agent:token:symbol'] = tokenSymbol;
      }
      if (tokenAddress) {
        textRecords['agent:token:address'] = tokenAddress;
      }
      if (treasuryAgentEnsName) {
        textRecords['agent:delegation'] = treasuryAgentEnsName;
      }

      const ensResult = await registerENSSubname(env, agentWallet.privateKey, {
        label: agentName,
        agentId: BigInt(erc8004Id),
        a2aUrl,
        textRecords,
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

    // ── Phase 6: Store agent keys ──

    // 8. Store agent keys in KV (include delegation metadata for DeFi agents)
    // treasuryAgent is only in scope for defi agents (line 320)
    const treasuryAgentForStorage = agentType === 'defi'
      ? await findUserAgentByType(env.TREASURY_KV, userAddress, 'treasury')
      : null;

    await storeAgentKeys(
      env.TREASURY_KV,
      userAddress,
      agentName,
      agentWallet,
      {
        ensName,
        erc8004Id,
        nostrPubkey,
        agentType,
        tokenAddress: tokenAddress || undefined,
        delegatedTo: treasuryAgentForStorage?.address,
        delegatedToEns: treasuryAgentEnsName,
        delegationTxHash,
      }
    );

    // Add to delegation index so the cron can discover this agent
    if (treasuryAgentForStorage?.address) {
      await addDelegationIndex(
        env.TREASURY_KV,
        treasuryAgentForStorage.address,
        userAddress,
        agentName
      );
    }

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
        delegationTxHash,
        tokenAddress: tokenAddress || undefined,
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
 * Request to import an existing agent wallet
 */
export interface ImportAgentRequest {
  /** User's wallet address (deployer) */
  userAddress: Address;
  /** Agent name for identification */
  agentName: string;
  /** Agent's private key (to be stored securely) */
  agentPrivateKey: `0x${string}`;
  /** Token address if already launched */
  tokenAddress?: Address;
  /** ENS name if registered */
  ensName?: string;
  /** ERC-8004 ID if registered */
  erc8004Id?: number;
  /** Nostr public key if available */
  nostrPubkey?: string;
}

/**
 * Handle POST /import-agent - Import an existing agent wallet
 *
 * Use this to register externally-created agent wallets (e.g., from Clawnch direct launch)
 * so the treasury agent can manage fee claiming and distribution.
 */
export async function handleImportAgent(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: ImportAgentRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { userAddress, agentName, agentPrivateKey, tokenAddress, ensName, erc8004Id, nostrPubkey } = body;

  // Validate required fields
  if (!userAddress || !agentName || !agentPrivateKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required fields: userAddress, agentName, agentPrivateKey',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate private key format
  if (!agentPrivateKey.startsWith('0x') || agentPrivateKey.length !== 66) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid private key format. Must be 0x-prefixed 32-byte hex string.',
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
        existingAgent: {
          address: existingAgent.address,
          ensName: existingAgent.ensName,
          tokenAddress: existingAgent.tokenAddress,
        },
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Derive address from private key (using static import)
    const account = privateKeyToAccount(agentPrivateKey);

    // Store the agent
    await storeAgentKeys(
      env.TREASURY_KV,
      userAddress,
      agentName,
      {
        address: account.address,
        privateKey: agentPrivateKey,
      },
      {
        ensName: ensName || `${agentName}.oikonomosapp.eth`,
        erc8004Id,
        nostrPubkey,
        tokenAddress,
      }
    );

    console.log(`[import-agent] Imported agent ${agentName} for user ${userAddress}`);
    console.log(`[import-agent] Agent wallet: ${account.address}`);
    if (tokenAddress) {
      console.log(`[import-agent] Token: ${tokenAddress}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agent imported successfully',
        agent: {
          address: account.address,
          agentName,
          ensName: ensName || `${agentName}.oikonomosapp.eth`,
          erc8004Id,
          nostrPubkey,
          tokenAddress,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[import-agent] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to import agent: ${String(error)}`,
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
            agentType: agent.agentType,
            ensName: agent.ensName,
            erc8004Id: agent.erc8004Id,
            nostrPubkey: agent.nostrPubkey,
            tokenAddress: agent.tokenAddress,
            tokenSymbol: agent.tokenSymbol,
            delegatedTo: agent.delegatedTo,
            delegatedToEns: agent.delegatedToEns,
            delegationTxHash: agent.delegationTxHash,
            feeSplit: agent.feeSplit,
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

/**
 * Fund agent wallet from deployer
 *
 * Transfers ETH from the deployer wallet to the newly created agent wallet
 * so it has gas for on-chain registrations (ERC-8004, ENS).
 */
export async function fundAgentWallet(
  env: Env,
  deployerPrivateKey: `0x${string}`,
  agentAddress: Address,
  amount: string
): Promise<{
  success: boolean;
  txHash?: `0x${string}`;
  amount?: string;
  error?: string;
}> {
  try {
    const deployerAccount = privateKeyToAccount(deployerPrivateKey);
    const chainId = parseInt(env.CHAIN_ID || '11155111');

    // Select chain based on env
    const chain = chainId === 8453 ? base : chainId === 84532 ? baseSepolia : sepolia;
    const rpcUrl = env.RPC_URL || (chainId === 8453
      ? 'https://mainnet.base.org'
      : chainId === 84532
        ? 'https://base-sepolia.drpc.org'
        : 'https://sepolia.drpc.org');

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account: deployerAccount,
      chain,
      transport: http(rpcUrl),
    });

    // Check deployer balance
    const deployerBalance = await publicClient.getBalance({
      address: deployerAccount.address,
    });

    const fundingWei = parseEther(amount);

    if (deployerBalance < fundingWei) {
      return {
        success: false,
        error: `Insufficient deployer balance: ${formatEther(deployerBalance)} ETH, need ${amount} ETH`,
      };
    }

    // Send ETH to agent wallet
    const txHash = await walletClient.sendTransaction({
      to: agentAddress,
      value: fundingWei,
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`[launch] Funded agent ${agentAddress} with ${amount} ETH, tx: ${txHash}`);

    return {
      success: true,
      txHash,
      amount,
    };
  } catch (error) {
    console.error('[launch] Funding failed:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Poll Clawnch API for a newly deployed token by symbol.
 *
 * Clawnch token deployment is async — the Nostr event fires, then the Clawnch bot
 * picks it up and deploys the contract. We poll to discover the token address.
 */
export async function pollClawnchForToken(
  tokenSymbol: string,
  _agentWallet: Address,
  maxRetries = 3,
  delayMs = 15000
): Promise<Address | null> {
  const symbolUpper = tokenSymbol.toUpperCase();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://clawn.ch/api/launches', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(`[launch] Clawnch poll attempt ${attempt + 1} failed: ${response.status}`);
        continue;
      }

      const data = await response.json() as
        | Array<{ contractAddress: string; symbol: string }>
        | { launches: Array<{ contractAddress: string; symbol: string }> };

      const launches = Array.isArray(data) ? data : data.launches || [];

      // Filter by symbol (wallet filter is known broken — see MEMORY.md)
      const match = launches.find(
        (l) => l.symbol?.toUpperCase() === symbolUpper
      );

      if (match?.contractAddress) {
        console.log(`[launch] Found token ${symbolUpper} at ${match.contractAddress}`);
        return match.contractAddress as Address;
      }
    } catch (error) {
      console.warn(`[launch] Clawnch poll attempt ${attempt + 1} error:`, error);
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log(`[launch] Token ${symbolUpper} not found after ${maxRetries} attempts`);
  return null;
}

// ── Launch Portfolio Types ──

export interface LaunchPortfolioRequest {
  userAddress: Address;
  agentName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  imageUrl?: string;
  feeSplit: number;           // 0-100
  platform?: 'moltbook' | '4claw' | 'clawstr' | 'moltx';
  fundingAmount?: string;
}

export interface LaunchPortfolioResponse {
  success: boolean;
  treasuryAgent?: { address: Address; ensName: string; erc8004Id?: number };
  defiAgent?: { address: Address; ensName: string; erc8004Id?: number; tokenAddress?: Address; tokenSymbol: string };
  delegation?: { txHash?: string; feeSplit: number };
  steps: LaunchStep[];
  error?: string;
}

/**
 * Handle POST /launch-portfolio — Full pipeline orchestrator.
 *
 * Deploys a treasury + DeFi agent pair in a single request:
 * Phase 1: Deploy Treasury Agent (wallet, ERC-8004, KV)
 * Phase 2: Deploy DeFi Agent + Token (wallet, ERC-8004, Nostr/Clawnch)
 * Phase 3: Sign Delegation (DeFi → Treasury)
 * Phase 4: Register ENS Names
 * Phase 5: Store DeFi Agent
 */
export async function handleLaunchPortfolio(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: LaunchPortfolioRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate required fields
  const { userAddress, agentName, tokenName, tokenSymbol, tokenDescription, feeSplit } = body;

  if (!userAddress || !agentName || !tokenName || !tokenSymbol || !tokenDescription || feeSplit === undefined) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required fields: userAddress, agentName, tokenName, tokenSymbol, tokenDescription, feeSplit',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate feeSplit
  if (typeof feeSplit !== 'number' || feeSplit < 0 || feeSplit > 100) {
    return new Response(
      JSON.stringify({ success: false, error: 'feeSplit must be a number between 0 and 100' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate agent name
  if (!/^[a-z0-9]+$/.test(agentName)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Agent name must be lowercase alphanumeric only' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const kv = env.TREASURY_KV;
  const treasuryAgentName = `${agentName}treasury`;
  const fundingAmount = body.fundingAmount || DEFAULT_FUNDING_AMOUNT;

  // Pre-checks: ensure neither agent exists
  const existingTreasury = await getStoredAgent(kv, userAddress, treasuryAgentName);
  if (existingTreasury) {
    return new Response(
      JSON.stringify({ success: false, error: `Treasury agent "${treasuryAgentName}" already exists` }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const existingDefi = await getStoredAgent(kv, userAddress, agentName);
  if (existingDefi) {
    return new Response(
      JSON.stringify({ success: false, error: `DeFi agent "${agentName}" already exists` }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check ENS availability for both names
  const [treasuryEnsAvailable, defiEnsAvailable] = await Promise.all([
    isSubnameAvailable(env, treasuryAgentName),
    isSubnameAvailable(env, agentName),
  ]);

  if (!treasuryEnsAvailable) {
    return new Response(
      JSON.stringify({ success: false, error: `ENS subname ${treasuryAgentName}.oikonomosapp.eth is already registered` }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (!defiEnsAvailable) {
    return new Response(
      JSON.stringify({ success: false, error: `ENS subname ${agentName}.oikonomosapp.eth is already registered` }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const steps: LaunchStep[] = [];
  const a2aUrl = 'https://oikonomos-treasury-agent.estmcmxci.workers.dev/.well-known/agent-card.json';

  // Create a public client for Base Sepolia to check pre-funded balances
  const baseSepoliaClient = createPublicClient({
    chain: baseSepolia,
    transport: http(env.RPC_URL || 'https://base-sepolia.drpc.org'),
  });

  // ── Phase 1: Deploy Treasury Agent ──

  let treasuryWallet: ReturnType<typeof generateAgentWallet>;
  let treasuryErc8004Id: number | undefined;
  const treasuryEnsName = `${treasuryAgentName}.oikonomosapp.eth`;

  try {
    // 1a. Generate treasury wallet
    treasuryWallet = generateAgentWallet(userAddress, treasuryAgentName, env.PRIVATE_KEY || 'default-salt');
    steps.push({ step: 'Generate treasury wallet', status: 'completed', details: treasuryWallet.address });

    // 1b. Fund treasury wallet (skip if user pre-funded)
    const treasuryBalance = await baseSepoliaClient.getBalance({ address: treasuryWallet.address });
    if (treasuryBalance >= parseEther(fundingAmount)) {
      steps.push({ step: 'Fund treasury wallet', status: 'completed', details: `Already funded (${formatEther(treasuryBalance)} ETH)` });
    } else if (env.PRIVATE_KEY) {
      const fundResult = await fundAgentWallet(env, env.PRIVATE_KEY as `0x${string}`, treasuryWallet.address, fundingAmount);
      steps.push({
        step: 'Fund treasury wallet',
        status: fundResult.success ? 'completed' : 'failed',
        details: fundResult.success ? `${fundResult.amount} ETH sent` : (fundResult.error || 'Funding failed'),
        txHash: fundResult.txHash,
      });
      // Wait for RPC node propagation before using the funded balance
      if (fundResult.success) await new Promise(r => setTimeout(r, 2000));
    } else {
      steps.push({ step: 'Fund treasury wallet', status: 'pending', details: 'No PRIVATE_KEY — fund manually' });
    }

    // 1c. Register treasury in ERC-8004
    const erc8004Result = await registerAgentERC8004(env, treasuryWallet.privateKey, {
      name: `${tokenName} Treasury`,
      description: tokenDescription,
      ensName: treasuryEnsName,
      a2aUrl,
    });
    if (erc8004Result.success) {
      treasuryErc8004Id = erc8004Result.erc8004Id;
      steps.push({ step: 'Register treasury ERC-8004', status: 'completed', details: `ID: ${treasuryErc8004Id}`, txHash: erc8004Result.txHash });
    } else {
      steps.push({ step: 'Register treasury ERC-8004', status: 'failed', details: erc8004Result.error || 'Registration failed' });
    }

    // 1d. Store treasury agent in KV
    await storeAgentKeys(kv, userAddress, treasuryAgentName, treasuryWallet, {
      agentType: 'treasury',
      ensName: treasuryEnsName,
      erc8004Id: treasuryErc8004Id,
      feeSplit,
    });
    steps.push({ step: 'Store treasury agent', status: 'completed', details: 'Stored in KV' });

    // 1e. Add to global treasury index (so cron discovers it)
    await addTreasuryAgentToGlobalIndex(kv, treasuryWallet.address, userAddress, treasuryAgentName);
    steps.push({ step: 'Register in treasury index', status: 'completed', details: 'Added to treasuryAgents:all' });
  } catch (error) {
    steps.push({ step: 'Deploy treasury agent', status: 'failed', details: String(error) });
    return new Response(
      JSON.stringify({ success: false, error: `Treasury deployment failed: ${error}`, steps }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── Phase 2: Deploy DeFi Agent + Token ──

  let defiWallet: ReturnType<typeof generateAgentWallet>;
  let defiErc8004Id: number | undefined;
  let tokenAddress: Address | null = null;
  const defiEnsName = `${agentName}.oikonomosapp.eth`;

  try {
    // 2a. Generate DeFi wallet
    defiWallet = generateAgentWallet(userAddress, agentName, env.PRIVATE_KEY || 'default-salt');
    steps.push({ step: 'Generate DeFi wallet', status: 'completed', details: defiWallet.address });

    // 2b. Fund DeFi wallet (skip if user pre-funded)
    const defiBalance = await baseSepoliaClient.getBalance({ address: defiWallet.address });
    if (defiBalance >= parseEther(fundingAmount)) {
      steps.push({ step: 'Fund DeFi wallet', status: 'completed', details: `Already funded (${formatEther(defiBalance)} ETH)` });
    } else if (env.PRIVATE_KEY) {
      const fundResult = await fundAgentWallet(env, env.PRIVATE_KEY as `0x${string}`, defiWallet.address, fundingAmount);
      steps.push({
        step: 'Fund DeFi wallet',
        status: fundResult.success ? 'completed' : 'failed',
        details: fundResult.success ? `${fundResult.amount} ETH sent` : (fundResult.error || 'Funding failed'),
        txHash: fundResult.txHash,
      });
      // Wait for RPC node propagation before using the funded balance
      if (fundResult.success) await new Promise(r => setTimeout(r, 2000));
    } else {
      steps.push({ step: 'Fund DeFi wallet', status: 'pending', details: 'No PRIVATE_KEY — fund manually' });
    }

    // 2c. Register DeFi agent in ERC-8004
    const erc8004Result = await registerAgentERC8004(env, defiWallet.privateKey, {
      name: tokenName,
      description: tokenDescription,
      ensName: defiEnsName,
      a2aUrl,
      imageUrl: body.imageUrl,
    });
    if (erc8004Result.success) {
      defiErc8004Id = erc8004Result.erc8004Id;
      steps.push({ step: 'Register DeFi ERC-8004', status: 'completed', details: `ID: ${defiErc8004Id}`, txHash: erc8004Result.txHash });
    } else {
      steps.push({ step: 'Register DeFi ERC-8004', status: 'failed', details: erc8004Result.error || 'Registration failed' });
    }

    // 2d. Nostr profile + !clawnch
    const nostrKeys = deriveNostrKeys(defiWallet.privateKey, agentName);
    const nostrResult = await launchAgentOnNostr(nostrKeys.privateKey, {
      tokenName,
      tokenSymbol,
      description: tokenDescription,
      imageUrl: body.imageUrl,
      platform: body.platform || 'clawstr',
      agentWallet: defiWallet.address,
      ensName: defiEnsName,
    });
    if (nostrResult.success) {
      steps.push({ step: 'Post Nostr !clawnch', status: 'completed', details: `Event: ${nostrResult.clawnchEventId?.slice(0, 16)}...` });
    } else {
      steps.push({ step: 'Post Nostr !clawnch', status: 'failed', details: nostrResult.error || 'Nostr launch failed' });
    }

    // 2e. Poll for token address (single quick check — cron handles late discovery)
    tokenAddress = await pollClawnchForToken(tokenSymbol, defiWallet.address, 1, 0);
    if (tokenAddress) {
      steps.push({ step: 'Discover token address', status: 'completed', details: tokenAddress });
    } else {
      steps.push({ step: 'Discover token address', status: 'pending', details: 'Token not yet deployed — will be set later' });
    }
  } catch (error) {
    steps.push({ step: 'Deploy DeFi agent', status: 'failed', details: String(error) });
    // Continue — treasury is already deployed, return partial result
  }

  // ── Phase 3: Sign Delegation ──

  let delegationTxHash: string | undefined;

  if (tokenAddress && env.DELEGATION_ROUTER) {
    try {
      const delegationResult = await signAndSubmitDelegation(env, {
        agentPrivateKey: defiWallet!.privateKey,
        agentAddress: defiWallet!.address,
        providerAddress: treasuryWallet.address,
        tokens: [tokenAddress],
        providerFeeBps: Math.min(10000 - feeSplit * 100, 1000),
      });

      if (delegationResult.success) {
        delegationTxHash = delegationResult.txHash;
        steps.push({ step: 'Sign delegation', status: 'completed', details: `Fee: ${feeSplit}%`, txHash: delegationResult.txHash });
      } else {
        steps.push({ step: 'Sign delegation', status: 'failed', details: delegationResult.error || 'Delegation failed' });
      }
    } catch (error) {
      steps.push({ step: 'Sign delegation', status: 'failed', details: String(error) });
    }
  } else {
    steps.push({
      step: 'Sign delegation',
      status: 'pending',
      details: !tokenAddress ? 'Requires token address' : 'DELEGATION_ROUTER not configured',
    });
  }

  // Always add to delegation index so the cron can discover this agent
  // (even if token isn't deployed yet — cron will do late discovery)
  await addDelegationIndex(kv, treasuryWallet.address, userAddress, agentName);

  // ── Phase 4: Register ENS Names ──

  // Treasury ENS
  if (treasuryErc8004Id !== undefined) {
    try {
      const ensResult = await registerENSSubname(env, treasuryWallet.privateKey, {
        label: treasuryAgentName,
        agentId: BigInt(treasuryErc8004Id),
        a2aUrl,
      });
      steps.push({
        step: 'Register treasury ENS',
        status: ensResult.success ? 'completed' : 'failed',
        details: ensResult.success ? ensResult.ensName : (ensResult.error || 'ENS failed'),
        txHash: ensResult.txHash,
      });
    } catch (error) {
      steps.push({ step: 'Register treasury ENS', status: 'failed', details: String(error) });
    }
  } else {
    steps.push({ step: 'Register treasury ENS', status: 'pending', details: 'Requires ERC-8004 ID' });
  }

  // DeFi ENS — deferred to a separate /register-ens call to stay under the 50-subrequest limit
  if (defiErc8004Id !== undefined) {
    steps.push({ step: 'Register DeFi ENS', status: 'deferred', details: 'Call POST /register-ens to complete' });
  } else {
    steps.push({ step: 'Register DeFi ENS', status: 'pending', details: 'Requires ERC-8004 ID' });
  }

  // ── Phase 5: Store DeFi Agent ──

  try {
    const nostrKeys = deriveNostrKeys(defiWallet!.privateKey, agentName);
    let nostrPubkey = nostrKeys.publicKey;
    try {
      nostrPubkey = getNostrPublicKey(nostrKeys.privateKey);
    } catch {
      // Keep derived key
    }

    await storeAgentKeys(kv, userAddress, agentName, defiWallet!, {
      agentType: 'defi',
      ensName: defiEnsName,
      erc8004Id: defiErc8004Id,
      nostrPubkey,
      tokenAddress: tokenAddress || undefined,
      tokenSymbol,
      delegatedTo: treasuryWallet.address,
      delegatedToEns: treasuryEnsName,
      delegationTxHash,
      feeSplit,
    });
    steps.push({ step: 'Store DeFi agent', status: 'completed', details: 'Stored in KV' });
  } catch (error) {
    steps.push({ step: 'Store DeFi agent', status: 'failed', details: String(error) });
  }

  // ── Build Response ──

  const failedSteps = steps.filter(s => s.status === 'failed');

  const response: LaunchPortfolioResponse = {
    success: failedSteps.length === 0,
    treasuryAgent: {
      address: treasuryWallet.address,
      ensName: treasuryEnsName,
      erc8004Id: treasuryErc8004Id,
    },
    defiAgent: defiWallet! ? {
      address: defiWallet!.address,
      ensName: defiEnsName,
      erc8004Id: defiErc8004Id,
      tokenAddress: tokenAddress || undefined,
      tokenSymbol,
    } : undefined,
    delegation: {
      txHash: delegationTxHash,
      feeSplit,
    },
    steps,
  };

  if (failedSteps.length > 0) {
    response.error = `${failedSteps.length} step(s) failed: ${failedSteps.map(s => s.step).join(', ')}`;
  }

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// POST /generate-wallets — Derive wallet addresses for a new agent pair
// No on-chain writes, no KV writes. Fast and idempotent.
// ════════════════════════════════════════════════════════════════════════════

export interface GenerateWalletsRequest {
  userAddress: Address;
  agentName: string;
}

export interface GenerateWalletsResponse {
  success: boolean;
  treasuryWallet?: { address: Address; name: string };
  defiWallet?: { address: Address; name: string };
  requiredFunding?: {
    chainId: number;
    chainName: string;
    amountPerWallet: string;
    totalRequired: string;
  };
  ensAvailability?: { treasuryAvailable: boolean; defiAvailable: boolean };
  error?: string;
}

export async function handleGenerateWallets(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: GenerateWalletsRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { userAddress, agentName } = body;

  if (!userAddress || !agentName) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: userAddress, agentName' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate agent name
  if (!/^[a-z0-9]+$/.test(agentName)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Agent name must be lowercase alphanumeric only' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const treasuryAgentName = `${agentName}treasury`;

  // Check if agents already exist
  const [existingTreasury, existingDefi] = await Promise.all([
    getStoredAgent(env.TREASURY_KV, userAddress, treasuryAgentName),
    getStoredAgent(env.TREASURY_KV, userAddress, agentName),
  ]);

  if (existingTreasury || existingDefi) {
    return new Response(
      JSON.stringify({
        success: false,
        error: existingTreasury
          ? `Treasury agent "${treasuryAgentName}" already exists`
          : `DeFi agent "${agentName}" already exists`,
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Derive wallets (deterministic, no on-chain writes)
  const treasuryWallet = generateAgentWallet(userAddress, treasuryAgentName, env.PRIVATE_KEY || 'default-salt');
  const defiWallet = generateAgentWallet(userAddress, agentName, env.PRIVATE_KEY || 'default-salt');

  // Check ENS availability
  const [treasuryEnsAvailable, defiEnsAvailable] = await Promise.all([
    isSubnameAvailable(env, treasuryAgentName),
    isSubnameAvailable(env, agentName),
  ]);

  const response: GenerateWalletsResponse = {
    success: true,
    treasuryWallet: { address: treasuryWallet.address, name: treasuryAgentName },
    defiWallet: { address: defiWallet.address, name: agentName },
    requiredFunding: {
      chainId: 84532,
      chainName: 'Base Sepolia',
      amountPerWallet: '0.01',
      totalRequired: '0.02',
    },
    ensAvailability: {
      treasuryAvailable: treasuryEnsAvailable,
      defiAvailable: defiEnsAvailable,
    },
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// POST /poll-token — Discover a Clawnch-deployed token and update KV
// Called by the frontend between deploy and ENS registration.
// ════════════════════════════════════════════════════════════════════════════

export interface PollTokenRequest {
  userAddress: Address;
  agentName: string;
  tokenSymbol: string;
}

export interface PollTokenResponse {
  success: boolean;
  found: boolean;
  tokenAddress?: Address;
  tokenSymbol?: string;
  clankerUrl?: string;
  dexScreenerUrl?: string;
  error?: string;
}

export async function handlePollToken(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: PollTokenRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, found: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { userAddress, agentName, tokenSymbol } = body;

  if (!userAddress || !agentName || !tokenSymbol) {
    return new Response(
      JSON.stringify({ success: false, found: false, error: 'Missing required fields: userAddress, agentName, tokenSymbol' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if token is already stored in KV
  const agent = await getStoredAgent(env.TREASURY_KV, userAddress, agentName);
  if (agent?.tokenAddress) {
    return new Response(JSON.stringify({
      success: true,
      found: true,
      tokenAddress: agent.tokenAddress,
      tokenSymbol: agent.tokenSymbol || tokenSymbol,
      clankerUrl: `https://clanker.world/clanker/${agent.tokenAddress}`,
      dexScreenerUrl: `https://dexscreener.com/base/${agent.tokenAddress}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Single poll attempt (frontend handles retry timing)
  const tokenAddress = await pollClawnchForToken(tokenSymbol, (agent?.address || '0x0') as Address, 1, 0);

  if (!tokenAddress) {
    return new Response(JSON.stringify({
      success: true,
      found: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Update KV with discovered token address
  if (agent) {
    await updateStoredAgent(env.TREASURY_KV, userAddress, agentName, {
      tokenAddress,
      tokenSymbol,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    found: true,
    tokenAddress,
    tokenSymbol,
    clankerUrl: `https://clanker.world/clanker/${tokenAddress}`,
    dexScreenerUrl: `https://dexscreener.com/base/${tokenAddress}`,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// POST /register-ens — Register ENS subname for an existing stored agent
// Used as a follow-up to launch-portfolio (DeFi ENS deferred to avoid 50-subrequest limit)
// ════════════════════════════════════════════════════════════════════════════

export async function handleRegisterENS(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const body = await request.json() as {
    userAddress?: string;
    agentName?: string;
    // Optional: frontend can pass discovered token data directly
    // (avoids KV eventual-consistency stale reads)
    tokenAddress?: string;
    tokenSymbol?: string;
  };

  if (!body.userAddress || !body.agentName) {
    return new Response(JSON.stringify({ success: false, error: 'Missing userAddress or agentName' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userAddress = body.userAddress as Address;
  const agentName = body.agentName;

  // Look up the stored agent
  const agent = await getStoredAgent(env.TREASURY_KV, userAddress, agentName);
  if (!agent) {
    return new Response(JSON.stringify({ success: false, error: `Agent "${agentName}" not found for ${userAddress}` }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!agent.erc8004Id) {
    return new Response(JSON.stringify({ success: false, error: 'Agent has no ERC-8004 ID' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const a2aUrl = 'https://oikonomos-treasury-agent.estmcmxci.workers.dev/.well-known/agent-card.json';
  const label = agentName;

  // Use frontend-provided token data (fresh) over KV data (may be stale due to eventual consistency)
  const tokenSymbol = body.tokenSymbol || agent.tokenSymbol;
  const tokenAddress = body.tokenAddress || agent.tokenAddress;

  // Build text records
  const textRecords: Record<string, string> = {};
  if (tokenSymbol) {
    textRecords['agent:token:symbol'] = tokenSymbol;
  }
  if (tokenAddress) {
    textRecords['agent:token:address'] = tokenAddress;
    textRecords['agent:token:clanker'] = `https://clanker.world/clanker/${tokenAddress}`;
  }
  if (agent.delegatedToEns) {
    textRecords['agent:delegation'] = agent.delegatedToEns;
  }

  try {
    const ensResult = await registerENSSubname(env, agent.encryptedKey as `0x${string}`, {
      label,
      agentId: BigInt(agent.erc8004Id),
      a2aUrl,
      textRecords,
    });

    return new Response(JSON.stringify({
      success: ensResult.success,
      ensName: ensResult.ensName,
      txHash: ensResult.txHash,
      error: ensResult.error,
      textRecordResults: ensResult.textRecordResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
