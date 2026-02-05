// Contracts
export {
  IdentityRegistryABI,
  registerAgent,
  registerAgentWithAddress,
  getAgentURI,
  getAgentOwner,
  getAgentWallet,
  setAgentURI,
  decodeRegisteredLog,
  extractAgentIdFromTransferLog,
  createAgentURI,
  parseAgentURI,
  getIdentityRegistryAddress,
  type ERC8004Registration,
  type ERC8004Service,
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
  // Clawnch integration
  ClawnchService,
  createClawnchService,
  type LaunchedToken,
  type TokenAnalytics,
  type LaunchParams,
  type LaunchResult,
  // Fee Locker integration
  FeeLockerService,
  createFeeLockerService,
  ClankerFeeLockerABI,
  FEE_LOCKER_ADDRESS,
  WETH_ADDRESS,
  type TokenFeeInfo,
  type AggregateFeeInfo,
  type ClaimResult,
} from './services';

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
  setEnsText,
  setAgentERC8004Record,
  formatERC8004Record,
  getPublicResolverAddress,
  buildSetTextCalldata,
  type ERC8004Record,
  // CCIP Subnames
  validateLabel,
  getFullSubname,
  getSubnameNamehash,
  isSubnameAvailable,
  getSubnameRecord,
  registerSubname,
  computeOikonomosParentNode,
  SEPOLIA_CCIP_CONFIG,
  OffchainSubnameManagerABI,
  type SubnameRegistrationParams,
  type CCIPConfig,
  type SubnameRecord,
} from './ens';

// Validation
export {
  validateEndpointFormat,
  validateA2AEndpoint,
  validateENSName,
  validateWebEndpoint,
  type ValidationResult,
} from './validation';

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

// Session Keys (ZeroDev)
export {
  createSmartAccount,
  recoverSmartAccount,
  getPasskeyValidator,
  createSessionKey,
  validateSessionPermissions,
  isOperationAllowed,
  createDefaultSessionConfig,
  OIKONOMOS_PERMISSION_SCOPE,
  type CreateSmartAccountParams,
  type RecoverSmartAccountParams,
  type CreateSessionKeyParams,
  type SessionKey,
  type SessionKeyConfig,
  type SmartAccountInfo,
  type PermissionEntry,
  type ValidationResult as SessionValidationResult,
} from './session';

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
