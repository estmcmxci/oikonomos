import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { ENS_RECORDS } from '@oikonomos/shared';

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ensName = searchParams.get('name');

  if (!ensName) {
    return NextResponse.json(
      { error: 'Missing ENS name parameter' },
      { status: 400 }
    );
  }

  try {
    const normalizedName = normalize(ensName);

    // Try mainnet first for ENS resolution
    const client = mainnetClient;

    // Fetch all text records in parallel
    const [type, mode, version, chainId, entrypoint, a2a, x402, safe, rolesModifier, erc8004] =
      await Promise.all([
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.TYPE }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.MODE }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.VERSION }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.CHAIN_ID }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ENTRYPOINT }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.A2A }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.X402 }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.SAFE }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ROLES_MODIFIER }).catch(() => null),
        client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ERC8004 }).catch(() => null),
      ]);

    if (!type || !entrypoint) {
      return NextResponse.json(
        { error: 'Agent records not found for this ENS name' },
        { status: 404 }
      );
    }

    const agent = {
      type,
      mode: mode || 'intent-only',
      version: version || '1.0.0',
      chainId: chainId ? parseInt(chainId, 10) : 11155111,
      entrypoint,
      a2a: a2a || undefined,
      x402: x402 || undefined,
      safe: safe || undefined,
      rolesModifier: rolesModifier || undefined,
      erc8004: erc8004 || undefined,
    };

    return NextResponse.json(agent);
  } catch (error) {
    console.error('ENS resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve ENS name' },
      { status: 500 }
    );
  }
}
