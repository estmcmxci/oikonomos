# Zodiac Modifier Roles

> Context file for Oikonomos integration with Gnosis Guild's Zodiac Roles Modifier

## Overview

The Roles Modifier enables granular, role-based permissions for Safe modules. It sits between a module (our agent executor) and the Safe, enforcing that only approved addresses, functions, and parameters can be called.

**Repository**: `/Users/oakgroup/Desktop/webdev/ethglobal/zodiac-modifier-roles`
**Docs**: https://docs.roles.gnosisguild.org
**App**: https://roles.gnosisguild.org

## Contract Addresses

Same address on all supported chains:

| Contract | Address |
|----------|---------|
| Roles | `0x9646fDAD06d3e24444381f44362a3B0eB343D337` |
| Integrity | `0x6a6Af4b16458Bc39817e4019fB02BD3b26d41049` |
| Packer | `0x61C5B1bE435391fDd7BC6703F3740C0d11728a8C` |
| MultiSendUnwrapper | `0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0` |
| AvatarIsOwnerOfERC721 | `0x91B1bd7BCC5E623d5CE76b0152253499a9C819d1` |

**Supported chains**: Mainnet, Optimism, Gnosis, Polygon, Arbitrum, Avalanche, BSC, Base, Celo, Sonic, Berachain, Sepolia, Base Sepolia

**Subgraph**: https://gnosisguild.squids.live/roles:production/api/graphql

## Architecture Decisions for Oikonomos

### Policy Compiler Strategy
**Decision**: Use SDK directly

Policy templates are expressed as `zodiac-roles-sdk` permission arrays. No custom DSL—we use the SDK's native types (`Permission`, `TargetPermission`, `FunctionPermission`) and `planApply()` for role updates.

### Swap Routing
**Decision**: Uniswap v4 only for v0, scaffold CowSwap for v1

- v0: Direct Uniswap v4 integration for hackathon (judges are Uniswap)
- v1: Add CowSwap as fallback for MEV protection and aggregation
- Note: SDK has existing CowSwap integration (`getCowQuote`, `signCowOrder`, `postCowOrder`) that can be leveraged later

### v0 Permission Surface
**Decision**: Token allowlist + max notional

Minimum viable permissions for Treasury Autopilot demo:
- **Token allowlist**: USDC, USDT, DAI (restrict which tokens can be swapped)
- **Max notional**: Daily spend limits (e.g., $50k/day)

Deferred to v1:
- Slippage caps (enforce via intent constraints instead)
- Function selector restrictions (beyond swap functions)
- Cadence limits (time-based restrictions)

### Config Storage
**Decision**: ENS refs + subgraph

- ENS text records store: `agent:safe`, `agent:rolesModifier`, `agent:roleKey`
- Full permission config fetched from Zodiac subgraph at runtime
- No duplication of permission data on IPFS

## Key Contracts

### Roles.sol

Main modifier contract. Key functions:

```solidity
// Assign roles to an executor address
function assignRoles(
    address module,           // executor address
    bytes32[] calldata roleKeys,
    bool[] calldata memberOf
) external onlyOwner;

// Execute transaction with role-based permission check
function execTransactionWithRole(
    address to,
    uint256 value,
    bytes calldata data,
    Operation operation,
    bytes32 roleKey,
    bool shouldRevert
) public returns (bool success);

// Set default role for a module
function setDefaultRole(
    address module,
    bytes32 roleKey
) external onlyOwner;
```

### AvatarIsOwnerOfERC721.sol

Custom condition for Uniswap LP position ownership verification:

```solidity
// Returns true if the Safe (avatar) owns the NFT tokenId
function check(
    address to,          // NFT contract (e.g., Uniswap Position Manager)
    uint256 value,
    bytes calldata data,
    Operation operation,
    uint256 location,    // byte offset of tokenId in calldata
    uint256 size,        // size of tokenId (32 bytes)
    bytes12 extra
) public view returns (bool success, bytes32 reason);
```

Use case: Ensure agent can only manage LP positions owned by the treasury Safe.

## SDK Usage

### Package
```bash
npm install zodiac-roles-sdk zodiac-roles-deployments
```

### Permission Types

