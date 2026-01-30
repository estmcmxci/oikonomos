# ERC-8004 Contracts

> Context file for Oikonomos integration with ERC-8004 Trustless Agents protocol

## Overview

ERC-8004 provides three on-chain registries for agent discovery and trust:
- **Identity Registry**: ERC-721 based agent registration
- **Reputation Registry**: Feedback signals and aggregation
- **Validation Registry**: Third-party validator attestations

**Repository**: `/Users/oakgroup/Desktop/webdev/ethglobal/erc-8004-contracts`
**Spec**: [ERC-8004 Full Specification](https://eips.ethereum.org/EIPS/eip-8004)
**Website**: https://www.8004.org

## Agent Scaffolding with create-8004-agent

Use the `create-8004-agent` CLI to scaffold ERC-8004 compliant agent services with A2A, MCP, and x402 support.

### Installation

```bash
npm create 8004-agent@latest
```

### Scaffolded Structure

```
agent/
├── package.json
├── .env.example
├── registration.json          # ERC-8004 metadata (agentURI target)
├── tsconfig.json
├── src/
│   ├── register.ts            # On-chain ERC-8004 registration
│   ├── agent.ts               # LLM agent logic (OpenAI integration)
│   ├── a2a-server.ts          # A2A protocol server (JSON-RPC 2.0)
│   ├── mcp-server.ts          # MCP protocol server (stdio)
│   └── tools.ts               # Custom MCP tools
└── .well-known/
    └── agent-card.json        # A2A discovery card
```

### Protocol Stack

| Protocol | Layer | Purpose in Oikonomos |
|----------|-------|---------------------|
| **A2A** | Transport | Strategy ↔ Executor coordination, inter-agent task delegation |
| **MCP** | Tools | Expose Treasury Autopilot capabilities to Claude, GPT, etc. |
| **x402** | Payments | Paid strategy quotes, MEV-aware execution planning (v1) |
| **ERC-8004** | Identity/Trust | On-chain registration, reputation, validation |

### Oikonomos Module Mapping

**Decision**: One scaffold per module, deployed to Cloudflare Workers

| ENS Name | Scaffold | A2A Role | MCP Tools | x402 Services |
|----------|----------|----------|-----------|---------------|
| `treasury.brand.eth` | treasury-agent | Receives rebalance requests | `check_policy`, `get_rebalance_plan` | — |
| `router.brand.eth` | router-agent | Receives execution tasks | `execute_swap`, `emit_receipt` | — |
| `strategy.X.brand.eth` | strategy-agent | Proposes quotes/plans | `generate_quote`, `explain_plan` | Quote generation, monitoring |

### Mapping Scaffold → Oikonomos Architecture

| Scaffolded File | Oikonomos Use | Notes |
|-----------------|---------------|-------|
| `registration.json` | Agent Record mirror | ENS text records remain canonical; this mirrors for ERC-8004 interop |
| `register.ts` | Optional ERC-8004 bridge | Only needed for Reputation/Validation registry access |
| `agent.ts` | **Decision engine** | Policy evaluation, drift detection, trigger logic |
| `a2a-server.ts` | **Inter-module coordination** | Strategy → Router task delegation |
| `mcp-server.ts` | **External tool exposure** | Claude/GPT can invoke agent capabilities |
| `tools.ts` | **Core operations** | Swap execution, policy checks, receipt generation |
| `.well-known/agent-card.json` | A2A discovery | Complements ENS metadata for A2A-native clients |

### Cloudflare Workers Deployment

**Decision**: Deploy agent services to Cloudflare Workers

```bash
# Install Wrangler CLI
npm install -g wrangler

# Initialize worker
wrangler init treasury-agent

# Deploy
wrangler deploy
```

**Benefits**:
- Native x402 support (Cloudflare champions the standard)
- Edge deployment (low latency globally)
- Durable Objects for state management
- KV for caching quotes/receipts

**Considerations**:
- MCP stdio transport doesn't work in Workers; use HTTP adapter
- A2A server works natively over HTTP
- x402 uses `@x402/evm` with USDC on supported networks

### ENS-Native Adaptation

Since ENS is our primary identity layer, we adapt the scaffold:

1. **Discovery flow**: Clients resolve `treasury.brand.eth` → ENS text records → Agent Record JSON. The `registration.json` mirrors this, not the source of truth.

2. **ERC-8004 registration is optional**: Only call `register.ts` when needing:
   - Submit receipts to Reputation Registry
   - Request validation via Validation Registry
   - Interoperate with systems requiring ERC-8004 `agentId`

3. **ENS records reference ERC-8004**: When bridged, ENS text record `agent:erc8004` contains `eip155:<chainId>:<registryAddress>:<agentId>`.

### Example: Treasury Autopilot Tools (tools.ts)

```typescript
// MCP tools for Treasury Autopilot
export const tools = {
  check_policy: {
    description: "Validate an intent against treasury policy",
    parameters: {
      intent: { type: "object", description: "The rebalance intent" }
    },
    handler: async ({ intent }) => {
      // Policy validation logic
      return { valid: true, constraints: [...] };
    }
  },

  get_rebalance_plan: {
    description: "Generate a rebalance plan for current portfolio",
    parameters: {
      portfolio: { type: "object" },
      targetAllocation: { type: "object" }
    },
    handler: async ({ portfolio, targetAllocation }) => {
      // Rebalance calculation
      return { swaps: [...], expectedSlippage: 0.1 };
    }
  },

  execute_swap: {
    description: "Execute a swap via Uniswap v4",
    parameters: {
      swapParams: { type: "object" }
    },
    handler: async ({ swapParams }) => {
      // Calls router contract
      return { receipt: {...}, txHash: "0x..." };
    }
  }
};
```

### Related SDKs

- **agent0-ts**: TypeScript SDK for programmatic ERC-8004 registration
- **@x402/evm**: x402 payment handling for EVM chains
- **Coinbase x402**: Micropayments with USDC

## Contract Addresses

| Chain | Identity Registry | Reputation Registry |
|-------|-------------------|---------------------|
| Mainnet | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Sepolia | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Base Sepolia | TBD | TBD |

**Note**: Validation Registry addresses not yet deployed on public networks.

## Architecture Decisions for Oikonomos

### Two-Layer Identity Model
**Decision**: ENS for user-facing identity, agentId for registry access

| Layer | Purpose | Identifier | Visibility |
|-------|---------|------------|------------|
| **User-facing** | Discovery, addressing, human-readable | ENS name (`treasury.brand.eth`) | Public, primary |
| **Registry-access** | ERC-8004 Reputation/Validation | agentId (`uint256`) | Internal, implementation detail |

**Why two layers?**
- ERC-8004 Reputation and Validation registries require a valid `agentId` (they call `ownerOf()` and `isAuthorizedOrOwner()` on the Identity Registry)
- ENS provides human-readable names, but the registries need numeric IDs
- Similar to DNS (domain names) vs IP addresses (numeric)

**The bridge**: ENS text record `agent:erc8004` maps between the two identity systems.

**Workflow**:
1. Agent registers with ENS (`treasury.brand.eth`) - this is the canonical identity
2. Agent mints ERC-8004 agentId via `register()` - required for registry access
3. ENS text record `agent:erc8004` stores: `eip155:{chainId}:{registryAddress}:{agentId}`
4. Discovery: Resolve ENS → read text record → extract agentId → query Reputation/Validation
5. Users never see the agentId; they interact via ENS names

### Reputation Metrics
**Decision**: Both execution quality AND policy compliance

Receipts feed into Reputation Registry with multiple feedback entries per execution:

| Tag1 | Tag2 | Value | Description |
|------|------|-------|-------------|
| `execution` | `slippage` | 0-100 | 100 = no slippage, 0 = hit cap |
| `execution` | `gas` | 0-100 | Gas efficiency score |
| `execution` | `price_impact` | 0-100 | 100 = minimal impact |
| `compliance` | `policy` | 0 or 100 | Binary pass/fail |
| `compliance` | `revert` | 0 or 100 | 100 = no revert |

### Validation Approach
**Decision**: Simple attestation for v0, scaffold for TEE/zkML in v1

v0: Basic validator that attests receipts are well-formed
v1: TEE attestation or zkML proofs for execution verification

## Contracts Reference

### IdentityRegistryUpgradeable.sol

ERC-721 with URIStorage for agent registration.

```solidity
// Register a new agent (mints NFT)
function register() external returns (uint256 agentId);
function register(string memory agentURI) external returns (uint256 agentId);
function register(string memory agentURI, MetadataEntry[] memory metadata) external returns (uint256 agentId);

// Update agent URI
function setAgentURI(uint256 agentId, string calldata newURI) external;

// On-chain metadata (key-value store)
function getMetadata(uint256 agentId, string memory metadataKey) external view returns (bytes memory);
function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue) external;

// Agent wallet (payment address) - requires signature proof
function getAgentWallet(uint256 agentId) external view returns (address);
function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes calldata signature) external;

// Authorization check (used by Reputation/Validation registries)
function isAuthorizedOrOwner(address spender, uint256 agentId) external view returns (bool);
```

**Events**:
- `Registered(uint256 indexed agentId, string agentURI, address indexed owner)`
- `MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)`
- `URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)`

**Important**: `agentWallet` is cleared on NFT transfer for security.

### ReputationRegistryUpgradeable.sol

Stores feedback signals as signed fixed-point numbers.

```solidity
// Submit feedback (reverts if caller is agent owner/operator)
function giveFeedback(
    uint256 agentId,
    int128 value,           // Signed value (-1e38 to 1e38)
    uint8 valueDecimals,    // 0-18 decimal places
    string calldata tag1,   // Primary categorization
    string calldata tag2,   // Secondary categorization
    string calldata endpoint,
    string calldata feedbackURI,
    bytes32 feedbackHash
) external;

// Revoke your own feedback
function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external;

// Read single feedback entry
function readFeedback(uint256 agentId, address clientAddress, uint64 feedbackIndex)
    external view returns (int128 value, uint8 valueDecimals, string memory tag1, string memory tag2, bool isRevoked);

// Aggregate feedback (requires clientAddresses to reduce Sybil risk)
function getSummary(
    uint256 agentId,
    address[] calldata clientAddresses,  // REQUIRED - cannot be empty
    string calldata tag1,
    string calldata tag2
) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals);

// Batch read
function readAllFeedback(
    uint256 agentId,
    address[] calldata clientAddresses,
    string calldata tag1,
    string calldata tag2,
    bool includeRevoked
) external view returns (...);

// Get all clients who gave feedback
function getClients(uint256 agentId) external view returns (address[] memory);
```

**Events**:
- `NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, int128 value, uint8 valueDecimals, string indexed indexedTag1, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)`
- `FeedbackRevoked(uint256 indexed agentId, address indexed clientAddress, uint64 indexed feedbackIndex)`

**Security**: Self-feedback is blocked. The contract checks `isAuthorizedOrOwner()` on the Identity Registry.

### ValidationRegistryUpgradeable.sol

Request/response pattern for third-party validators.

```solidity
// Request validation (must be agent owner/operator)
function validationRequest(
    address validatorAddress,   // Who should validate
    uint256 agentId,
    string calldata requestURI, // Off-chain data (inputs/outputs)
    bytes32 requestHash         // Commitment to request payload
) external;

// Submit validation response (must be the requested validator)
function validationResponse(
    bytes32 requestHash,
    uint8 response,             // 0-100 scale (0=failed, 100=passed)
    string calldata responseURI,
    bytes32 responseHash,
    string calldata tag
) external;

// Read validation status
function getValidationStatus(bytes32 requestHash)
    external view returns (address validatorAddress, uint256 agentId, uint8 response, bytes32 responseHash, string memory tag, uint256 lastUpdate);

// Aggregate validations
function getSummary(
    uint256 agentId,
    address[] calldata validatorAddresses,
    string calldata tag
) external view returns (uint64 count, uint8 avgResponse);

// List validations for agent/validator
function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory);
function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory);
```

**Events**:
- `ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestURI, bytes32 indexed requestHash)`
- `ValidationResponse(address indexed validatorAddress, uint256 indexed agentId, bytes32 indexed requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag)`

## Integration with Oikonomos

### Registration Flow

```typescript
// 1. Register ENS name (primary identity)
// treasury.brand.eth -> set text records

// 2. Mint ERC-8004 agentId (for registry access)
const agentId = await identityRegistry.register(agentURI);

// 3. Link in ENS
// Set text record: agent:erc8004 = "eip155:11155111:0x8004A818...:42"
```

### Receipt → Reputation Flow

```typescript
// After successful execution, submit feedback from a non-owner address
// (e.g., the user who requested the rebalance, or a monitoring service)

async function submitReceiptToReputation(
  agentId: bigint,
  receipt: ExecutionReceipt
) {
  // Execution quality feedback
  await reputationRegistry.giveFeedback(
    agentId,
    calculateSlippageScore(receipt),  // 0-100
    0,  // decimals
    "execution",
    "slippage",
    "",  // endpoint
    receipt.ipfsUri,
    receipt.hash
  );

  // Policy compliance feedback
  await reputationRegistry.giveFeedback(
    agentId,
    receipt.policyPassed ? 100n : 0n,
    0,
    "compliance",
    "policy",
    "",
    receipt.ipfsUri,
    receipt.hash
  );
}
```

### Validation Flow (v0 - Simple Attestation)

```typescript
// Agent owner requests validation of a receipt batch
const requestHash = keccak256(encodeReceiptBatch(receipts));

await validationRegistry.validationRequest(
  VALIDATOR_ADDRESS,
  agentId,
  `ipfs://${receiptBatchCid}`,
  requestHash
);

