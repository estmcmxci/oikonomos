# Phase 5: Mode B (Safe + Roles) & Reputation Registry

## Objective

Implement Mode B execution (Safe + Zodiac Roles Modifier) for DAO treasuries and the ReputationRegistry for on-chain trust scores. This phase is **optional for MVP** but required for full DAO support.

## Prerequisites

- Phases 0-4 completed
- Understanding of Gnosis Safe and Zodiac Roles Modifier
- A test Safe deployed on Sepolia

## Context Files

Read these before starting:
- `/EED.md` - Sections on Mode B, ReputationRegistry
- `/ENS-native Agent Registry for Uniswap v4 Automation.md` - DAO Treasury Journey (7.2)
- `/context/gnosis-safe.md` - Safe contract interactions
- `/context/zodiac-modifier-roles.md` - Roles Modifier configuration

## Deliverables

### Part A: AgentExecutor (Mode B)

#### 1. AgentExecutor Contract

```solidity
// packages/contracts/src/policy/AgentExecutor.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {HookDataLib} from "../libraries/HookDataLib.sol";

interface IRolesModifier {
    enum Operation { Call, DelegateCall }

    function execTransactionWithRole(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        bytes32 roleKey,
        bool shouldRevert
    ) external returns (bool success);
}

interface ISafe {
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external returns (bool success);
}

contract AgentExecutor {
    event ExecutionAttempted(
        address indexed safe,
        bytes32 indexed roleKey,
        bytes32 indexed strategyId,
        bool success
    );

    event ExecutionReverted(
        address indexed safe,
        bytes32 indexed roleKey,
        string reason
    );

    struct ExecutionParams {
        address safe;
        address rolesModifier;
        bytes32 roleKey;
        address target;
        bytes calldata;
        bytes32 strategyId;
        bytes32 quoteId;
        uint256 maxSlippage;
    }

    IPoolManager public immutable poolManager;

    constructor(address _poolManager) {
        poolManager = IPoolManager(_poolManager);
    }

    /**
     * @notice Execute a transaction through Safe + Roles Modifier
     * @dev The caller must have the specified role assigned in the RolesModifier
     * @param params Execution parameters including Safe address, role, and calldata
     */
    function execute(ExecutionParams calldata params) external returns (bool success) {
        // 1. Encode hookData for ReceiptHook attribution
        bytes memory hookData = HookDataLib.encode(
            params.strategyId,
            params.quoteId,
            params.maxSlippage
        );

        // 2. Inject hookData into the calldata if it's a swap
        bytes memory enrichedData = _injectHookData(params.calldata, hookData);

        // 3. Execute through Roles Modifier → Safe → Target
        try IRolesModifier(params.rolesModifier).execTransactionWithRole(
            params.target,
            0, // value
            enrichedData,
            IRolesModifier.Operation.Call,
            params.roleKey,
            true // shouldRevert on permission failure
        ) returns (bool result) {
            success = result;
            emit ExecutionAttempted(params.safe, params.roleKey, params.strategyId, success);
        } catch Error(string memory reason) {
            emit ExecutionReverted(params.safe, params.roleKey, reason);
            success = false;
        }

        return success;
    }

    /**
     * @notice Execute multiple transactions in a batch
     * @dev All transactions must use the same Safe and role
     */
    function executeBatch(ExecutionParams[] calldata paramsBatch) external returns (bool[] memory results) {
        results = new bool[](paramsBatch.length);

        for (uint256 i = 0; i < paramsBatch.length; i++) {
            results[i] = this.execute(paramsBatch[i]);
        }

        return results;
    }

    /**
     * @dev Inject hookData into swap calldata for ReceiptHook attribution
     */
    function _injectHookData(
        bytes calldata originalData,
        bytes memory hookData
    ) internal pure returns (bytes memory) {
        // For MVP: Simple concatenation
        // Production: Parse selector and inject into appropriate parameter
        return abi.encodePacked(originalData, hookData);
    }

    /**
     * @notice Check if an address has a specific role
     * @param rolesModifier The Roles Modifier contract
     * @param account The address to check
     * @param roleKey The role to check for
     */
    function hasRole(
        address rolesModifier,
        address account,
        bytes32 roleKey
    ) external view returns (bool) {
        // This would call the RolesModifier to check role assignment
        // Implementation depends on Zodiac Roles version
        return true; // Placeholder
    }
}
```

#### 2. Policy Compiler (Roles Configuration Generator)

