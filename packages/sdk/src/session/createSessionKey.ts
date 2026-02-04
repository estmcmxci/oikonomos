import { createKernelAccount } from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import {
  signerToSessionKeyValidator,
  serializeSessionKeyAccount,
} from '@zerodev/session-key';
import { type PublicClient, type LocalAccount } from 'viem';
import type { SessionKey, SessionKeyConfig } from './types';
import type { KernelValidator } from '@zerodev/passkey-validator';

export interface CreateSessionKeyParams {
  publicClient: PublicClient;
  config: SessionKeyConfig;
  /** The agent's signer (private key account) */
  agentSigner: LocalAccount;
  /** Passkey validator from getPasskeyValidator() */
  passkeyValidator: KernelValidator<'WebAuthnValidator'>;
}

const ENTRYPOINT_V07 = getEntryPoint('0.7');

/**
 * Creates a scoped session key for autonomous agent execution
 */
export async function createSessionKey(
  params: CreateSessionKeyParams
): Promise<SessionKey> {
  const { publicClient, config, agentSigner, passkeyValidator } = params;

  // Build permission list from config
  const permissions = config.allowedTargets.flatMap((target) =>
    config.allowedFunctions.map((functionName) => ({
      target,
      functionName,
      valueLimit: 0n,
    }))
  );

  // Create session key validator
  const sessionKeyValidator = await signerToSessionKeyValidator(publicClient, {
    signer: agentSigner,
    entryPoint: ENTRYPOINT_V07,
    kernelVersion: KERNEL_V3_1,
    validatorData: {
      permissions,
      validAfter: config.validAfter,
      validUntil: config.validUntil,
      paymaster: config.maxGasCost ? undefined : undefined, // Paymaster address if using sponsored gas
    },
  });

  // Create session-enabled kernel account
  const sessionAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: passkeyValidator,
      regular: sessionKeyValidator,
    },
    entryPoint: ENTRYPOINT_V07,
    kernelVersion: KERNEL_V3_1,
  });

  // Serialize the session key account for storage
  const serialized = await serializeSessionKeyAccount(sessionAccount);

  return {
    address: config.agentAddress,
    serialized: serialized as `0x${string}`,
    config,
    smartAccountAddress: sessionAccount.address,
  };
}