// Validator (separate service) verifies and responds
await validationRegistry.validationResponse(
  requestHash,
  100,  // passed
  `ipfs://${attestationCid}`,
  attestationHash,
  "receipt-attestation"
);
```

### Value/Decimals Interpretation

The `value` + `valueDecimals` pair represents a signed decimal:

| Example | value | decimals | Meaning |
|---------|-------|----------|---------|
| Score 87/100 | 87 | 0 | `87` |
| Uptime 99.77% | 9977 | 2 | `99.77` |
| Binary pass | 1 | 0 | `true` |
| Slippage -0.15% | -15 | 2 | `-0.15` |

## File Structure

```
erc-8004-contracts/
├── contracts/
│   ├── IdentityRegistryUpgradeable.sol
│   ├── ReputationRegistryUpgradeable.sol
│   ├── ValidationRegistryUpgradeable.sol
│   ├── MinimalUUPS.sol              # Upgrade logic
│   └── ERC1967Proxy.sol
├── abis/
│   ├── IdentityRegistry.json
│   ├── ReputationRegistry.json
│   └── ValidationRegistry.json
├── scripts/
│   ├── deploy-vanity.ts
│   └── verify-vanity.ts
├── test/
│   ├── core.ts
│   └── upgradeable.ts
├── ERC8004SPEC.md                   # Full protocol spec
└── README.md
```

## ABIs Location

Pre-built ABIs for integration:
- `/Users/oakgroup/Desktop/webdev/ethglobal/erc-8004-contracts/abis/IdentityRegistry.json`
- `/Users/oakgroup/Desktop/webdev/ethglobal/erc-8004-contracts/abis/ReputationRegistry.json`
- `/Users/oakgroup/Desktop/webdev/ethglobal/erc-8004-contracts/abis/ValidationRegistry.json`

## Constraints & Gotchas

1. **agentId required**: Reputation and Validation registries require a valid agentId. Cannot skip Identity Registry entirely.

2. **Self-feedback blocked**: Agent owner/operators cannot submit feedback for their own agent. Use a separate address (user, monitoring service) for feedback submission.

3. **clientAddresses required for getSummary**: The aggregation function requires explicit client addresses to reduce Sybil attack surface.

4. **agentWallet cleared on transfer**: If NFT ownership changes, the payment wallet is cleared and must be re-verified.

5. **Validation Registry still evolving**: The spec notes this is under active discussion with TEE community. v0 should use simple attestation.

## References

**ERC-8004 Core**:
- [ERC-8004 Specification](./ERC8004SPEC.md)
- [8004.org](https://www.8004.org)
- [Ethereum Magicians Discussion](https://ethereum-magicians.org/t/erc-8004-trustless-agents/25098)
- [8004scan Explorer](https://www.8004scan.io/)

**Scaffolding & SDKs**:
- [create-8004-agent (npm)](https://www.npmjs.com/package/create-8004-agent)
- [agent0-ts SDK](https://github.com/agent0lab/agent0-ts)
- [Awesome ERC-8004](https://github.com/sudeepb02/awesome-erc8004)

**Protocol Stack**:
- [A2A Protocol](https://a2a-protocol.org/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [x402 Payment Protocol](https://payram.com/blog/mcp-a2a-ap2-acp-x402-erc-8004)

**Deployment**:
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [@x402/evm](https://www.npmjs.com/package/@x402/evm)
