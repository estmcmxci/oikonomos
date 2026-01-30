# Phase 1: Core Contracts (ReceiptHook, IdentityRegistry, IntentRouter)

## Objective

Implement and deploy the core Solidity contracts that form the trust layer of Oikonomos. ReceiptHook is the trust anchor - every other component depends on it.

## Prerequisites

- Phase 0 completed (monorepo structure, Foundry setup)
- `.env` configured with SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY

## Context Files

Read these before starting:
- `/EED.md` - Sections on Phase 1, Phase 2 (contract specs)
- `/context/uniswap-v4.md` - Uniswap v4 hooks development
- `/context/erc-8004-contracts.md` - ERC-8004 Identity standard
- `/context/eip-712.md` - Typed structured data signing
- `/context/solidity.md` - Solidity best practices

## Deliverables

### 1. ReceiptHook (Trust Anchor)

The ReceiptHook is a Uniswap v4 hook that emits `ExecutionReceipt` events after every swap. This is the foundation of the entire system.

```solidity
// packages/contracts/src/core/ReceiptHook.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/base/hooks/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

contract ReceiptHook is BaseHook {
    event ExecutionReceipt(
        bytes32 indexed strategyId,
        bytes32 indexed quoteId,
        address indexed sender,
        int128 amount0,
        int128 amount1,
        uint256 actualSlippage,
        bool policyCompliant,
        uint256 timestamp
    );

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,  // We emit receipts after swaps
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override returns (bytes4, int128) {
        // Decode hookData: (strategyId, quoteId, maxSlippage)
        if (hookData.length > 0) {
            (bytes32 strategyId, bytes32 quoteId, uint256 maxSlippage) =
                abi.decode(hookData, (bytes32, bytes32, uint256));

            // Calculate actual slippage (simplified - basis points)
            uint256 actualSlippage = _calculateSlippage(params, delta);

            emit ExecutionReceipt(
                strategyId,
                quoteId,
                sender,
                delta.amount0(),
                delta.amount1(),
                actualSlippage,
                actualSlippage <= maxSlippage,
                block.timestamp
            );
        }

        return (BaseHook.afterSwap.selector, 0);
    }

    function _calculateSlippage(
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta
    ) internal pure returns (uint256) {
        // Simplified slippage calculation
        // In production, compare against sqrtPriceLimitX96 or oracle price
        int256 amountSpecified = params.amountSpecified;
        int128 actualAmount = params.zeroForOne ? delta.amount1() : delta.amount0();

        if (amountSpecified == 0) return 0;

        // Return slippage in basis points (0-10000)
        uint256 expected = uint256(amountSpecified > 0 ? amountSpecified : -amountSpecified);
        uint256 actual = uint256(actualAmount > 0 ? int256(actualAmount) : -int256(actualAmount));

        if (actual >= expected) return 0;
        return ((expected - actual) * 10000) / expected;
    }
}
```

### 2. HookDataLib (Encoding/Decoding)

```solidity
// packages/contracts/src/libraries/HookDataLib.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library HookDataLib {
    function encode(
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 maxSlippage
    ) internal pure returns (bytes memory) {
        return abi.encode(strategyId, quoteId, maxSlippage);
    }

    function decode(bytes calldata hookData) internal pure returns (
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 maxSlippage
    ) {
        return abi.decode(hookData, (bytes32, bytes32, uint256));
    }

    function strategyIdFromEns(string memory ensName) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(ensName));
    }
}
```

### 3. IdentityRegistry (ERC-8004 Compliant)

```solidity
// packages/contracts/src/identity/IdentityRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract IdentityRegistry is ERC721, EIP712 {
    using ECDSA for bytes32;

    struct Agent {
        string agentURI;
        address agentWallet;
        uint256 registeredAt;
    }

    mapping(uint256 => Agent) public agents;
    uint256 public nextAgentId;

    bytes32 private constant WALLET_UPDATE_TYPEHASH =
        keccak256("WalletUpdate(uint256 agentId,address newWallet,uint256 nonce)");
    mapping(uint256 => uint256) public nonces;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI);
    event AgentWalletUpdated(uint256 indexed agentId, address indexed oldWallet, address indexed newWallet);
    event AgentURIUpdated(uint256 indexed agentId, string newURI);

    constructor() ERC721("Oikonomos Agent", "OIKO") EIP712("OikonomosIdentity", "1") {}

    function register(
        string calldata agentURI,
        bytes calldata /* metadata */
    ) external returns (uint256 agentId) {
        agentId = nextAgentId++;

        agents[agentId] = Agent({
            agentURI: agentURI,
            agentWallet: msg.sender,
            registeredAt: block.timestamp
        });

        _mint(msg.sender, agentId);

        emit AgentRegistered(agentId, msg.sender, agentURI);
    }

    function updateAgentWallet(
        uint256 agentId,
        address newWallet,
        bytes calldata signature
    ) external {
        require(_ownerOf(agentId) != address(0), "Agent does not exist");

        // Verify signature from current wallet or owner
        bytes32 structHash = keccak256(abi.encode(
            WALLET_UPDATE_TYPEHASH,
            agentId,
            newWallet,
            nonces[agentId]++
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        require(
            signer == agents[agentId].agentWallet || signer == ownerOf(agentId),
            "Invalid signature"
        );

        address oldWallet = agents[agentId].agentWallet;
        agents[agentId].agentWallet = newWallet;

        emit AgentWalletUpdated(agentId, oldWallet, newWallet);
    }

    function updateAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender, "Not owner");
        agents[agentId].agentURI = newURI;
        emit AgentURIUpdated(agentId, newURI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Agent does not exist");
        return agents[tokenId].agentURI;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(_ownerOf(agentId) != address(0), "Agent does not exist");
        return agents[agentId];
    }
}
```

