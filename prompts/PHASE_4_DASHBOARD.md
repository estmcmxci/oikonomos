# Phase 4: Next.js Dashboard

## Objective

Build the user-facing dashboard for Oikonomos that enables agent discovery, policy configuration, execution monitoring, and receipt verification.

## Prerequisites

- Phases 0-3 completed
- Contracts deployed, SDK built, Indexer running, Agents deployed
- ENS records configured for `treasury.oikonomos.eth`

## Context Files

Read these before starting:
- `/EED.md` - Section on Phase 6 (Frontend specs)
- `/ENS-native Agent Registry for Uniswap v4 Automation.md` - User journeys
- `/context/wagmi.md` - Wagmi React hooks

## Deliverables

### 1. Dashboard Structure

```
apps/dashboard/
├── package.json
├── next.config.js
├── tailwind.config.js
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Home / Agent Discovery
│   ├── providers.tsx               # Wagmi + QueryClient
│   │
│   ├── agent/
│   │   └── [ensName]/
│   │       ├── page.tsx            # Agent profile
│   │       └── configure/
│   │           └── page.tsx        # Policy configuration
│   │
│   ├── portfolio/
│   │   ├── page.tsx                # User portfolio (Mode A)
│   │   └── history/
│   │       └── page.tsx            # Execution history
│   │
│   ├── receipt/
│   │   └── [txHash]/
│   │       └── page.tsx            # Receipt verification
│   │
│   └── api/
│       ├── resolve/
│       │   └── route.ts            # ENS resolution API
│       └── receipts/
│           └── route.ts            # Indexer proxy API
│
├── components/
│   ├── agent/
│   │   ├── AgentCard.tsx
│   │   ├── AgentSearch.tsx
│   │   └── TrustScore.tsx
│   │
│   ├── policy/
│   │   ├── PolicyConfigurator.tsx
│   │   ├── AllocationSlider.tsx
│   │   └── PolicySummary.tsx
│   │
│   ├── portfolio/
│   │   ├── AllocationChart.tsx
│   │   ├── DriftIndicator.tsx
│   │   └── ExecutionLog.tsx
│   │
│   ├── receipt/
│   │   ├── ReceiptCard.tsx
│   │   ├── ComplianceCheck.tsx
│   │   └── ProofLinks.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── Input.tsx
│
├── hooks/
│   ├── useAgent.ts
│   ├── useReceipts.ts
│   ├── usePolicy.ts
│   └── usePortfolio.ts
│
└── lib/
    ├── wagmi.ts
    ├── ens.ts
    └── api.ts
```

### 2. Package Configuration

```json
// apps/dashboard/package.json
{
  "name": "@oikonomos/dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.51.0",
    "wagmi": "^2.12.0",
    "viem": "^2.21.0",
    "@rainbow-me/rainbowkit": "^2.1.0",
    "@oikonomos/sdk": "workspace:*",
    "@oikonomos/shared": "workspace:*",
    "recharts": "^2.12.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0"
  }
}
```

### 3. Wagmi & Provider Setup

```typescript
// apps/dashboard/lib/wagmi.ts
import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'Oikonomos',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '',
  }
);

export const config = createConfig({
  chains: [sepolia, mainnet],
  connectors,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [mainnet.id]: http(),
  },
});
```

```typescript
// apps/dashboard/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 4. Root Layout

```typescript
// apps/dashboard/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Oikonomos | ENS-native Agent Registry',
  description: 'Automated Uniswap v4 treasury management with verifiable receipts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-gray-950 text-white">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
```

### 5. Home Page (Agent Discovery)

```typescript
// apps/dashboard/app/page.tsx
'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AgentSearch } from '@/components/agent/AgentSearch';
import { AgentCard } from '@/components/agent/AgentCard';
import { useAgent } from '@/hooks/useAgent';

