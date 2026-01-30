import { type PublicClient, namehash, type Address, keccak256, toBytes } from 'viem';
import { normalize } from 'viem/ens';
import { type AgentRecord, ENS_RECORDS } from '@oikonomos/shared';

export async function resolveAgent(
  client: PublicClient,
  ensName: string
): Promise<AgentRecord | null> {
  const normalizedName = normalize(ensName);

  try {
    const records = await Promise.all([
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.TYPE }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.MODE }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.VERSION }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.CHAIN_ID }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ENTRYPOINT }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.A2A }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.X402 }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.SAFE }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ROLES_MODIFIER }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ERC8004 }),
    ]);

    const [type, mode, version, chainId, entrypoint, a2a, x402, safe, rolesModifier, erc8004] = records;

    if (!type || !entrypoint) {
      return null;
    }

    return {
      type: type as AgentRecord['type'],
      mode: (mode || 'intent-only') as AgentRecord['mode'],
      version: version || '0.1.0',
      chainId: chainId ? parseInt(chainId) : 11155111,
      entrypoint: entrypoint as Address,
      a2a: a2a || undefined,
      x402: x402 || undefined,
      safe: safe as Address | undefined,
      rolesModifier: rolesModifier as Address | undefined,
      erc8004: erc8004 || undefined,
    };
  } catch (error) {
    console.error('Failed to resolve ENS agent:', error);
    return null;
  }
}

export function ensNameToStrategyId(ensName: string): `0x${string}` {
  return keccak256(toBytes(ensName));
}

export function getNamehash(ensName: string): `0x${string}` {
  return namehash(normalize(ensName));
}

export async function getEnsAddress(
  client: PublicClient,
  ensName: string
): Promise<Address | null> {
  const normalizedName = normalize(ensName);
  return await client.getEnsAddress({ name: normalizedName });
}

export async function getEnsText(
  client: PublicClient,
  ensName: string,
  key: string
): Promise<string | null> {
  const normalizedName = normalize(ensName);
  return await client.getEnsText({ name: normalizedName, key });
}
