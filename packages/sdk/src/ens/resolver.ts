import { type PublicClient, namehash, type Address, keccak256, toBytes } from 'viem';
import { normalize } from 'viem/ens';
import { type AgentRecord, ENS_RECORDS, getERC8004Addresses } from '@oikonomos/shared';

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

export interface ERC8004Record {
  chainId: number;
  registryAddress: Address;
  agentId: bigint;
}

/**
 * Generates an ERC-8004 text record value for ENS
 * Format: eip155:{chainId}:{registryAddress}:{agentId}
 *
 * @example
 * generateERC8004Record(11155111, 42n)
 * // => "eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:42"
 */
export function generateERC8004Record(chainId: number, agentId: bigint): string {
  const { identity } = getERC8004Addresses(chainId);
  return `eip155:${chainId}:${identity}:${agentId.toString()}`;
}

/**
 * Parses an ERC-8004 text record value from ENS
 * Format: eip155:{chainId}:{registryAddress}:{agentId}
 *
 * @example
 * parseERC8004Record("eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:42")
 * // => { chainId: 11155111, registryAddress: "0x8004A818...", agentId: 42n }
 */
export function parseERC8004Record(record: string): ERC8004Record | null {
  const parts = record.split(':');
  if (parts.length !== 4 || parts[0] !== 'eip155') {
    return null;
  }

  const chainId = parseInt(parts[1], 10);
  if (isNaN(chainId)) {
    return null;
  }

  const registryAddress = parts[2] as Address;
  if (!registryAddress.startsWith('0x') || registryAddress.length !== 42) {
    return null;
  }

  try {
    const agentId = BigInt(parts[3]);
    return { chainId, registryAddress, agentId };
  } catch {
    return null;
  }
}

/**
 * Resolves an agent's ERC-8004 identity from their ENS name
 * Fetches the agent:erc8004 text record and parses it
 */
export async function resolveAgentERC8004(
  client: PublicClient,
  ensName: string
): Promise<ERC8004Record | null> {
  const record = await getEnsText(client, ensName, ENS_RECORDS.ERC8004);
  if (!record) {
    return null;
  }
  return parseERC8004Record(record);
}
