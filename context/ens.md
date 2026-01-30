# ENS (Ethereum Name Service)

## Overview

ENS (Ethereum Name Service) is a distributed, open naming system based on the Ethereum blockchain. It maps human-readable names like `alice.eth` to machine-readable identifiers such as Ethereum addresses, content hashes, and metadata.

## Key Concepts

### Resolution

ENS resolution involves:
1. Finding the resolver responsible for a name
2. Querying the resolver for specific records

```solidity
ENS.resolver(bytes32 node) view returns (address)
```

### Resolvers

Resolvers are contracts that hold the records for ENS names. The Public Resolver implements several EIPs:

```
PublicResolver:
  // EIP-137 & EIP-2304: Address Resolution
  addr(bytes32 node) returns (address);

  // EIP-165: Interface Detection
  supportsInterface(bytes4 interfaceID) returns (bool);

  // EIP-181: Reverse Resolution
  name(bytes32 node) returns (string);

  // EIP-634: Text Record Resolution
  text(bytes32 node, string key) returns (string);

  // EIP-1577: Content Hash Resolution
  contenthash(bytes32 node) returns (bytes);
```

### Text Records

Text records store arbitrary key-value data associated with an ENS name:

```solidity
interface IMyResolver {
    function text(bytes32 node, string calldata key) external view returns (string memory);
    function setText(bytes32 node, string calldata key, string calldata value) external;
}
```

## Code Examples

### Get Text Records (Wagmi/React)

```tsx
import { normalize } from 'viem/ens'
import { useEnsText } from 'wagmi'

export const MyProfile = ({ name }) => {
  const { data } = useEnsText({
    name: normalize('nick.eth'),
    key: 'com.twitter',
  })

  return (
    <div>
      <span>Twitter: {data}</span>
    </div>
  )
}
```

### Get Text Records (Ethers.js)

```javascript
const provider = new ethers.providers.JsonRpcProvider()

const resolver = await provider.getResolver('nick.eth')
const twitter = await resolver.getText('com.twitter')
```

### Get Text Records (Viem)

```typescript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

const ensText = await publicClient.getEnsText({
  name: normalize('nick.eth'),
  key: 'com.twitter',
})
```

### Find Resolver (Viem)

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensResolver = await publicClient.getEnsResolver({
  name: normalize('luc.eth'),
})
```

## Resolver Interface

```solidity
interface IMyResolver {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
    function addr(bytes32 node) external view returns (address payable);
    function addr(bytes32 node, uint256 coinType) external view returns (bytes memory);
    function contenthash(bytes32 node) external view returns (bytes memory);
    function text(bytes32 node, string calldata key) external view returns (string memory);

    function setAddr(bytes32 node, address addr) external;
    function setAddr(bytes32 node, uint256 coinType, bytes calldata a) external;
    function setContenthash(bytes32 node, bytes calldata hash) external;
    function setText(bytes32 node, string calldata key, string calldata value) external;
}
```

## Resources

- [ENS Documentation](https://docs.ens.domains/)
- [ENSjs Library](https://github.com/ensdomains/ensjs)
- [ENS App](https://app.ens.domains/)
