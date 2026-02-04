# OIK-56: Next.js Migration Implementation Plan

## Overview

Migrate the HTML prototypes in `apps/dashboard/` to a production Next.js application with real backend integration.

**Reference Files:**
- `prompts/frontend-aesthetics.md` - Design system prompt
- `prompts/design-system-reference.md` - CSS tokens and component patterns

---

## Phase 1: Project Setup & Design System

### 1.1 Initialize Next.js App Structure

```
apps/dashboard/
├── app/
│   ├── layout.tsx           # Root layout with fonts, metadata
│   ├── page.tsx             # Landing page (/)
│   ├── globals.css          # Design tokens, base styles
│   ├── analyze/page.tsx
│   ├── discover/page.tsx
│   ├── configure/[id]/page.tsx
│   ├── authorize/page.tsx
│   ├── dashboard/page.tsx
│   ├── provider/
│   │   ├── page.tsx         # Provider guide
│   │   ├── register/page.tsx
│   │   ├── ens/page.tsx
│   │   └── dashboard/page.tsx
├── components/
│   ├── ui/                  # Base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── IconBox.tsx
│   │   └── Modal.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── BackgroundLayers.tsx
│   ├── Logo.tsx
│   └── WalletButton.tsx
├── lib/
│   ├── wagmi.ts             # Wallet config
│   ├── indexer.ts           # API client
│   └── contracts.ts         # Contract ABIs & addresses
└── hooks/
    ├── useAgents.ts
    ├── useSubnames.ts
    └── useReceipts.ts
```

### 1.2 Extract Design Tokens to Tailwind

Create `tailwind.config.ts` with design tokens from `design-system-reference.md`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0a0a0b',
        'bg-elevated': '#111114',
        'bg-card': 'rgba(17, 17, 20, 0.7)',
        'border-subtle': 'rgba(82, 152, 255, 0.15)',
        'border-accent': 'rgba(82, 152, 255, 0.4)',
        'accent-blue': '#5298FF',
        'accent-cyan': '#00D4AA',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
}
```

### 1.3 Setup Next.js Fonts

```typescript
// app/layout.tsx
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500', '700'],
})
```

---

## Phase 2: Shared Components

### 2.1 Base UI Components

Extract from HTML prototypes:

| Component | Source | Features |
|-----------|--------|----------|
| `Button` | Primary/secondary variants | Shine effect, glow on hover |
| `Card` | Glass morphism base | Hover lift, blur backdrop |
| `Badge` | Status indicators | Pulsing dot animation |
| `IconBox` | Icon containers | Blue/cyan variants |
| `Modal` | Receipt/confirmation dialogs | Backdrop blur |

### 2.2 Layout Components

| Component | Purpose |
|-----------|---------|
| `BackgroundLayers` | Grid + gradient + noise |
| `Header` | Logo, nav, wallet button |
| `Footer` | Links, "Built With" logos |

### 2.3 Data Components

| Component | Purpose |
|-----------|---------|
| `AgentCard` | Agent marketplace card |
| `AgentTable` | Tabular agent listing |
| `ReceiptRow` | Execution receipt display |
| `ReputationGauge` | Score visualization |

---

## Phase 3: Wallet Integration

### 3.1 Setup wagmi + viem

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
})
```

### 3.2 Wallet Button Component

```typescript
// components/WalletButton.tsx
'use client'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  // Render connected state with truncated address
  // Or connect button with connector options
}
```

---

## Phase 4: Indexer Integration

### 4.1 API Client

```typescript
// lib/indexer.ts
const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL
  || 'https://indexer-production-323e.up.railway.app'

export async function getAgents(params?: { ens?: string; limit?: number }) {
  const url = new URL(`${INDEXER_URL}/agents`)
  if (params?.ens) url.searchParams.set('ens', params.ens)
  if (params?.limit) url.searchParams.set('limit', params.limit.toString())
  const res = await fetch(url)
  return res.json()
}

export async function getSubnames(params?: { limit?: number; offset?: number }) {
  const url = new URL(`${INDEXER_URL}/subnames`)
  if (params?.limit) url.searchParams.set('limit', params.limit.toString())
  if (params?.offset) url.searchParams.set('offset', params.offset.toString())
  const res = await fetch(url)
  return res.json()
}

export async function getReceipts(params?: { strategyId?: string; user?: string }) {
  // ...
}

export async function getLeaderboard(sortBy: 'volume' | 'compliance' | 'score' = 'score') {
  const endpoint = sortBy === 'volume' ? '/leaderboard'
    : sortBy === 'compliance' ? '/leaderboard/compliance'
    : '/leaderboard/score'
  const res = await fetch(`${INDEXER_URL}${endpoint}`)
  return res.json()
}
```

### 4.2 React Query Hooks

```typescript
// hooks/useAgents.ts
import { useQuery } from '@tanstack/react-query'
import { getAgents } from '@/lib/indexer'

export function useAgents(params?: { ens?: string }) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => getAgents(params),
  })
}

// hooks/useSubnames.ts
export function useSubnames() {
  return useQuery({
    queryKey: ['subnames'],
    queryFn: () => getSubnames(),
  })
}
```

