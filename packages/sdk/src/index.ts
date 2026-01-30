// Contracts
export {
  ReceiptHookABI,
  decodeReceiptLog,
  getReceipts,
  getReceiptsByStrategy,
  getReceiptsByUser,
  IdentityRegistryABI,
  IdentityRegistryExtendedABI,
  registerAgent,
  getAgent,
  updateAgentWallet,
  decodeAgentRegisteredLog,
  type AgentData,
  IntentRouterABI,
  IntentRouterExtendedABI,
  getNonce,
  getDomainSeparator,
  executeIntent,
} from './contracts';

// ENS
export {
  resolveAgent,
  ensNameToStrategyId,
  getNamehash,
  getEnsAddress,
  getEnsText,
} from './ens';

// Intents
export {
  buildIntent,
  buildIntentWithStrategyId,
  isIntentExpired,
  getIntentHash,
  type BuildIntentParams,
  signIntent,
  getIntentTypedData,
  getIntentDomain,
  INTENT_TYPES,
} from './intents';

// Re-export shared types and constants
export {
  type AgentRecord,
  type ExecutionReceipt,
  type Intent,
  type PoolKey,
  CHAIN_ID,
  ADDRESSES,
  ENS_RECORDS,
} from '@oikonomos/shared';
