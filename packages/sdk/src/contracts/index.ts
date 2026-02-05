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
} from './identityRegistry';

export {
  IntentRouterABI,
  IntentRouterExtendedABI,
  getNonce,
  getDomainSeparator,
  executeIntent,
} from './intentRouter';

export {
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
} from './reputationRegistry';
