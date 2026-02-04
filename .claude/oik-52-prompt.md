# OIK-52: Fix IntentRouter getNonce Revert in Trade Execution

## Context

OIK-51 successfully deployed permit-enabled tokens and verified the x402 payment flow works. The facilitator accepts payments and returns 200. However, the **trade execution** fails immediately after payment verification.

**Error:**
```
ContractFunctionExecutionError: The contract function "getNonce" reverted.

Contract Call:
  address:   0xe57a783A55Da1FBA9aBAF1eD7bCDf16792604858
  function:  getNonce(address user)
  args:      (0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21)
```

## Branch
`m/oik-52-fix-intentrouter-getnonce-revert-in-trade-execution`

## Linear
https://linear.app/oikonomos-app/issue/OIK-52

## Current Infrastructure (Base Sepolia)

| Contract | Address | Status |
|----------|---------|--------|
| IntentRouter | `0xe57a783A55Da1FBA9aBAF1eD7bCDf16792604858` | ❌ getNonce reverts |
| ReceiptHook | `0x906e3e24c04f6b6b5b6743bb77d0fcbe4d87c040` | ✅ Working |
| PoolManager | `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` | ✅ Uniswap v4 |
| MockUSDC (permit) | `0x944a6D90b3111884CcCbfcc45B381b7C864D7943` | ✅ Trading token |
| MockDAI (permit) | `0xCE728786975c72711e810aDCD9BC233A2a55d7C1` | ✅ Trading token |
| Official USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | ✅ x402 payments |

## What's Working

1. ✅ Quote endpoint returns valid quotes
2. ✅ 402 response has correct format with EIP-712 domain params
3. ✅ x402 SDK creates payment payload
4. ✅ Facilitator verifies payment (returns 200)
5. ❌ Trade execution fails at `getNonce` call

## Investigation Steps

### 1. Check IntentRouter Contract Source
```bash
# Find the IntentRouter contract
cat packages/contracts/src/policy/IntentRouter.sol
```

Questions:
- Does IntentRouter have a `getNonce(address)` function?
- What's the function signature?
- Does it require initialization?

### 2. Check How getNonce is Called
```bash
# Find the intent mode implementation
cat agents/treasury-agent/src/modes/intentMode.ts
```

Questions:
- How is `getNonce` being called?
- Is the ABI correct?
- Is it calling the right contract?

### 3. Verify Contract Deployment
```bash
# Check if contract has code
source .env && cast code 0xe57a783A55Da1FBA9aBAF1eD7bCDf16792604858 --rpc-url "$BASE_SEPOLIA_RPC_URL"

# Try calling getNonce directly
source .env && cast call 0xe57a783A55Da1FBA9aBAF1eD7bCDf16792604858 "getNonce(address)(uint256)" 0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21 --rpc-url "$BASE_SEPOLIA_RPC_URL"
```

### 4. Check Contract ABI in Treasury Agent
```bash
# Find where IntentRouter ABI is defined
grep -r "IntentRouter" agents/treasury-agent/src/ --include="*.ts"
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/contracts/src/policy/IntentRouter.sol` | IntentRouter contract source |
| `agents/treasury-agent/src/modes/intentMode.ts` | Intent mode implementation |
| `agents/treasury-agent/src/execute/handler.ts` | Execute handler (calls getNonce) |

## Likely Causes

1. **Function doesn't exist**: IntentRouter may not have `getNonce(address)`
2. **Wrong ABI**: Treasury agent may be using outdated ABI
3. **Contract not initialized**: IntentRouter may need setup before use
4. **Wrong contract address**: May be pointing to wrong deployment

## Test Command

After fixing, run the E2E test:
```bash
cd agents/treasury-agent
source ../../.env
PRIVATE_KEY="$DEPLOYER_PRIVATE_KEY" npx tsx scripts/x402-e2e-test.ts
```

## Acceptance Criteria

- [ ] Identify root cause of getNonce revert
- [ ] Fix IntentRouter interaction or configuration
- [ ] Trade execution completes successfully after x402 payment
- [ ] E2E test shows successful swap execution
