# OIK-51: Deploy EIP-2612 Permit-Enabled MockUSDC for x402 Payments

## Context

OIK-49 implemented x402 SDK compatible 402 responses in the treasury-agent. The 402 response format now works correctly with the `@x402/fetch` SDK, but full E2E payment fails because our MockUSDC token doesn't support EIP-2612 permits.

**Error from x402 SDK:**
```
Failed to create payment payload: EIP-712 domain parameters (name, version) are required in payment requirements for asset 0x524C057B1030B3D832f1688e4993159C7A124518
```

The x402 protocol uses permit-based gasless approvals. Our current MockUSDC is a basic ERC20 without permit support.

## Branch
`m/oik-51-deploy-eip-2612-permit-enabled-mockusdc-for-x402-payments`

## Linear
https://linear.app/oikonomos-app/issue/OIK-51

## Current Deployed Infrastructure (Base Sepolia)

| Contract | Address | Status |
|----------|---------|--------|
| MockUSDC | `0x524C057B1030B3D832f1688e4993159C7A124518` | ❌ No permit |
| MockDAI | `0x233Dc75Bda7dB90a33454e4333E3ac96eB7FB84E` | ❌ No permit |
| ReceiptHook | `0x906e3e24c04f6b6b5b6743bb77d0fcbe4d87c040` | ✅ Keep |
| IntentRouter | `0xe57a783A55Da1FBA9aBAF1eD7bCDf16792604858` | ✅ Keep |
| PoolManager | `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` | ✅ Uniswap v4 |

## Tasks

### 1. Update Mock Token Contracts

**MockUSDC** (`packages/contracts/src/mocks/MockUSDC.sol`):
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MockUSDC is ERC20, ERC20Permit {
    constructor() ERC20("Mock USDC", "USDC") ERC20Permit("Mock USDC") {
        _mint(msg.sender, 100_000 * 10 ** 6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

**MockDAI** (`packages/contracts/src/mocks/MockDAI.sol`):
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MockDAI is ERC20, ERC20Permit {
    constructor() ERC20("Mock DAI", "DAI") ERC20Permit("Mock DAI") {
        _mint(msg.sender, 100_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

### 2. Deploy New Tokens to Base Sepolia

Use existing deployment script pattern from `packages/contracts/script/DeployBaseSepolia.s.sol`:
- Deploy MockUSDC with permit
- Deploy MockDAI with permit
- Verify on BaseScan
- Record new addresses

### 3. Initialize New Pools with ReceiptHook

Create pools with the new token addresses:
- DAI/USDC pool (0.05% fee, tickSpacing 10)
- WETH/USDC pool (0.3% fee, tickSpacing 60)

Use existing ReceiptHook at `0x906e3e24c04f6b6b5b6743bb77d0fcbe4d87c040`.

### 4. Add Liquidity

Mint tokens and add liquidity to pools (similar to OIK-50).

### 5. Update Configuration Files

**`agents/treasury-agent/src/config/pools.ts`**:
- Update TOKENS object with new addresses
- Update SUPPORTED_POOLS with new pool keys

**`agents/treasury-agent/src/x402/config.ts`**:
- Update PAYMENT_TOKEN with new MockUSDC address

**`agents/treasury-agent/wrangler.toml`** (if token addresses are in env vars)

### 6. Redeploy Treasury Agent

```bash
cd agents/treasury-agent
CLOUDFLARE_API_TOKEN=... npx wrangler deploy
```

### 7. Run E2E Test

```bash
cd agents/treasury-agent
source ../../.env
PRIVATE_KEY=$DEPLOYER_PRIVATE_KEY npx tsx scripts/x402-e2e-test.ts
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/contracts/src/mocks/MockUSDC.sol` | Token contract to update |
| `packages/contracts/src/mocks/MockDAI.sol` | Token contract to update |
| `packages/contracts/script/DeployBaseSepolia.s.sol` | Deployment script reference |
| `agents/treasury-agent/src/config/pools.ts` | Pool configuration |
| `agents/treasury-agent/src/x402/config.ts` | Payment token config |
| `agents/treasury-agent/scripts/x402-e2e-test.ts` | E2E test script |

## Environment Variables Needed

From `.env`:
- `BASE_SEPOLIA_RPC_URL` - RPC endpoint
- `DEPLOYER_PRIVATE_KEY` - Deployment key
- `BASESCAN_API_KEY` - Contract verification
- `CLOUDFLARE_API_TOKEN` - Worker deployment

## Acceptance Criteria

- [ ] MockUSDC deployed with ERC20Permit support
- [ ] MockDAI deployed with ERC20Permit support
- [ ] Pools re-initialized with ReceiptHook
- [ ] Treasury agent config updated with new addresses
- [ ] Treasury agent redeployed
- [ ] x402 E2E test passes

## Notes

- ReceiptHook and IntentRouter do NOT need redeployment - they work with any ERC20 tokens
- Only the mock tokens and pools need updating
- The indexer may need config updates if it references token addresses directly
