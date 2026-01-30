# Gnosis Safe (Safe{Core})

> Context file for Oikonomos integration with Safe Smart Accounts for DAO treasury management

## Overview

Safe is a smart contract wallet requiring multiple signatures to execute transactions. For Oikonomos Treasury Autopilot, Safe provides the custody layer while Zodiac Roles Modifier enforces granular permissions.

**Docs**: https://docs.safe.global/
**SDK**: https://github.com/safe-global/safe-core-sdk

## Architecture Decisions for Oikonomos

### SDK Choice
**Decision**: Protocol Kit only

We use `@safe-global/protocol-kit` for core Safe interactions:
- Create and sign transactions
- Deploy new Safes
- Enable/disable modules
- Execute transactions

API Kit and Relay Kit are not needed for v0 (no multi-sig coordination or sponsored txs).

### Execution Mode
**Decision**: Via Zodiac Roles Modifier

```
Agent Executor
      │
      ▼
┌─────────────────────────────┐
│  Roles Modifier             │  ← Enforces permissions
│  execTransactionWithRole()  │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  Gnosis Safe                │  ← Holds treasury funds
│  execTransactionFromModule()│
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  Uniswap v4 Router          │  ← Executes swaps
└─────────────────────────────┘
```

The agent never calls the Safe directly. All execution flows through Roles Modifier.

### Deployment Pattern
**Decision**: Deploy new Safe for v0 demo

For hackathon demo, deploy a fresh Safe with:
- Single owner (demo account)
- Threshold of 1
- Roles Modifier enabled as module

## Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| Safe Singleton (v1.4.1) | `0x41675C099F32341bf84BFc5382aF534df5C7461a` |
| Safe Proxy Factory | `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` |
| MultiSend | `0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526` |
| MultiSendCallOnly | `0x9641d764fc13c8B624c04430C7356C1C7C8102e2` |
| Fallback Handler | `0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99` |
| Roles Modifier | `0x9646fDAD06d3e24444381f44362a3B0eB343D337` |

**Safe Transaction Service (Sepolia)**: https://safe-transaction-sepolia.safe.global

## SDK Setup

### Installation

```bash
pnpm add @safe-global/protocol-kit viem
```

### Initialize Protocol Kit

```typescript
import Safe from '@safe-global/protocol-kit'

// For existing Safe
const protocolKit = await Safe.init({
  provider: 'https://rpc.ankr.com/eth_sepolia',
  signer: PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS
})

// For deploying new Safe
const protocolKit = await Safe.init({
  provider: 'https://rpc.ankr.com/eth_sepolia',
  signer: PRIVATE_KEY,
  predictedSafe: {
    safeAccountConfig: {
      owners: [OWNER_ADDRESS],
      threshold: 1
    }
  }
})
```

## Deploy New Safe

```typescript
import Safe from '@safe-global/protocol-kit'

async function deploySafe(ownerAddress: string, signerPrivateKey: string) {
  const protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: signerPrivateKey,
    predictedSafe: {
      safeAccountConfig: {
        owners: [ownerAddress],
        threshold: 1
      },
      safeDeploymentConfig: {
        saltNonce: Date.now().toString() // Unique deployment
      }
    }
  })

  // Get predicted address before deployment
  const predictedAddress = await protocolKit.getAddress()
  console.log('Predicted Safe address:', predictedAddress)

  // Deploy the Safe
  const deploymentTx = await protocolKit.createSafeDeploymentTransaction()

  // Execute deployment (requires funds for gas)
  const txHash = await protocolKit.executeTransaction(deploymentTx)

  return predictedAddress
}
```

## Enable Roles Modifier as Module

After deploying Safe, enable the Roles Modifier:

```typescript
import Safe from '@safe-global/protocol-kit'
import { encodeFunctionData } from 'viem'

const ROLES_MODIFIER = '0x9646fDAD06d3e24444381f44362a3B0eB343D337'

async function enableRolesModifier(protocolKit: Safe) {
  // Create transaction to enable module
  const enableModuleTx = await protocolKit.createEnableModuleTx(ROLES_MODIFIER)

  // Sign the transaction
  const signedTx = await protocolKit.signTransaction(enableModuleTx)

  // Execute
  const result = await protocolKit.executeTransaction(signedTx)

  // Verify module is enabled
  const modules = await protocolKit.getModules()
  console.log('Enabled modules:', modules)

  return result
}
```

## Safe Interface (Solidity)

Key functions for module integration:

```solidity
interface ISafe {
    // Module management (only callable by Safe itself via tx)
    function enableModule(address module) external;
    function disableModule(address prevModule, address module) external;
    function isModuleEnabled(address module) external view returns (bool);
    function getModulesPaginated(address start, uint256 pageSize)
        external view returns (address[] memory array, address next);

    // Execution from modules
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) external returns (bool success);

    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) external returns (bool success, bytes memory returnData);

    // Safe info
    function getOwners() external view returns (address[] memory);
    function getThreshold() external view returns (uint256);
    function nonce() external view returns (uint256);
}

enum Operation {
    Call,       // 0
    DelegateCall // 1
}
```

## Integration with Zodiac Roles

See `context/zodiac-modifier-roles.md` for full Roles integration details.

### Setup Flow

