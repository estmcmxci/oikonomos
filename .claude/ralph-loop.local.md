# Ralph Loop Progress: Unified Treasury Platform

## Status: Phases 1-5 COMPLETE

## Completed Tasks

### Phase 1: Extended Portfolio Discovery ✅
- Created `agents/treasury-agent/src/suggestion/clawnch.ts`
  - `discoverAgentTokens()` - Query Clawnch API + FeeLocker for agent tokens
  - `getAggregateFees()` - Calculate total unclaimed fees
  - `getAgentWallets()` / `saveAgentWallets()` - KV storage for agent wallets
- Updated `agents/treasury-agent/src/suggestion/handler.ts`
  - Extended `/suggest-policy` to include agent tokens and fees in response
  - New response fields: `agentTokens`, `unclaimedFees`

### Phase 2: Unified Policy Schema ✅
- Updated `agents/treasury-agent/src/policy/templates.ts`
  - Added `UnifiedPolicy` type with:
    - `stablecoinRebalance` - Drift-based rebalancing config
    - `feeClaiming` - Frequency and threshold config
    - `wethStrategy` - Compound/toStables/hold percentages
    - `tokenStrategy` - Exit losers, hold winners config
  - Added `PolicyType` union type
  - Added validation helpers
- Updated `agents/treasury-agent/src/suggestion/matcher.ts`
  - Added `matchUnifiedPolicy()` function
  - Added `prepareUnifiedContext()` helper

### Phase 3: Fee Claiming Execution ✅
- Created `agents/treasury-agent/src/execute/feeClaim.ts`
  - `executeFeeClaim()` - Claim fees for single token
  - `executeClaimAll()` - Claim fees for multiple tokens efficiently
  - `getAgentPrivateKey()` - Retrieve agent key from KV
- Created `agents/treasury-agent/src/execute/wethDistribution.ts`
  - `distributeWeth()` - Split WETH per policy (compound/toStables/hold)
  - `calculateDistribution()` - Calculate amounts
  - Swap to USDC placeholder (needs IntentRouter integration)

### Phase 4: Trigger System ✅
- Created `agents/treasury-agent/src/triggers/unified.ts`
  - `checkAllTriggers()` - Check stablecoin drift, fees, exit conditions
  - `checkFeeThreshold()` - Check if fee threshold met
  - `checkExitConditions()` - Check for underperforming tokens
  - `shouldClaimByFrequency()` - Check claim timing
  - Last claim time KV storage

### Phase 5: Agent Launcher ✅
- Created `agents/treasury-agent/src/launch/keychain.ts`
  - `generateAgentWallet()` - Deterministic wallet from user + name
  - `deriveNostrKeys()` - Derive Nostr keys for Clawstr
  - `storeAgentKeys()` / `getStoredAgent()` - Secure KV storage
  - `listUserAgentDetails()` - List all user's agents
- Created `agents/treasury-agent/src/launch/handler.ts`
  - `handleLaunchAgent()` - POST /launch-agent endpoint
  - `handleListAgents()` - GET /agents endpoint
- Updated `agents/treasury-agent/src/index.ts`
  - Added `/launch-agent` and `/agents` routes

## New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/suggest-policy` | POST | Now returns unified portfolio with agent tokens + fees |
| `/launch-agent` | POST | Create new agent wallet + prepare token launch |
| `/agents` | GET | List user's agents |

## Files Created/Modified

### Created
- `src/suggestion/clawnch.ts`
- `src/execute/feeClaim.ts`
- `src/execute/wethDistribution.ts`
- `src/triggers/unified.ts`
- `src/launch/keychain.ts`
- `src/launch/handler.ts`

### Modified
- `src/suggestion/handler.ts` - Extended for agent tokens
- `src/suggestion/matcher.ts` - Added unified policy matching
- `src/policy/templates.ts` - Added UnifiedPolicy type
- `src/index.ts` - Added new routes

## Remaining Work (Phase 6-7)

### Phase 6: Dashboard Updates (SKIPPED per instructions)
- Agent tokens section
- Fee summary component
- Agent launcher page

### Phase 7: Indexer Updates (Optional)
- `feeClaim` table for FeesClaimed events
- `agentToken` table for launched tokens
- ClankerFeeLocker contract indexing

## Build Status
- ✅ Build passes (`wrangler deploy --dry-run` successful)
- Fixed pre-existing missing exports in `config/pools.ts`
- Added legacy compatibility stubs: `requirePoolForPair`, `SUPPORTED_POOLS`, `PoolConfig`
