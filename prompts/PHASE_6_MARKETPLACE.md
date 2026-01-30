# Phase 6: Strategy Marketplace & Submission Wizard

## Objective

Build the strategy marketplace where providers can list their strategies, users can discover and compare strategies, and new providers can submit strategies via a guided wizard. This phase completes the economic flywheel of the Oikonomos ecosystem.

## Prerequisites

- Phases 0-5 completed
- ReputationRegistry deployed and recording data
- Multiple strategies executing (for leaderboard data)

## Context Files

Read these before starting:
- `/EED.md` - Marketplace sections
- `/ENS-native Agent Registry for Uniswap v4 Automation.md` - Section 8.3 (Strategy Marketplace)

## Deliverables

### Part A: Marketplace UI

#### 1. Marketplace Pages Structure

```
apps/dashboard/app/marketplace/
├── page.tsx                    # Leaderboard & discovery
├── [strategyEns]/
│   └── page.tsx                # Strategy detail page
├── compare/
│   └── page.tsx                # Side-by-side comparison
└── submit/
    ├── page.tsx                # Wizard entry
    ├── connect/
    │   └── page.tsx            # Step 1: Connect & verify
    ├── deploy/
    │   └── page.tsx            # Step 2: Deploy worker
    ├── identity/
    │   └── page.tsx            # Step 3: Register ERC-8004
    ├── capabilities/
    │   └── page.tsx            # Step 4: Declare capabilities
    ├── pricing/
    │   └── page.tsx            # Step 5: Set pricing (x402)
    └── verify/
        └── page.tsx            # Step 6: Verification & ENS
```

#### 2. Leaderboard Page

```typescript
// apps/dashboard/app/marketplace/page.tsx
'use client';

import { useState } from 'react';
import { Leaderboard } from '@/components/marketplace/Leaderboard';
import { StrategyFilters } from '@/components/marketplace/StrategyFilters';
import { useStrategies } from '@/hooks/useStrategies';

type StrategyType = 'routing' | 'treasury' | 'lp' | 'all';
type SortBy = 'volume' | 'slippage' | 'compliance' | 'score';

export default function MarketplacePage() {
  const [strategyType, setStrategyType] = useState<StrategyType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('volume');

  const { strategies, isLoading } = useStrategies({ type: strategyType, sortBy });

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Strategy Marketplace</h1>
        <p className="text-gray-400">
          Discover and compare strategies ranked by verifiable on-chain performance
        </p>
      </header>

      <StrategyFilters
        strategyType={strategyType}
        onTypeChange={setStrategyType}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="mt-6">
        {isLoading ? (
          <div className="text-gray-400">Loading strategies...</div>
        ) : (
          <Leaderboard strategies={strategies} />
        )}
      </div>

      <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
        <h2 className="text-xl font-semibold mb-2">Are you a strategy provider?</h2>
        <p className="text-gray-400 mb-4">
          Deploy your strategy and compete for users based on verifiable performance.
        </p>
        <a
          href="/marketplace/submit"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
        >
          Submit Your Strategy
        </a>
      </div>
    </div>
  );
}
```

#### 3. Leaderboard Component

```typescript
// apps/dashboard/components/marketplace/Leaderboard.tsx
'use client';

import Link from 'next/link';
import { StrategyMetrics } from '@oikonomos/shared';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, formatBps } from '@/lib/format';

interface LeaderboardProps {
  strategies: StrategyMetrics[];
}

export function Leaderboard({ strategies }: LeaderboardProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
            <th className="pb-3 pr-4">Rank</th>
            <th className="pb-3 pr-4">Strategy</th>
            <th className="pb-3 pr-4">Score</th>
            <th className="pb-3 pr-4">Avg Slippage</th>
            <th className="pb-3 pr-4">Compliance</th>
            <th className="pb-3 pr-4">Volume</th>
            <th className="pb-3 pr-4">Executions</th>
            <th className="pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((strategy, index) => (
            <LeaderboardRow
              key={strategy.id}
              rank={index + 1}
              strategy={strategy}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeaderboardRow({
  rank,
  strategy,
}: {
  rank: number;
  strategy: StrategyMetrics;
}) {
  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge variant="green">{score}</Badge>;
    if (score >= 70) return <Badge variant="blue">{score}</Badge>;
    if (score >= 50) return <Badge variant="purple">{score}</Badge>;
    return <Badge variant="gray">{score}</Badge>;
  };

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-900/50">
      <td className="py-4 pr-4">
        <span className={rank <= 3 ? 'font-bold text-yellow-400' : ''}>
          #{rank}
        </span>
      </td>
      <td className="py-4 pr-4">
        <div>
          <p className="font-medium">{strategy.ensName || 'Unknown'}</p>
          <p className="text-sm text-gray-400 font-mono">
            {strategy.id.slice(0, 10)}...
          </p>
        </div>
      </td>
      <td className="py-4 pr-4">{getScoreBadge(strategy.score || 0)}</td>
      <td className="py-4 pr-4">
        <span className={Number(strategy.avgSlippage) <= 25 ? 'text-green-400' : ''}>
          {formatBps(strategy.avgSlippage)}
        </span>
      </td>
      <td className="py-4 pr-4">
        <span className={Number(strategy.complianceRate) >= 9500 ? 'text-green-400' : ''}>
          {(Number(strategy.complianceRate) / 100).toFixed(1)}%
        </span>
      </td>
      <td className="py-4 pr-4">${formatNumber(strategy.totalVolume)}</td>
      <td className="py-4 pr-4">{strategy.totalExecutions.toString()}</td>
      <td className="py-4">
        <Link
          href={`/marketplace/${strategy.ensName || strategy.id}`}
          className="text-blue-400 hover:text-blue-300"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}
```