```solidity
// packages/contracts/src/policy/PolicyCompiler.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title PolicyCompiler
 * @notice Translates high-level policy templates into Zodiac Roles permissions
 * @dev This is a helper contract for DAOs to configure their agent permissions
 */
contract PolicyCompiler {
    struct PolicyTemplate {
        address[] allowedTargets;
        bytes4[] allowedSelectors;
        address[] allowedTokens;
        uint256 maxPerTransaction;
        uint256 maxDaily;
        uint256 maxSlippageBps;
    }

    struct RolesPermission {
        address target;
        bytes4 selector;
        bytes32[] paramConditions;
        bool delegateCall;
    }

    event PolicyCompiled(bytes32 indexed roleKey, uint256 permissionCount);

    /**
     * @notice Compile a policy template into Roles permissions
     * @param template The high-level policy configuration
     * @return permissions Array of permissions to be set in RolesModifier
     */
    function compile(
        PolicyTemplate calldata template
    ) external pure returns (RolesPermission[] memory permissions) {
        uint256 count = template.allowedTargets.length * template.allowedSelectors.length;
        permissions = new RolesPermission[](count);

        uint256 index = 0;
        for (uint256 i = 0; i < template.allowedTargets.length; i++) {
            for (uint256 j = 0; j < template.allowedSelectors.length; j++) {
                permissions[index] = RolesPermission({
                    target: template.allowedTargets[i],
                    selector: template.allowedSelectors[j],
                    paramConditions: new bytes32[](0), // Simplified for MVP
                    delegateCall: false
                });
                index++;
            }
        }

        return permissions;
    }

    /**
     * @notice Generate a human-readable summary of the policy
     * @dev Used for governance proposals
     */
    function summarize(
        PolicyTemplate calldata template
    ) external pure returns (string memory) {
        // In production: Build detailed summary string
        return "Treasury Agent Policy: Allows swaps on approved targets with configured limits";
    }
}
```

#### 3. Deployment Script for AgentExecutor

```solidity
// packages/contracts/script/03_DeployAgentExecutor.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {AgentExecutor} from "../src/policy/AgentExecutor.sol";

contract DeployAgentExecutor is Script {
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        AgentExecutor executor = new AgentExecutor(POOL_MANAGER);

        console.log("AgentExecutor deployed at:", address(executor));

        vm.stopBroadcast();
    }
}
```

#### 4. AgentExecutor Tests

```solidity
// packages/contracts/test/AgentExecutor.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {AgentExecutor} from "../src/policy/AgentExecutor.sol";

contract AgentExecutorTest is Test {
    AgentExecutor public executor;

    address public safe = makeAddr("safe");
    address public rolesModifier = makeAddr("rolesModifier");

    function setUp() public {
        executor = new AgentExecutor(address(0)); // Mock PoolManager
    }

    function test_ExecuteEmitsEvent() public {
        // Test would mock RolesModifier and verify execution flow
    }

    function test_ExecuteBatch() public {
        // Test batch execution
    }

    function test_RevertsOnPermissionDenied() public {
        // Test that permission failures are handled correctly
    }
}
```

---

### Part B: Reputation Registry

#### 5. ReputationRegistry Contract

