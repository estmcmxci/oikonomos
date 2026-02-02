# DeFi Power User Portfolio Simulation (Sepolia Testnet)

> Based on available Uniswap v4 pools on Sepolia as of 2026-02-01

---

## Reality Check: What's Actually Available

### Tradeable Tokens on Sepolia v4

| Token | Address | Faucet | Decimals |
|-------|---------|--------|----------|
| **ETH** | Native | [Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia), [Alchemy](https://sepoliafaucet.com/) | 18 |
| **USDC (Aave)** | `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8` | [Aave Faucet](https://staging.aave.com/faucet/) | 6 |
| **DAI (Aave)** | `0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357` | [Aave Faucet](https://staging.aave.com/faucet/) | 18 |
| **WETH (Aave)** | `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c` | [Aave Faucet](https://staging.aave.com/faucet/) | 18 |
| **USDC (Circle)** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | [Circle Faucet](https://faucet.circle.com/) | 6 |
| **WETH (Sepolia)** | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` | Wrap native ETH | 18 |
| **WETH (Uniswap)** | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` | Wrap native ETH | 18 |
| **UNI** | `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` | Limited availability | 18 |
| **LINK** | `0x779877A7B0D9E8603169DdbD7836e478b4624789` | [Chainlink Faucet](https://faucets.chain.link/sepolia) | 18 |

### Available Trading Routes

```
                    ┌─────────────┐
                    │    ETH      │
                    │  (Native)   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │  WETH   │  │  USDC   │  │  WETH   │
        │ (Aave)  │  │(Circle) │  │ (Uni)   │
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
             ▼            │            │
        ┌─────────┐       │            │
        │   UNI   │       │            │
        └─────────┘       │            │
                          │            │
              ┌───────────┴───┐        │
              │               │        │
              ▼               ▼        ▼
        ┌─────────┐     ┌─────────────────┐
        │  USDC   │◄───►│   USDC/WETH     │
        │ (Aave)  │     │   (2 pools)     │
        └────┬────┘     └─────────────────┘
             │
             │ ◄─── Main Stablecoin Pair (4 pools)
             ▼
        ┌─────────┐
        │   DAI   │
        │ (Aave)  │
        └─────────┘
```

---

## Simulated DeFi Power User Portfolio

### Persona: "Marcus" - Active DeFi Trader (2026)

**Philosophy**: Maintain core ETH exposure while actively managing stablecoin reserves for yield opportunities and dip buying.

### Target Portfolio (~$100K equivalent in testnet tokens)

| Asset | Target % | Testnet Amount | Rationale |
|-------|----------|----------------|-----------|
| **ETH/WETH** | 40% | 16 ETH (~$40K) | Base layer exposure, gas, collateral |
| **USDC (Aave)** | 25% | 25,000 USDC | Primary stablecoin, Aave yield |
| **DAI (Aave)** | 15% | 15,000 DAI | Decentralized stable, Aave yield |
| **USDC (Circle)** | 10% | 10,000 USDC | DEX liquidity, trading |
| **UNI** | 5% | TBD UNI | DeFi governance exposure |
| **LINK** | 5% | TBD LINK | Infrastructure bet |

### Drift Thresholds

| Asset Class | Threshold | Action |
|-------------|-----------|--------|
| ETH/WETH | ±7% | Rebalance to 40% |
| Stablecoins (combined) | ±5% | Rebalance internally |
| Altcoins (UNI/LINK) | ±10% | Wider tolerance for volatility |

### Rebalancing Scenarios

**Scenario 1: ETH Pumps 20%**
- ETH position grows from 40% to ~48%
- Sell ETH for stablecoins to rebalance
- Route: ETH → WETH → USDC (Circle) OR ETH → USDC directly

**Scenario 2: Stablecoin Drift**
- USDC (Aave) drifts from 25% to 30%
- DAI drifts from 15% to 10%
- Swap USDC → DAI via USDC(Aave)/DAI(Aave) pool

**Scenario 3: DeFi Token Rebalance**
- UNI position exceeds 8%
- Sell UNI → WETH (Aave) → distribute

---

## Setup Instructions

### Step 1: Get Sepolia ETH
```bash
# Primary faucets (choose one):
# - Google Cloud: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
# - Alchemy: https://sepoliafaucet.com/
# - Infura: https://www.infura.io/faucet/sepolia

# Need: ~20 ETH for simulation (may require multiple faucet claims)
```

### Step 2: Get Aave Testnet Tokens
```bash
# Visit: https://staging.aave.com/faucet/
# Connect wallet to Sepolia
# Mint:
#   - 25,000 USDC
#   - 15,000 DAI
#   - 5 WETH (for UNI pool trading)
```

### Step 3: Get Circle USDC
```bash
# Visit: https://faucet.circle.com/
# Select Sepolia
# Mint: 10,000 USDC
```

### Step 4: Get LINK (Optional)
```bash
# Visit: https://faucets.chain.link/sepolia
# Connect wallet
# Request LINK tokens
```

### Step 5: Wrap ETH for Trading
```typescript
// Using viem to wrap ETH
import { createWalletClient, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';

const WETH_ADDRESS = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'; // Uniswap WETH

const wethAbi = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  }
];

// Wrap 10 ETH
await walletClient.writeContract({
  address: WETH_ADDRESS,
  abi: wethAbi,
  functionName: 'deposit',
  value: parseEther('10')
});
```

---

## Pool Configuration for Treasury Agent

### Primary Pools to Use

```typescript
// pools.config.ts
export const SIMULATION_POOLS = {
  // Stablecoin rebalancing
  USDC_DAI: {
    currency0: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC (Aave)
    currency1: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // DAI (Aave)
    fee: 500,        // 0.05% - best for stables
    tickSpacing: 10,
    hooks: '0x0000000000000000000000000000000000000000'
  },

  // ETH/USD trading
  ETH_USDC: {
    currency0: '0x0000000000000000000000000000000000000000', // Native ETH
    currency1: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC (Circle)
    fee: 3000,       // 0.3%
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000'
  },

  // WETH/USDC (alternative route)
  WETH_USDC: {
    currency0: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC (Circle)
    currency1: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // WETH (Uni)
    fee: 3000,       // 0.3%
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000'
  },

  // DeFi token trading
  UNI_WETH: {
    currency0: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
    currency1: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', // WETH (Aave)
    fee: 3000,       // 0.3%
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000'
  }
};
```

### Policy Configuration

```typescript
// policy.config.ts
export const MARCUS_POLICY = {
  targetAllocations: [
    { token: 'ETH', percentage: 40 },
    { token: 'USDC_AAVE', percentage: 25 },
    { token: 'DAI_AAVE', percentage: 15 },
    { token: 'USDC_CIRCLE', percentage: 10 },
    { token: 'UNI', percentage: 5 },
    { token: 'LINK', percentage: 5 }
  ],

  driftThresholds: {
    ETH: 7,           // 7% drift triggers rebalance
    stablecoins: 5,   // 5% combined stablecoin drift
    altcoins: 10      // 10% for volatile assets
  },

  constraints: {
    maxSlippageBps: 50,     // 0.5% max slippage
    maxDailyVolume: 20000,  // $20K max daily trading
    minGasReserve: 0.5      // Keep 0.5 ETH for gas
  }
};
```

---

## Differences from Original User Journey

| Original (Alice) | Simulation (Marcus) | Reason |
|------------------|---------------------|--------|
| 60K USDC, 25K USDT, 15K DAI | No USDT available | USDT has no v4 pools on Sepolia |
| 100% stablecoins | 40% ETH, 50% stable, 10% alts | More realistic DeFi portfolio |
| Single rebalance type | Multiple asset classes | Tests complex rebalancing logic |
| Fixed 5% drift | Variable by asset class | Volatile assets need wider bands |

---

## Next Steps

1. **Fund wallet** using faucets above
2. **Approve tokens** for IntentRouter contract
3. **Configure policy** in treasury agent
4. **Run drift detection** to test rebalancing
5. **Execute swaps** via IntentRouter

---

## Faucet Summary

| Token | Faucet URL | Daily Limit | Notes |
|-------|------------|-------------|-------|
| Sepolia ETH | cloud.google.com/faucet | 0.05-0.5 ETH | May need multiple sources |
| USDC/DAI/WETH (Aave) | staging.aave.com/faucet | 10,000 each | Best source for stables |
| USDC (Circle) | faucet.circle.com | 10 USDC | Limited amounts |
| LINK | faucets.chain.link | 20 LINK | Requires 0.001 ETH |

---

*Generated for Oikonomos testnet simulation*