#### 4. Strategy Detail Page

```typescript
// apps/dashboard/app/marketplace/[strategyEns]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { PerformanceChart } from '@/components/marketplace/PerformanceChart';
import { PricingTable } from '@/components/marketplace/PricingTable';
import { RecentExecutions } from '@/components/marketplace/RecentExecutions';
import { useStrategy } from '@/hooks/useStrategy';
import { useReceipts } from '@/hooks/useReceipts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function StrategyDetailPage() {
  const params = useParams();
  const strategyEns = params.strategyEns as string;

  const { strategy, metrics, isLoading: strategyLoading } = useStrategy(strategyEns);
  const { receipts, isLoading: receiptsLoading } = useReceipts(strategy?.id);

  if (strategyLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!strategy) {
    return <div className="container mx-auto px-4 py-8">Strategy not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{strategyEns}</h1>
            <p className="text-gray-400">{strategy.description}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{metrics?.score || 0}</div>
            <div className="text-sm text-gray-400">Trust Score</div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {strategy.capabilities?.map((cap) => (
            <Badge key={cap} variant="blue">{cap}</Badge>
          ))}
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Avg Slippage"
          value={`${metrics?.avgSlippage || 0} bps`}
          trend={metrics?.slippageTrend}
        />
        <MetricCard
          label="Compliance Rate"
          value={`${((Number(metrics?.complianceRate) || 0) / 100).toFixed(1)}%`}
        />
        <MetricCard
          label="Total Volume"
          value={`$${formatNumber(metrics?.totalVolume || 0n)}`}
        />
        <MetricCard
          label="Executions"
          value={metrics?.totalExecutions?.toString() || '0'}
        />
      </div>

      {/* Performance Chart */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance History</h2>
        <PerformanceChart strategyId={strategy.id} />
      </section>

      {/* Pricing */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pricing</h2>
        <PricingTable pricing={strategy.pricing} />
      </section>

      {/* Recent Executions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <RecentExecutions receipts={receipts?.slice(0, 10) || []} />
      </section>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="primary">Use This Strategy</Button>
        <Button variant="secondary">Compare</Button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {trend && (
        <p className={`text-sm ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
          {trend === 'up' ? '↑ Improving' : trend === 'down' ? '↓ Declining' : '→ Stable'}
        </p>
      )}
    </div>
  );
}

