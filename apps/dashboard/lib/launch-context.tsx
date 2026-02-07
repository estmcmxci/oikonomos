'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import {
  generateWallets,
  launchPortfolio,
  pollToken,
  registerENS,
  type GenerateWalletsResponse,
  type LaunchPortfolioRequest,
  type LaunchPortfolioResponse,
  type PollTokenResponse,
  type RegisterENSResponse,
} from './api'

// ── State ───────────────────────────────────────────────────────────

export type Stage = 'form' | 'funding' | 'launching' | 'discovering' | 'ens' | 'result'

export type FundingWalletStatus = 'pending' | 'sending' | 'confirming' | 'funded' | 'error'

export interface WalletInfo {
  treasuryWallet: { address: Address; name: string }
  defiWallet: { address: Address; name: string }
  requiredFunding: {
    chainId: number
    chainName: string
    amountPerWallet: string
    totalRequired: string
  }
}

export interface TokenInfo {
  tokenAddress: Address
  tokenSymbol: string
  clankerUrl: string
  dexScreenerUrl: string
}

export interface FormData {
  agentName: string
  tokenName: string
  tokenSymbol: string
  tokenDescription: string
  platform: 'moltbook' | '4claw' | 'clawstr' | 'moltx'
  feeSplit: number
}

interface LaunchState {
  // Wallet (synced from wagmi)
  deployerAddress: Address | null
  chainId: number | null
  isWalletConnected: boolean

  // Flow
  stage: Stage
  formData: FormData | null

  // Funding stage
  walletInfo: WalletInfo | null
  isGeneratingWallets: boolean
  generateWalletsError: string | null
  fundingStatus: {
    treasury: FundingWalletStatus
    defi: FundingWalletStatus
  }

  // Launch stage
  portfolioResult: LaunchPortfolioResponse | null
  isLaunching: boolean
  launchError: string | null

  // Token discovery stage
  tokenInfo: TokenInfo | null
  isDiscoveringToken: boolean
  tokenPollAttempt: number
  hasDeferredENS: boolean

  // ENS stage
  ensResult: RegisterENSResponse | null
  isRegisteringENS: boolean
  ensError: string | null
}

const initialState: LaunchState = {
  deployerAddress: null,
  chainId: null,
  isWalletConnected: false,
  stage: 'form',
  formData: null,
  walletInfo: null,
  isGeneratingWallets: false,
  generateWalletsError: null,
  fundingStatus: { treasury: 'pending', defi: 'pending' },
  portfolioResult: null,
  isLaunching: false,
  launchError: null,
  tokenInfo: null,
  isDiscoveringToken: false,
  tokenPollAttempt: 0,
  hasDeferredENS: false,
  ensResult: null,
  isRegisteringENS: false,
  ensError: null,
}

// ── Actions ─────────────────────────────────────────────────────────

type LaunchAction =
  | { type: 'WALLET_CONNECTED'; address: Address; chainId: number }
  | { type: 'WALLET_DISCONNECTED' }
  | { type: 'CHAIN_CHANGED'; chainId: number }
  | { type: 'SET_FORM_DATA'; formData: FormData }
  | { type: 'GENERATE_WALLETS_START' }
  | { type: 'GENERATE_WALLETS_SUCCESS'; walletInfo: WalletInfo }
  | { type: 'GENERATE_WALLETS_ERROR'; error: string }
  | { type: 'FUNDING_UPDATE'; wallet: 'treasury' | 'defi'; status: FundingWalletStatus }
  | { type: 'LAUNCH_START' }
  | { type: 'LAUNCH_SUCCESS'; result: LaunchPortfolioResponse }
  | { type: 'LAUNCH_ERROR'; error: string }
  | { type: 'DISCOVER_TOKEN_START' }
  | { type: 'DISCOVER_TOKEN_POLL'; attempt: number }
  | { type: 'DISCOVER_TOKEN_SUCCESS'; tokenInfo: TokenInfo }
  | { type: 'DISCOVER_TOKEN_TIMEOUT' }
  | { type: 'SET_DEFERRED_ENS' }
  | { type: 'ENS_START' }
  | { type: 'ENS_SUCCESS'; result: RegisterENSResponse }
  | { type: 'ENS_ERROR'; error: string }
  | { type: 'RESET' }