---

## Phase 5: Contract Integration

### 5.1 SDK Integration

```typescript
// lib/contracts.ts
import {
  registerSubname,
  isSubnameAvailable,
  getSubnameRecord,
} from '@oikonomos/sdk'
```

### 5.2 Provider Registration Flow

**`/provider/register` page:**
1. Connect wallet
2. Enter desired subname label (e.g., "alice-treasury")
3. Check availability via `isSubnameAvailable()`
4. Enter agentId and A2A URL
5. Call `registerSubname()` via SDK
6. Display success with ENS records set

```typescript
// Subname registration hook
import { useWalletClient, usePublicClient } from 'wagmi'
import { registerSubname } from '@oikonomos/sdk'

export function useRegisterSubname() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const register = async (params: {
    label: string
    agentId: bigint
    a2aUrl: string
  }) => {
    if (!walletClient) throw new Error('Wallet not connected')

    return registerSubname(publicClient, walletClient, {
      label: params.label,
      subnameOwner: walletClient.account.address,
      agentId: params.agentId,
      a2aUrl: params.a2aUrl,
      desiredExpiry: 0n,
    })
  }

  return { register }
}
```

---

## Phase 6: Page Implementation

### 6.1 Consumer Journey Pages

| Page | Data Sources | Actions |
|------|--------------|---------|
| `/` (Landing) | Static | Connect wallet |
| `/analyze` | User tokens (on-chain) | Analyze portfolio |
| `/discover` | `GET /agents`, `GET /subnames` | Filter, select agent |
| `/configure/[id]` | Agent metadata | Configure policy params |
| `/authorize` | Policy config | Sign EIP-712 intent |
| `/dashboard` | `GET /receipts/user/:address` | View history, verify |

### 6.2 Provider Journey Pages

| Page | Data Sources | Actions |
|------|--------------|---------|
| `/provider` | Static | Documentation |
| `/provider/register` | `isSubnameAvailable()` | `registerSubname()` |
| `/provider/ens` | ENS records | Verify records |
| `/provider/dashboard` | `GET /receipts/:strategyId`, `GET /strategies/:id` | View metrics |

---

## Phase 7: Real-Time Features

### 7.1 Live Activity Feed

```typescript
// Poll indexer for new receipts
export function useRecentReceipts() {
  return useQuery({
    queryKey: ['receipts', 'recent'],
    queryFn: () => getReceipts({ limit: 10, orderDirection: 'desc' }),
    refetchInterval: 10000, // Poll every 10s
  })
}
```

### 7.2 Leaderboard Updates

```typescript
export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => getLeaderboard('score'),
    refetchInterval: 30000, // Poll every 30s
  })
}
```

---

## Implementation Order

### Week 1: Foundation
- [ ] Phase 1: Project setup, Tailwind config, fonts
- [ ] Phase 2: Base UI components (Button, Card, Badge)
- [ ] Phase 3: Wallet integration (wagmi setup, WalletButton)

### Week 2: Data Layer
- [ ] Phase 4: Indexer client, React Query hooks
- [ ] Phase 5: SDK integration for subname registration

### Week 3: Consumer Pages
- [ ] Landing page (/)
- [ ] Discover page (/discover) - agent marketplace
- [ ] Dashboard page (/dashboard) - receipts & history

### Week 4: Provider Pages
- [ ] Provider guide (/provider)
- [ ] Register page (/provider/register) - subname registration
- [ ] Provider dashboard (/provider/dashboard) - reputation & earnings

---

## Backend Endpoints Required

All endpoints are already implemented:

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `GET /agents` | ✅ Live | List registered agents |
| `GET /agents/:agentId` | ✅ Live | Get agent details |
| `GET /agents/by-strategy/:strategyId` | ✅ Live | Resolve strategyId → agentId |
| `GET /subnames` | ✅ Live | List CCIP subnames |
| `GET /subnames/:label` | ✅ Live | Get subname details |
| `GET /receipts` | ✅ Live | List execution receipts |
| `GET /receipts/user/:user` | ✅ Live | User's receipts |
| `GET /strategies/:strategyId` | ✅ Live | Strategy metrics |
| `GET /leaderboard` | ✅ Live | Top strategies by volume |
| `GET /leaderboard/score` | ✅ Live | Top strategies by reputation |

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_INDEXER_URL=https://indexer-production-323e.up.railway.app
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SUBNAME_MANAGER=0x89E3740C8b81D90e146c62B6C6451b85Ec8E6E78
NEXT_PUBLIC_IDENTITY_REGISTRY=0x8004A818BFB912233c491871b3d84c89A494BD9e
```

---

## Success Criteria

- [ ] All 10 pages converted from HTML to Next.js
- [ ] Wallet connection works (MetaMask, WalletConnect)
- [ ] Agent discovery shows real data from indexer
- [ ] Subname registration flow works end-to-end
- [ ] Receipt verification displays real execution data
- [ ] Responsive design matches HTML prototypes
- [ ] Staggered animations preserved
