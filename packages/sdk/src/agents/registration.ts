/**
 * Agent Registration Helper
 *
 * Builds howto8004.com compliant registration JSON for ERC-8004 registry.
 * https://howto8004.com
 */

export type AgentType = 'treasury' | 'strategy' | 'router' | 'lp' | 'vault' | 'netting' | 'receipts';

export interface AgentService {
  name: string;
  endpoint: string;
  version?: string;
}

export interface ERC8004RegistrationJSON {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  name: string;
  description: string;
  image: string;
  active: boolean;
  x402Support: boolean;
  services: AgentService[];
}

export interface BuildRegistrationParams {
  agentType: AgentType;
  agentName: string;
  agentDescription: string;
  a2aEndpoint: string;
  ensName: string;
  webEndpoint: string;
  imageUrl?: string;
  x402Support?: boolean;
  additionalServices?: AgentService[];
}

/**
 * Builds a registration JSON object following howto8004.com format
 */
export function buildRegistrationJSON(params: BuildRegistrationParams): ERC8004RegistrationJSON {
  const {
    agentName,
    agentDescription,
    a2aEndpoint,
    ensName,
    webEndpoint,
    imageUrl = '',
    x402Support = false,
    additionalServices = [],
  } = params;

  const services: AgentService[] = [
    { name: 'A2A', endpoint: a2aEndpoint, version: '0.3.0' },
    { name: 'ENS', endpoint: ensName },
    { name: 'web', endpoint: webEndpoint },
    ...additionalServices,
  ];

  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: agentName,
    description: agentDescription,
    image: imageUrl,
    active: true,
    x402Support,
    services,
  };
}

/**
 * Builds a base64-encoded registration JSON string ready for register() call
 *
 * @example
 * const agentURI = buildAgentRegistrationJSON({
 *   agentType: 'treasury',
 *   agentName: 'Oikonomos Treasury Agent',
 *   agentDescription: 'Automated treasury rebalancing for Uniswap v4',
 *   a2aEndpoint: 'https://treasury-agent.workers.dev/.well-known/agent-card.json',
 *   ensName: 'treasury.oikonomos.eth',
 *   webEndpoint: 'https://treasury-agent.workers.dev',
 * });
 * // => "data:application/json;base64,eyJ0eXBlIjoiaHR0cHM..."
 */
export function buildAgentRegistrationJSON(params: BuildRegistrationParams): string {
  const json = buildRegistrationJSON(params);
  const jsonString = JSON.stringify(json);
  const base64 = btoa(jsonString);
  return `data:application/json;base64,${base64}`;
}

/**
 * Parses a base64-encoded registration URI back to JSON
 */
export function parseAgentRegistrationJSON(agentURI: string): ERC8004RegistrationJSON | null {
  if (!agentURI.startsWith('data:application/json;base64,')) {
    return null;
  }

  try {
    const base64 = agentURI.replace('data:application/json;base64,', '');
    const jsonString = atob(base64);
    return JSON.parse(jsonString) as ERC8004RegistrationJSON;
  } catch {
    return null;
  }
}

/**
 * Helper to build treasury agent registration
 */
export function buildTreasuryAgentRegistration(
  ensName: string,
  workerUrl: string,
  options?: { imageUrl?: string; x402Support?: boolean }
): string {
  return buildAgentRegistrationJSON({
    agentType: 'treasury',
    agentName: 'Oikonomos Treasury Agent',
    agentDescription: 'Automated treasury rebalancing for Uniswap v4 with policy-compliant execution',
    a2aEndpoint: `${workerUrl}/.well-known/agent-card.json`,
    ensName,
    webEndpoint: workerUrl,
    imageUrl: options?.imageUrl,
    x402Support: options?.x402Support,
  });
}

/**
 * Helper to build strategy agent registration
 */
export function buildStrategyAgentRegistration(
  ensName: string,
  workerUrl: string,
  options?: { imageUrl?: string; x402Support?: boolean }
): string {
  return buildAgentRegistrationJSON({
    agentType: 'strategy',
    agentName: 'Oikonomos Strategy Agent',
    agentDescription: 'DeFi strategy execution with reputation-tracked performance',
    a2aEndpoint: `${workerUrl}/.well-known/agent-card.json`,
    ensName,
    webEndpoint: workerUrl,
    imageUrl: options?.imageUrl,
    x402Support: options?.x402Support,
  });
}