### 4. IntentRouter (Mode A - Intent-First Execution)

```solidity
// packages/contracts/src/policy/IntentRouter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {HookDataLib} from "../libraries/HookDataLib.sol";

contract IntentRouter is EIP712 {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    struct Intent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 maxSlippage; // basis points (100 = 1%)
        uint256 deadline;
        bytes32 strategyId;
        uint256 nonce;
    }

    IPoolManager public immutable poolManager;

    bytes32 private constant INTENT_TYPEHASH = keccak256(
        "Intent(address user,address tokenIn,address tokenOut,uint256 amountIn,uint256 maxSlippage,uint256 deadline,bytes32 strategyId,uint256 nonce)"
    );

    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public executedIntents;

    event IntentExecuted(
        bytes32 indexed intentHash,
        address indexed user,
        bytes32 indexed strategyId,
        uint256 amountIn,
        uint256 amountOut
    );

    error InvalidSignature();
    error IntentExpired();
    error IntentAlreadyExecuted();
    error InvalidNonce();

    constructor(address _poolManager) EIP712("OikonomosIntentRouter", "1") {
        poolManager = IPoolManager(_poolManager);
    }

    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        PoolKey calldata poolKey,
        bytes calldata strategyData
    ) external returns (int256 amountOut) {
        // 1. Validate intent
        bytes32 intentHash = _hashIntent(intent);

        if (executedIntents[intentHash]) revert IntentAlreadyExecuted();
        if (block.timestamp > intent.deadline) revert IntentExpired();
        if (intent.nonce != nonces[intent.user]) revert InvalidNonce();

        // 2. Verify signature
        bytes32 digest = _hashTypedDataV4(intentHash);
        address signer = digest.recover(signature);
        if (signer != intent.user) revert InvalidSignature();

        // 3. Mark as executed
        executedIntents[intentHash] = true;
        nonces[intent.user]++;

        // 4. Transfer tokens from user
        IERC20(intent.tokenIn).safeTransferFrom(intent.user, address(this), intent.amountIn);

        // 5. Build hookData for ReceiptHook
        bytes32 quoteId = keccak256(strategyData);
        bytes memory hookData = HookDataLib.encode(
            intent.strategyId,
            quoteId,
            intent.maxSlippage
        );

        // 6. Execute swap via PoolManager
        // Note: In production, this would go through UniversalRouter
        // For MVP, we demonstrate the hookData flow
        bool zeroForOne = intent.tokenIn < intent.tokenOut;

        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: int256(intent.amountIn),
            sqrtPriceLimitX96: zeroForOne ? 4295128739 + 1 : 1461446703485210103287273052203988822378723970342 - 1
        });

        // Approve PoolManager
        IERC20(intent.tokenIn).approve(address(poolManager), intent.amountIn);

        // Execute swap (simplified - production would use callbacks)
        // The actual swap execution depends on v4 integration pattern
        // This emits ExecutionReceipt via ReceiptHook.afterSwap()

        emit IntentExecuted(intentHash, intent.user, intent.strategyId, intent.amountIn, 0);

        return 0; // Placeholder - actual amount from swap
    }

    function _hashIntent(Intent calldata intent) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            INTENT_TYPEHASH,
            intent.user,
            intent.tokenIn,
            intent.tokenOut,
            intent.amountIn,
            intent.maxSlippage,
            intent.deadline,
            intent.strategyId,
            intent.nonce
        ));
    }

    function getIntentHash(Intent calldata intent) external pure returns (bytes32) {
        return _hashIntent(intent);
    }

    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
```

### 5. Deployment Scripts