export default function HomePage() {
  const [ensName, setEnsName] = useState('treasury.oikonomos.eth');
  const { agent, isLoading, error } = useAgent(ensName);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold">Oikonomos</h1>
          <p className="text-gray-400">ENS-native Agent Registry for Uniswap v4</p>
        </div>
        <ConnectButton />
      </header>

      {/* Agent Discovery */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Discover Agents</h2>
        <AgentSearch value={ensName} onChange={setEnsName} />

        {isLoading && (
          <div className="mt-4 text-gray-400">Resolving {ensName}...</div>
        )}

        {error && (
          <div className="mt-4 text-red-400">Failed to resolve agent: {error.message}</div>
        )}

        {agent && (
          <div className="mt-6">
            <AgentCard agent={agent} ensName={ensName} />
          </div>
        )}
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          title="Policy-Driven"
          description="Define constraints like slippage caps, token allowlists, and daily limits. The agent executes within your rules."
        />
        <FeatureCard
          title="Verifiable Receipts"
          description="Every execution produces an on-chain receipt proving what happened and why."
        />
        <FeatureCard
          title="ENS Discovery"
          description="Find agents via human-readable names like treasury.oikonomos.eth"
        />
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
```

### 6. Agent Card Component

```typescript
// apps/dashboard/components/agent/AgentCard.tsx
'use client';

import Link from 'next/link';
import { AgentRecord } from '@oikonomos/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TrustScore } from './TrustScore';

interface AgentCardProps {
  agent: AgentRecord;
  ensName: string;
}

export function AgentCard({ agent, ensName }: AgentCardProps) {
  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{ensName}</h3>
          <p className="text-gray-400 text-sm">
            {agent.type} agent • v{agent.version}
          </p>
        </div>
        <Badge variant={agent.mode === 'intent-only' ? 'blue' : 'purple'}>
          {agent.mode === 'intent-only' ? 'Intent Mode' : 'Safe + Roles'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-400">Chain</p>
          <p className="font-mono">Sepolia ({agent.chainId})</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Entrypoint</p>
          <p className="font-mono text-sm truncate">{agent.entrypoint}</p>
        </div>
      </div>

      {agent.erc8004 && (
        <div className="mb-6">
          <TrustScore erc8004={agent.erc8004} />
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/agent/${ensName}/configure`} className="flex-1">
          <Button variant="primary" className="w-full">
            Configure Policy
          </Button>
        </Link>
        <Link href={`/agent/${ensName}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

### 7. Policy Configurator

```typescript
// apps/dashboard/components/policy/PolicyConfigurator.tsx
'use client';

import { useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { AllocationSlider } from './AllocationSlider';
import { PolicySummary } from './PolicySummary';
import { Button } from '@/components/ui/Button';
import { buildIntent, signIntent } from '@oikonomos/sdk';

interface PolicyConfig {
  allocations: { token: string; symbol: string; percentage: number }[];
  driftThreshold: number;
  maxSlippageBps: number;
  maxDailyUsd: number;
  triggerType: 'drift' | 'periodic';
}

interface PolicyConfiguratorProps {
  agentUrl: string;
}

export function PolicyConfigurator({ agentUrl }: PolicyConfiguratorProps) {
  const { address } = useAccount();
  const [config, setConfig] = useState<PolicyConfig>({
    allocations: [
      { token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC', percentage: 100 },
    ],
    driftThreshold: 5,
    maxSlippageBps: 25,
    maxDailyUsd: 10000,
    triggerType: 'drift',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!address) return;

    setIsSubmitting(true);
    try {
      // Submit policy to treasury agent
      const response = await fetch(`${agentUrl}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          policy: config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to configure policy');
      }

      alert('Policy configured successfully!');
    } catch (error) {
      console.error('Configuration error:', error);
      alert('Failed to configure policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Allocation Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Target Allocation</h3>
        {config.allocations.map((alloc, i) => (
          <AllocationSlider
            key={alloc.token}
            symbol={alloc.symbol}
            percentage={alloc.percentage}
            onChange={(value) => {
              const newAllocations = [...config.allocations];
              newAllocations[i].percentage = value;
              setConfig({ ...config, allocations: newAllocations });
            }}
          />
        ))}
      </section>

      {/* Constraints Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Constraints</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Drift Threshold (%)
            </label>
            <input
              type="number"
              value={config.driftThreshold}
              onChange={(e) => setConfig({ ...config, driftThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Max Slippage (bps)
            </label>
            <input
              type="number"
              value={config.maxSlippageBps}
              onChange={(e) => setConfig({ ...config, maxSlippageBps: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Max Daily (USD)
            </label>
            <input
              type="number"
              value={config.maxDailyUsd}
              onChange={(e) => setConfig({ ...config, maxDailyUsd: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700"
            />
          </div>
        </div>
      </section>

      {/* Summary */}
      <PolicySummary config={config} />

      {/* Submit */}
      <Button
        variant="primary"
        className="w-full"
        onClick={handleSubmit}
        disabled={!address || isSubmitting}
      >
        {isSubmitting ? 'Configuring...' : 'Configure Policy'}
      </Button>
    </div>
  );
}
```

### 8. Receipt Card

```typescript
// apps/dashboard/components/receipt/ReceiptCard.tsx
'use client';

import { ExecutionReceipt } from '@oikonomos/shared';
import { Badge } from '@/components/ui/Badge';
import { ComplianceCheck } from './ComplianceCheck';
import { ProofLinks } from './ProofLinks';
import { formatUnits } from 'viem';

interface ReceiptCardProps {
  receipt: ExecutionReceipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const formatAmount = (amount: bigint, decimals = 6) => {
    const abs = amount < 0n ? -amount : amount;
    const sign = amount < 0n ? '-' : '+';
    return `${sign}${formatUnits(abs, decimals)}`;
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Execution Receipt</h3>
        <Badge variant={receipt.policyCompliant ? 'green' : 'red'}>
          {receipt.policyCompliant ? 'Compliant' : 'Violation'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-400">Input (Token 0)</p>
          <p className="font-mono">{formatAmount(receipt.amount0)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Output (Token 1)</p>
          <p className="font-mono">{formatAmount(receipt.amount1)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Slippage</p>
          <p className="font-mono">{receipt.actualSlippage.toString()} bps</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Timestamp</p>
          <p className="font-mono">
            {new Date(Number(receipt.timestamp) * 1000).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-2">Strategy ID</p>
        <p className="font-mono text-xs break-all">{receipt.strategyId}</p>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-2">Quote ID</p>
        <p className="font-mono text-xs break-all">{receipt.quoteId}</p>
      </div>

      <ComplianceCheck receipt={receipt} />

      <div className="mt-4 pt-4 border-t border-gray-800">
        <ProofLinks txHash={receipt.transactionHash} blockNumber={receipt.blockNumber} />
      </div>
    </div>
  );
}
```

### 9. Hooks

```typescript
// apps/dashboard/hooks/useAgent.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { resolveAgent } from '@oikonomos/sdk';
import { AgentRecord } from '@oikonomos/shared';

export function useAgent(ensName: string | undefined) {
  const client = usePublicClient();

  const query = useQuery<AgentRecord | null>({
    queryKey: ['agent', ensName],
    queryFn: async () => {
      if (!ensName || !client) return null;
      return resolveAgent(client, ensName);
    },
    enabled: !!ensName && !!client,
  });

  return {
    agent: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

```typescript
// apps/dashboard/hooks/useReceipts.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { ExecutionReceipt } from '@oikonomos/shared';

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069';

export function useReceipts(strategyId?: string) {
  const query = useQuery<ExecutionReceipt[]>({
    queryKey: ['receipts', strategyId],
    queryFn: async () => {
      const url = strategyId
        ? `${PONDER_URL}/receipts/${strategyId}`
        : `${PONDER_URL}/receipts`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch receipts');
      return response.json();
    },
    enabled: true,
  });

  return {
    receipts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useReceipt(txHash: string) {
  const query = useQuery<ExecutionReceipt | null>({
    queryKey: ['receipt', txHash],
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/receipts?txHash=${txHash}`);
      if (!response.ok) return null;
      const receipts = await response.json();
      return receipts[0] ?? null;
    },
  });

  return {
    receipt: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

### 10. UI Components

```typescript
// apps/dashboard/components/ui/Button.tsx
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        {
          'bg-blue-600 hover:bg-blue-700 text-white': variant === 'primary',
          'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700': variant === 'secondary',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

```typescript
// apps/dashboard/components/ui/Badge.tsx
import { clsx } from 'clsx';

interface BadgeProps {
  variant?: 'green' | 'red' | 'blue' | 'purple' | 'gray';
  children: React.ReactNode;
}

export function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'px-2 py-1 text-xs font-medium rounded-full',
        {
          'bg-green-900 text-green-300': variant === 'green',
          'bg-red-900 text-red-300': variant === 'red',
          'bg-blue-900 text-blue-300': variant === 'blue',
          'bg-purple-900 text-purple-300': variant === 'purple',
          'bg-gray-800 text-gray-300': variant === 'gray',
        }
      )}
    >
      {children}
    </span>
  );
}
```

### 11. Tailwind Configuration

```javascript
// apps/dashboard/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```css
/* apps/dashboard/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-950 text-white;
}
```

## Acceptance Criteria

- [ ] Home page loads with agent search
- [ ] ENS resolution works for `treasury.oikonomos.eth`
- [ ] Agent card displays all metadata from ENS records
- [ ] Policy configurator allows setting allocations and constraints
- [ ] Receipt cards display execution data correctly
- [ ] Compliance badge shows correct status
- [ ] Links to Etherscan work
- [ ] Wallet connection works via RainbowKit
- [ ] `pnpm dev` starts the dashboard at http://localhost:3000

## Commands

```bash
cd apps/dashboard

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Environment Variables

Add to `.env`:

```
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_PONDER_URL=http://localhost:42069
NEXT_PUBLIC_WALLETCONNECT_ID=your_project_id
NEXT_PUBLIC_RECEIPT_HOOK_ADDRESS=0x...
NEXT_PUBLIC_INTENT_ROUTER_ADDRESS=0x...
```

## Demo Flow

1. Connect wallet
2. Search for `treasury.oikonomos.eth`
3. View agent card with capabilities and trust score
4. Click "Configure Policy"
5. Set target allocations and constraints
6. Sign policy configuration
7. View portfolio with drift indicators
8. View execution history with receipts