```solidity
// packages/contracts/src/identity/ReputationRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationRegistry
 * @notice On-chain trust scores derived from ExecutionReceipt data
 * @dev Implements ERC-8004 reputation interface
 */
contract ReputationRegistry is Ownable {
    struct Reputation {
        uint256 totalExecutions;
        uint256 totalVolume;           // In USD (scaled by 1e6)
        uint256 avgSlippage;           // Basis points
        uint256 complianceRate;        // Basis points (10000 = 100%)
        uint256 successRate;           // Basis points (10000 = 100%)
        uint256 lastUpdated;
    }

    // agentId (from IdentityRegistry) => Reputation
    mapping(uint256 => Reputation) public reputations;

    // Authorized recorders (indexer or receipt processor)
    mapping(address => bool) public authorizedRecorders;

    event ReputationUpdated(
        uint256 indexed agentId,
        uint256 totalExecutions,
        uint256 avgSlippage,
        uint256 complianceRate
    );

    event RecorderAuthorized(address indexed recorder, bool authorized);

    error UnauthorizedRecorder();

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        if (!authorizedRecorders[msg.sender]) revert UnauthorizedRecorder();
        _;
    }

    /**
     * @notice Record a new execution for reputation scoring
     * @param agentId The ERC-8004 agent identity
     * @param volume Trade volume in USD (scaled by 1e6)
     * @param slippage Actual slippage in basis points
     * @param compliant Whether the execution was policy-compliant
     * @param success Whether the execution succeeded
     */
    function recordExecution(
        uint256 agentId,
        uint256 volume,
        uint256 slippage,
        bool compliant,
        bool success
    ) external onlyAuthorized {
        Reputation storage rep = reputations[agentId];

        uint256 oldCount = rep.totalExecutions;
        uint256 newCount = oldCount + 1;

        // Running average for slippage
        if (oldCount > 0) {
            rep.avgSlippage = (rep.avgSlippage * oldCount + slippage) / newCount;
        } else {
            rep.avgSlippage = slippage;
        }

        // Running average for compliance rate
        uint256 complianceValue = compliant ? 10000 : 0;
        if (oldCount > 0) {
            rep.complianceRate = (rep.complianceRate * oldCount + complianceValue) / newCount;
        } else {
            rep.complianceRate = complianceValue;
        }

        // Running average for success rate
        uint256 successValue = success ? 10000 : 0;
        if (oldCount > 0) {
            rep.successRate = (rep.successRate * oldCount + successValue) / newCount;
        } else {
            rep.successRate = successValue;
        }

        rep.totalExecutions = newCount;
        rep.totalVolume += volume;
        rep.lastUpdated = block.timestamp;

        emit ReputationUpdated(agentId, newCount, rep.avgSlippage, rep.complianceRate);
    }

    /**
     * @notice Calculate a composite trust score for an agent
     * @param agentId The ERC-8004 agent identity
     * @return score Composite score from 0-100
     */
    function getScore(uint256 agentId) external view returns (uint256 score) {
        Reputation memory rep = reputations[agentId];

        if (rep.totalExecutions == 0) {
            return 0; // New agent, no score
        }

        // Scoring weights:
        // - 35% slippage (lower is better, max 100bps considered bad)
        // - 25% compliance rate
        // - 25% success rate
        // - 15% execution count (log scale, caps at 1000)

        // Slippage score: 35 points max, loses points as slippage increases
        uint256 slippageScore;
        if (rep.avgSlippage <= 10) {
            slippageScore = 35; // Excellent: ≤10bps
        } else if (rep.avgSlippage <= 25) {
            slippageScore = 30; // Good: 10-25bps
        } else if (rep.avgSlippage <= 50) {
            slippageScore = 20; // Fair: 25-50bps
        } else if (rep.avgSlippage <= 100) {
            slippageScore = 10; // Poor: 50-100bps
        } else {
            slippageScore = 0; // Bad: >100bps
        }

        // Compliance score: 25 points max
        uint256 complianceScore = (rep.complianceRate * 25) / 10000;

        // Success score: 25 points max
        uint256 successScore = (rep.successRate * 25) / 10000;

        // Volume/activity score: 15 points max (log scale)
        uint256 activityScore;
        if (rep.totalExecutions >= 1000) {
            activityScore = 15;
        } else if (rep.totalExecutions >= 100) {
            activityScore = 12;
        } else if (rep.totalExecutions >= 10) {
            activityScore = 8;
        } else {
            activityScore = rep.totalExecutions * 8 / 10;
        }

        score = slippageScore + complianceScore + successScore + activityScore;
    }

    /**
     * @notice Get full reputation data for an agent
     */
    function getReputation(uint256 agentId) external view returns (Reputation memory) {
        return reputations[agentId];
    }

    /**
     * @notice Authorize or revoke a recorder
     */
    function setAuthorizedRecorder(address recorder, bool authorized) external onlyOwner {
        authorizedRecorders[recorder] = authorized;
        emit RecorderAuthorized(recorder, authorized);
    }
}
```

#### 6. SDK Updates for Mode B

```typescript
// packages/sdk/src/safe/executor.ts
import { Address, encodeFunctionData, Hex } from 'viem';

export interface SafeExecutionParams {
  safe: Address;
  rolesModifier: Address;
  roleKey: Hex;
  target: Address;
  value: bigint;
  data: Hex;
  strategyId: Hex;
  quoteId: Hex;
  maxSlippage: bigint;
}

export const AgentExecutorABI = [
  {
    type: 'function',
    name: 'execute',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'safe', type: 'address' },
          { name: 'rolesModifier', type: 'address' },
          { name: 'roleKey', type: 'bytes32' },
          { name: 'target', type: 'address' },
          { name: 'calldata', type: 'bytes' },
          { name: 'strategyId', type: 'bytes32' },
          { name: 'quoteId', type: 'bytes32' },
          { name: 'maxSlippage', type: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

export function buildAgentExecutorCall(params: SafeExecutionParams): Hex {
  return encodeFunctionData({
    abi: AgentExecutorABI,
    functionName: 'execute',
    args: [params],
  });
}
```

