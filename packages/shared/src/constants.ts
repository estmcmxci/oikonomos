export const CHAIN_ID = 11155111; // Sepolia

export const ADDRESSES = {
  // Uniswap v4
  POOL_MANAGER: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
  UNIVERSAL_ROUTER: '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b',
  POSITION_MANAGER: '0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4',
  QUOTER: '0x61b3f2011a92d183c7dbadbda940a7555ccf9227',

  // Gnosis Safe
  SAFE_SINGLETON: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
  SAFE_FACTORY: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',

  // Zodiac
  ROLES_MODIFIER: '0x9646fDAD06d3e24444381f44362a3B0eB343D337',

  // Tokens
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',

  // ENS
  ENS_REGISTRY: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  ENS_RESOLVER: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
} as const;

// Canonical ERC-8004 Registry Addresses (howto8004.com)
export const ERC8004_ADDRESSES = {
  sepolia: {
    IDENTITY_REGISTRY: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    REPUTATION_REGISTRY: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  },
  mainnet: {
    IDENTITY_REGISTRY: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    REPUTATION_REGISTRY: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
  },
} as const;

// Helper to get ERC-8004 addresses by chain ID
export function getERC8004Addresses(chainId: number) {
  switch (chainId) {
    case 1:
      return ERC8004_ADDRESSES.mainnet;
    case 11155111:
      return ERC8004_ADDRESSES.sepolia;
    default:
      throw new Error(`ERC-8004 registries not available on chain ${chainId}`);
  }
}

export const ENS_RECORDS = {
  TYPE: 'agent:type',
  MODE: 'agent:mode',
  VERSION: 'agent:version',
  CHAIN_ID: 'agent:chainId',
  ENTRYPOINT: 'agent:entrypoint',
  A2A: 'agent:a2a',
  X402: 'agent:x402',
  SAFE: 'agent:safe',
  ROLES_MODIFIER: 'agent:rolesModifier',
  ERC8004: 'agent:erc8004',
} as const;