```solidity
// packages/contracts/script/00_DeployReceiptHook.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {ReceiptHook} from "../src/core/ReceiptHook.sol";
import {HookMiner} from "../test/utils/HookMiner.sol";

contract DeployReceiptHook is Script {
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        // Determine required hook flags
        uint160 flags = uint160(Hooks.AFTER_SWAP_FLAG);

        // Mine salt for hook address
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_FACTORY,
            flags,
            type(ReceiptHook).creationCode,
            abi.encode(POOL_MANAGER)
        );

        vm.startBroadcast(deployerPrivateKey);

        ReceiptHook hook = new ReceiptHook{salt: salt}(IPoolManager(POOL_MANAGER));

        require(address(hook) == hookAddress, "Hook address mismatch");

        console.log("ReceiptHook deployed at:", address(hook));

        vm.stopBroadcast();
    }
}
```

```solidity
// packages/contracts/script/01_DeployIdentity.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/identity/IdentityRegistry.sol";

contract DeployIdentity is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IdentityRegistry registry = new IdentityRegistry();

        console.log("IdentityRegistry deployed at:", address(registry));

        vm.stopBroadcast();
    }
}
```

```solidity
// packages/contracts/script/02_DeployIntentRouter.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";

contract DeployIntentRouter is Script {
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IntentRouter router = new IntentRouter(POOL_MANAGER);

        console.log("IntentRouter deployed at:", address(router));

        vm.stopBroadcast();
    }
}
```

### 6. Tests

```solidity
// packages/contracts/test/ReceiptHook.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {ReceiptHook} from "../src/core/ReceiptHook.sol";
import {HookDataLib} from "../src/libraries/HookDataLib.sol";

contract ReceiptHookTest is Test {
    ReceiptHook public hook;

    function setUp() public {
        // Deploy with mock PoolManager
        // hook = new ReceiptHook(mockPoolManager);
    }

    function test_HookDataEncoding() public {
        bytes32 strategyId = keccak256("treasury.oikonomos.eth");
        bytes32 quoteId = keccak256("quote-123");
        uint256 maxSlippage = 25; // 25 bps

        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, maxSlippage);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedSlippage) =
            HookDataLib.decode(encoded);

        assertEq(decodedStrategy, strategyId);
        assertEq(decodedQuote, quoteId);
        assertEq(decodedSlippage, maxSlippage);
    }

    function test_StrategyIdFromEns() public {
        bytes32 strategyId = HookDataLib.strategyIdFromEns("treasury.oikonomos.eth");
        assertEq(strategyId, keccak256(abi.encodePacked("treasury.oikonomos.eth")));
    }
}
```

```solidity
// packages/contracts/test/IdentityRegistry.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/identity/IdentityRegistry.sol";

contract IdentityRegistryTest is Test {
    IdentityRegistry public registry;
    address public alice = makeAddr("alice");

    function setUp() public {
        registry = new IdentityRegistry();
    }

    function test_Register() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://QmTest", "");

        assertEq(agentId, 0);
        assertEq(registry.ownerOf(0), alice);

        IdentityRegistry.Agent memory agent = registry.getAgent(0);
        assertEq(agent.agentURI, "ipfs://QmTest");
        assertEq(agent.agentWallet, alice);
    }

    function test_UpdateAgentURI() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://QmTest", "");

        vm.prank(alice);
        registry.updateAgentURI(agentId, "ipfs://QmUpdated");

        assertEq(registry.tokenURI(agentId), "ipfs://QmUpdated");
    }
}
```

## Acceptance Criteria

- [ ] ReceiptHook compiles and deploys
- [ ] ReceiptHook emits ExecutionReceipt with correct strategyId, quoteId
- [ ] HookDataLib encoding/decoding works correctly
- [ ] IdentityRegistry allows agent registration
- [ ] IdentityRegistry mints ERC-721 to registrant
- [ ] IdentityRegistry wallet updates work with EIP-712 signatures
- [ ] IntentRouter validates EIP-712 signed intents
- [ ] IntentRouter enforces deadline and nonce
- [ ] All tests pass: `forge test`
- [ ] Contracts deploy to Sepolia
- [ ] Contracts verified on Etherscan

## Deployment Commands

```bash
cd packages/contracts

# Build
forge build

# Test
forge test -vvv

# Deploy ReceiptHook
source ../../.env
forge script script/00_DeployReceiptHook.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Deploy IdentityRegistry
forge script script/01_DeployIdentity.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Deploy IntentRouter
forge script script/02_DeployIntentRouter.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

## Post-Deployment

After deployment, update `.env` with:
- `RECEIPT_HOOK_ADDRESS=0x...`
- `IDENTITY_REGISTRY_ADDRESS=0x...`
- `INTENT_ROUTER_ADDRESS=0x...`

Also update `NEXT_PUBLIC_*` versions of these addresses.
