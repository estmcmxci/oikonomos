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
  ReputationRegistryABI,
  giveFeedback,
  getSummary,
  readFeedback,
  getClients,
  revokeFeedback,
  decodeNewFeedbackLog,
  submitExecutionFeedback,
  type FeedbackSummary,
  type FeedbackEntry,
  type FeedbackParams,
  type ExecutionFeedbackParams,
} from './contracts';

// Services
export {
  submitReceiptFeedback,
  batchSubmitReceiptFeedback,
  calculateSlippageScore,
  type ExecutionReceiptData,
  type ReputationServiceConfig,
} from './services';

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
  ERC8004_ADDRESSES,
  getERC8004Addresses,
} from '@oikonomos/shared';
