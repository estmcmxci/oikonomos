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
  generateERC8004Record,
  parseERC8004Record,
  resolveAgentERC8004,
  type ERC8004Record,
} from './ens';

// Agents
export {
  buildRegistrationJSON,
  buildAgentRegistrationJSON,
  parseAgentRegistrationJSON,
  buildTreasuryAgentRegistration,
  buildStrategyAgentRegistration,
  type AgentType,
  type AgentService,
  type ERC8004RegistrationJSON,
  type BuildRegistrationParams,
} from './agents';

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
