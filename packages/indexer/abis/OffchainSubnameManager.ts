// OffchainSubnameManager ABI for CCIP subname registration
// Contract: Oikonomos CCIP Subname Manager for oikonomos.eth
export const OffchainSubnameManagerABI = [
  // SubnameRegistered event - emitted when a subname is registered
  // Includes a2aUrl for A2A protocol endpoint per STRATEGY_PROVIDER_JOURNEY.md
  {
    type: 'event',
    name: 'SubnameRegistered',
    inputs: [
      { name: 'parentNode', type: 'bytes32', indexed: true },
      { name: 'labelHash', type: 'bytes32', indexed: true },
      { name: 'label', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: false },
      { name: 'a2aUrl', type: 'string', indexed: false },
      { name: 'expiry', type: 'uint64', indexed: false },
    ],
  },
  // GatewayURLsUpdated event
  {
    type: 'event',
    name: 'GatewayURLsUpdated',
    inputs: [
      { name: 'urls', type: 'string[]', indexed: false },
    ],
  },
  // TrustedSignerUpdated event
  {
    type: 'event',
    name: 'TrustedSignerUpdated',
    inputs: [
      { name: 'oldSigner', type: 'address', indexed: true },
      { name: 'newSigner', type: 'address', indexed: true },
    ],
  },
  // RegistryUpdated event
  {
    type: 'event',
    name: 'RegistryUpdated',
    inputs: [
      { name: 'oldRegistry', type: 'address', indexed: true },
      { name: 'newRegistry', type: 'address', indexed: true },
    ],
  },
  // DefaultResolverUpdated event
  {
    type: 'event',
    name: 'DefaultResolverUpdated',
    inputs: [
      { name: 'oldResolver', type: 'address', indexed: true },
      { name: 'newResolver', type: 'address', indexed: true },
    ],
  },
] as const;