function launchReducer(state: LaunchState, action: LaunchAction): LaunchState {
  switch (action.type) {
    case 'WALLET_CONNECTED':
      return {
        ...state,
        deployerAddress: action.address,
        chainId: action.chainId,
        isWalletConnected: true,
      }
    case 'WALLET_DISCONNECTED':
      return {
        ...state,
        deployerAddress: null,
        chainId: null,
        isWalletConnected: false,
      }
    case 'CHAIN_CHANGED':
      return { ...state, chainId: action.chainId }
    case 'SET_FORM_DATA':
      return { ...state, formData: action.formData }
    case 'GENERATE_WALLETS_START':
      return { ...state, isGeneratingWallets: true, generateWalletsError: null }
    case 'GENERATE_WALLETS_SUCCESS':
      return {
        ...state,
        isGeneratingWallets: false,
        walletInfo: action.walletInfo,
        stage: 'funding',
        fundingStatus: { treasury: 'pending', defi: 'pending' },
      }
    case 'GENERATE_WALLETS_ERROR':
      return { ...state, isGeneratingWallets: false, generateWalletsError: action.error, stage: 'form' }
    case 'FUNDING_UPDATE':
      return {
        ...state,
        fundingStatus: { ...state.fundingStatus, [action.wallet]: action.status },
      }
    case 'LAUNCH_START':
      return { ...state, stage: 'launching', isLaunching: true, launchError: null }
    case 'LAUNCH_SUCCESS':
      return { ...state, isLaunching: false, portfolioResult: action.result }
    case 'LAUNCH_ERROR':
      return { ...state, isLaunching: false, launchError: action.error }
    case 'DISCOVER_TOKEN_START':
      return { ...state, stage: 'discovering', isDiscoveringToken: true, tokenPollAttempt: 0 }
    case 'DISCOVER_TOKEN_POLL':
      return { ...state, tokenPollAttempt: action.attempt }
    case 'DISCOVER_TOKEN_SUCCESS': {
      // Also patch the portfolioResult so the result page shows token details
      const updatedResult = state.portfolioResult ? {
        ...state.portfolioResult,
        defiAgent: state.portfolioResult.defiAgent ? {
          ...state.portfolioResult.defiAgent,
          tokenAddress: action.tokenInfo.tokenAddress,
        } : state.portfolioResult.defiAgent,
      } : state.portfolioResult
      return {
        ...state,
        isDiscoveringToken: false,
        tokenInfo: action.tokenInfo,
        portfolioResult: updatedResult,
      }
    }
    case 'DISCOVER_TOKEN_TIMEOUT':
      return { ...state, isDiscoveringToken: false }
    case 'SET_DEFERRED_ENS':
      return { ...state, hasDeferredENS: true }
    case 'ENS_START':
      return { ...state, stage: 'ens', isRegisteringENS: true, ensError: null }
    case 'ENS_SUCCESS':
      return { ...state, isRegisteringENS: false, ensResult: action.result, stage: 'result' }
    case 'ENS_ERROR':
      return { ...state, isRegisteringENS: false, ensError: action.error, stage: 'result' }
    case 'RESET':
      return {
        ...initialState,
        deployerAddress: state.deployerAddress,
        chainId: state.chainId,
        isWalletConnected: state.isWalletConnected,
      }
    default:
      return state
  }
}

// ── Context ─────────────────────────────────────────────────────────

