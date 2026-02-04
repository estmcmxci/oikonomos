import { createKernelAccount } from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import {
  toPasskeyValidator,
  toWebAuthnKey,
  WebAuthnMode,
  PasskeyValidatorContractVersion,
  type KernelValidator,
} from '@zerodev/passkey-validator';
import { type PublicClient } from 'viem';
import type { SmartAccountInfo } from './types';

export interface CreateSmartAccountParams {
  publicClient: PublicClient;
  passkeyName?: string;
}

export interface RecoverSmartAccountParams extends CreateSmartAccountParams {
  passkeyId: string;
}

const ENTRYPOINT_V07 = getEntryPoint('0.7');

/**
 * Creates a new smart account with passkey authentication
 */
export async function createSmartAccount(
  params: CreateSmartAccountParams
): Promise<SmartAccountInfo> {
  const { publicClient, passkeyName = 'Oikonomos Account' } = params;

  // Create WebAuthn key (passkey) - register new passkey
  const webAuthnKey = await toWebAuthnKey({
    passkeyName,
    passkeyServerUrl: '', // Uses browser native WebAuthn
    mode: WebAuthnMode.Register,
  });

  // Create passkey validator
  const passkeyValidator = await toPasskeyValidator(publicClient, {
    webAuthnKey,
    entryPoint: ENTRYPOINT_V07,
    kernelVersion: KERNEL_V3_1,
    validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED,
  });

  // Create kernel account
  const kernelAccount = await createKernelAccount(publicClient, {
    plugins: { sudo: passkeyValidator },
    entryPoint: ENTRYPOINT_V07,
    kernelVersion: KERNEL_V3_1,
  });

  return {
    address: kernelAccount.address,
    chainId: publicClient.chain?.id ?? 1,
    isDeployed: await kernelAccount.isDeployed(),
    passkeyId: webAuthnKey.authenticatorId,
  };
}

/**
 * Recovers an existing smart account using a stored passkey
 */
export async function recoverSmartAccount(
  params: RecoverSmartAccountParams
): Promise<SmartAccountInfo> {
  const { publicClient, passkeyName = 'Oikonomos Account' } = params;

  // Login with existing passkey
  const webAuthnKey = await toWebAuthnKey({
    passkeyName,
    passkeyServerUrl: '', // Uses browser native WebAuthn
    mode: WebAuthnMode.Login,
  });

  // Create passkey validator
  const passkeyValidator = await toPasskeyValidator(publicClient, {
    webAuthnKey,
    entryPoint: ENTRYPOINT_V07,
    kernelVersion: KERNEL_V3_1,
    validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED,
  });

  // Create kernel account
  const kernelAccount = await createKernelAccount(publicClient, {
    plugins: { sudo: passkeyValidator },
    entryPoint: ENTRYPOINT_V07,
    kernelVersion: KERNEL_V3_1,
  });

  return {
    address: kernelAccount.address,
    chainId: publicClient.chain?.id ?? 1,
    isDeployed: await kernelAccount.isDeployed(),
    passkeyId: webAuthnKey.authenticatorId,
  };
}

/**
 * Gets the passkey validator for an existing account (for session key creation)
 */
export async function getPasskeyValidator(
  publicClient: PublicClient,
  passkeyName: string = 'Oikonomos Account'
): Promise<KernelValidator<'WebAuthnValidator'>> {
  const webAuthnKey = await toWebAuthnKey({
    passkeyName,
    passkeyServerUrl: '',
    mode: WebAuthnMode.Login,
  });

  return toPasskeyValidator(publicClient, {
    webAuthnKey,
    entryPoint: ENTRYPOINT_V07,
    kernelVersion: KERNEL_V3_1,
    validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED,
  });
}
