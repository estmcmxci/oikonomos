import type { Address } from 'viem'

const TREASURY_AGENT_URL =
  process.env.NEXT_PUBLIC_TREASURY_AGENT_URL ||
  'https://oikonomos-treasury-agent.estmcmxci.workers.dev'

// ── Generate Wallets Types ──────────────────────────────────────────

export interface GenerateWalletsRequest {
  userAddress: Address
  agentName: string
}

export interface GenerateWalletsResponse {
  success: boolean
  treasuryWallet?: { address: Address; name: string }
  defiWallet?: { address: Address; name: string }
  requiredFunding?: {
    chainId: number
    chainName: string
    amountPerWallet: string
    totalRequired: string
  }
  ensAvailability?: { treasuryAvailable: boolean; defiAvailable: boolean }
  error?: string
}

// ── Types (mirror agents/treasury-agent/src/launch/handler.ts) ──────

export interface LaunchPortfolioRequest {
  userAddress: Address
  agentName: string
  tokenName: string
  tokenSymbol: string
  tokenDescription: string
  feeSplit: number
  platform?: 'moltbook' | '4claw' | 'clawstr' | 'moltx'
  imageUrl?: string
}

export interface LaunchStep {
  step: string
  status: 'completed' | 'failed' | 'pending' | 'deferred'
  details?: string
  txHash?: string
}

export interface LaunchPortfolioResponse {
  success: boolean
  treasuryAgent?: {
    address: Address
    ensName: string
    erc8004Id?: number
  }
  defiAgent?: {
    address: Address
    ensName: string
    erc8004Id?: number
    tokenAddress?: Address
    tokenSymbol: string
  }
  delegation?: {
    txHash?: string
    feeSplit: number
  }
  steps: LaunchStep[]
  error?: string
}

export interface RegisterENSResponse {
  success: boolean
  ensName?: string
  txHash?: string
  error?: string
}

// ── API calls ───────────────────────────────────────────────────────

export async function launchPortfolio(
  req: LaunchPortfolioRequest,
): Promise<LaunchPortfolioResponse> {
  const res = await fetch(`${TREASURY_AGENT_URL}/launch-portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Launch failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function generateWallets(
  req: GenerateWalletsRequest,
): Promise<GenerateWalletsResponse> {
  const res = await fetch(`${TREASURY_AGENT_URL}/generate-wallets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Generate wallets failed (${res.status}): ${text}`)
  }
  return res.json()
}

// ── Poll Token Types ────────────────────────────────────────────────

export interface PollTokenResponse {
  success: boolean
  found: boolean
  tokenAddress?: Address
  tokenSymbol?: string
  clankerUrl?: string
  dexScreenerUrl?: string
  error?: string
}

export async function pollToken(
  userAddress: Address,
  agentName: string,
  tokenSymbol: string,
): Promise<PollTokenResponse> {
  const res = await fetch(`${TREASURY_AGENT_URL}/poll-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress, agentName, tokenSymbol }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Poll token failed (${res.status}): ${text}`)
  }
  return res.json()
}

// ── List Agents Types ─────────────────────────────────────────────

export interface AgentInfo {
  address: Address
  agentName: string
  agentType?: 'treasury' | 'defi'
  ensName: string
  erc8004Id?: number
  nostrPubkey?: string
  tokenAddress?: Address
  tokenSymbol?: string
  delegatedTo?: Address
  delegatedToEns?: string
  delegationTxHash?: string
  feeSplit?: number
  createdAt: number
}

export interface ListAgentsResponse {
  success: boolean
  agents: AgentInfo[]
  count: number
}

export async function listAgents(
  userAddress: Address,
): Promise<ListAgentsResponse> {
  const res = await fetch(
    `${TREASURY_AGENT_URL}/agents?userAddress=${encodeURIComponent(userAddress)}`,
  )
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`List agents failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function registerENS(
  userAddress: Address,
  agentName: string,
  tokenData?: { tokenAddress: string; tokenSymbol: string },
): Promise<RegisterENSResponse> {
  const res = await fetch(`${TREASURY_AGENT_URL}/register-ens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress,
      agentName,
      ...(tokenData && { tokenAddress: tokenData.tokenAddress, tokenSymbol: tokenData.tokenSymbol }),
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`ENS registration failed (${res.status}): ${text}`)
  }
  return res.json()
}

// ── Fee Status Types ────────────────────────────────────────────────

export interface DistributionSchedule {
  type: 'weekly' | 'biweekly' | 'monthly' | 'custom'
  customDays?: number
}

export interface ClaimHistoryEntry {
  agentName: string
  tokenAddress: string
  wethClaimed: string
  deployerAmount: string
  serviceFee: string
  claimTxHash?: string
  distributionTxHash?: string
  timestamp: number
  mode: 'auto' | 'manual'
}

export interface AgentFeeInfo {
  agentName: string
  agentType: string
  agentAddress: Address
  tokenSymbol?: string
  tokenAddress?: Address
  claimableWeth: string
  walletWethBalance: string
  distributionMode: 'auto' | 'manual'
  distributionSchedule?: DistributionSchedule
  feeSplit: number
  lastDistributionTime?: number
  nextDistributionTime?: number
}

export interface FeeStatusResponse {
  agents: AgentFeeInfo[]
  totalClaimableWeth: string
  totalWalletWeth: string
  totalDistributed: string
  recentClaims: ClaimHistoryEntry[]
  depositAddress?: Address
  depositChainId: number
}

export interface UpdateDistributionResponse {
  success: boolean
  updatedAgents: number
  distributionMode: 'auto' | 'manual'
  distributionSchedule?: DistributionSchedule
  error?: string
}

export interface ClaimFeesResponse {
  success: boolean
  claim?: {
    totalWethClaimed: string
    totalTokensClaimed: number
  }
  error?: string
}

export interface WithdrawResponse {
  txHash?: string
  amount: string
  success: boolean
  error?: string
}

// ── Fee API Calls ───────────────────────────────────────────────────

export async function getFeeStatus(
  userAddress: Address,
): Promise<FeeStatusResponse> {
  const res = await fetch(
    `${TREASURY_AGENT_URL}/fee-status?userAddress=${encodeURIComponent(userAddress)}`,
  )
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Fee status failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function updateDistribution(
  userAddress: Address,
  mode: 'auto' | 'manual',
  schedule?: DistributionSchedule,
): Promise<UpdateDistributionResponse> {
  const res = await fetch(`${TREASURY_AGENT_URL}/update-distribution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress,
      distributionMode: mode,
      ...(schedule && { distributionSchedule: schedule }),
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Update distribution failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function claimFees(
  userAddress: Address,
): Promise<ClaimFeesResponse> {
  const res = await fetch(`${TREASURY_AGENT_URL}/claim-fees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Claim fees failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function withdrawFees(
  userAddress: Address,
  amount?: string,
  type: 'eth' | 'weth' = 'weth',
  agentName?: string,
): Promise<WithdrawResponse> {
  const res = await fetch(`${TREASURY_AGENT_URL}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress, type, ...(amount && { amount }), ...(agentName && { agentName }) }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Withdraw failed (${res.status}): ${text}`)
  }
  return res.json()
}