```typescript
import {
  Permission,
  TargetPermission,      // Allow all calls to a target
  FunctionPermission,    // Allow specific function with optional conditions
  processPermissions,
  planApply
} from "zodiac-roles-sdk";

// Target-level permission (allow all calls to address)
const allowTarget: TargetPermission = {
  targetAddress: "0x...",
  send: true,
  delegateCall: false,
};

// Function-level permission with conditions
const allowSwap: FunctionPermission = {
  targetAddress: UNISWAP_ROUTER,
  selector: "0x...",  // swap function selector
  condition: {
    // Parameter conditions here
  },
  send: false,
  delegateCall: false,
};
```

### Applying Permissions

```typescript
import { planApply, encodeCalls } from "zodiac-roles-sdk";
import { fetchRole } from "zodiac-roles-deployments";

// Fetch current role state from subgraph
const currentRole = await fetchRole({
  chainId: 1,
  address: ROLES_MODIFIER,
  roleKey: ROLE_KEY,
});

// Plan permission changes
const calls = planApply(currentRole.targets, newPermissions);

// Encode for Safe transaction
const encodedCalls = encodeCalls(calls);
```

### CowSwap Integration (v1)

```typescript
import { getCowQuote, signCowOrder, postCowOrder } from "zodiac-roles-sdk/swaps";

// Get quote
const quote = await getCowQuote({
  kind: "sell",
  sellToken: USDC,
  buyToken: DAI,
  sellAmountBeforeFee: 1000000n,  // 1 USDC
  chainId: SupportedChainId.MAINNET,
  rolesModifier: ROLES_MODIFIER,
  roleKey: ROLE_KEY,
});

// Sign and post (v1 implementation)
const signature = await signCowOrder(quote, signer);
await postCowOrder(quote, signature);
```

## Integration with Oikonomos

### ENS Records for DAO Mode

```
agent:mode = "safe-roles"
agent:safe = "0x..."              # Gnosis Safe address
agent:rolesModifier = "0x9646fDAD06d3e24444381f44362a3B0eB343D337"
agent:roleKey = "0x..."           # bytes32 role identifier
```

### Execution Flow

1. **Resolve ENS** → get Safe, Roles Modifier, roleKey
2. **Fetch permissions** from Zodiac subgraph
3. **Validate intent** against policy (off-chain pre-check)
4. **Execute via Roles** → `execTransactionWithRole()`
5. **Emit receipt** linking Safe tx hash to policy compliance

### Policy → Roles Compilation (v0)

```typescript
// Policy template (high-level)
interface TreasuryPolicy {
  allowedTokens: Address[];
  maxDailyNotional: bigint;
  targetAllocations: { token: Address; weight: number }[];
}

// Compile to Roles permissions
function compilePolicyToPermissions(policy: TreasuryPolicy): Permission[] {
  return [
    // Allow swaps on Uniswap v4 router
    {
      targetAddress: UNISWAP_V4_ROUTER,
      selector: SWAP_SELECTOR,
      condition: buildTokenAllowlistCondition(policy.allowedTokens),
      send: false,
      delegateCall: false,
    },
    // Allowance tracking for max notional
    // (uses SDK's allowance features)
  ];
}
```

### Receipt Linkage

Receipts MUST include:
- `safeTxHash`: Safe transaction hash
- `roleKey`: Role used for execution
- `enforcementBackend`: `"safe-roles"`
- `permissionsHash`: Hash of permissions at execution time (for audit trail)

## File Structure Reference

```
zodiac-modifier-roles/
├── packages/
│   ├── evm/                    # Solidity contracts
│   │   ├── contracts/
│   │   │   ├── Roles.sol       # Main modifier
│   │   │   ├── PermissionChecker.sol
│   │   │   ├── PermissionBuilder.sol
│   │   │   ├── AllowanceTracker.sol
│   │   │   └── periphery/
│   │   │       └── AvatarIsOwnerOfERC721.sol
│   │   └── docs/               # Audit reports
│   ├── sdk/                    # TypeScript SDK
│   │   └── src/
│   │       ├── main/           # Core SDK
│   │       │   ├── permission/ # Permission types & processing
│   │       │   ├── condition/  # Condition builders
│   │       │   └── target/     # Target management
│   │       └── swaps/          # CowSwap integration
│   ├── deployments/            # Chain configs & subgraph queries
│   ├── app/                    # Web UI (roles.gnosisguild.org)
│   └── docs/                   # Documentation site
```

## References

- [EVM Contracts README](../zodiac-modifier-roles/packages/evm/README.md)
- [SDK Documentation](https://docs.roles.gnosisguild.org/sdk/getting-started)
- [Zodiac Roles App](https://roles.gnosisguild.org)
- [Gnosis Guild Discord](http://discord.gnosisguild.org)
