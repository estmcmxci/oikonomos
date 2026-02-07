export const CHAIN_ID = 11155111; // Sepolia
export const BASE_SEPOLIA_CHAIN_ID = 84532; // Base Sepolia

export const ADDRESSES = {
  // Uniswap v4
  POOL_MANAGER: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
  UNIVERSAL_ROUTER: '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b',
  POSITION_MANAGER: '0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4',
  QUOTER: '0x61b3f2011a92d183c7dbadbda940a7555ccf9227',

  // Oikonomos Contracts (Sepolia)
  // ReceiptHook deployed via CREATE2 with salt 43988
  // Address flags: 0x0040 (AFTER_SWAP_FLAG)
  RECEIPT_HOOK: '0xea155cf7d152125839e66b585b9e455621b7c040',

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

// Uniswap V4 Contract Addresses
export const UNISWAP_V4_ADDRESSES = {
  BASE_MAINNET: {
    POOL_MANAGER: '0x498581ff718922c3f8e6a244956af099b2652b2b' as const,
    POSITION_DESCRIPTOR: '0x25d093633990dc94bedeed76c8f3cdaa75f3e7d5' as const,
    POSITION_MANAGER: '0x7c5f5a4bbd8fd6318457752532612bb519429bdc' as const,
    QUOTER: '0x0d5e0f971ed27fbff6c2837bf313161215320484' as const,
    STATE_VIEW: '0xa3c0c9b65bad0b08107aa264b0f3db444b867a71' as const,
    UNIVERSAL_ROUTER: '0x6ff5693b99212da76ad316178a184ab56d299b43' as const,
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const,
  },
  BASE_SEPOLIA: {
    POOL_MANAGER: '0x7da1d65f8b249183667cde74c5cbd46dd38aa829' as const,
    POSITION_DESCRIPTOR: null as `0x${string}` | null,
    POSITION_MANAGER: '0xcDbe7b1eD817eF0005ECe6a3e576fBAE2EA5EAFE' as const,
    QUOTER: '0xb3cb4484d3f7e6e23d0ea847bc9270b63a59adc3' as const,
    STATE_VIEW: '0x571291b572ed32ce6751a2cb2486ebee8defb9b4' as const,
    UNIVERSAL_ROUTER: '0x95273d871c8156636e114b63797d78D7E1720d81' as const,
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const,
  },
} as const;

// Clanker Contract Addresses
// Used for meta-treasury management of AI agent tokens
export const CLANKER_ADDRESSES = {
  BASE_SEPOLIA: {
    // Uniswap V4 PoolManager for Clanker pools
    POOL_MANAGER: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408' as const,
    // Clanker token factory
    CLANKER: '0xE85A59c628F7d27878ACeB4bf3b35733630083a9' as const,
    // Fee accumulation contract (80% to launcher, 20% to Clawnch)
    FEE_LOCKER: '0x42A95190B4088C88Dd904d930c79deC1158bF09D' as const,
    // Uniswap V4 hook for Clanker pools
    CLANKER_HOOK: '0xE63b0A59100698f379F9B577441A561bAF9828cc' as const,
    // Canonical WETH on Base
    WETH: '0x4200000000000000000000000000000000000006' as const,
  },
  BASE_MAINNET: {
    // Uniswap V4 PoolManager (same as UNISWAP_V4_ADDRESSES)
    POOL_MANAGER: '0x498581ff718922c3f8e6a244956af099b2652b2b' as const,
    // Clanker contracts v4.1.0
    CLANKER_HOOK_DYNAMIC: '0xd60D6B218116cFd801E28F78d011a203D2b068Cc' as const,
    CLANKER_HOOK_STATIC: '0xb429d62f8f3bFFb98CdB9569533eA23bF0Ba28CC' as const,
    CLANKER_SNIPER_AUCTION: '0xebB25BB797D82CB78E1bc70406b13233c0854413' as const,
    CLANKER_SNIPER_UTIL: '0xC5AA2945d52a4096b946891ef8e01668f82eB74E' as const,
    CLANKER_AIRDROP: '0xf652B3610D75D81871bf96DB50825d9af28391E0' as const,
    CLANKER_POOL_EXTENSION: '0xaa12bb11E9876FCAFc7c46dBEB985d3fA23832c9' as const,
    // Fee locker - TODO: Get from Clanker docs
    FEE_LOCKER: '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68' as const,
    // Canonical WETH on Base
    WETH: '0x4200000000000000000000000000000000000006' as const,
    // USDC on Base mainnet
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  },
} as const;

// Helper to get Clanker addresses by chain ID
export function getClankerAddresses(chainId: number) {
  switch (chainId) {
    case 8453: // Base Mainnet
      return CLANKER_ADDRESSES.BASE_MAINNET;
    case 84532: // Base Sepolia
    default:
      return CLANKER_ADDRESSES.BASE_SEPOLIA;
  }
}

// Helper to get Uniswap V4 addresses by chain ID
export function getUniswapV4Addresses(chainId: number) {
  switch (chainId) {
    case 8453: // Base Mainnet
      return UNISWAP_V4_ADDRESSES.BASE_MAINNET;
    case 84532: // Base Sepolia
    default:
      return UNISWAP_V4_ADDRESSES.BASE_SEPOLIA;
  }
}

// Canonical ERC-8004 Registry Addresses (howto8004.com)
// Deployed via CREATE2 - same address across chains
export const ERC8004_ADDRESSES = {
  SEPOLIA: {
    IDENTITY: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const,
    REPUTATION: '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const,
  },
  BASE_SEPOLIA: {
    // Same address via CREATE2
    IDENTITY: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const,
    REPUTATION: '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const,
  },
  MAINNET: {
    IDENTITY: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const,
    REPUTATION: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as const,
  },
} as const;

// Helper to get ERC-8004 addresses by chain ID
export function getERC8004Addresses(chainId: number): { identity: `0x${string}`; reputation: `0x${string}` } {
  switch (chainId) {
    case 1: // Mainnet
      return { identity: ERC8004_ADDRESSES.MAINNET.IDENTITY, reputation: ERC8004_ADDRESSES.MAINNET.REPUTATION };
    case 84532: // Base Sepolia
      return { identity: ERC8004_ADDRESSES.BASE_SEPOLIA.IDENTITY, reputation: ERC8004_ADDRESSES.BASE_SEPOLIA.REPUTATION };
    case 11155111: // Sepolia
    default:
      return { identity: ERC8004_ADDRESSES.SEPOLIA.IDENTITY, reputation: ERC8004_ADDRESSES.SEPOLIA.REPUTATION };
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

// OIK-54: CCIP Subname Configuration
export const CCIP_CONFIG = {
  sepolia: {
    managerAddress: '0xa7a1c040A70EB0BB4698BDE8193c56Ac594a95FF' as `0x${string}`,
    gatewayUrl: 'https://oikonomos-ccip-gateway.estmcmxci.workers.dev',
    parentName: 'oikonomosapp.eth',
    // namehash("oikonomosapp.eth") = 0x6c34d411c8237450d6595c190f68d59f87081d9f18b6116c57242e7d39df2cad
    parentNode: '0x6c34d411c8237450d6595c190f68d59f87081d9f18b6116c57242e7d39df2cad' as `0x${string}`,
  },
  mainnet: {
    managerAddress: null as `0x${string}` | null, // TBD
    gatewayUrl: null as string | null,
    parentName: 'oikonomosapp.eth',
    parentNode: null as `0x${string}` | null,
  },
} as const;
