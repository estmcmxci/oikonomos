# OIK-50 E2E Verification Context

## Task
Run E2E verification test on Base Sepolia to confirm the full flow works:
1. Execute a swap through IntentRouter
2. Verify ReceiptHook emits ExecutionReceipt event
3. Confirm indexer captures the event

## Branch
`m/oik-50-deploy-to-base-sepolia-for-native-x402-support`

## Deployed Contracts (Base Sepolia - Chain ID: 84532)

| Contract | Address |
|----------|---------|
| PoolManager | `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` |
| Quoter | `0x4a6513c898fe1b2d0e78d3b0e0a4a151589b1cba` |
| MockUSDC | `0x524C057B1030B3D832f1688e4993159C7A124518` (6 decimals) |
| MockDAI | `0x233Dc75Bda7dB90a33454e4333E3ac96eB7FB84E` (18 decimals) |
| WETH | `0x4200000000000000000000000000000000000006` |
| ReceiptHook | `0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040` |
| IntentRouter | `0xe57a783A55Da1FBA9aBAF1eD7bCDf16792604858` |

## Pools Created (with ReceiptHook)

| Pool | Fee | tickSpacing | Liquidity |
|------|-----|-------------|-----------|
| DAI/USDC | 0.05% (500) | 10 | ✅ Has liquidity (~499 each) |
| WETH/USDC | 0.3% (3000) | 60 | ⚠️ No liquidity yet |

## Funded Wallets (0.01 ETH each)

| Role | Address |
|------|---------|
| Deployer | `0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21` |
| Treasury Agent | `0xB037d8161eFc69dE19D5bD76B6BaeaC5dE5C8761` |
| Reputation Worker | `0x326C5A8E71584Af2fCcd1608207Af9A4924274Ce` |
| Strategy Agent | `0x168E50A2812Fb380c64a2B1C523DA4fb00923691` |

## Indexer
- **URL**: https://indexer-production-323e.up.railway.app
- **Schema**: `oikonomos_v4`
- **Status**: Redeployed with multi-chain support (Sepolia + Base Sepolia)

## Action Required

Create a new Foundry script at `packages/contracts/script/ExecuteBaseSepoliaE2E.s.sol` that:

1. Uses the **deployed** IntentRouter (not a fresh one)
2. Swaps DAI → USDC using the DAI/USDC pool (fee: 500, tickSpacing: 10)
3. Signs the intent with EIP-712 signature
4. Calls `executeIntent()` on the IntentRouter

### Key differences from existing E2E script (`07_ExecuteRealE2E.s.sol`):
- Don't deploy a new IntentRouter - use existing at `0xe57a783A55Da1FBA9aBAF1eD7bCDf16792604858`
- Use Base Sepolia addresses (MockDAI, MockUSDC, ReceiptHook, PoolManager)
- Pool fee is 500 (0.05%) not 3000, tickSpacing is 10 not 60
- Get the current nonce from IntentRouter: `router.nonces(deployer)`

### IntentRouter.Intent struct:
```solidity
struct Intent {
    address user;
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint256 maxSlippage;  // basis points (500 = 5%)
    uint256 deadline;
    bytes32 strategyId;
    uint256 nonce;
}
```

### PoolKey for DAI/USDC:
```solidity
// currency0 must be < currency1 (sort by address)
// MockDAI: 0x233Dc75Bda7dB90a33454e4333E3ac96eB7FB84E
// MockUSDC: 0x524C057B1030B3D832f1688e4993159C7A124518
// Since 0x233... < 0x524..., currency0 = DAI, currency1 = USDC

PoolKey memory poolKey = PoolKey({
    currency0: Currency.wrap(0x233Dc75Bda7dB90a33454e4333E3ac96eB7FB84E), // DAI
    currency1: Currency.wrap(0x524C057B1030B3D832f1688e4993159C7A124518), // USDC
    fee: 500,
    tickSpacing: 10,
    hooks: IHooks(0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040)
});
```

### Run command:
```bash
cd packages/contracts
forge script script/ExecuteBaseSepoliaE2E.s.sol:ExecuteBaseSepoliaE2E \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  -vvvv
```

## Verification Steps

### 1. Check BaseScan for ExecutionReceipt event
https://sepolia.basescan.org/address/0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040#events

### 2. Query indexer API
```bash
curl https://indexer-production-323e.up.railway.app/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ executionReceipts(first: 5, orderBy: \"timestamp\", orderDirection: \"desc\") { items { id strategyId user transactionHash timestamp } } }"}'
```

## Success Criteria
- [ ] Swap executes successfully on IntentRouter
- [ ] ExecutionReceipt event emitted by ReceiptHook
- [ ] Indexer captures and stores the receipt
- [ ] Receipt appears in indexer API response

## Reference Files
- Deployment script: `packages/contracts/script/DeployBaseSepolia.s.sol`
- Existing E2E script (Sepolia): `packages/contracts/script/07_ExecuteRealE2E.s.sol`
- IntentRouter source: `packages/contracts/src/policy/IntentRouter.sol`
- ReceiptHook source: `packages/contracts/src/core/ReceiptHook.sol`
