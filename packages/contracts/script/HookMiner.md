# OIK-11: Hook CREATE2 Mining

## Problem

The deployed ReceiptHook has address flags that don't match the required `AFTER_SWAP_FLAG` (0x0040 = 64).

- Current address: `0x028E4abd1C581eC7231d1d17e13b4dfAF9913F2B`
- Current flags: 16171
- Required flags: 64

This prevents proper Uniswap v4 pool registration with the hook.

## Solution

Implement CREATE2 deployment with salt mining to achieve an address with the correct lower 14 bits.

## Tasks

- [ ] Add HookMiner library for salt computation
- [ ] Create CREATE2 deployment script
- [ ] Deploy hook with correct address flags
- [ ] Update constants.ts with new hook address
- [ ] Verify pool registration works

## References

- [Uniswap v4 Hook Flags](https://github.com/Uniswap/v4-core/blob/main/src/libraries/Hooks.sol)
- Linear Issue: OIK-11