interface LaunchContextValue {
  state: LaunchState
  dispatch: React.Dispatch<LaunchAction>
  startLaunch: (formData: FormData) => Promise<void>
  confirmLaunch: () => Promise<void>
  startTokenDiscovery: () => Promise<void>
  registerDeFiENS: () => Promise<void>
  deployerAddress: Address | null
  chainId: number | null
  isWalletConnected: boolean
}

const LaunchContext = createContext<LaunchContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────────────

const TOKEN_POLL_INTERVAL = 10000 // 10s between polls
const TOKEN_POLL_MAX_ATTEMPTS = 18 // 3 minutes max

export function LaunchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(launchReducer, initialState)
  const { address, isConnected, chainId } = useAccount()

  // Sync wallet state from wagmi
  useEffect(() => {
    if (isConnected && address && chainId) {
      dispatch({
        type: 'WALLET_CONNECTED',
        address,
        chainId,
      })
    } else {
      dispatch({ type: 'WALLET_DISCONNECTED' })
    }
  }, [isConnected, address, chainId])

  // Phase 1: Generate wallets and transition to funding step
  const startLaunch = useCallback(
    async (formData: FormData) => {
      if (!state.deployerAddress) return

      dispatch({ type: 'SET_FORM_DATA', formData })
      dispatch({ type: 'GENERATE_WALLETS_START' })

      try {
        const result: GenerateWalletsResponse = await generateWallets({
          userAddress: state.deployerAddress,
          agentName: formData.agentName,
        })

        if (!result.success || !result.treasuryWallet || !result.defiWallet || !result.requiredFunding) {
          dispatch({ type: 'GENERATE_WALLETS_ERROR', error: result.error || 'Failed to generate wallets' })
          return
        }

        dispatch({
          type: 'GENERATE_WALLETS_SUCCESS',
          walletInfo: {
            treasuryWallet: result.treasuryWallet,
            defiWallet: result.defiWallet,
            requiredFunding: result.requiredFunding,
          },
        })
      } catch (err) {
        dispatch({
          type: 'GENERATE_WALLETS_ERROR',
          error: err instanceof Error ? err.message : 'Failed to generate wallets',
        })
      }
    },
    [state.deployerAddress],
  )

  // Phase 2: Called when both wallets are funded — deploy only, user reviews results
  const confirmLaunch = useCallback(
    async () => {
      if (!state.deployerAddress || !state.formData) return

      dispatch({ type: 'LAUNCH_START' })

      const formData = state.formData
      const deployerAddress = state.deployerAddress

      try {
        const req: LaunchPortfolioRequest = {
          userAddress: deployerAddress,
          agentName: formData.agentName,
          tokenName: formData.tokenName,
          tokenSymbol: formData.tokenSymbol,
          tokenDescription: formData.tokenDescription,
          feeSplit: formData.feeSplit,
          platform: formData.platform,
        }

        const result = await launchPortfolio(req)
        dispatch({ type: 'LAUNCH_SUCCESS', result })

        // Check if ENS is deferred so UI knows to show the register button later
        const deferredENS = result.steps?.some(
          (s) => s.status === 'deferred' && s.step.toLowerCase().includes('ens'),
        )
        if (deferredENS) {
          dispatch({ type: 'SET_DEFERRED_ENS' })
        }
      } catch (err) {
        dispatch({
          type: 'LAUNCH_ERROR',
          error: err instanceof Error ? err.message : 'Launch failed',
        })
      }
    },
    [state.deployerAddress, state.formData],
  )

  // Phase 2b: User-initiated — poll for token after reviewing deploy results
  const startTokenDiscovery = useCallback(
    async () => {
      if (!state.deployerAddress || !state.formData) return

      const formData = state.formData
      const deployerAddress = state.deployerAddress

      // If token was already found during deploy, skip discovery
      if (state.portfolioResult?.defiAgent?.tokenAddress) {
        if (!state.hasDeferredENS) {
          dispatch({ type: 'ENS_SUCCESS', result: { success: true } })
        } else {
          // Go to discovering stage so user can see token + register ENS
          dispatch({ type: 'DISCOVER_TOKEN_START' })
          dispatch({
            type: 'DISCOVER_TOKEN_SUCCESS',
            tokenInfo: {
              tokenAddress: state.portfolioResult.defiAgent.tokenAddress,
              tokenSymbol: state.portfolioResult.defiAgent.tokenSymbol || formData.tokenSymbol,
              clankerUrl: `https://clanker.world/clanker/${state.portfolioResult.defiAgent.tokenAddress}`,
              dexScreenerUrl: `https://dexscreener.com/base/${state.portfolioResult.defiAgent.tokenAddress}`,
            },
          })
        }
        return
      }

      dispatch({ type: 'DISCOVER_TOKEN_START' })

      let tokenFound: PollTokenResponse | null = null

      for (let attempt = 1; attempt <= TOKEN_POLL_MAX_ATTEMPTS; attempt++) {
        dispatch({ type: 'DISCOVER_TOKEN_POLL', attempt })

        try {
          const pollResult = await pollToken(deployerAddress, formData.agentName, formData.tokenSymbol)
          if (pollResult.found && pollResult.tokenAddress) {
            tokenFound = pollResult
            dispatch({
              type: 'DISCOVER_TOKEN_SUCCESS',
              tokenInfo: {
                tokenAddress: pollResult.tokenAddress,
                tokenSymbol: pollResult.tokenSymbol || formData.tokenSymbol,
                clankerUrl: pollResult.clankerUrl || '',
                dexScreenerUrl: pollResult.dexScreenerUrl || '',
              },
            })
            break
          }
        } catch {
          // Ignore individual poll errors
        }

        // Wait before next attempt
        if (attempt < TOKEN_POLL_MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, TOKEN_POLL_INTERVAL))
        }
      }

      if (!tokenFound) {
        dispatch({ type: 'DISCOVER_TOKEN_TIMEOUT' })
      }

      // If no deferred ENS, go straight to result after discovery
      if (!state.hasDeferredENS) {
        await new Promise((r) => setTimeout(r, 1500))
        dispatch({ type: 'ENS_SUCCESS', result: { success: true } })
      }
      // Otherwise stay on discovering — user will click "Register ENS Records"
    },
    [state.deployerAddress, state.formData, state.portfolioResult, state.hasDeferredENS],
  )

  // Phase 3: User-initiated — register DeFi ENS with discovered token records
  const registerDeFiENS = useCallback(
    async () => {
      if (!state.deployerAddress || !state.formData) return

      dispatch({ type: 'ENS_START' })
      try {
        // Pass token data directly to avoid KV eventual-consistency stale reads
        const tokenData = state.tokenInfo
          ? { tokenAddress: state.tokenInfo.tokenAddress, tokenSymbol: state.tokenInfo.tokenSymbol }
          : undefined
        const ensResult = await registerENS(state.deployerAddress, state.formData.agentName, tokenData)
        dispatch({ type: 'ENS_SUCCESS', result: ensResult })
      } catch (err) {
        dispatch({
          type: 'ENS_ERROR',
          error: err instanceof Error ? err.message : 'ENS registration failed',
        })
      }
    },
    [state.deployerAddress, state.formData, state.tokenInfo],
  )

  return (
    <LaunchContext.Provider
      value={{
        state,
        dispatch,
        startLaunch,
        confirmLaunch,
        startTokenDiscovery,
        registerDeFiENS,
        deployerAddress: state.deployerAddress,
        chainId: state.chainId,
        isWalletConnected: state.isWalletConnected,
      }}
    >
      {children}
    </LaunchContext.Provider>
  )
}

// ── Hook ────────────────────────────────────────────────────────────

export function useLaunch() {
  const ctx = useContext(LaunchContext)
  if (!ctx) {
    throw new Error('useLaunch must be used within a <LaunchProvider>')
  }
  return ctx
}
