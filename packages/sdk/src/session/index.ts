// Smart account creation
export {
  createSmartAccount,
  recoverSmartAccount,
  getPasskeyValidator,
  type CreateSmartAccountParams,
  type RecoverSmartAccountParams,
} from './smartAccount';

// Session key creation
export {
  createSessionKey,
  type CreateSessionKeyParams,
} from './createSessionKey';

// Permission validation
export {
  validateSessionPermissions,
  isOperationAllowed,
  createDefaultSessionConfig,
  type ValidationResult,
} from './validatePermissions';

// Constants
export { OIKONOMOS_PERMISSION_SCOPE } from './constants';

// Types
export type {
  SessionKey,
  SessionKeyConfig,
  SmartAccountInfo,
  PermissionEntry,
} from './types';

// Re-export useful ZeroDev types
export { WebAuthnMode } from '@zerodev/passkey-validator';
export { deserializeSessionKeyAccount } from '@zerodev/session-key';