function formatNumber(value: bigint | number): string {
  const num = typeof value === 'bigint' ? Number(value) / 1e6 : value;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(0);
}
```

---

### Part B: Strategy Submission Wizard

#### 5. Wizard Entry Page

```typescript
// apps/dashboard/app/marketplace/submit/page.tsx
'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function SubmitWizardPage() {
  const { isConnected } = useAccount();

  const steps = [
    { number: 1, title: 'Connect', description: 'Connect wallet and verify ownership' },
    { number: 2, title: 'Deploy', description: 'Deploy your strategy worker' },
    { number: 3, title: 'Identity', description: 'Register ERC-8004 agent identity' },
    { number: 4, title: 'Capabilities', description: 'Declare supported capabilities' },
    { number: 5, title: 'Pricing', description: 'Configure x402 pricing (optional)' },
    { number: 6, title: 'Verify', description: 'Test and publish to marketplace' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Submit Your Strategy</h1>
        <p className="text-gray-400">
          Deploy a strategy to the Oikonomos marketplace and compete for users
        </p>
      </header>

      {/* Steps Overview */}
      <div className="mb-8 space-y-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full font-semibold">
              {step.number}
            </div>
            <div>
              <p className="font-medium">{step.title}</p>
              <p className="text-sm text-gray-400">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        {isConnected ? (
          <Link
            href="/marketplace/submit/connect"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            Start Submission
          </Link>
        ) : (
          <div>
            <p className="text-gray-400 mb-4">Connect your wallet to begin</p>
            <ConnectButton />
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 6. Wizard Step Components

```typescript
// apps/dashboard/components/wizard/WizardProgress.tsx
'use client';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-400">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-400">
          {Math.round((currentStep / totalSteps) * 100)}% complete
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

```typescript
// apps/dashboard/app/marketplace/submit/deploy/page.tsx
'use client';

import { useState } from 'react';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { Button } from '@/components/ui/Button';

export default function DeployStepPage() {
  const [workerUrl, setWorkerUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<{
    valid: boolean;
    agentCard?: any;
    errors?: string[];
  } | null>(null);

  const validateWorker = async () => {
    setIsValidating(true);
    try {
      const response = await fetch(`${workerUrl}/.well-known/agent-card.json`);
      if (!response.ok) {
        setValidation({
          valid: false,
          errors: ['Could not fetch agent card from worker'],
        });
        return;
      }

      const agentCard = await response.json();

      // Validate required fields
      const errors: string[] = [];
      if (!agentCard.name) errors.push('Missing: name');
      if (!agentCard.version) errors.push('Missing: version');
      if (!agentCard.capabilities) errors.push('Missing: capabilities');
      if (!agentCard.endpoints?.quote) errors.push('Missing: /quote endpoint');

      setValidation({
        valid: errors.length === 0,
        agentCard,
        errors,
      });
    } catch (error) {
      setValidation({
        valid: false,
        errors: ['Failed to connect to worker'],
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <WizardProgress currentStep={2} totalSteps={6} />

      <h1 className="text-2xl font-bold mb-2">Deploy Your Worker</h1>
      <p className="text-gray-400 mb-6">
        Deploy a Cloudflare Worker that implements the A2A protocol
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Worker URL</label>
          <input
            type="url"
            value={workerUrl}
            onChange={(e) => setWorkerUrl(e.target.value)}
            placeholder="https://your-strategy.workers.dev"
            className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
          />
        </div>

        <Button
          onClick={validateWorker}
          disabled={!workerUrl || isValidating}
          className="w-full"
        >
          {isValidating ? 'Validating...' : 'Validate Worker'}
        </Button>

        {validation && (
          <div
            className={`p-4 rounded-lg ${
              validation.valid
                ? 'bg-green-900/50 border border-green-700'
                : 'bg-red-900/50 border border-red-700'
            }`}
          >
            {validation.valid ? (
              <div>
                <p className="font-semibold text-green-400">Worker validated!</p>
                <p className="text-sm mt-2">Name: {validation.agentCard.name}</p>
                <p className="text-sm">Version: {validation.agentCard.version}</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-red-400">Validation failed</p>
                <ul className="text-sm mt-2 list-disc list-inside">
                  {validation.errors?.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button
            disabled={!validation?.valid}
            onClick={() => {
              // Save to wizard state and navigate
              window.location.href = '/marketplace/submit/identity';
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### 7. Identity Registration Step

```typescript
// apps/dashboard/app/marketplace/submit/identity/page.tsx
'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { Button } from '@/components/ui/Button';
import { IdentityRegistryABI } from '@oikonomos/sdk';

const IDENTITY_REGISTRY = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS as `0x${string}`;

export default function IdentityStepPage() {
  const { address } = useAccount();
  const [agentURI, setAgentURI] = useState('');

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const registerAgent = () => {
    writeContract({
      address: IDENTITY_REGISTRY,
      abi: IdentityRegistryABI,
      functionName: 'register',
      args: [agentURI, '0x'],
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <WizardProgress currentStep={3} totalSteps={6} />

      <h1 className="text-2xl font-bold mb-2">Register Agent Identity</h1>
      <p className="text-gray-400 mb-6">
        Create an ERC-8004 identity for your strategy (mints an NFT)
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Agent URI</label>
          <input
            type="url"
            value={agentURI}
            onChange={(e) => setAgentURI(e.target.value)}
            placeholder="ipfs://... or https://..."
            className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
          />
          <p className="text-sm text-gray-400 mt-1">
            Link to your agent metadata JSON (capabilities, description, etc.)
          </p>
        </div>

        {isSuccess ? (
          <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg">
            <p className="font-semibold text-green-400">Agent registered!</p>
            <p className="text-sm mt-1">Transaction: {txHash?.slice(0, 20)}...</p>
          </div>
        ) : (
          <Button
            onClick={registerAgent}
            disabled={!agentURI || isPending || isConfirming}
            className="w-full"
          >
            {isPending
              ? 'Confirm in wallet...'
              : isConfirming
              ? 'Registering...'
              : 'Register Agent'}
          </Button>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button
            disabled={!isSuccess}
            onClick={() => {
              window.location.href = '/marketplace/submit/capabilities';
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### 8. Hooks for Marketplace

```typescript
// apps/dashboard/hooks/useStrategies.ts
'use client';

import { useQuery } from '@tanstack/react-query';

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069';

interface UseStrategiesParams {
  type?: 'routing' | 'treasury' | 'lp' | 'all';
  sortBy?: 'volume' | 'slippage' | 'compliance' | 'score';
  limit?: number;
}

export function useStrategies(params: UseStrategiesParams = {}) {
  const { type = 'all', sortBy = 'volume', limit = 50 } = params;

  const query = useQuery({
    queryKey: ['strategies', type, sortBy, limit],
    queryFn: async () => {
      const response = await fetch(
        `${PONDER_URL}/leaderboard?type=${type}&sortBy=${sortBy}&limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch strategies');
      return response.json();
    },
  });

  return {
    strategies: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

```typescript
// apps/dashboard/hooks/useStrategy.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { resolveAgent, ensNameToStrategyId } from '@oikonomos/sdk';

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069';

export function useStrategy(ensName: string) {
  const client = usePublicClient();

  // Fetch agent record from ENS
  const agentQuery = useQuery({
    queryKey: ['strategy-agent', ensName],
    queryFn: async () => {
      if (!client) return null;
      return resolveAgent(client, ensName);
    },
    enabled: !!ensName && !!client,
  });

  // Fetch metrics from indexer
  const metricsQuery = useQuery({
    queryKey: ['strategy-metrics', ensName],
    queryFn: async () => {
      const strategyId = ensNameToStrategyId(ensName);
      const response = await fetch(`${PONDER_URL}/strategies/${strategyId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!ensName,
  });

  return {
    strategy: agentQuery.data,
    metrics: metricsQuery.data,
    isLoading: agentQuery.isLoading || metricsQuery.isLoading,
    error: agentQuery.error || metricsQuery.error,
  };
}
```

## Acceptance Criteria

### Marketplace
- [ ] Leaderboard displays strategies sorted by volume/score
- [ ] Strategy detail page shows full metrics and history
- [ ] Comparison page allows side-by-side analysis
- [ ] Data comes from Ponder indexer API

### Submission Wizard
- [ ] 6-step wizard guides new providers
- [ ] Worker validation checks A2A compliance
- [ ] ERC-8004 identity registration works
- [ ] ENS record configuration guided
- [ ] Final verification tests the complete setup

## Commands

```bash
cd apps/dashboard
pnpm dev
```

Navigate to http://localhost:3000/marketplace

## Integration with Indexer

Add these endpoints to the Ponder indexer:

```typescript
// packages/indexer/src/api/strategies.ts

// Get leaderboard with sorting
ponder.get('/leaderboard', async (c) => {
  const type = c.req.query('type') || 'all';
  const sortBy = c.req.query('sortBy') || 'volume';
  const limit = parseInt(c.req.query('limit') || '50');

  let orderBy: any = { totalVolume: 'desc' };
  if (sortBy === 'slippage') orderBy = { avgSlippage: 'asc' };
  if (sortBy === 'compliance') orderBy = { complianceRate: 'desc' };

  const strategies = await c.db.StrategyMetrics.findMany({
    orderBy,
    limit,
  });

  // Enrich with ENS names (would need additional lookup)
  return c.json(strategies);
});
```

## Economic Model Summary

The marketplace creates a competitive flywheel:

1. **Providers deploy** strategies and register identity
2. **Executions emit receipts** with strategyId attribution
3. **Indexer computes scores** from receipt data
4. **Leaderboard ranks** strategies by verifiable performance
5. **Users select** top strategies for their policies
6. **Better performance** → higher ranking → more users → more revenue
7. **Revenue incentivizes** better algorithms → repeat

This creates sustainable, merit-based competition where quality is objectively measured on-chain.
