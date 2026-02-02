# OIK-13 Deployment Summary

## Sepolia Testnet (Chain ID: 11155111)

### Core Contracts

| Contract | Address | Notes |
|----------|---------|-------|
| PoolManager | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` | Uniswap V4 (existing) |
| ReceiptHook | `0x41a75f07bA1958EcA78805D8419C87a393764040` | afterSwap hook, user address in hookData (OIK-31) |
| IntentRouter | `0x89223f6157cDE457B37763A70ed4E6A302F23683` | Passes user address to hookData (OIK-31) |

### Identity

| Registry | Address | Agent ID |
|----------|---------|----------|
| ERC-8004 IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | 642 |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | (canonical) |

### Test Pool

| Parameter | Value |
|-----------|-------|
| currency0 | `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8` (Aave USDC) |
| currency1 | `0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357` (Aave DAI) |
| fee | 500 (0.05%) |
| tickSpacing | 10 |
| hooks | `0x41a75f07bA1958EcA78805D8419C87a393764040` |

### ENS Text Records (treasury.oikonomos.eth)

```
agent:type = treasury
agent:mode = intent-only
agent:entrypoint = 0x89223f6157cDE457B37763A70ed4E6A302F23683
agent:erc8004 = eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:642
agent:a2a = https://treasury-agent.oikonomos.workers.dev
```

### Agent Environment Variables

```bash
CHAIN_ID=11155111
IDENTITY_REGISTRY=0x8004A818BFB912233c491871b3d84c89A494BD9e
INTENT_ROUTER=0x89223f6157cDE457B37763A70ed4E6A302F23683
RECEIPT_HOOK=0x41a75f07bA1958EcA78805D8419C87a393764040
AGENT_ID=642
STRATEGY_ID=0x0000000000000000000000000000000000000000000000000000000000000282
```

### Indexer Configuration

```typescript
// ponder.config.ts
export default createConfig({
  chains: {
    sepolia: {
      id: 11155111,
      rpc: process.env.SEPOLIA_RPC_URL,
    },
  },
  contracts: {
    ReceiptHook: {
      chain: 'sepolia',
      abi: ReceiptHookABI,
      address: '0x41a75f07bA1958EcA78805D8419C87a393764040',
      startBlock: 10176818,
    },
    IdentityRegistry: {
      chain: 'sepolia',
      abi: IdentityRegistryABI,
      address: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      startBlock: 10165000,
    },
  },
});
```

### E2E Validation Status

| Phase | Status | Details |
|-------|--------|---------|
| 1. Contract Deployment | ✅ Complete | ReceiptHook, IntentRouter deployed with correct hook flags |
| 2. Agent Integration | ✅ Complete | Agent ID 642 registered with ERC-8004 |
| 3. Indexer & Reputation | ✅ Complete | Ponder indexer live at block 10165771 |
| 4. E2E Validation | ✅ Complete | All contracts verified, awaiting test funds for swap execution |

### Validation Script

Run the E2E validation:
```bash
cd packages/contracts
forge script script/06_ValidateE2E.s.sol --rpc-url $SEPOLIA_RPC_URL -vvv
```

### Next Steps for Full Swap Test

1. Fund wallet `0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21` with Aave USDC/DAI
2. Approve IntentRouter for token spending
3. Execute intent via treasury-agent `/rebalance` endpoint
4. Verify `ExecutionReceipt` event indexed by Ponder
