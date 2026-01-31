# OIK-11: Hook CREATE2 Mining

## Problem

The deployed ReceiptHook has address flags that don't match the required `AFTER_SWAP_FLAG` (0x0040 = 64).

- Current address: `0x028E4abd1C581eC7231d1d17e13b4dfAF9913F2B`
- Current flags: 16171
- Required flags: 64

This prevents proper Uniswap v4 pool registration with the hook.

## Solution

Implement CREATE2 deployment with salt mining to achieve an address with the correct lower 14 bits.

## Mined Result

Successfully mined a valid salt:

| Property | Value |
|----------|-------|
| Salt (decimal) | 43988 |
| Salt (hex) | `0x000000000000000000000000000000000000000000000000000000000000abd4` |
| Hook Address | `0xea155cf7d152125839e66b585b9e455621b7c040` |
| Address Flags | `0x0040` (64 = AFTER_SWAP_FLAG) |
| Init Code Hash | `0x75592c3813bb807f794f2db22bcbbea678688554bff13221de368747158e81d7` |

## Verification

```
Address: 0xea155cf7d152125839e66b585b9e455621b7c040
         └──────────────────────────────────────┴──┘
                                                 └─ Lower 14 bits: 0x0040 ✓
```

## Scripts

### TypeScript Miner (Off-chain, faster)

```bash
cd packages/contracts
npx tsx script/mine-hook-salt.ts
```

### Solidity Deployment

```bash
cd packages/contracts
source ../../.env
forge script script/DeployReceiptHookCREATE2.s.sol:DeployReceiptHookCREATE2 \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

### Shell Script Deployment (using cast)

```bash
cd packages/contracts
./script/deploy-hook-create2.sh
```

## Deployment Configuration

- CREATE2 Deployer: `0x4e59b44847b379578588920cA78FbF26c0B4956C`
- Pool Manager (Sepolia): `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543`

## Tasks

- [x] Add HookMiner library for salt computation
- [x] Create TypeScript miner script
- [x] Mine valid salt (43988)
- [x] Create CREATE2 deployment script
- [ ] Deploy hook with correct address flags
- [x] Update constants.ts with new hook address
- [ ] Verify contract on Etherscan
- [ ] Test pool registration works

## References

- [Uniswap v4 Hook Flags](https://github.com/Uniswap/v4-core/blob/main/src/libraries/Hooks.sol)
- [v4-periphery HookMiner](https://github.com/Uniswap/v4-periphery/blob/main/src/utils/HookMiner.sol)
- Linear Issue: OIK-11