```typescript
// packages/sdk/src/safe/roles.ts
import { Address, Hex, PublicClient } from 'viem';

export interface RolesPermission {
  target: Address;
  selector: Hex;
  paramConditions: Hex[];
  delegateCall: boolean;
}

export async function checkRolePermission(
  client: PublicClient,
  rolesModifier: Address,
  account: Address,
  roleKey: Hex,
  target: Address,
  selector: Hex
): Promise<boolean> {
  // Check if the account has permission for this action
  // Implementation depends on Zodiac Roles version
  return true; // Placeholder
}

export function encodeRoleKey(roleName: string): Hex {
  // Convert role name to bytes32
  const encoder = new TextEncoder();
  const bytes = encoder.encode(roleName);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex.padEnd(64, '0')}` as Hex;
}
```

#### 7. Treasury Agent Safe Mode

```typescript
// agents/treasury-agent/src/modes/safeMode.ts
import { createWalletClient, createPublicClient, http, Address, Hex } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { Env } from '../index';

interface SafeModeConfig {
  safe: Address;
  rolesModifier: Address;
  roleKey: Hex;
  agentExecutor: Address;
}

interface TradeParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  strategyId: Hex;
  quoteId: Hex;
  maxSlippage: bigint;
}

export async function executeSafeMode(
  env: Env,
  config: SafeModeConfig,
  trade: TradeParams
): Promise<{ success: boolean; txHash?: Hex; error?: string }> {
  const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  try {
    // 1. Build swap calldata (for UniversalRouter)
    const swapCalldata = buildSwapCalldata(trade);

    // 2. Build AgentExecutor.execute() call
    const executorCalldata = buildAgentExecutorCall({
      safe: config.safe,
      rolesModifier: config.rolesModifier,
      roleKey: config.roleKey,
      target: env.UNIVERSAL_ROUTER as Address,
      calldata: swapCalldata,
      strategyId: trade.strategyId,
      quoteId: trade.quoteId,
      maxSlippage: trade.maxSlippage,
    });

    // 3. Send transaction to AgentExecutor
    const txHash = await walletClient.sendTransaction({
      to: config.agentExecutor,
      data: executorCalldata,
    });

    // 4. Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      success: receipt.status === 'success',
      txHash,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

function buildSwapCalldata(trade: TradeParams): Hex {
  // Build UniversalRouter swap calldata
  // Implementation depends on v4 routing
  return '0x' as Hex;
}

function buildAgentExecutorCall(params: any): Hex {
  // Encode AgentExecutor.execute() call
  return '0x' as Hex;
}
```

#### 8. Dashboard Updates for DAO Mode

```typescript
// apps/dashboard/components/treasury/SafeStatus.tsx
'use client';

import { Address } from 'viem';
import { useReadContract } from 'wagmi';
import { Badge } from '@/components/ui/Badge';

interface SafeStatusProps {
  safeAddress: Address;
  rolesModifier: Address;
  roleKey: `0x${string}`;
}

export function SafeStatus({ safeAddress, rolesModifier, roleKey }: SafeStatusProps) {
  // Check Safe configuration and role status

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <h4 className="text-sm font-semibold mb-3">Safe Configuration</h4>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Safe Address</span>
          <span className="font-mono">{safeAddress.slice(0, 10)}...</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Roles Modifier</span>
          <Badge variant="green">Active</Badge>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Agent Role</span>
          <span className="font-mono">{roleKey.slice(0, 10)}...</span>
        </div>
      </div>
    </div>
  );
}
```

## Acceptance Criteria

### AgentExecutor
- [ ] Deploys and integrates with Zodiac Roles Modifier
- [ ] Executes transactions through Safe correctly
- [ ] Emits ExecutionAttempted and ExecutionReverted events
- [ ] Reverts on permission denied (Roles check fails)
- [ ] hookData injected for ReceiptHook attribution

### ReputationRegistry
- [ ] Records executions from authorized sources
- [ ] Calculates running averages correctly
- [ ] getScore() returns composite 0-100 score
- [ ] Only authorized recorders can record
- [ ] Emits ReputationUpdated events

### Integration
- [ ] treasury-agent supports both intent-only and safe-roles modes
- [ ] Dashboard shows Safe status for Mode B agents
- [ ] Receipts include enforcement backend info

## Deployment Commands

```bash
# Deploy AgentExecutor
forge script script/03_DeployAgentExecutor.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Deploy ReputationRegistry
forge script script/04_DeployReputationRegistry.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

## Post-Deployment

1. Update `.env`:
   - `AGENT_EXECUTOR_ADDRESS=0x...`
   - `REPUTATION_REGISTRY_ADDRESS=0x...`

2. Authorize the indexer to record reputations:
   ```solidity
   reputationRegistry.setAuthorizedRecorder(indexerAddress, true);
   ```

3. For DAO testing, deploy a test Safe and configure Roles:
   - Deploy Safe via Safe Factory
   - Enable Roles Modifier as Safe module
   - Assign agent executor the treasury role
   - Set ENS records for Mode B agent
