/**
 * ENS Contract Deployments
 *
 * Contract addresses for ENS on Ethereum mainnet and Sepolia
 * Reference: https://docs.ens.domains/learn/deployments
 */

export type NetworkConfig = {
  chainId: number;
  parentDomain: string;
  registry: `0x${string}`;
  resolver: `0x${string}`;
  registrarController: `0x${string}`;
  baseRegistrar: `0x${string}`;
  reverseRegistrar: `0x${string}`;
  nameWrapper: `0x${string}`;
  ensNodeSubgraph: string;
  rpcUrl: string;
  explorerUrl: string;
};

export const ENS_DEPLOYMENTS: Record<string, NetworkConfig> = {
  sepolia: {
    chainId: 11155111,
    parentDomain: "eth",
    // ENS Sepolia deployments
    registry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    resolver: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD", // Public Resolver
    registrarController: "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72",
    baseRegistrar: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
    reverseRegistrar: "0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6",
    nameWrapper: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
    ensNodeSubgraph: "https://api.studio.thegraph.com/query/49574/enssepolia/version/latest",
    rpcUrl: "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
  },
  mainnet: {
    chainId: 1,
    parentDomain: "eth",
    // ENS Mainnet deployments
    registry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    resolver: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63", // Public Resolver
    registrarController: "0x253553366Da8546fC250F225fe3d25d0C782303b",
    baseRegistrar: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
    reverseRegistrar: "0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb",
    nameWrapper: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
    ensNodeSubgraph: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
    rpcUrl: "https://eth.drpc.org",
    explorerUrl: "https://etherscan.io",
  },
};

// Default to Sepolia for development
export const DEFAULT_NETWORK = "sepolia";

// ETH coin type (SLIP-44)
export const ETH_COIN_TYPE = 60n;

export function getNetworkConfig(network?: string): NetworkConfig {
  const net = network || process.env.ENS_NETWORK || DEFAULT_NETWORK;
  const config = ENS_DEPLOYMENTS[net];
  if (!config) {
    throw new Error(`Unknown network: ${net}. Available: ${Object.keys(ENS_DEPLOYMENTS).join(", ")}`);
  }
  return config;
}

/**
 * Get the coin type for a network
 * For L1 ENS, we always use coin type 60 (ETH)
 */
export function getCoinType(_network?: string): bigint {
  // L1 ENS uses standard ETH coin type
  return ETH_COIN_TYPE;
}