```typescript
// 1. Deploy Safe
const safeAddress = await deploySafe(ownerAddress, privateKey)

// 2. Enable Roles Modifier as module
await enableRolesModifier(protocolKit)

// 3. Configure Roles Modifier
//    - Set Safe as avatar and target
//    - Create role with permissions
//    - Assign role to agent executor

// 4. Agent executes via Roles
// Agent calls: rolesModifier.execTransactionWithRole(...)
// Roles calls: safe.execTransactionFromModule(...)
```

### Roles Modifier Setup (Solidity)

```solidity
// Roles Modifier constructor params:
// - owner: who can configure roles (typically the Safe itself)
// - avatar: the Safe (executes final tx)
// - target: the Safe (receives module calls)

Roles rolesModifier = new Roles(
    safeAddress,  // owner
    safeAddress,  // avatar
    safeAddress   // target
);

// Then enable Roles as module on Safe
safe.enableModule(address(rolesModifier));
```

## Transaction Building

### Create Safe Transaction

```typescript
import { MetaTransactionData } from '@safe-global/types-kit'

// Single transaction
const tx: MetaTransactionData = {
  to: UNISWAP_ROUTER,
  value: '0',
  data: swapCalldata,
  operation: 0 // Call
}

const safeTx = await protocolKit.createTransaction({
  transactions: [tx]
})

// Batched transactions (via MultiSend)
const txs: MetaTransactionData[] = [
  { to: TOKEN_A, value: '0', data: approveCalldata, operation: 0 },
  { to: ROUTER, value: '0', data: swapCalldata, operation: 0 }
]

const batchTx = await protocolKit.createTransaction({
  transactions: txs
})
```

### Sign and Execute

```typescript
// Sign
const signedTx = await protocolKit.signTransaction(safeTx)

// Execute (if threshold met)
const result = await protocolKit.executeTransaction(signedTx)
console.log('Tx hash:', result.hash)
```

## Reading Safe State

```typescript
// Get Safe info
const owners = await protocolKit.getOwners()
const threshold = await protocolKit.getThreshold()
const nonce = await protocolKit.getNonce()
const modules = await protocolKit.getModules()
const balance = await protocolKit.getBalance()

console.log({
  owners,
  threshold,
  nonce,
  modules,
  balance: balance.toString()
})
```

## v0 Demo Setup Script

Complete setup for Treasury Autopilot demo:

```typescript
import Safe from '@safe-global/protocol-kit'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const ROLES_MODIFIER = '0x9646fDAD06d3e24444381f44362a3B0eB343D337'

async function setupTreasuryDemo(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey)

  // 1. Deploy new Safe
  console.log('Deploying Safe...')
  const protocolKit = await Safe.init({
    provider: sepolia.rpcUrls.default.http[0],
    signer: privateKey,
    predictedSafe: {
      safeAccountConfig: {
        owners: [account.address],
        threshold: 1
      }
    }
  })

  const safeAddress = await protocolKit.getAddress()
  console.log('Safe address:', safeAddress)

  // Fund the Safe address before deployment
  console.log('Fund this address with Sepolia ETH, then continue...')

  // 2. Deploy
  const deployTx = await protocolKit.createSafeDeploymentTransaction()
  await protocolKit.executeTransaction(deployTx)

  // 3. Reinitialize with deployed Safe
  const deployedKit = await Safe.init({
    provider: sepolia.rpcUrls.default.http[0],
    signer: privateKey,
    safeAddress
  })

  // 4. Enable Roles Modifier
  console.log('Enabling Roles Modifier...')
  const enableTx = await deployedKit.createEnableModuleTx(ROLES_MODIFIER)
  const signedEnable = await deployedKit.signTransaction(enableTx)
  await deployedKit.executeTransaction(signedEnable)

  // 5. Verify
  const modules = await deployedKit.getModules()
  console.log('Enabled modules:', modules)

  return {
    safeAddress,
    rolesModifier: ROLES_MODIFIER,
    owner: account.address
  }
}
```

## ENS Integration

Store Safe configuration in ENS text records:

```
agent:mode = "safe-roles"
agent:safe = "0x..."                    # Safe address
agent:rolesModifier = "0x9646fDAD..."   # Roles Modifier address
agent:roleKey = "0x..."                 # bytes32 role identifier
```

Discovery flow:
1. Resolve ENS → get `agent:safe` and `agent:rolesModifier`
2. Verify Roles is enabled as module: `safe.isModuleEnabled(rolesModifier)`
3. Agent executes via `rolesModifier.execTransactionWithRole()`

## Security Considerations

1. **Module trust**: Only enable trusted modules. Modules can execute any transaction.

2. **Roles granularity**: Use Zodiac Roles for fine-grained permissions rather than direct module access.

3. **Threshold for production**: Demo uses threshold=1. Production DAOs should use higher thresholds with multi-sig.

4. **Recovery**: Keep backup owner keys. Consider social recovery modules for production.

5. **Guard contracts**: Consider adding transaction guards for additional validation layer.

## Resources

- [Safe Documentation](https://docs.safe.global/)
- [Protocol Kit Reference](https://docs.safe.global/sdk/protocol-kit/reference)
- [Safe Contracts](https://github.com/safe-global/safe-smart-account)
- [Zodiac Roles Integration](./zodiac-modifier-roles.md)
