### Install wagmi and viem

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/quickstart.mdx

Installs the necessary libraries for interacting with Ethereum and ENS in your React application. wagmi provides hooks for common Ethereum tasks, and viem is a lightweight, type-safe Ethereum client.

```bash
npm install wagmi viem @tanstack/react-query
```

--------------------------------

### Basic Resolver Contract in Solidity

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/quickstart.mdx

A simple ENS resolver smart contract example written in Solidity. This contract implements the basic resolver functionality by returning a fixed address for any queried node, demonstrating a naive approach to resolution.

```solidity
contract MyResolver {
    function addr(bytes32 node) external pure returns (address) {
        return 0x225f137127d9067788314bc7fcc1f36746a3c3B5;
    }

    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return
            interfaceID == this.addr.selector ||
            interfaceID == this.supportsInterface.selector;
    }
}
```

--------------------------------

### Embed Link to ENS Documentation Sections

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/index.mdx

Provides a reusable React component for linking to various sections of the ENS documentation. Each link includes a title and a brief description to guide users.

```javascript
import { EmbedLink } from '../../components/EmbedLink'

// Example usage for Quickstart
<EmbedLink
  href="/web/quickstart"
  title="Quickstart"
  description="To jumpstart your journey with names."
/>

// Example usage for Tools & Libraries
<EmbedLink
  href="/web/libraries"
  title="Tools & Libraries"
  description="To learn about the available tools and libraries that interact with ENS"
/>

// Example usage for Address Resolution
<EmbedLink
  href="/web/resolution"
  title="Address Resolution"
  description="To find guides on the address lookup features of ENS."
/>

// Example usage for Issuing Subnames
<EmbedLink
  href="/web/subdomains"
  title="Issuing Subnames"
  description="To an overview of the difference ways to issue subnames."
/>

// Example usage for ETH Registrar
<EmbedLink
  href="/registry/eth"
  title="ETH Registrar"
  description="To an overview of the two smart contracts that make up the ETH Registrar."
/>
```

--------------------------------

### Display ENS User Profile with wagmi

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/quickstart.mdx

Demonstrates how to create a basic user profile section showing the user's ENS name and avatar. It leverages wagmi hooks like `useAccount`, `useEnsName`, and `useEnsAvatar`. ENS resolution starts from L1, hence `chainId: 1` is specified.

```tsx
import { useAccount, useEnsAvatar, useEnsName } from 'wagmi'

export const EnsProfile = () => {
  const { address } = useAccount()
  const { data: name } = useEnsName({ address, chainId: 1 })
  const { data: avatar } = useEnsAvatar({ name, chainId: 1 })

  return (
    <div className="flex items-center gap-2">
      <img src={avatar} className="h-8 w-8 rounded-full" />
      <div className="flex flex-col leading-none">
        <span className="font-semibold">{name}</span>
        <span className="text-grey text-sm">{address}</span>
      </div>
    </div>
  )
}
```

--------------------------------

### Display Multiple ENS Names and Addresses

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/index.mdx

Shows how to render a list of ENS names, each with its dynamically fetched avatar and associated address. This example utilizes React's mapping capabilities to iterate over data.

```javascript
import { Card } from '../../components/ui/Card'

// ... inside a React component
<Card>
  <div className="flex items-stretch justify-center gap-2">
    <div className="flex flex-col justify-between rounded-md border p-2 px-3">
      <span>0xb8c...67d5</span>
      <span>0x866...5eEE</span>
      <span>0xd8d...6045</span>
    </div>
    <span className="flex flex-col gap-3 pt-3">
      <span>➡️</span>
      <span>➡️</span>
      <span>➡️</span>
    </span>
    <div className="flex flex-col gap-2 rounded-md border p-2 px-3">
      {['nick.eth', 'jefflau.eth', 'vitalik.eth'].map((name) => (
        <div className="flex items-center gap-2" key={name}>
          <object
            data={'https://ens-api.gregskril.com/avatar/' + name + '?width=64'}
            type="image/jpeg"
            className="aspect-square h-full w-8 rounded"
          >
            <img src="/img/fallback-avatar.svg" />
          </object>
          <span>{name}</span>
        </div>
      ))}
    </div>
  </div>
</Card>
```

--------------------------------

### CCIP Read Gateway GET Endpoint Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/ccip-read.mdx

Example configuration for a CCIP Read Gateway using a GET request. This is used when the gateway URL includes the '{data}' parameter.

```yaml
URL:mple.com/gateway/{sender}/{data}.json
Method: GET
```

--------------------------------

### Display ContentHash Examples

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dweb/intro.mdx

Demonstrates displaying various ContentHash formats (IPFS, Swarm, Arweave) using React components and badges.

```jsx
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

<Card className="flex justify-center gap-4">
  {['ipfs://qMhx...', 'bzz:/2477', 'ar://HGa8...'].map((tag) => (
    <Badge key={tag} variant="secondary">
      {tag}
    </Badge>
  ))}
</Card>
```

--------------------------------

### Universal Resolver Forward Resolution Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/universal.mdx

Demonstrates the process of forward resolving an ENS name by normalizing and DNS encoding it, followed by an example of an ABI-encoded call to a resolver method.

```APIDOC
Forward Resolution Process:

1. Normalize Name:
   - Input: `My.Name.eth`
   - Output: `my.name.eth`

2. DNS Encode Name:
   - Input: `my.name.eth`
   - Output: `0x026d79046e616d650365746800`

3. ABI-Encode Resolver Call:
   - Method: `addr(bytes32 node)`
   - Input Name (DNS Encoded): `0x026d79046e616d650365746800`
   - ABI Encoded Call: `0x3b3b57def61adbd8ee36cf930560efc644af752731733dc6421afe47608f8e2cfeaabe2b`

Method Signature:
resolve(bytes name, bytes data)
  - name: The DNS-encoded version of the ENS name.
  - data: The ABI-encoded call to the resolver for the name.
```

--------------------------------

### Link to Issuing Subdomains Guide

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/protocol.mdx

Provides a link to a guide on how to issue subdomains within the ENS ecosystem. This component is used for navigation and further learning.

```javascript
import { EmbedLink } from '../../components/EmbedLink'

// ... inside a React component
<EmbedLink
  href="/web/subdomains"
  title="Issuing Subdomains"
  description="Learn how to issue subdomains on ENS."
/>
```

--------------------------------

### Build ENS Docs Locally

Source: https://github.com/ensdomains/docs/blob/master/CONTRIBUTING.md

Instructions for building the ENS documentation locally to verify changes. Requires Node.js version 20 or higher.

```shell
pnpm run build
```

--------------------------------

### Example Usage of Card Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/overview.mdx

Demonstrates the usage of the Card component, which likely wraps content and applies specific styling. It includes an image element within the card.

```jsx
<Card>
  <img
    src="/img/namewrapper-overview-subnames.jpg"
    alt="Subnames without NFTs"
  />
</Card>
```

--------------------------------

### Commit-Reveal Process UI Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Illustrates a UI representation of the commit-reveal process using React components and icons. It shows three distinct steps: Commit, Wait, and Reveal.

```jsx
<Card className="flex items-center justify-center gap-8">
  <div className="flex flex-col items-center text-center">
    <FiHash className="text-2xl" />
    <span>Commit</span>
  </div>
  <div className="flex flex-col items-center text-center">
    <FiClock className="text-2xl" />
    <span>Wait</span>
  </div>
  <div className="flex flex-col items-center text-center">
    <FiBookOpen className="text-2xl" />
    <span>Reveal</span>
  </div>
</Card>
```

--------------------------------

### SIWE Message Format Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/siwe.mdx

An example of the message format that a user signs using their Ethereum keys for authentication. It includes essential parameters like URI, Chain ID, Nonce, and Issued At to prevent replay attacks and ensure security.

```text
localhost wants you to sign in with your Ethereum account:
0x225f137127d9067788314bc7fcc1f36746a3c3B5

This is a test statement.

URI: https://localhost/login
Version: 1
Chain ID: 1
Nonce: abcdef1234567890
Issued At: 2023-01-30T00:00:00.000Z
```

--------------------------------

### Universal Resolver Reverse Resolution Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/universal.mdx

Illustrates the steps for reverse resolving an Ethereum address to an ENS name, including constructing the reverse name, normalization, and DNS encoding.

```APIDOC
Reverse Resolution Process:

1. Construct Reverse Name:
   - Input Address: `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63`
   - Output: `231b0Ee14048e9dCcD1d247744d114a4EB5E8E63.addr.reverse`

2. Normalize Reverse Name:
   - Input: `231b0Ee14048e9dCcD1d247744d114a4EB5E8E63.addr.reverse`
   - Output: `231b0ee14048e9dccd1d247744d114a4eb5e8e63.addr.reverse`

3. DNS Encode Reverse Name:
   - Input: `231b0ee14048e9dccd1d247744d114a4eb5e8e63.addr.reverse`
   - Output: `0x28323331623065653134303438653964636364316432343737343464313134613465623565386536330461646472077265766572736500`

Method Signature:
reverse(bytes reverseName)
  - reverseName: The DNS-encoded version of the reverse name (e.g., `[addr].addr.reverse`).
```

--------------------------------

### Lookup ENS Text Records

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/quickstart.mdx

Fetches and displays specified text records for an ENS name. This functionality uses a component to render records and a hook to perform the lookup. Common keys include 'url', 'com.github', 'com.twitter', and 'description'.

```tsx
// [!include ~/components/TextRecords.tsx]
```

```ts
// [!include ~/hooks/useEnsTexts.ts]
```

--------------------------------

### Get Text Records using various libraries

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/records.mdx

Fetch specific text records associated with an ENS name. These examples demonstrate how to retrieve data like Twitter handles or descriptions using popular Ethereum libraries across different programming languages. Ensure you have the necessary library installed and configured with an Ethereum provider.

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

```ethers
const provider = new ethers.providers.JsonRpcProvider()

const resolver = await provider.getResolver('nick.eth')
const twitter = await resolver.getText('com.twitter')
```

```viem
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

```python
from ens.auto import ns

# set text
ns.set_text('alice.eth', 'url', 'https://example.com')

# get text
url = ns.get_text('alice.eth', 'url')
assert url == 'https://example.com'
```

```go
package main

import (
	"fmt"

	"github.com/ethereum/go-ethereum/ethclient"
	ens "github.com/wealdtech/go-ens/v3"
)

func main() {
	client, _ := ethclient.Dial("https://rpc.ankr.com/eth")

	domain, _ := ens.Normalize("nick.eth")
	resolver, _ := ens.NewResolver(client, domain)
	twitter, _ := resolver.Text("com.twitter")

	fmt.Println("Twitter: ", twitter)
}
```

--------------------------------

### Display ETH Registrar Name Structure

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/index.mdx

Illustrates the structure of names registered under the .eth domain, showing common prefixes associated with the ETH Registrar. This uses basic HTML structure within a React component.

```javascript
import { Card } from '../../components/ui/Card'

// ... inside a React component
<Card className="flex items-center justify-center text-xl">
  <div className="text-right font-bold">
    {['nick', 'vitalik', 'matoken', 'jefflau', 'ens'].map((subname, i) => (
      <div
        className={
          ['opacity-20', 'opacity-50', '', 'opacity-50', 'opacity-20'][i]
        }
        key={subname}
      >
        {subname}
      </div>
    ))}
  </div>
  <div className="text-blue font-bold">.eth</div>
</Card>
```

--------------------------------

### CCIP Read Gateway POST Endpoint Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/ccip-read.mdx

Example configuration for a CCIP Read Gateway using a POST request. This is used when the gateway URL does not include the '{data}' parameter.

```yaml
URL: https://example.com/gateway
Method: POST
Body:
  sender: "0x..."
  data: "0x..."
```

--------------------------------

### Lookup ENS Address Records

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/quickstart.mdx

Retrieves addresses associated with an ENS name for various blockchain coin types. This involves a component for display and a hook for fetching the data. It supports multiple coin types, such as Ethereum (60) and others.

```tsx
// [!include ~/components/AddressRecords.tsx]
```

```ts
// [!include ~/hooks/useEnsAddresses.ts]
```

--------------------------------

### ENS Reverse Resolution Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/resolution.mdx

Illustrates the reverse resolution process by displaying an address and its corresponding ENS name using the EnsProfile component. This showcases how an address can be mapped back to a human-readable name.

```jsx
<Card className="flex items-center justify-center gap-2">
  <span className="font-medium">0x225...c3B5</span>
  <span>to</span>
  <EnsProfile name="nick.eth" hideAddress />
</Card>
```

--------------------------------

### React/Next.js Component Import

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/siwe.mdx

Example of importing a UI component (Card) from a local path, commonly used in React or Next.js applications for building user interfaces.

```javascript
import { Card } from '../../components/ui/Card'
```

--------------------------------

### ENS Name Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/terminology.mdx

An example of a typical ENS identifier, which may consist of multiple labels separated by dots, such as 'vault.luc.eth'.

```text
vault.luc.eth
```

--------------------------------

### ENS Forward Resolution Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/resolution.mdx

Demonstrates the display of ENS profile information for a given name, including associated records like ETH, BTC, Twitter, and Github. This snippet uses React components to render the profile and associated data.

```jsx
<Card>
  <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
    <EnsProfile name="ricmoo.eth" hideAddress />
    <span className="hidden sm:block">➡️</span>
    <span className="block sm:hidden">⬇️</span>
    <Card className="w-64 rounded-md p-4">
      <div>
        <span className="font-extrabold">ETH </span> 0x5555...3dCa
      </div>
      <div>
        <span className="font-extrabold">BTC Address:</span> 1RicMoo...Jyn
      </div>
      <div>
        <span className="font-extrabold">Twitter:</span> @ricmoo
      </div>
      <div>
        <span className="font-extrabold">Github:</span> @ricmoo
      </div>
      <span className="font-extrabold">...</span>
    </Card>
  </div>
</Card>
```

--------------------------------

### Top-Level Domain (TLD) Examples

Source: https://github.com/ensdomains/docs/blob/master/src/pages/terminology.mdx

Examples of Top-Level Domains (TLDs) which are the highest level names in the ENS hierarchy, such as '.eth', '.com', and '.xyz'.

```text
.eth .com .xyz
```

--------------------------------

### Display ENS Avatar and Name

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/index.mdx

Demonstrates how to display an ENS name alongside its avatar, fetched from an external API. This component uses React and an object tag for image rendering, with a fallback image.

```javascript
import { Card } from '../../components/ui/Card'

// ... inside a React component
<Card className="flex items-center justify-center gap-2">
  <div className="flex flex-col gap-2 rounded-md border p-2 px-3">
    <div className="flex items-center gap-2">
      <object
        data={'https://ens-api.gregskril.com/avatar/vitalik.eth?width=64'}
        type="image/jpeg"
        className="aspect-square h-full w-8 rounded"
      >
        <img src="https://docs.ens.domains/fallback.svg" />
      </object>
      <span>vitalik.eth</span>
    </div>
  </div>
  <span>➡️</span>
  <div className="flex flex-col justify-start gap-1 rounded-md border p-2 px-3">
    <span>mi pinxe lo crino tcati</span>
    <span>0xd8d...6045</span>
  </div>
</Card>
```

--------------------------------

### Submit DNS Proof to DNSRegistrar

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/dns.mdx

Example of importing a DNS name into ENS using ENSJS. It demonstrates setting up viem cts and calling `getDnsImportData` and `importDnsName` functions to submit DNS records and proofs.

```ts
import { addEnsContracts } from '@ensdomains/ensjs'
import { getDnsImportData, importDnsName } from '@ensdomains/ensjs/dns'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { mainnet } from 'viem/chains'

const mainnetWithEns = addEnsContracts(mainnet)

const client = createPublicClient({
  chain: mainnetWithEns,
  transport: http(),
})

const wallet = createWalletClient({
  chain: mainnetWithEns,
  transport: custom(window.ethereum),
})

const dnsImportData = await getDnsImportData(client, {
  name: 'example.com',
})

await importDnsName(wallet, {
  name: 'example.com',
  dnsImportData,
})
```

--------------------------------

### Display ENS Subname Structure

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/index.mdx

Visually represents the hierarchical structure of ENS subnames, highlighting the root and registrar components. This uses basic HTML structure within a React component.

```javascript
import { Card } from '../../components/ui/Card'

// ... inside a React component
<Card className="flex items-center justify-center text-xl">
  <div className="text-right font-bold">
    {['root', 'registrar', 'controller', 'resolver', 'registry'].map(
      (subname, i) => (
        <div
          className={
            ['opacity-20', 'opacity-50', '', 'opacity-50', 'opacity-20'][i]
          }
          key={subname}
        >
          {subname}
        </div>
      )
    )}
  </div>
  <div className="text-blue font-bold">.ens.eth</div>
</Card>
```

--------------------------------

### Solidity Offchain Resolver Contract Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/writing.mdx

This Solidity contract demonstrates an offchain resolver implementing CCIP Read. It defers name resolution to an external HTTP gateway, allowing offchain data updates. It includes an `addr` function for resolution and a callback for receiving responses, but lacks security verification for demonstration purposes.

```solidity
contract OffchainResolver {
    string public url =
        "https://docs.ens.domains/api/example/basic-gateway";

    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    function addr(bytes32 node) external view returns (address) {
        bytes memory callData = abi.encodeWithSelector(
            OffchainResolver.addr.selector,
            node
        );

        string[] memory urls = new string[](1);
        urls[0] = url;

        revert OffchainLookup(
            address(this),
            urls,
            callData,
            OffchainResolver.addrCallback.selector,
            abi.encode(callData, address(this))
        );
    }

    function addrCallback(
        bytes calldata response,
        bytes calldata
    ) external pure returns (address) {
        address _addr = abi.decode(response, (address));
        return _addr;
    }

    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return
            interfaceID == OffchainResolver.supportsInterface.selector ||
            interfaceID == OffchainResolver.addr.selector;
    }
}
```

--------------------------------

### Registrar Contract Public Function Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/creating-subname-registrar.mdx

Illustrates a public-facing registration function within a custom registrar contract that calls the NameWrapper's `setSubnodeRecord`.

```solidity
function register(bytes32 parentNode, string calldata label) public {
    // Example logic to determine owner, fuses, and expiry
    address owner = msg.sender;
    uint32 fuses = 65536; // Emancipated rental subname
    uint64 expiry = block.timestamp + 365 days; // Example: 1 year expiry
    address resolver = 0x4200000000000000000000000000000000000021; // Default public resolver
    uint64 ttl = 0;

    NameWrapper(nameWrapperAddress).setSubnodeRecord(
        parentNode,
        label,
        owner,
        resolver,
        ttl,
        fuses,
        expiry
    );
}
```

--------------------------------

### Generate ENS Namehash Across Libraries

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/names.mdx

Provides examples of generating ENS namehashes using various libraries and languages. Namehash is a recursive algorithm that hashes each part of a name and combines them into a 32-byte node, essential for ENS registry operations. It is imperative to normalize names before hashing to ensure the correct node is generated. Examples include Viem, Ethers.js, ens-namehash-py, namehash-rust, and a Solidity contract.

```javascript
// https://viem.sh/docs/ens/utilities/namehash
import { namehash, normalize } from 'viem/ens'

const normalizedName = normalize('name.eth')
const node = namehash(normalizedName)
```

```javascript
// https://docs.ethers.org/v6/api/hashing/#namehash
import { ensNormalize, namehash } from 'ethers/hash'

const normalizedName = ensNormalize('name.eth')
const node = namehash(normalizedName)
```

```python
# https://github.com/ConsenSysMesh/ens-namehash-py
from namehash import namehash

node = namehash('name.eth')
```

```rust
// https://github.com/InstateDev/namehash-rust
fn main() {
  let node = &namehash("name.eth");
  let s = hex::encode(&node);
}
```

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@ensdomains/ens-contracts/contracts/utils/NameEncoder.sol";

contract MyContract {
    function namehash(string calldata name) public pure returns (bytes32) {
        (, bytes32 node) = NameEncoder.dnsEncodeName(name);
        return node;
    }
}
```

--------------------------------

### Approve Token Spend with Ethers.js

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/0.2.mdx

This snippet demonstrates how to approve a specified amount of tokens for spending using the Ethers.js library. It initializes an Ethers contract instance for a token, populates an approval transaction, and logs relevant transaction data. Ensure you have the 'ethers' package installed.

```javascript
const ethers = require('ethers');
const abi = [
  'function approve(address _spender, uint256 _value) public returns (bool success)',
];
const token = new ethers.Contract(
  '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
  abi
);
const airdropAddress = 'TBD';
const tx = await token.populateTransaction.approve(
  airdropAddress,
  '213049736662531485206636'
);
console.log([token.address]);
console.log([0]);
console.log([tx.data]);
```

--------------------------------

### Get ENS Avatar

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/avatars.mdx

Retrieve the avatar associated with an ENS name using different libraries. These examples demonstrate how to fetch avatar URIs for a given ENS name, often requiring an Ethereum provider or client connection. The output is typically a URI that can be used to display the avatar image.

```tsx
import { useEnsAvatar } from 'wagmi'

function App() {
  const { data: ensAvatar } = useEnsAvatar({
    address: 'nick.eth',
    chainId: 1, // (1 = Ethereum Mainnet, 11155111 = Sepolia)
  })

  return (
    <img
      src={ensAvatar || 'https://avatars.jakerunzer.com/nick.eth'}
      alt="nick.eth"
    />
  )
}
```

```ts
const ensAvatar = await provider.getAvatar('nick.eth')
```

```ts
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensAvatar = await publicClient.getEnsAvatar({
  name: normalize('nick.eth'),
})
```

```py
from ens.auto import ns

avatar = ns.get_text('alice.eth', 'avatar')
```

```go
package main

import (
	"fmt"
	"github.com/ethereum/go-ethereum/ethclient"
	ens "github.com/wealdtech/go-ens/v3"
)

func main() {
	client, _ := ethclient.Dial("https://rpc.ankr.com/eth")

	domain, _ := ens.Normalize("nick.eth")
	resolver, _ := ens.NewResolver(client, domain)
	avatar, _ := resolver.Text("avatar")

	fmt.Println("Avatar: ", avatar)
}
```

--------------------------------

### Display ENS Profile Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/design.mdx

Renders an ENS profile component, displaying the ENS name 'nick.eth'. This is an example of how to integrate ENS names into a UI for read operations, such as showing a connected wallet or user identifier.

```typescript
<Card className="flex justify-center">
  <EnsProfile name="nick.eth" />
</Card>
```

--------------------------------

### Wagmi ENS Resolution Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/multichain.mdx

Demonstrates how to resolve ENS names within a dApp using the Wagmi library. It shows how to specify the chain ID, such as Mainnet (1) or Sepolia (11155111), to ensure correct resolution for cross-chain applications.

```typescript
import { useAccount, useEnsAvatar, useEnsName } from 'wagmi'

const Name = () => {
  const { data: ensName } = useEnsAddress({
    address: 'luc.eth',
    chainId: 1, // (1 = Ethereum, 11155111 = Sepolia)
  })

  return <div>{ensName || address}</div>
}
```

--------------------------------

### Ownable Contract for ENS Naming

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/naming-contracts.mdx

An example of a Solidity contract inheriting from OpenZeppelin's Ownable. This pattern allows the contract owner to manage the contract's primary ENS name without embedding ENS-specific logic.

```solidity
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Contract is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}
}
```

--------------------------------

### Update ENS Temporary Premium Price Oracle

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/1.1.mdx

This documentation outlines the steps to update the ENS temporary premium pricing. It involves deploying a new price oracle contract and setting it on the ENS controller. This is a critical step for managing expiring ENS names.

```APIDOC
APIDOC:
  Deploy LinearPremiumPriceOracle:
    - Parameters:
      - initialPremiumUSD: 100000 (USD)
      - period: 28 (days)
      - otherPricingVariables: Identical to current oracle
    - Description: Deploys a new instance of the LinearPremiumPriceOracle contract with the specified parameters.

  Set ENS Controller Price Oracle:
    - Method: controller.ens.eth.setPriceOracle
    - Parameters:
      - newPriceOracleAddress: Address of the newly deployed LinearPremiumPriceOracle contract
    - Description: Updates the ENS controller to use the new price oracle for determining temporary premiums.
```

--------------------------------

### Generate ENS Labelhash

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/names.mdx

Demonstrates how to generate a labelhash, which is the Keccak-256 hash of a single ENS label. It emphasizes the necessity of normalizing the label first. Examples are provided for Viem, Ethers.js, and Solidity.

```typescript
import { labelhash, normalize } from 'viem/ens'

const normalizedLabel = normalize('label')
const hash = labelhash(normalizedLabel)
```

```typescript
import { keccak256 } from 'ethers/crypto'
import { ensNormalize } from 'ethers/hash'
import { toUtf8Bytes } from 'ethers/utils'

const normalizedLabel = ensNormalize('label')
const labelhash = keccak256(toUtf8Bytes(normalizedLabel))
```

```solidity
string constant label = "label";
bytes32 constant labelhash = keccak256(bytes(label));
```

--------------------------------

### Deploy ReverseClaimer Contract

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/naming-contracts.mdx

A Solidity contract example using ReverseClaimer to automatically claim ownership of a contract's reverse ENS node upon deployment. The deployer is set as the owner, allowing them to update the reverse name.

```solidity
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/reverseRegistrar/ReverseClaimer.sol";

contract MyContract is ReverseClaimer {
    constructor (
        ENS ens
    ) ReverseClaimer(ens, msg.sender) {}
}
```

--------------------------------

### Display Hosting Options

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dweb/intro.mdx

Shows popular decentralized hosting and pinning options (IPFS/Filecoin, Swarm, Arweave) presented as badges within a React Card component.

```jsx
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

<Card className="flex justify-center gap-4">
  {['IPFS / Filecoin', 'Swarm', 'Arweave'].map((tag) => (
    <Badge key={tag} variant="secondary">
      {tag}
    </Badge>
  ))}
</Card>
```

--------------------------------

### ENS Root Contract Subnode Ownership Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/0.1.mdx

Illustrative Solidity snippet demonstrating the `setSubnodeOwner` function, used for managing subdomains and namespaces within the ENS Root contract. This is relevant to the transfer of the 'reverse' namespace.

```Solidity
pragma solidity ^0.8.0;

// Assume ENSRoot is an interface or contract for the ENS Root registry
interface ENSRoot {
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external;
    // Other ENS Root functions...
}

// Example of how setSubnodeOwner might be called:
// Assume 'ensRoot' is an instance of ENSRoot
// Assume 'reverseLabelHash' is keccak256('reverse')
// Assume 'daoTimelockAddress' is the address of wallet.ensdao.eth

// bytes32 reverseNode = keccak256("reverse"); // This is incorrect, node is usually parent node hash
// Correct usage would involve the parent node hash, e.g., keccak256("") for the root node
// For 'reverse' under root, the node would be keccak256("") and label would be keccak256('reverse')

// Example call structure:
// ensRoot.setSubnodeOwner(bytes32(0), keccak256("reverse"), daoTimelockAddress);
```

--------------------------------

### Update User's Resolver

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/interacting.mdx

Explains how to change the resolver contract for an ENS name. This involves calling the `setResolver` function on the ENSRegistry contract, with examples provided for the Solidity interface and ENSjs implementation.

```solidity
interface ENS {
    function setResolver(bytes32 node, address resolver) external;
}
```

```typescript
import { addEnsContracts } from '@ensdomains/ensjs'
import { setResolver } from '@ensdomains/ensjs/wallet'
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const wallet = createWalletClient({
  chain: addEnsContracts(mainnet),
  transport: custom(window.ethereum),
})
const hash = await setResolver(wallet, {
  name: 'ens.eth',
  contract: 'registry',
  resolverAddress: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
})
// 0x...
```

--------------------------------

### Increase USDC Allowance Function

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.29.mdx

This entry documents the `increaseAllowance` function, which allows increasing the spending limit for USDC. It specifies the function signature, expected parameters, and provides an example of how it might be called with specific arguments and encoded transaction data.

```APIDOC
increaseAllowance(address spender, uint256 increment)
  - Description: Increases the amount of USDC that the Autowrap strategy contract is able to spend.
  - Parameters:
    - spender: The address of the contract or account to grant allowance to.
    - increment: The amount of USDC to add to the allowance.
  - Example Usage:
    - Function Signature: `function increaseAllowance(address spender, uint256 increment)`
    - Arguments: `["0x1D65c6d3AD39d454Ea8F682c49aE7744706eA96d", 1100000000000]`
    - Encoded Transaction Data: `0x395093510000000000000000000000001d65c6d3ad39d454ea8f682c49ae7744706ea96d000000000000000000000000000000000000000000000000000001001d1bf800`
  - Related Information:
    - USDC Contract Address: [0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48](https://etherscan.io/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
    - Simulation Link: [Simulation](https://www.tdly.co/shared/simulation/d94d705b-0025-4500-b5d0-e4eba5221abe)
```

```Solidity
function increaseAllowance(address spender, uint256 increment) public virtual returns (bool) {
    _increaseAllowance(msg.sender, spender, increment);
    return true;
}
```

--------------------------------

### Get Domains Owned by Account (GraphQL)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/subgraph.mdx

Retrieves a list of ENS domains owned by a specific Ethereum address. Requires the address to be in lowercase. The query fetches the 'name' field for each domain associated with the owner.

```graphql
query getDomainsForAccount {
  domains(where: { owner: "0xa508c16666c5b8981fa46eb32784fccc01942a71" }) {
    name
  }
}
```

--------------------------------

### Get Reverse Node using Viem

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/naming-contracts.mdx

A TypeScript script using the Viem library to calculate the reverse ENS node for a given contract address. This is essential for managing the contract's primary ENS name.

```typescript
import { Hex, keccak256 } from 'viem'
import { namehash } from 'viem/ens'

function getNodeFromParentNodeAndLabelhash(parentNode: Hex, labelhash: Hex) {
  return keccak256((parentNode + labelhash.split('0x')[1]) as Hex)
}

const myContractAddress = '0x...' // replace with your contract address

const node = getNodeFromParentNodeAndLabelhash(
  namehash('addr.reverse'),
  labelhash(myContractAddress.slice(2).toLowerCase())
)

console.log(node)
```

--------------------------------

### ENS Registrar Controller Contract Example

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/0.1.mdx

Illustrative Solidity snippet showing the `transferOwnership` function, commonly used for changing contract ownership. This is relevant to proposals involving the ENS Registrar Controller and Price Oracle.

```Solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ENSController is Ownable {
    // Contract logic for ENS Registrar Controller

    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialization logic
    }

    // Other functions...
}

// Example of how transferOwnership might be called:
// Assume 'controller' is an instance of ENSController
// Assume 'newOwnerAddress' is the address of wallet.ensdao.eth
// controller.transferOwnership(newOwnerAddress);
```

--------------------------------

### Get ENS Domain Expiry Date (GraphQL)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/subgraph.mdx

Retrieves the expiry date for a given ENS domain. The query searches for registrations associated with the domain name and returns the 'expiryDate' field, ordered by expiry date.

```graphql
query getDomainExp($Account: String = "paulieb.eth") {
  registrations(
    where: { domain_: { name: $Account } }
    first: 1
    orderBy: expiryDate
    orderDirection: desc
  ) {
    expiryDate
  }
}
```

--------------------------------

### Update User Text Records

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/interacting.mdx

Provides methods for updating text records associated with an ENS name, such as avatars or custom text entries. It includes the Solidity interface for the `setText` function and an ENSjs example for setting multiple records.

```solidity
interface Resolver {
    function setText(bytes32 node, string calldata key, string calldata value) external;
}
```

```typescript
import { addEnsContracts } from '@ensdomains/ensjs'
import { setRecords } from '@ensdomains/ensjs/wallet'
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const wallet = createWalletClient({
  chain: addEnsContracts(mainnet),
  transport: custom(window.ethereum),
})
const hash = await setRecords(wallet, {
  name: 'ens.eth',
  coins: [
    {
      coin: 'ETH',
      value: '0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7',
    },
  ],
  texts: [{ key: 'foo', value: 'bar' }],
  resolverAddress: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
})
// 0x...
```

--------------------------------

### Get Top Domain by Expiry (GraphQL)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/subgraph.mdx

Fetches the top ENS domain for an account, determined by the longest registry or expiry date. It queries the 'account' entity and orders registrations by 'expiryDate' in descending order to find the most recently expired or longest-held domain.

```graphql
query getDomainForAccount {
  account(id: "0xa508c16666c5b8981fa46eb32784fccc01942a71") {
    registrations(first: 1, orderBy: expiryDate, orderDirection: desc) {
      domain {
        name
      }
    }
    id
  }
}
```

--------------------------------

### Cow's TWAP Functionality Reference

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.1.mdx

Details on Cow's TWAP (Time-Weighted Average Price) function, which is used for executing the ETH to USDC swaps. This section highlights that the TWAP function is not directly supported by Tally or Zodiac Roles Modifier (ZRM) permissions, necessitating a specific Safe setup.

```APIDOC
Cow's TWAP function:
  - Purpose: Facilitates the execution of Time-Weighted Average Price swaps.
  - Integration Note: Currently not supported by Tally or Zodiac Roles Modifier (ZRM) permissions.
  - Usage: Requires a dedicated Safe with specific signers for execution.
  - Swap Strategy:
    1. 1,000 ETH swap for immediate funding needs.
    2. 5,000 ETH swap via a 3-month TWAP, executed in ~55.6 ETH parts.
```

--------------------------------

### Executable Transactions for Service Provider Streams

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.2.mdx

This section details the five executable transactions required to initiate and manage streams for Service Providers. These operations involve interacting with Superfluid contracts for USDC wrapping and stream creation.

```APIDOC
APIDOC:
  Group: Service Provider Stream Initiation

  1. APPROVE Superfluid contracts to wrap USDC:
    - Description: Authorizes Superfluid contracts to wrap a specified amount of USDC.
    - Parameters:
      - amount: The amount of USDC to be wrapped (e.g., 300,000 USDC).
      - token: The USDC token address.
      - spender: The Superfluid contract address authorized to wrap.
    - Returns: Approval status.
    - Example:
      APPROVE(token='USDC_ADDRESS', spender='SUPERFLUID_WRAPPER_ADDRESS', amount=300000)

  2. WRAP USDC to USDCx:
    - Description: Converts USDC to USDCx, the Superfluid-native token for streaming.
    - Parameters:
      - amount: The amount of USDC to wrap (e.g., 300,000 USDC).
      - token: The USDC token address.
      - wrapper: The Superfluid wrapper contract address.
    - Returns: Transaction receipt indicating successful wrapping.
    - Example:
      WRAP(token='USDC_ADDRESS', wrapper='SUPERFLUID_WRAPPER_ADDRESS', amount=300000)

  3. START A STREAM:
    - Description: Initiates a continuous stream of USDCx to a specified recipient (Stream Management Pod).
    - Parameters:
      - sender: The address initiating the stream (e.g., Stream Management Pod).
      - recipient: The address receiving the stream (e.g., Service Provider's wallet).
      - flowRate: The amount of USDCx to be streamed per second (e.g., 0.114155251141552512 USDCx/sec).
      - token: The USDCx token address.
      - contract: The Superfluid stream manager contract.
    - Returns: Transaction receipt indicating successful stream creation.
    - Example:
      START_STREAM(sender='STREAM_MANAGEMENT_POD', recipient='SERVICE_PROVIDER_XYZ', flowRate=0.114155251141552512, token='USDCX_ADDRESS', contract='SUPERFLUID_STREAM_MANAGER')

  4. APPROVE AutoWrap contract to wrap additional USDC:
    - Description: Authorizes the AutoWrap contract to wrap a larger amount of USDC for future streams.
    - Parameters:
      - amount: The total amount of USDC to be wrapped (e.g., 5.1M USDC).
      - token: The USDC token address.
      - spender: The AutoWrap contract address authorized to wrap.
    - Returns: Approval status.
    - Example:
      APPROVE(token='USDC_ADDRESS', spender='AUTOWRAP_CONTRACT_ADDRESS', amount=5100000)

  5. ENABLE AUTO-WRAP:
    - Description: Configures the AutoWrap contract to automatically wrap USDC to USDCx within specified limits.
    - Parameters:
      - contract: The AutoWrap contract address.
      - token: The USDC token address.
      - lowerLimit: The minimum USDC balance to trigger wrapping (e.g., 200,000).
      - upperLimit: The maximum USDC balance before stopping wrapping (e.g., 500,000).
    - Returns: Configuration status.
    - Example:
      ENABLE_AUTO_WRAP(contract='AUTOWRAP_CONTRACT_ADDRESS', token='USDC_ADDRESS', lowerLimit=200000, upperLimit=500000)

  Related Methods:
    - All these transactions are part of a single EP to manage service provider streams.
  Error Conditions:
    - Insufficient USDC balance for wrapping.
    - Incorrect contract addresses or parameters.
    - Transaction failures on the blockchain.
```

--------------------------------

### Get Primary ENS Name for Address (Multiple Languages)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/reverse.mdx

Demonstrates how to retrieve a user's primary ENS name associated with an Ethereum address using reverse resolution. It covers implementations in popular web3 libraries and emphasizes the importance of verifying the resolved name against the original address to prevent spoofing. ENS resolution requests are made from Ethereum Mainnet.

```tsx
import { useEnsName } from 'wagmi'
import { mainnet } from 'wagmi/chains'

export const Name = () => {
  const { data: name } = useEnsName({
    address: '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5',
    chainId: mainnet.id, // resolution always starts from L1
  })

  return <div>Name: {name}</div>
}
```

```ts
const address = '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5';
const name = await provider.lookupAddress(address);

// Always verify the forward resolution
if (name) {
    const resolvedAddress = await provider.resolveName(name);
    if (resolvedAddress !== address) {
        // If verification fails, use the original address
        return address;
    }
}
```

```ts
// https://viem.sh/docs/ens/actions/getEnsName.html
import { publicClient } from './client'

const ensName = await publicClient.getEnsName({
  address: '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5',
})
```

```py
# https://web3py.readthedocs.io/en/latest/ens_overview.html#get-the-ens-name-for-an-address
from ens.auto import ns

name = ns.name('0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5')
```

```go
package main

import (
	"fmt"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	ens "github.com/wealdtech/go-ens/v3"
)

func main() {
	client, _ := ethclient.Dial("https://rpc.ankr.com/eth")

	name, _ := ens.ReverseResolve(client, common.HexToAddress("0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5"))
	fmt.Println("Name:", name)
	// Name: nick.eth
}
```

--------------------------------

### Basic Gateway Implementation Reference

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/ccip-read.mdx

A reference to a library that abstracts the decoding of calldata for basic gateway implementations, allowing static value returns without signing.

```typescript
import ccipReadRouter from '@ensdomains/ccip-read-router';
// Example usage would involve configuring the router with gateway logic.
```

--------------------------------

### setupDomain Method for Subname Registrar

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/creating-subname-registrar.mdx

A method often found in subname registrar contracts to 'enable' a parent name, allowing configuration of pricing terms or beneficiary accounts for subnames created under it.

```APIDOC
setupDomain(address parentName, address pricingContract, address beneficiary, ...)
  - Configures a parent name within the subname registrar.
  - Parameters:
    - parentName: The ENS name that will have subnames created under it.
    - pricingContract: Address of a contract defining pricing for subnames (optional).
    - beneficiary: Address to receive registration fees (optional).
    - ...: Other configuration parameters as needed.
  - Usage:
    - Called by the deployer or administrator to prepare a parent name for subname registration.
```

--------------------------------

### Community Managed Identity Server Proposal

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/1.6.mdx

Details the proposal for establishing a subgroup to manage a DAO-run Identity Server for Sign-In with Ethereum (SIWE). It outlines funding, responsibilities, and contract details.

```markdown
## Specification and Proposal Request

- **Establish a Subgroup in the Ecosystem Working Group: Community Managed Identity Server**
  - **$250,000** allocated from the DAO to the Ecosystem WG to fund this Subgroup.
    - **$75,000** from the allocated budget will be in place for community contributions related to the Subgroup, including grants for development, evangelism, and retroactive rewards for SIWE-related efforts.
    - **$175,000** from the allocated budget will go towards Spruce's maintenance contract (see below). Paid 25% upon execution, and then an additional 25% every 3 months.
  - This Subgroup will support the administration and maintenance of a DAO-run Identity Server for Sign-In with Ethereum. This subgroup will also serve as a support system to help onboard organizations, and evangelize Sign-In with Ethereum to allow users to control their identifiers and use ENS profiles as a base identity.
  - An important part of duties this group will include creating training, onboarding, and maintenance materials for managing the server on a specified cloud account.
  - Additionally, the group will be responsible for providing updates to the broader community on the health of the server.
  - Initial lead: Rocco from Spruce, while continuing to add interested parties to the group for good governance.
- **A 12-month maintenance contract awarded to Spruce for the continuous monitoring, maintaining, and improving of the deployed Identity Server.**
  - Spruce will help host a [`siwe-oidc`](https://github.com/spruceid/siwe-oidc) implementation in a lightweight fashion, using a well-known infrastructure provider ultimately administered by the Subgroup.
    - Spruce will also be responsible for the deployment, and continuous monitoring, maintenance, and improvements on the server throughout the duration of the contract.
  - If the DAO votes to end the contract funding will be returned against the remaining days of the year and we will provide sufficient training for administrators to transfer those duties to a new organization.
  - The server is expected to be live within 60 days of this proposal being accepted, assuming that access to the necessary systems and people is provided on a timely basis.
  - The 1-year contract begins when this proposal is accepted, and there will not be additional setup fees even if there are increased coordination costs to get the service running.
```

--------------------------------

### Create Vesting Plan with Hedgey Batch Planner

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.29.mdx

Creates a vesting plan for tokens using the Hedgey Batch Planner. This involves specifying the locker, token, total amount, recipient details, vesting period, and administrative settings.

```APIDOC
function batchVestingPlans(address locker, address token, uint256 totalAmount, (address recipient, uint256 amount, uint256 start, uint256 cliff, uint256 rate)[] recipients, uint256 period, address vestingAdmin, bool adminTransferOBO, uint8 mintType) external
  - Creates multiple vesting plans in a single transaction.
  - Parameters:
    - `locker`: The address of the locker contract.
    - `token`: The address of the token to be vested.
    - `totalAmount`: The total amount of tokens to be vested across all plans.
    - `recipients`: An array of recipient details, each containing:
      - `recipient`: The address of the beneficiary.
      - `amount`: The amount of tokens for this specific recipient.
      - `start`: The Unix timestamp when vesting begins.
      - `cliff`: The Unix timestamp for the cliff period.
      - `rate`: The vesting rate (tokens per second).
    - `period`: The duration of the vesting period in seconds.
    - `vestingAdmin`: The address of the vesting administrator.
    - `adminTransferOBO`: A boolean indicating if the admin can transfer on behalf of others.
    - `mintType`: The type of minting for the tokens.
```

--------------------------------

### requestSwapExactTokensForTokens API Method

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.3.mdx

This entry describes the `requestSwapExactTokensForTokens` method, used for executing exact token-to-token swaps. It details the required parameters, including amounts, token addresses, recipient, and optional price checking data.

```APIDOC
APIDOC:
  requestSwapExactTokensForTokens(amountIn, fromToken, toToken, to, priceChecker, priceCheckerData)
    - Description: Executes a token swap for a specified exact input amount.
    - Parameters:
      - amountIn (uint256): The exact amount of input tokens to be swapped. Example: "1000000000000000000000"
      - fromToken (address): The address of the token to swap from. Example: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
      - toToken (address): The address of the token to swap to. Example: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
      - to (address): The address that will receive the swapped tokens. Example: "0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7"
      - priceChecker (address): The address of the price checker contract. Example: "0x2F965935f93718bB66d53a37a97080785657f0AC"
      - priceCheckerData (bytes): Data used by the price checker for validation. Example: "0x00000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000005"
    - Returns: The amount of `toToken` received by the recipient.
```

--------------------------------

### Import Card Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/overview.mdx

Imports the Card UI component from the local components directory. This component is likely used for structuring content visually.

```javascript
import { Card } from '../../components/ui/Card'
```

--------------------------------

### Import and Render ENS Domains HomePage Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/index.mdx

This snippet demonstrates how to import the HomePage component from its relative path and render it within the application. It's a common pattern in React applications for structuring UI components.

```javascript
import { HomePage } from '../components/HomePage'

<HomePage />
```

--------------------------------

### ENS DAO ETH to USDC Swap Specification (APIDOC)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.3.mdx

This documentation outlines the sequence of smart contract interactions required to execute the ENS DAO's proposal to swap 10,000 ETH for USDC. It details the specific contract calls, parameters, and addresses involved in withdrawing ETH, depositing WETH, approving the swap agent, and requesting the token swap.

```APIDOC
ENS DAO ETH to USDC Swap Process:

This process involves a series of smart contract interactions to convert 10,000 ETH into USDC for the ENS DAO treasury.

1.  **Withdraw ETH from Controller**
    *   **Method**: `withdraw()`
    *   **Contract**: `controller.ens.eth` (0x283af0b28c62c092c9727f1ee09c02ca627eb7f5)
    *   **Description**: Initiates the withdrawal of ETH from the ENS controller contract.
    *   **Parameters**: None specified.
    *   **Return Value**: Implied success or transaction hash.

2.  **Deposit ETH as WETH**
    *   **Method**: `deposit()`
    *   **Contract**: `WETH9` (0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)
    *   **Description**: Deposits 10,000 ETH into the WETH contract to obtain WETH tokens.
    *   **Parameters**: 
        - `amount`: 10,000 ETH (represented as a large integer).
    *   **Return Value**: Implied success or transaction hash.

3.  **Approve WETH Transfer**
    *   **Method**: `approve(spender, amount)`
    *   **Contract**: `WETH9` (0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)
    *   **Description**: Approves the 'milkman' contract to spend the deposited WETH tokens on behalf of the DAO.
    *   **Parameters**: 
        - `spender`: Address of the 'milkman' contract (0x11C76AD590ABDFFCD980afEC9ad951B160F02797).
        - `amount`: The total amount of WETH to be approved (10,000 ETH).
    *   **Return Value**: Boolean indicating approval success.

4.  **Request Token Swap**
    *   **Method**: `requestSwapExactTokensForTokens(amountIn, tokenIn, tokenOut, to, permit, data)`
    *   **Contract**: `milkman` (0x11C76AD590ABDFFCD980afEC9ad951B160F02797)
    *   **Description**: Executes the swap of WETH for USDC. The `data` parameter includes slippage and path information for Uniswap v3.
    *   **Parameters**: 
        - `amountIn`: The amount of WETH to swap (10,000 ETH).
        - `tokenIn`: Address of the input token (WETH9: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2).
        - `tokenOut`: Address of the output token (USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).
        - `to`: The recipient address for the swapped tokens (wallet.ensdao.eth: 0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7).
        - `permit`: Not specified in this context, likely null or a specific permit object if required.
        - `data`: Encoded data for slippage checking against Uniswap v3 (e.g., generated by the JavaScript snippet above).
    *   **Return Value**: Implied success or transaction hash, with USDC tokens sent to the 'to' address.

**Related Addresses:**
- `wallet.ensdao.eth`: 0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7
- `controller.ens.eth`: 0x283af0b28c62c092c9727f1ee09c02ca627eb7f5
- `WETH9`: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
- `milkman`: 0x11C76AD590ABDFFCD980afEC9ad951B160F02797
- `USDC`: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- `Uniswap v3 slippage checker`: 0x2F965935f93718bB66d53a37a97080785657f0AC
```

--------------------------------

### Superfluid Stream Initialization: Set Flowrate

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.29.mdx

Sets up the Superfluid stream by defining the flow rate from the sender (USDCx) to the receiver (Unruggable multisig wallet). This is the third transaction in the sequence.

```Solidity
function setFlowrate(address tokenAddress, address receiverAddress, int96 amountPerSecond)
```

```Target Address
0xcfA132E353cB4E398080B9700609bb008eceB125
```

```Function Arguments
["0x1BA8603DA702602A8657980e825A6DAa03Dee93a", "0x64Ca550F78d6Cc711B247319CC71A04A166707Ab", 38026517538495352]
```

```Calldata
0x57e6aa360000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a00000000000000000000000064ca550f78d6cc711b247319cc71a04a166707ab000000000000000000000000000000000000000000000000008718ea8ded5b78
```

```Simulation
https://www.tdly.co/shared/simulation/725d872b-8174-4fa5-a60b-5d45eea1812f
```

--------------------------------

### Endowment Permissions - Swap & Protocol Management

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/4.5.mdx

Outlines permissions for removing access to certain DEXs and adding new swap functionalities across various decentralized exchanges and liquidity pools.

```APIDOC
APIDOC:
  Removal of CowSwap permissions
    - Description: Revokes the Endowment's permissions to interact with CowSwap.

  Removal of SushiSwap permissions
    - Description: Revokes the Endowment's permissions to interact with SushiSwap.

  Addition of alternative getReward() for Aura pools
    - Description: Grants permission to use an alternative getReward() function for Aura pools, likely for improved reward management.
    - Parameters:
      - protocol: Aura
      - function: getReward()

  Swaps:
    - rETH <> WETH on Balancer
      - Description: Enables swaps between rETH and WETH on the Balancer protocol.
      - Parameters:
        - token_in: rETH or WETH
        - token_out: WETH or rETH
        - protocol: Balancer

    - rETH <> WETH on Uniswap v3
      - Description: Enables swaps between rETH and WETH on Uniswap v3.
      - Parameters:
        - token_in: rETH or WETH
        - token_out: WETH or rETH
        - protocol: Uniswap v3

    - ankrETH <> wstETH on Balancer
      - Description: Enables swaps between ankrETH and wstETH on Balancer.
      - Parameters:
        - token_in: ankrETH or wstETH
        - token_out: wstETH or ankrETH
        - protocol: Balancer

    - ETHx <> WETH on Balancer
      - Description: Enables swaps between ETHx and WETH on Balancer.
      - Parameters:
        - token_in: ETHx or WETH
        - token_out: WETH or ETHx
        - protocol: Balancer

    - ankrETH <> ETH on Curve
      - Description: Enables swaps between ankrETH and ETH on Curve.
      - Parameters:
        - token_in: ankrETH or ETH
        - token_out: ETH or ankrETH
        - protocol: Curve

    - ETHx <> WETH on Pancake Swap
      - Description: Enables swaps between ETHx and WETH on Pancake Swap.
      - Parameters:
        - token_in: ETHx or WETH
        - token_out: WETH or ETHx
        - protocol: Pancake Swap
```

--------------------------------

### Basic Onchain Resolver Implementation

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/writing.mdx

A simple Solidity contract demonstrating an on-chain resolver that maps ENS nodes to addresses. It includes methods to set an address and to support EIP-165 interface detection.

```solidity
contract OnchainResolver {
    mapping(bytes32 node => address addr) public addr;

    function setAddr(bytes32 node, address _addr) external {
        addr[node] = _addr;
    }

    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return
            interfaceID == OnchainResolver.supportsInterface.selector ||
            // function addr(bytes32 node) external view returns (address)
            interfaceID == 0x3b3b57de;
    }
}
```

--------------------------------

### Permissions Policy Visualization

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.12.mdx

Describes the feature within the Zodiac Roles app that visualizes proposed permissions policies using DeFi Kit Protocol Actions. This provides a simplified and abstract representation of policy configurations.

```APIDOC
PolicyVisualization:
  feature: "show annotations" button
  location: top-right of the diff interface
  representation: DeFi Kit Protocol Actions
    - Description: Enables a simplified and abstract visualization of the proposed permissions policy, enhancing understanding and accessibility for audit purposes.
```

--------------------------------

### Link to ENS Manager App

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/protocol.mdx

Offers a direct link to the ENS Manager App, a web-based interface for managing ENS names. The link opens in a new tab for user convenience.

```javascript
import { EmbedLink } from '../../components/EmbedLink'

// ... inside a React component
<EmbedLink
  href="https://ens.app"
  target="_blank"
  title="ENS Manager App"
  description="The ENS Manager App is a web-based interface for managing ENS names."
/>
```

--------------------------------

### Display ENS Profiles

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/protocol.mdx

Demonstrates how to use the EnsProfile component to display ENS names. This component likely fetches and renders profile information associated with a given ENS name.

```javascript
import { EnsProfile } from '../../components/EnsProfile'
import { Card } from '../../components/ui/Card'

// ... inside a React component
<Card className="flex flex-col items-center justify-center gap-2 sm:flex-row">
  <EnsProfile name="nick.eth" />
  <EnsProfile name="jefflau.eth" />
</Card>
```

--------------------------------

### Hedgey Stream Initialization

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.29.mdx

Details the process of initializing a Hedgey stream for ENS token allocation. This involves two transactions, specifying target addresses, function signatures, arguments, and the raw calldata for the smart contract interaction.

```APIDOC
HedgeyStreamInitialization:
  Description: Initialising the Hedgey stream involves 2 transactions.
  Platform: Hedgey
  Purpose: Allocating delegateable ENS tokens to ecosystem participants.

  Transaction 1:
    Target Name: ENS DAO
    Target Address: 0x...
    Function Signature: initializeStream(address _token, uint256 _amount, uint256 _vestingPeriod, uint256 _startTime, address _beneficiary, uint256 _streamId)
    Function Arguments:
      _token: Address of the ENS token contract.
      _amount: Total amount of tokens to be streamed.
      _vestingPeriod: Duration of the vesting period in seconds.
      _startTime: Unix timestamp for when the stream begins.
      _beneficiary: Address receiving the tokens.
      _streamId: Unique identifier for the stream.
    Calldata: 0x...
```

```APIDOC
HedgeyStreamInitialization:
  Transaction 2:
    Target Name: ENS DAO
    Target Address: 0x...
    Function Signature: addDelegate(uint256 _streamId, address _delegateAddress)
    Function Arguments:
      _streamId: The ID of the stream to add a delegate to.
      _delegateAddress: The address designated as a delegate.
    Calldata: 0x...
```

--------------------------------

### Create Auto-Wrap Schedule Function and Calldata

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.2.mdx

Defines the `createWrapSchedule` function signature used for setting up automatic wrapping schedules for ENS streams. It includes the function's parameters: superToken address, Strategy contract address, base token address, expiry, lowerLimit, and upperLimit. The lower and upper limits are specified in seconds, determining when funds are automatically wrapped based on the stream's runway.

```Solidity
function createWrapSchedule (address superToken, address strategy, address baseToken, uint64 expiry, uint64 lowerLimit, uint64 upperLimit)
```

```Hex
0x5626f9e60000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a0000000000000000000000001d65c6d3ad39d454ea8f682c49ae7744706ea96d000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000b2d05e0000000000000000000000000000000000000000000000000000000000001baf80000000000000000000000000000000000000000000000000000000000041eb00
```

--------------------------------

### Importing ENS Components

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/dns.mdx

Imports necessary React components for rendering DNS-related features on the ENS documentation site.

```javascript
import { DNSGrid } from '../../components/DNSGrid'
import { DNSUsageExamples } from '../../components/DNSUsageExamples'
import { EmbedLink } from '../../components/EmbedLink'
```

--------------------------------

### Protocol Guild Pilot Vesting Contract

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/1.9.mdx

Details the specific smart contract used for the Protocol Guild's 2022 Pilot program, which handles fund vesting for Guild members over one year. This contract is hosted on 0xsplits.xyz.

```APIDOC
Contract: Pilot Vesting Contract
URL: https://app.0xsplits.xyz/accounts/0xF29Ff96aaEa6C9A1fBa851f74737f3c069d4f1a9/

Purpose:
  To manage the direct vesting of funds to Protocol Guild members over a one-year period as part of the 2022 Pilot program.

Key Features:
  - Time-based vesting mechanism.
  - Autonomous value routing for core protocol work.
  - Trustless fund handling, without custody by the Protocol Guild.

Related Information:
  - General smart contract documentation: https://protocol-guild.readthedocs.io/en/latest/3-smart-contract.html
```

--------------------------------

### Set Flowrate for Superfluid

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.2.mdx

Initiates a streaming payment (flow) from a sender to a receiver using Superfluid. This function sets the rate at which tokens are transferred per second.

```APIDOC
setFlowrate(address sender, address receiver, int96 flowRate)
  - Sets or updates a streaming payment flow.
  - Parameters:
    - sender: The address initiating the flow (e.g., the Super-USDC contract).
    - receiver: The address receiving the tokens.
    - flowRate: The rate of token transfer per second, represented as an integer.
  - Example:
    setFlowrate(0x1BA8603DA702602A8657980e825A6DAa03Dee93a, 0xB162Bf7A7fD64eF32b787719335d06B2780e31D1, 114155251141552512)
```

--------------------------------

### ENS Provider Selection Process

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/4.9.mdx

Details the process for selecting ENS service providers based on DAO approval of EP4.7. It outlines the steps for ordering proposals, evaluating them against vote thresholds, budget checks, and the 'None of the Above' option, as well as the post-selection procedure.

```APIDOC
ENS Provider Selection Process:
  Purpose: Select service providers for annual funding to enhance the ENS system.
  Budget: $3,600,000 USDC annually.
  Dependencies: Approval of EP4.7.

  Evaluation Steps:
    1. Order Proposals: Arrange all proposals in descending order based on the number of votes received.
    2. Evaluate Proposals Sequentially:
       - Vote Threshold Check: Stop if a proposal has received fewer than 1 million votes.
       - Comparison with 'None of the Above': Stop if a proposal has fewer votes than the 'None of the Above' option.
       - Budget Check: Skip if a proposal's requested budget exceeds the remaining budget.
       - Selection: Add proposal to selected set and deduct its requested budget from remaining budget if it passes checks.

  Post-Selection Procedure:
    - If at least one provider is chosen, Meta-Governance working group posts an executable vote to implement funding streams by January 10.

  Voting Instructions:
    - Vote FOR providers capable of continuous evolution and enhancement of ENS with good cost-benefit.
    - Do NOT vote for providers deemed incapable, with out-of-scope projects, or too high asks.
    - Vote 'None of the Above' to express disapproval of the whole system and prevent any projects from being selected.

  Candidates:
    - NameSys.eth: Requested Budget: $200,000 p.a.
    - handle.eth: Requested Budget: $100,000 p.a.
    - NameHash Labs: Requested Budget: $600,000 p.a.
    - Unruggable: Requested Budget: $400,000 p.a.
    - generalmagic.eth & pairwise.eth: Requested Budget: $300,000 p.a.
```

--------------------------------

### ENS Sepolia Deployments

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/deployments.mdx

Renders contract deployment information for the Sepolia testnet.

```jsx
<ContractDeployments chain="sepolia" />
```

--------------------------------

### Navigation Links to Registries

Source: https://github.com/ensdomains/docs/blob/master/src/pages/contracts/index.mdx

Generates a grid of navigation links for various ENS registry types, including the main Registry, ETH Registrar, DNS Registrar, and Reverse Registrar. Each link points to a specific registry section and displays its name.

```jsx
<div>
  <div className="grid grid-cols-3 gap-4">
    {[
      ['The Registry', '/registry/ens'],
      ['ETH Registrar', '/registry/eth'],
      ['DNS Registrar', '/registry/dns'],
      ['Reverse Registrar', '/registry/reverse'],
    ].map((list) => (
      <EmbedLink
        title={list[0]}
        description="The resolution process"
        href={list[1]}
        key={list[1]}
        className="p-4"
      />
    ))}
  </div>
</div>
```

--------------------------------

### Superfluid Stream Initialization: Approve USDC

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.29.mdx

Approves the Super USDCx contract to spend a specified amount of USDC on behalf of the sender (ENS DAO wallet). This is the first transaction in setting up a Superfluid stream.

```Solidity
function approve(address spender, uint256 amount) external returns (bool)
```

```Target Address
0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

```Function Arguments
["0x1BA8603DA702602A8657980e825A6DAa03Dee93a", 100000000000]
```

```Calldata
0x095ea7b30000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a000000000000000000000000000000000000000000000000000000174876e800
```

```Simulation
https://www.tdly.co/shared/simulation/7a33ba80-767d-4764-891f-b93690ad7b25
```

--------------------------------

### Endowment Permissions - Deposit & Stake Actions

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/4.5.mdx

Details permissions for depositing assets on lending protocols and staking ETH on liquid staking providers. These actions are part of the Endowment's strategy to diversify its holdings and manage ETH exposure.

```APIDOC
APIDOC:
  Deposit ETH on Compound v3
    - Description: Allows the Endowment to deposit ETH into Compound v3.
    - Parameters:
      - asset: ETH
      - protocol: Compound v3

  Deposit ETH or WETH on AAVE v3
    - Description: Allows the Endowment to deposit ETH or WETH into AAVE v3.
    - Parameters:
      - asset: ETH or WETH
      - protocol: AAVE v3

  Deposit ETH or WETH on Spark Protocol
    - Description: Allows the Endowment to deposit ETH or WETH into Spark Protocol.
    - Parameters:
      - asset: ETH or WETH
      - protocol: Spark Protocol

  Stake (and unstake) ETH on Stader
    - Description: Enables staking and unstaking of ETH through Stader Labs.
    - Parameters:
      - asset: ETH
      - protocol: Stader

  Stake (and unstake) ETH on Ankr
    - Description: Enables staking and unstaking of ETH through Ankr.
    - Parameters:
      - asset: ETH
      - protocol: Ankr
```

--------------------------------

### Import UI Card Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/expiry.mdx

Imports the Card UI component from a local path, typically used for structuring content visually.

```javascript
import { Card } from '../../components/ui/Card'
```

--------------------------------

### ETHRegistrarController: register Function

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Registers the ENS domain after the commit phase. It requires the same parameters as `makeCommitment` and must be called after waiting at least `MIN_COMMITMENT_AGE` (60 seconds) from the `commit` transaction. The caller must also send sufficient ETH to cover the registration price plus a small premium for slippage.

```Solidity
ETHRegistrarController.register(
    name string,
    owner address,
    duration uint256,
    secret bytes32,
    resolver address,
    data bytes[],
    reverseRecord bool,
    ownerControlledFuses uint16
)

// For example
register(
    "myname", // "myname.eth" but only the label
    0x1234..., // The address you want to own the name
    31536000, // 1 year (in seconds)
    0x1234..., // The same secret you used in the `commit` transaction
    0x1234..., // The address of the resolver you want to use
    [0x8b95dd71...], // Encoded function calls you want to pass to the resolver, like `setAddr()`
    false, // Whether or not to set the new name as your primary name
    0 // The NameWrapper fuses you want to set
);
```

--------------------------------

### Display ENS Contracts Repository

Source: https://github.com/ensdomains/docs/blob/master/src/pages/contracts/index.mdx

Renders a component to display information about the ENS contracts GitHub repository, including its source path and a brief description. This component is used to link to the project's source code on GitHub.

```jsx
<div>
  <Repository
    src="ensdomains/ens-contracts"
    description="Ethereum Name Service Contracts"
  />
</div>
```

--------------------------------

### Lido Withdrawals with Permits

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.12.mdx

Enhanced Lido withdrawal methods to support permits for both wstETH and stETH. These methods facilitate withdrawal requests using permit functionality, simplifying user interactions.

```APIDOC
LidoWithdrawals:
  requestWithdrawalsWstETHWithPermit(permit: Permit, amount: uint256, deadline: uint256, signature: bytes)
    - Description: Requests withdrawal of wstETH using a permit.
    - Parameters:
      - permit: The permit details for the transaction.
      - amount: The amount of wstETH to withdraw.
      - deadline: The Unix timestamp by which the permit is valid.
      - signature: The signature authorizing the withdrawal.
    - Returns: Transaction receipt or confirmation.

  requestWithdrawalsWithPermit(permit: Permit, amount: uint256, deadline: uint256, signature: bytes)
    - Description: Requests withdrawal of stETH using a permit.
    - Parameters:
      - permit: The permit details for the transaction.
      - amount: The amount of stETH to withdraw.
      - deadline: The Unix timestamp by which the permit is valid.
      - signature: The signature authorizing the withdrawal.
    - Returns: Transaction receipt or confirmation.
```

--------------------------------

### Render Subname Hierarchy

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/protocol.mdx

Illustrates the hierarchical structure of ENS subnames using a simple React component. It displays a list of potential subnames for a given ENS domain, showing their relative opacity to indicate hierarchy.

```javascript
import { Card } from '../../components/ui/Card'

// ... inside a React component
<Card className="flex items-center justify-center text-xl">
  <div className="text-right font-bold">
    {['root', 'registrar', 'controller', 'resolver', 'registry'].map(
      (subname, i) => (
        <div
          className={
            ['opacity-20', 'opacity-50', '', 'opacity-50', 'opacity-20'][i]
          }
          key={subname}
        >
          {subname}
        </div>
      )
    )}
  </div>
  <div className="text-blue font-bold">.ens.eth</div>
</Card>
```

--------------------------------

### ENS Upgrade Transaction Calls

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.5.mdx

Details the specific contract calls required to execute the ENS upgrade, including adding the new NameWrapper as a controller, setting the new Reverse Registrar, and updating the Public Resolver with interface information for discovery.

```APIDOC
1. Add NameWrapper as Controller to Registrar:
   Contract: 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85
   Function: addController(address controller)
   Arguments:
     - controller: 0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401 (New NameWrapper address)

2. Set New Reverse Registrar for '.reverse' node:
   Contract: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e (ENS Registry)
   Function: setSubnodeOwner(bytes32 node, bytes32 label, address owner)
   Arguments:
     - node: 0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34 (namehash('reverse'))
     - label: 0xe5e14487b78f85faa6e1808e89246cf57dd34831548ff2e6097380d98db2504a (labelhash('addr'))
     - owner: 0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb (New ReverseRegistrar address)

3. Update Public Resolver with New Controller Interface:
   Contract: 0x30200e0cb040f38e474e53ef437c95a1be723b2b (ENS Registry)
   Function: setInterface(bytes32 node, bytes4 interfaceId, address implementer)
   Arguments:
     - node: 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae (namehash('.eth'))
     - interfaceId: 0x019a38fe (Interface ID for NameWrapper)
     - implementer: 0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401 (New NameWrapper address)

4. Update Public Resolver with New Registrar Interface:
   Contract: 0x30200e0cb040f38e474e53ef437c95a1be723b2b (ENS Registry)
   Function: setInterface(bytes32 node, bytes4 interfaceId, address implementer)
   Arguments:
     - node: 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae (namehash('.eth'))
     - interfaceId: 0x612e8c09 (Interface ID for ETHRegistrarController)
     - implementer: 0x253553366Da8546fC250F225fe3d25d0C782303b (New ETHRegistrarController address)
```

--------------------------------

### Import ENS Components

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/deployments.mdx

Imports necessary React components for displaying contract deployments and embeddable links.

```typescript
import { ContractDeployments } from '../../components/ContractDeployments'
import { EmbedLink } from '../../components/EmbedLink'
import { Card } from '../../components/ui/Card'
```

--------------------------------

### Import ENS and Transaction Components

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/design.mdx

Imports necessary React components for displaying ENS profiles and transaction demos, along with a UI card component. These are foundational for building ENS-integrated interfaces.

```typescript
import { EnsProfile } from '../../components/EnsProfile'
import { SendTransactionDemo } from '../../components/SendTransaction'
import { Card } from '../../components/ui/Card'
```

--------------------------------

### Set Flow Rate Transaction

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.13.mdx

Details the Superfluid `setFlowrate` function call, specifying the token, receiver, and the desired flow rate. Includes the encoded calldata for execution.

```Solidity
Target: 0xcfA132E353cB4E398080B9700609bb008eceB125
Function: setFlowrate
Arguments:
  token: 0x1BA8603DA702602A8657980e825A6DAa03Dee93a
  receiver: 0xB162Bf7A7fD64eF32b787719335d06B2780e31D1
  flowrate: 142599440769357573
Calldata:
0x57e6aa360000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a000000000000000000000000b162bf7a7fd64ef32b787719335d06b2780e31d100000000000000000000000000000000000000000000000001fa9d6f943a1705
```

--------------------------------

### Wrap USDC to USDCX

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.2.mdx

Converts a specified amount of USDC into USDCx, the SuperToken representation of USDC. This operation is performed on the Super-USDC contract.

```APIDOC
upgrade(uint256 amount)
  - Upgrades USDC to USDCx.
  - Parameters:
    - amount: The amount of USDC to wrap.
  - Example:
    upgrade(300000000000000000000000)
```

--------------------------------

### ENS Endowment Initial Funding Specification

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.4.mdx

Details the initial fund transfers required for the ENS Endowment, including amounts, destinations, and purpose. Also lists key addresses involved in the ENS ecosystem.

```APIDOC
ENS Endowment Funding Operations:

1. Transfer 16,000 ETH to the Endowment contract.
   - Destination Address: 0x4F2083f5fBede34C2714aFfb3105539775f7FE64
   - Purpose: Initial funding tranche for the Endowment.

2. Transfer 150 ETH to the ens-metagov.pod.xyz contract.
   - Destination Address: 0x91c32893216dE3eA0a55ABb9851f581d4503d39b
   - Purpose: To cover Endowment operational fees for Q1/Q2.

Key Addresses:
- ENS DAO: 0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7
- Endowment Contract: 0x4F2083f5fBede34C2714aFfb3105539775f7FE64
- ens-metagov.pod.xyz: 0x91c32893216dE3eA0a55ABb9851f581d4503d39b
```

--------------------------------

### Retrieve DNS Import Data with ENSjs

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/dns.mdx

Demonstrates how to use the ENSjs library to fetch data required for importing a DNS name into ENS. It utilizes viem for blockchain interaction and requires a client instance configured with ENS contracts.

```ts
import { addEnsContracts } from '@ensdomains/ensjs'
import { getDnsImportData } from '@ensdomains/ensjs/dns'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: addEnsContracts(mainnet),
  transport: http(),
})

const dnsImportData = await getDnsImportData(client, {
  name: 'example.com',
})
```

--------------------------------

### ENS Mainnet Deployments

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/deployments.mdx

Renders contract deployment information for the Ethereum Mainnet.

```jsx
<ContractDeployments chain="mainnet" />
```

--------------------------------

### Subname Registration with Resolver Records

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/creating-subname-registrar.mdx

Steps to set subname records within the same transaction as registration. This involves temporarily setting the contract as owner, calling resolver methods, and then setting the final owner and records.

```APIDOC
setSubnodeOwner(bytes32 label, address owner)
  - Sets the owner of a subname.
  - Parameters:
    - label: The label of the subname to set.
    - owner: The address to temporarily set as owner.
  - Usage:
    - Call this first to grant the contract authority to set records.

Resolver Methods (e.g., setText, setAddr)
  - Methods provided by the resolver contract to set various record types.
  - Parameters and return values depend on the specific resolver method used.
  - Usage:
    - Call these after setSubnodeOwner to configure subname records.

setSubnodeRecord(bytes32 label, address owner, address resolver, uint64 expiry, uint32 fuses)
  - Sets the final owner, resolver, expiry, and fuses for a subname.
  - Parameters:
    - label: The label of the subname.
    - owner: The intended final owner of the subname.
    - resolver: The resolver address for the subname.
    - expiry: The expiry timestamp for the subname.
    - fuses: Bitmask of fuses to burn for the subname.
  - Usage:
    - Call this as the final step to finalize subname ownership and records.
```

--------------------------------

### NameWrapper Contract Subname Creation

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/creating-subname-registrar.mdx

Provides documentation for the `setSubnodeOwner` and `setSubnodeRecord` methods of the ENS NameWrapper contract, used for creating and configuring subnames.

```APIDOC
NameWrapper.setSubnodeOwner(bytes32 parentNode, string label, address owner, uint32 fuses, uint64 expiry)
  - Creates a subnode with a specified owner, fuses, and expiry.
  - Parameters:
    - parentNode: The namehash of the parent node (e.g., "myname.eth").
    - label: The label of the subname to create (e.g., "sub").
    - owner: The address that will own the new subname.
    - fuses: Bitmask representing fuses to burn (e.g., 65536 for emancipated rental).
    - expiry: The Unix timestamp for the subname's expiry.
  - Example:
    setSubnodeOwner(
        0x6cbc..., // The namehash of the parent node, e.g. "myname.eth"
        "sub", // The label of the subname to create
        0x1234..., // The address you want to be the owner of the new subname
        65536, // The fuse bits OR'd together, that you want to burn
        2021232060 // The expiry for the subname
    )

NameWrapper.setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry)
  - Creates a subnode and sets its owner, resolver, TTL, fuses, and expiry.
  - Parameters:
    - parentNode: The namehash of the parent node (e.g., "myname.eth").
    - label: The label of the subname to create (e.g., "sub").
    - owner: The address that will own the new subname.
    - resolver: The address of the resolver to set for the new subname.
    - ttl: The Time To Live for the subname's record.
    - fuses: Bitmask representing fuses to burn (e.g., 65536 for emancipated rental).
    - expiry: The Unix timestamp for the subname's expiry.
  - Example:
    setSubnodeRecord(
        0x6cbc..., // The namehash of the parent node, e.g. "myname.eth"
        "sub", // The label of the subname to create
        0x1234..., // The address you want to be the owner of the new subname
        0x5678..., // The address of the resolver to set for the new subname
        0, // The TTL to set for the new subname
        65536, // The fuse bits OR'd together, that you want to burn
        2021232060 // The expiry for the subname
    )
```

--------------------------------

### Import ENS Avatar Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/stewards.mdx

Imports the Avatar component from a local path, used for displaying delegate avatars within the ENS DAO documentation.

```javascript
import { Avatar } from '../../components/Avatar'
```

--------------------------------

### Check Resolver Interface Support (EIP-165)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/interacting.mdx

Demonstrates how to check if a resolver contract supports a specific interface using the `supportsInterface` function, as defined by EIP-165. This is crucial for ensuring compatibility before sending transactions.

```solidity
function supportsInterface(bytes4 interfaceID) external pure returns (bool)
```

--------------------------------

### Public Resolver API Methods

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/public.mdx

The Public Resolver implements several Ethereum Name Service (ENS) Improvement Proposals (EIPs) to provide core resolution functionalities. These methods allow querying for addresses, reverse resolution names, text records, content hashes, and more. It is recommended to use `supportsInterface()` to verify functionality before calling other methods.

```APIDOC
PublicResolver:
  // EIP-137 & EIP-2304: Address Resolution
  addr(bytes32 node) returns (address);
    - Returns the address associated with a given node.
    - Supports multi-coin addresses via EIP-2304.

  // EIP-165: Interface Detection
  supportsInterface(bytes4 interfaceID) returns (bool);
    - Checks if the resolver supports a specific interface.
    - Crucial for safe interaction with unknown resolver versions.

  // EIP-181: Reverse Resolution
  name(bytes32 node) returns (string);
    - Returns the name associated with a given node (e.g., for reverse ENS lookups).

  // EIP-205: ABI Resolution
  ABI(bytes32 node, bytes4 contentTopic) returns (bytes);
    - Returns the ABI for a given node and content topic.

  // EIP-619: Public Key Resolution
  pubkey(bytes32 node) returns (bytes32 x, bytes32 y);
    - Returns the SECP256k1 public key (x and y coordinates) for a given node.

  // EIP-634: Text Record Resolution
  text(bytes32 node, string key) returns (string);
    - Returns the value of a text record for a given node and key (e.g., 'email', 'avatar').

  // EIP-1577: Content Hash Resolution
  contenthash(bytes32 node) returns (bytes);
    - Returns the content hash associated with a given node.

  // Related Methods:
  // - owner(bytes32 node) returns (address): Returns the owner of the name.
  // - manager(bytes32 node) returns (address): Returns the manager of the name.

  // Usage Note:
  // Always verify interface support using `supportsInterface()` before calling other methods to ensure compatibility and prevent errors with different resolver implementations.
```

--------------------------------

### CCIP Read Resolution Workflow

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/ccip-read.mdx

Details the step-by-step process for resolving an offchain/L2 ENS name using CCIP Read. This outlines the interaction between a user's wallet, the ENS resolver, and an offchain gateway.

```APIDOC
CCIP Read Resolution Process:

1. User Input: A user enters an ENS name (e.g., "example.eth") into their wallet.
2. Resolver Query: The wallet's client queries the associated ENS Resolver contract for the name.
3. OffchainLookup Error: If the data is stored offchain, the Resolver reverts with an `OffchainLookup` error, providing necessary details.
   - `sender`: The address initiating the lookup.
   - `urls`: An array of gateway URLs to query.
   - `callData`: The data to be sent in the gateway request.
   - `callbackFunction`: The function signature to call with the gateway's response.
   - `extraData`: Additional data for the callback.
4. Gateway Request: The client (e.g., wagmi, viem, ethers) makes an HTTP request to one of the provided gateway URLs, including the `callData`.
5. Gateway Response: The gateway processes the request, fetches data from an offchain database or L2, and returns the relevant information.
6. Callback Execution: The client invokes the specified `callbackFunction` with the data received from the gateway.
7. Data Validation: The callback function typically performs validation on the returned data, often verifying a signature from a trusted private key.
8. Result to User: If validation is successful, the client returns the resolved data to the user.
```

--------------------------------

### Render InterfaceDetails Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/interfaces.mdx

Renders the InterfaceDetails component, passing the imported resolver_methods data as a prop. This component is responsible for displaying the interface standards based on the provided methods.

```javascript
<InterfaceDetails methods={resolver_methods} />
```

--------------------------------

### BaseRegistrar Writable Methods

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Details on state-changing functions for the BaseRegistrar contract, including transferring names, approving operators, and reclaiming ENS records.

```APIDOC
BaseRegistrar:
  Writable Methods:
    transferFrom(address from, address to, uint256 tokenId)
      - Transfers ownership of an ENS token from one address to another.
      - Parameters:
        - from: The current owner's address.
        - to: The new owner's address.
        - tokenId: The ID of the ENS token to transfer.

    safeTransferFrom(address from, address to, uint256 tokenId)
      - Safely transfers ownership of an ENS token, ensuring the recipient contract can handle it.
      - Parameters:
        - from: The current owner's address.
        - to: The new owner's address.
        - tokenId: The ID of the ENS token to transfer.

    safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)
      - Safely transfers ownership of an ENS token with additional data for the recipient.
      - Parameters:
        - from: The current owner's address.
        - to: The new owner's address.
        - tokenId: The ID of the ENS token to transfer.
        - _data: Additional data to send to the recipient.

    approve(address to, uint256 tokenId)
      - Approves an address to transfer a specific ENS token on behalf of the owner.
      - Parameters:
        - to: The address to approve.
        - tokenId: The ID of the ENS token.

    setApprovalForAll(address operator, bool approved)
      - Approves or revokes an operator to manage all of the caller's ENS tokens.
      - Parameters:
        - operator: The address of the operator.
        - approved: True to approve, false to revoke.

    reclaim(uint256 label)
      - Reclaims an ENS record, typically used to re-associate a name with a specific label.
      - Parameters:
        - label: The label hash of the ENS name to reclaim.
```

--------------------------------

### ENS Subname Creation Methods

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/usecases.mdx

Methods for creating subnames under a parent ENS name. These are typically used for bulk distribution or automated registration processes. Requires interaction with the ENS Name Wrapper contract.

```APIDOC
setSubnodeOwner(parentNode: bytes32, subnode: bytes32, owner: address, expiry: uint256)
  - Sets the owner of a subnode.
  - Parameters:
    - parentNode: The keccak256 hash of the parent ENS name.
    - subnode: The keccak256 hash of the subnode name (e.g., 'my' for 'my.example.eth').
    - owner: The address that will own the subname.
    - expiry: The expiration timestamp for the subname.
  - Returns: None.

setSubnodeRecord(parentNode: bytes32, subnode: bytes32, owner: address, resolver: address, ttl: uint64, expiry: uint256)
  - Sets the owner, resolver, and TTL for a subnode.
  - Parameters:
    - parentNode: The keccak256 hash of the parent ENS name.
    - subnode: The keccak256 hash of the subnode name.
    - owner: The address that will own the subname.
    - resolver: The address of the resolver for the subname.
    - ttl: The Time To Live for the subname record.
    - expiry: The expiration timestamp for the subname.
  - Returns: None.

Note: These methods are part of the ENS contracts, specifically the wrapper functionality. Refer to the ENS contracts repository for detailed implementation and usage examples.
```

--------------------------------

### Unruggable Funding Streams

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.29.mdx

Details the financial components of the funding request, including annual USDC allocation and ENS token vesting schedule with a cliff period. This represents the executable part of the proposal.

```APIDOC
FundingStreams:
  USDC:
    amount: "1,200,000"
    period: "annual"
    description: "Annual funding for infrastructure, talent acquisition, and ongoing development."
  ENS:
    amount: "24,000"
    period: "2 years"
    vesting: "24 months"
    cliff: "1 year"
    description: "ENS tokens vested over two years with a one-year cliff, controlled by the ENS DAO Wallet."

Control:
  owner: "ENS DAO Wallet"
  cancellable: true
  cancellation_condition: "DAO vote if Unruggable fails to fulfil promises."

RelatedCodebase:
  url: "https://github.com/unruggable-labs/unruggable-stream/tree/3d3c49980defbab315b6e09385b22946dd9729b0"
  purpose: "Generates and simulates execution of transactions for funding streams."
```

--------------------------------

### Superfluid Stream Initialization: Upgrade USDC to USDCx

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.29.mdx

Upgrades a specified amount of USDC from the ENS DAO wallet to USDCx. This is a prerequisite for using USDC within the Superfluid protocol. This is the second transaction.

```Solidity
function upgrade(uint256 amount)
```

```Target Address
0x1BA8603DA702602A8657980e825A6DAa03Dee93a
```

```Function Arguments
[100000000000]
```

```Calldata
0x45977d03000000000000000000000000000000000000000000000000000000174876e800
```

```Simulation
https://www.tdly.co/shared/simulation/d564e4b9-3c5d-4e90-91f7-9ae78e32fbd1
```

--------------------------------

### ETHRegistrarController Constants and View Methods

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Defines constants and read-only methods for the ETHRegistrarController contract, used for managing domain commitments, prices, validity, and availability checks.

```APIDOC
ETHRegistrarController:
  Constants:
    MIN_COMMITMENT_AGE: uint
    MAX_COMMITMENT_AGE: uint
    MIN_REGISTRATION_DURATION: uint

  View Methods:
    commitments(bytes32 commitment) view returns (uint timestamp)
      - Retrieves the timestamp for a given commitment.

    rentPrice(string name, uint duration) view returns (uint price)
      - Calculates and returns the rental price for a given ENS name and duration.
      - Parameters:
        - name: The ENS name to check the price for.
        - duration: The registration duration in seconds.
      - Returns: The calculated rental price.

    valid(string name) view returns (bool isValid)
      - Checks if an ENS name is valid according to ENS naming rules.
      - Parameters:
        - name: The ENS name to validate.
      - Returns: True if the name is valid, false otherwise.

    available(string name) view returns (bool isAvailable)
      - Checks if an ENS name is both valid and available for registration.
      - This is the recommended method for checking availability.
      - Parameters:
        - name: The ENS name to check.
      - Returns: True if the name is valid and available, false otherwise.

    makeCommitment(string name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, bool reverseRecord, uint16 ownerControlledFuses) view returns (bytes32 commitment)
      - Calculates the commitment hash required before registering an ENS name.
      - Parameters:
        - name: The ENS name to register.
        - owner: The address that will own the ENS name.
        - duration: The registration duration in seconds.
        - secret: A secret string to prevent front-running.
        - resolver: The resolver address for the ENS name.
        - data: Additional data for the resolver.
        - reverseRecord: Whether to set up a reverse ENS record.
        - ownerControlledFuses: Fuses controlled by the owner.
      - Returns: The calculated commitment hash.
```

--------------------------------

### Approve auto-wrap for USDC

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.2.mdx

Approves a specific contract (likely an auto-wrapper or manager) to transfer a large amount of USDC from the caller's account. This is for automated processes.

```APIDOC
approve(address spender, uint256 amount)
  - Approves the spender to withdraw from your account.
  - Parameters:
    - spender: The address of the contract to approve for auto-wrapping.
    - amount: The maximum amount of USDC that can be transferred.
  - Example:
    approve(0x1D65c6d3AD39d454Ea8F682c49Ae7744706eA96d, 5100000000000)
```

--------------------------------

### ETHRegistrarController: makeCommitment Function

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Generates a commitment hash required for the commit-reveal registration process. It takes domain details, owner information, duration, a secret, resolver address, data, reverse record preference, and owner fuses as input.

```Solidity
ETHRegistrarController.makeCommitment(
    name string,
    owner address,
    duration uint256,
    secret bytes32,
    resolver address,
    data bytes[],
    reverseRecord bool,
    ownerControlledFuses uint16
)

// For example
makeCommitment(
    "myname", // "myname.eth" but only the label
    0x1234..., // The address you want to own the name
    31536000, // 1 year (in seconds)
    0x1234..., // A randomly generated 32 byte secret you create
    0x1234..., // The address of the resolver you want to use
    [0x8b95dd71...], // Encoded function calls you want to pass to the resolver, like `setAddr()`
    false, // Whether or not to set the new name as your primary name
    0 // The NameWrapper fuses you want to set
);
```

--------------------------------

### Verify .ceo Ownership TXT Record

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.12.mdx

Verifies the ownership claim for the .ceo TLD by checking a specific TXT record on the `_ens.nic.ceo` subdomain. This record points to the address of the DNSSEC registrar, confirming their intention for this ENS Improvement Proposal (EP).

```shell
dig TXT _ens.nic.ceo
```

--------------------------------

### React Icons Import

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Imports specific icons from the react-icons/fi library, commonly used for UI elements in React applications.

```javascript
import { FiBookOpen, FiClock, FiHash } from 'react-icons/fi'
```

--------------------------------

### NameWrapper Approval for Subname Creation

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/creating-subname-registrar.mdx

To delegate subname creation, a parent name owner must approve the subname registrar contract as an operator on the NameWrapper contract using `setApprovalForAll`.

```APIDOC
setApprovalForAll(address operator, bool approved)
  - Grants or revokes permission for `operator` to manage all of the caller's NFTs.
  - Parameters:
    - operator: The address of the subname registrar contract.
    - approved: `true` to approve, `false` to revoke.
  - Usage:
    - The owner of a parent ENS name calls this on the NameWrapper contract to allow their subname registrar to manage subnames under that parent.
```

--------------------------------

### ENS Resolver Interface Standards

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/universal.mdx

This section references standard methods for ENS resolvers, typically used within ABI-encoded calls for name resolution. The `universalresolver_methods` variable likely contains definitions for these standard methods.

```javascript
import { InterfaceDetails } from '../../components/InterfaceDetails'
import { universalresolver_methods } from '../../data/universal-resolver'

// Usage within a React component:
// <InterfaceDetails methods={universalresolver_methods} />
```

--------------------------------

### Spark Rewards Claim

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.12.mdx

Functionality added to claim wstETH rewards within the Spark protocol. This enables users to retrieve earned rewards.

```APIDOC
SparkRewards:
  claimWstETHRewards(user: address, amount: uint256)
    - Description: Claims wstETH rewards for a specified user.
    - Parameters:
      - user: The address of the user claiming rewards.
      - amount: The amount of wstETH rewards to claim.
    - Returns: Transaction receipt or confirmation.
```

--------------------------------

### Name Wrapper Contract API

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

API documentation for the Name Wrapper contract, covering methods for wrapping and unwrapping ENS names. These methods manage ownership and controller roles, and interact with ERC-721 and ERC-1155 standards.

```APIDOC
NameWrapper:
  wrapETH2LD(string label, address wrappedOwner, uint16 ownerControlledFuses, address resolver)
    - Wraps a .eth 2LD name.
    - Transfers ownership of the ERC-721 NFT to the contract.
    - Sets the contract as the Manager (Controller).
    - Issues an ERC-1155 NFT representing the wrapped name.
    - Parameters:
      - label: The label of the .eth name (e.g., "myname").
      - wrappedOwner: The address that will own the wrapped name (receive the ERC-1155).
      - ownerControlledFuses: Bitmask of fuses to burn upon wrapping.
      - resolver: The address of the resolver to associate with the name.
    - Example:
      wrapETH2LD("myname", 0x1234..., 0, 0x1234...)

  wrap(bytes name, address wrappedOwner, address resolver)
    - Wraps any ENS name (not just .eth 2LDs).
    - Transfers the Manager (Controller) role to the contract.
    - Issues an ERC-1155 NFT representing the wrapped name.
    - Parameters:
      - name: The DNS-encoded ENS name (e.g., "sub.myname.eth").
      - wrappedOwner: The address that will own the wrapped name (receive the ERC-1155).
      - resolver: The address of the resolver to associate with the name.
    - Example:
      wrap(0x03737562046e616d650365746800, 0x1234..., 0x1234...)

  unwrapETH2LD(bytes32 labelhash, address registrant, address controller)
    - Unwraps a previously wrapped .eth 2LD name.
    - Requires that the permission to unwrap has not been revoked.
    - Reverts the wrapping process, returning control to the original registrant.
    - Parameters:
      - labelhash: The labelhash of the .eth name (e.g., keccak256('myname')).
      - registrant: The address that should own the unwrapped name.
      - controller: The address that should be the manager of the unwrapped name.
    - Example:
      unwrapETH2LD(0x952f..., 0x1234..., 0x1234...)

  unwrap(bytes32 parentNode, bytes32 labelhash, address controller)
    - Unwraps any previously wrapped ENS name.
    - Requires that the permission to unwrap has not been revoked.
    - Reverts the wrapping process, returning control to the original controller.
    - Parameters:
      - parentNode: The namehash of the parent node (e.g., namehash("myname.eth")).
      - labelhash: The labelhash of the child node to unwrap (e.g., keccak256('sub')).
      - controller: The address that should be the manager of the unwrapped name.
    - Example:
      unwrap(0x6cbc..., 0xfa1e..., 0x1234...)

```

--------------------------------

### Import InterfaceDetails Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/interfaces.mdx

Imports the InterfaceDetails component, a UI element used for displaying interface information, from its relative path.

```javascript
import { InterfaceDetails } from '../../components/InterfaceDetails'
```

--------------------------------

### Approve USDCx SuperToken to transfer USDC

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.2.mdx

Approves the USDCx SuperToken contract to transfer a specified amount of USDC from the caller's account. This is a prerequisite for wrapping USDC to USDCx.

```APIDOC
approve(address spender, uint256 amount)
  - Approves the spender to withdraw from your account.
  - Parameters:
    - spender: The address of the contract to approve (e.g., USDCx SuperToken).
    - amount: The maximum amount of USDC that can be transferred.
  - Example:
    approve(0x1BA8603DA702602A8657980e825A6DAa03Dee93a, 300000000000)
```

--------------------------------

### ENS Contract Addresses

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.5.mdx

Lists the deployed addresses for the new ENS NameWrapper, Reverse Registrar, ETHRegistrarController, and PublicResolver contracts on mainnet. These addresses are crucial for interacting with the updated ENS infrastructure.

```APIDOC
NameWrapper: 0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401
ReverseRegistrar: 0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb
ETHRegistrarController: 0x253553366Da8546fC250F225fe3d25d0C782303b
PublicResolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63
```

--------------------------------

### Render Card with Image

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/expiry.mdx

A React/JSX snippet demonstrating the usage of the imported Card component to display an image, likely for illustrative purposes within the documentation.

```jsx
<Card>
  <img src="/img/namewrapper-expiry-subnames.jpg" alt="Expiry Diagram" />
</Card>
```

--------------------------------

### Verify .ceo ownership TXT record

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.7.mdx

This command queries the DNS TXT record for '_ens.nic.ceo' to verify the address designated as the DNSSEC registrar for the .ceo TLD.

```shell
dig TXT _ens.nic.ceo
```

--------------------------------

### Using ReverseSetter Contract

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/naming-contracts.mdx

Demonstrates how to inherit and use the ReverseSetter contract in another Solidity contract. This allows the child contract to automatically set its ENS name during its own deployment by passing the desired name to the parent constructor.

```solidity
import {ReverseSetter} from "./ReverseSetter.sol";

contract Contract is ReverseSetter {
    constructor(string memory name) ReverseSetter(name) {}
}
```

--------------------------------

### ETHRegistrarController: commit Function

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Submits the commitment hash to the contract, initiating the commit-reveal process. This function requires the commitment hash generated by `makeCommitment` and must be called before the `register` function.

```Solidity
ETHRegistrarController.commit(commitment bytes32);
```

--------------------------------

### React Card Component Import

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Imports a custom Card component from a local UI library, likely used for structuring content blocks.

```javascript
import { Card } from '../../components/ui/Card'
```

--------------------------------

### Auditing Process - Payload and Role Modifier

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/4.5.mdx

Describes tools and processes for auditing proposed permission changes, including a payload diff tool and a self-audit report.

```APIDOC
APIDOC:
  Preset Permissions - ENS Endowment Document
    - Description: A Google Document detailing all permissions granted to karpatkey, with proposed additions marked in green and revocations in red.
    - URL: https://docs.google.com/document/d/1Ker_TkBJV0xmQ9Li9HB-vtdlpx1vEeVEQwpIH6WoK0o/edit?usp=sharing

  Payload Diff Tool
    - Description: A new version of the Zodiac Roles Modifier app developed by Gnosis Guild. Allows users to input a payload and check the before-and-after status of permissions presets.
    - URL: https://zodiac-roles-1h9v0miw9-gnosis-guild.vercel.app/gor%3A0x74F819Fa1D95B57a15ECDEf9ce5c779C1bD6cc8A/roles/test-role/diff/4Iq1jdNbLbCBKmLAKciGaDQANiHStkCqFvJJ5KWQc

  Self-Audit Report
    - Description: A report detailing internal procedures for assessing proposed permissions and changes, enhancing transparency.
    - URL: https://github.com/karpatkey/gists/blob/main/Self%20Audit_%20%5BENS%5D%20-%20PUR%20%233%20-%20New%20ETH-Neutral%20Strategies.md
```

--------------------------------

### Resolve Multi-Chain ENS Addresses

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/resolution.mdx

Demonstrates how to resolve blockchain addresses for various networks (e.g., BTC, SOL, Arbitrum, Base) associated with an ENS name. It showcases implementations using popular libraries like Wagmi (React), Viem (TypeScript), Ethers.js (JavaScript), and web3.py (Python), utilizing coin types or EVM chain IDs for resolution.

```tsx
import { useEnsAddress } from 'wagmi'
import { arbitrum, base } from 'wagmi/chains'

const name = 'gregskril.eth'

const evmChainIdToCoinType = (chainId: number) => {
  return (0x80000000 | chainId) >>> 0
}

export const MyAddresses = () => {
  // SLIP-0044 Coin Types (see ENSIP-9)
  const { data: bitcoinAddr } = useEnsAddress({ name, coinType: 0, chainId: 1 })
  const { data: solanaAddr } = useEnsAddress({
    name,
    coinType: 501,
    chainId: 1,
  })

  // EVM Chain IDs (see ENSIP-11)
  const { data: baseAddr } = useEnsAddress({
    name,
    coinType: evmChainIdToCoinType(base.id),
    chainId: 1,
  })
  const { data: arbitrumAddr } = useEnsAddress({
    name,
    coinType: evmChainIdToCoinType(arbitrum.id),
    chainId: 1,
  })

  return (
    <div>
      {JSON.stringify({ bitcoinAddr, solanaAddr, baseAddr, arbitrumAddr })}
    </div>
  )
}
```

```ts
import { normalize } from 'viem/ens'

// Assuming publicClient is an initialized Viem PublicClient
const ensName = await publicClient.getEnsAddress({
  name: normalize('wagmi-dev.eth'),
  coinType: 0, // BTC
})
```

```ts
// Assuming provider is an initialized Ethers.js Provider
const resolver = await provider.getResolver('luc.eth')
const btcAddress = await resolver?.getAddress(0)
```

```py
from ens.auto import ns

eth_address = ns.address('alice.eth', coin_type=60)
```

--------------------------------

### Allowance Module Parameter Update

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.2.mdx

Details the proposed change to the resetTimeMin parameter within the Allowance Module for main.mg.wg.ens.eth. This snippet shows the current and new values for key parameters.

```APIDOC
AllowanceModuleUpdate:
  delegate: string
    - The delegate address associated with the module.
  token: string
    - The token address, likely zero address for native ETH.
  allowanceAmount: string
    - The current allowance amount in wei.
  resetTimeMin: string
    - The current reset time minimum in seconds.
    - Proposed change: '43200' (30 days) to '36000' (25 days).
  resetBaseMin: string
    - The current reset base minimum in seconds.
```

--------------------------------

### Roles Modifier Module Management

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.12.mdx

Details on the management and transition of Roles Modifier modules, including the activation of v2 and the role of v1 for backward compatibility. Ownership transfer and permission policy alignment are key aspects.

```APIDOC
RolesModifier:
  v1_status: active
    - Description: The Roles Modifier v1 module remains active to ensure operational continuity.

  v2_deployment:
    address: 0x703806E61847984346d2D7DDd853049627e50A40
    ownership: transferred to Endowment's Avatar Safe
    permissions_policy: matches v4 policy
    - Description: The Roles Modifier v2 module is deployed and its ownership has been transferred. It is equipped with the new proposed permissions policy and will be activated in a subsequent phase.

  migration_process:
    phase_1: Activate v2 module via payload.
    phase_2: Propose policy update to disable v1 module.
    - Description: The migration involves activating the v2 module first, followed by disabling the v1 module through a separate proposal.
```

--------------------------------

### ENS Resolver Interface

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/writing.mdx

Defines the core methods for an ENS resolver, allowing it to support specific interfaces and resolve various types of data associated with an ENS name, such as addresses and content hashes.

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

--------------------------------

### ENS Transaction Functions

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.3.mdx

Details common transaction functions for ENS domains, including their contract addresses, parameters, and associated values. This documentation helps understand the interaction with ENS smart contracts.

```APIDOC
Transaction Functions:

withdraw
  - Description: Initiates a withdrawal transaction.
  - Address: 0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5
  - Parameters: None specified.
  - Returns: Transaction status.

deposit
  - Description: Executes a deposit transaction.
  - Address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
  - Value: 10000 ETH
  - Parameters: None specified.
  - Returns: Transaction status.

approve
  - Description: Grants approval for a specific operation.
  - Address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
  - Parameters:
    - guy: The address to grant approval to.
      - Type: Address
      - Value: 0x11C76AD590ABDFFCD980afEC9ad951B160F02797
    - wad: The amount for which approval is granted.
      - Type: uint256
      - Value: 10000000000000000000000
  - Returns: Approval status.
```

--------------------------------

### Root Contract setController for DNSSEC Upgrade

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.1.mdx

This transaction updates the Root contract to point to the new DNSSEC registrar, enabling gasless DNSSEC functionality. It involves calling the `setController` function on the Root contract with the new registrar's address and a boolean flag.

```APIDOC
APIDOC:
Contract: Root (0xaB528d626EC275E3faD363fF1393A41F581c5897)
Method: setController(address controller, bool enabled)
  - controller: The address of the new DNS registrar (0xB32cB5677a7c971689228EC835800432b339ba2b).
  - enabled: A boolean flag, set to true to enable the controller.

Transaction Details:
  - Address: 0xaB528d626EC275E3faD363fF1393A41F581c5897
  - Value: 0 ETH
  - Function: setController
  - Arguments:
    - controller: 0xB32cB5677a7c971689228EC835800432b339ba2b
    - enabled: true

Related Actions:
  - This action is part of the EP5.1 proposal to upgrade DNSSEC support.
```

--------------------------------

### Reverse Registrar API

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/reverse.mdx

Documentation for the Reverse Registrar contract, detailing its core functions for managing reverse ENS records.

```APIDOC
ReverseRegistrar:
  // Sets the caller's reverse ENS record to point to the provided name.
  // This is a convenience function that automates setting ownership, resolver, and the name field.
  setName(name: string) returns (bytes32)

  // Claims the caller's address in the reverse registrar, assigning ownership of the reverse record to 'owner'.
  // Equivalent to calling claimWithResolver(owner, 0).
  claim(owner: address) returns (bytes32)

  // Claims the caller's address in the reverse registrar, assigning ownership of the reverse record to 'owner'.
  // If 'resolver' is non-zero, also updates the record's resolver.
  // - The reverse record for the caller is owned by 'owner'.
  // - If 'resolver' is non-zero, the reverse record's resolver is set to 'resolver'; otherwise, it is left unchanged.
  claimWithResolver(owner: address, resolver: address) returns (bytes32)

  // Returns the address of the resolver contract that the ReverseRegistrar uses for setName.
  defaultResolver() returns (address)
```

--------------------------------

### Search Subdomains (GraphQL)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/subgraph.mdx

Finds subdomains associated with a given ENS name. This query retrieves the main domain's name, ID, subdomain count, and a list of its direct subdomains, fetching up to 10 subdomains.

```graphql
query getSubDomains($Account: String = "messari.eth") {
  domains(where: { name: "messari.eth" }) {
    name
    id
    subdomains(first: 10) {
      name
    }
    subdomainCount
  }
}
```

--------------------------------

### Query ENS Names via The Graph

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/enumerate.mdx

This GraphQL query retrieves ENS domain names owned by a specific address from The ENS subgraph. It fetches both standard domains and wrapped domains, which are essential for listing all names a user might control. The query requires a valid Ethereum address as input.

```graphql
{
  domains(where: { owner: "0x225f137127d9067788314bc7fcc1f36746a3c3b5" }) {
    name
  }
  wrappedDomains(
    where: { owner: "0x225f137127d9067788314bc7fcc1f36746a3c3b5" }
  ) {
    name
  }
}
```

--------------------------------

### NFT Contract Integration for Subname Claims

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/usecases.mdx

Illustrates how an NFT contract can integrate ENS subname management, allowing NFT owners to automatically claim or reclaim their associated ENS subnames upon NFT transfer.

```Solidity
// Example conceptual Solidity code for integrating ENS subname transfer
// This is illustrative and requires actual ENS contracts and interfaces.

// Assume existence of ENS Name Wrapper contract interface
interface ENSNameWrapper {
    function setSubnodeOwner(address owner, bytes32 label, bytes32 subnode, uint16 fuses, uint64 expiry) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract MyNFTWithENS is ERC721 {
    ENSNameWrapper public ensWrapper;
    // ... other NFT contract variables ...

    constructor(string memory name, string memory symbol, ENSNameWrapper wrapperAddress) ERC721(name, symbol) {
        ensWrapper = wrapperAddress;
    }

    // Override _transfer to automatically manage ENS subnames
    function _transfer(address from, address to, uint256 tokenId) internal virtual override {
        // Get ENS subname details associated with this tokenId
        // This mapping would need to be defined and managed
        bytes32 subnameHash = getSubnameHashForToken(tokenId);
        bytes32 subnameLabel = getSubnameLabelForToken(tokenId);

        // If the NFT is being transferred to a new owner ('to' address)
        if (from != address(0) && to != address(0)) {
            // Transfer ownership of the ENS subname to the new NFT owner
            // This assumes the subname is NOT emancipated (PARENT_CANNOT_CONTROL fuse is NOT burned)
            // and the NFT contract has approval or is the owner.
            // The exact logic depends on how fuses and ownership are managed.
            // For simplicity, let's assume the NFT contract is the owner or has approval.

            // Example: Set owner of subname to the new NFT owner ('to')
            // This might involve burning specific fuses or setting an expiry.
            // For automatic transfer, you might want to burn CAN_EXTEND_EXPIRY and set a long expiry.
            uint16 fusesToBurn = 0; // Or specific fuses like CAN_EXTEND_EXPIRY
            uint64 expiry = block.timestamp + 365 * 1 days; // Example: 1 year expiry

            // Call ENS Name Wrapper to update subname owner
            // The 'owner' parameter here should be the new NFT owner ('to')
            // The 'subnode' parameter is the hash of the ENS name (e.g., 'mytoken.eth')
            // The 'label' parameter is the label of the subname (e.g., 'mytoken')
            ensWrapper.setSubnodeOwner(to, subnameLabel, subnameHash, fusesToBurn, expiry);
        }

        super._transfer(from, to, tokenId);
    }

    // Placeholder functions - actual implementation depends on your NFT structure
    function getSubnameHashForToken(uint256 tokenId) internal view returns (bytes32) {
        // Logic to retrieve the ENS subname hash associated with tokenId
        // e.g., return mapping[tokenId].subnameHash;
        revert("getSubnameHashForToken not implemented");
    }

    function getSubnameLabelForToken(uint256 tokenId) internal view returns (bytes32) {
        // Logic to retrieve the ENS subname label associated with tokenId
        // e.g., return mapping[tokenId].subnameLabel;
        revert("getSubnameLabelForToken not implemented");
    }
}

```

--------------------------------

### ERC-1155 Token Receiver Implementation

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/creating-subname-registrar.mdx

Contracts interacting with ERC-1155 tokens must implement specific receiver methods and signal support via ERC-165. OpenZeppelin's ERC1155Holder.sol provides an abstract contract for this.

```Solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract MyContract is ERC1155Holder {
    // Your contract logic here

    // onERC1155Received is automatically handled by inheriting ERC1155Holder
    // onERC1155BatchReceived is automatically handled by inheriting ERC1155Holder
    // supportsInterface for ERC1155 is automatically handled by inheriting ERC1155Holder
}

```

--------------------------------

### Withdraw ETH from Old Registrar Controller Payload

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.1.mdx

This payload describes the action to withdraw the total ETH balance from the Old Registrar Controller contract and send it to the ENS DAO Wallet. It includes the source contract address, token type, and the destination wallet.

```JSON
{
  "from": "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5",
  "token": "ETH",
  "amount": 4241.966,
  "recipient": "wallet.ensdao.eth"
}
```

--------------------------------

### Embed Link for Offchain/L2 Resolvers

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/deployments.mdx

Provides an embedded link to learn more about ENS on Layer 2 and offchain solutions.

```jsx
<EmbedLink
  title="Offchain / L2 Resolvers"
  description="Learn more about ENS on Layer 2 and offchain solutions"
  href="/resolvers/ccip-read"
/>
```

--------------------------------

### Configure .ceo TLD Resolver and Ownership

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.12.mdx

This block details the sequence of smart contract calls required to correctly configure the .ceo TLD. It involves setting the owner of the 'ceo' subnode, assigning the appropriate resolver, and finally setting the owner of the 'ceo' TLD itself to the DNSSEC registrar. These actions are crucial for enabling offchain claiming of .ceo 2LDs.

```APIDOC
ENS Root Contract Operations:

setSubnodeOwner(node: bytes32, label: bytes32, owner: address)
  - Sets the owner of a subnode within the ENS hierarchy.
  - Parameters:
    - node: The keccak256 hash of the parent node (e.g., keccak256('ceo')).
    - label: The label of the subnode being set (e.g., 'ceo').
    - owner: The address of the new owner for the subnode.
  - Example Call:
    Call `setSubnodeOwner` on ENS Root contract (`0xaB528d626EC275E3faD363fF1393A41F581c5897`) with:
      - node: keccak256('ceo')
      - label: 'ceo'
      - owner: 0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7 (ENS Timelock)

ENS Registry Contract Operations:

setResolver(node: bytes32, resolver: address)
  - Sets the resolver address for a given ENS node.
  - Parameters:
    - node: The namehash of the ENS node (e.g., namehash('ceo')).
    - resolver: The address of the resolver contract.
  - Example Call:
    Call `setResolver` on ENS Registry contract (`0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`) with:
      - node: namehash('ceo')
      - resolver: 0xF142B308cF687d4358410a4cB885513b30A42025 (OffchainDNSResolver)

setOwner(node: bytes32, owner: address)
  - Sets the owner of an ENS node.
  - Parameters:
    - node: The namehash of the ENS node (e.g., namehash('ceo')).
    - owner: The address of the new owner for the node.
  - Example Call:
    Call `setOwner` on ENS Registry contract (`0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`) with:
      - node: namehash('ceo')
      - owner: 0xB32cB5677a7C971689228EC835800432B339bA2B (DNSSEC Registrar)
```

--------------------------------

### Wrap ETH 2LD ENS Name (Solidity)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

This function wraps a .eth 2LD (second-level domain) name. It transfers the Owner (Registrant) of the ERC-721 NFT to the Name Wrapper contract and automatically takes over the Manager (Controller). The contract issues an ERC-1155 NFT in return.

```Solidity
NameWrapper.wrapETH2LD(string label, address wrappedOwner, uint16 ownerControlledFuses, address resolver)

// For example
wrapETH2LD(
    "myname", // "myname.eth" but only the label
    0x1234..., // The address you want to own the wrapped name
    0, // The owner-controlled fuse bits OR'd together, that you want to burn
    0x1234... // The address of the resolver you want to use
)
```

--------------------------------

### Import Resolver Methods Data

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/interfaces.mdx

Imports the resolver_methods data, which likely contains definitions or configurations for resolver functions, from a local JavaScript module.

```javascript
import { resolver_methods } from '../../data/resolver'
```

--------------------------------

### ENS Holesky Deployments

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/deployments.mdx

Renders contract deployment information for the Holesky testnet.

```jsx
<ContractDeployments chain="holesky" />
```

--------------------------------

### Proposal Metadata

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/1.9.mdx

Metadata associated with the ENS DAO proposal, including author information, discourse link, snapshot, tally, and proposal type.

```YAML
description: 'This is a proposal for the ENS DAO to support the Protocol Guild Pilot, a vested split contract which directs funding to 110 Ethereum core protocol contributors over one year.'
authors: [
    # Trent Van Epps
    'tvanepps',
    # Tim Beiko
    'timbeiko',
  ]
proposal:
  discourse: '12877'
  snapshot: '0xe07284156fb063d5fba6b9fed50cc74fad36ea02c2ede0207434db476884104b'
  tally: '8759198094868535520038506706231539487662297008587733129541987545743856603253'
  type: 'executable'
```

--------------------------------

### ENS Airdrop Contract and Token Distribution Specification

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/0.2.mdx

This specification outlines the technical requirements for implementing the retrospective ENS airdrop. It details the actions required from True Names Limited, including contract deployment, website updates, and authorization for token spending from the ENS DAO account.

```APIDOC
APIDOC:
  title: "ENS Retrospective Airdrop Specification"
  description: "Steps to implement the retrospective airdrop for ENS users."
  steps:
    - "Request True Names Limited to write and deploy a contract for claiming tokens via Merkle Proofs, using the same methodology as the original airdrop."
    - "Request True Names Limited to update the claim.ens.domains site to support claiming this additional airdrop for qualifying accounts."
    - "Authorize the contract deployed in step 1 to spend 219295650978169915391391 base ENS tokens from the ENS DAO account."
  token_allocation:
    retrospective_airdrop: "~213,049 ENS"
    returned_transferred_tokens: "6,246 contracts across 49 transfers"
    total_to_new_contract: "219,295 ENS tokens"
```

--------------------------------

### ENS Extended Resolver with Wildcard Resolution

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/writing.mdx

Introduces the `resolve` method for wildcard resolution, as specified in ENSIP-10. This method allows for dynamic resolution of names based on provided data.

```solidity
interface IExtendedResolver {
    /**
     * @dev Performs ENS name resolution for the supplied name and resolution data.
     * @param name The name to resolve, in normalised and DNS-encoded form.
     * @param data The resolution data, as specified in ENSIP-10.
     * @return The result of resolving the name.
     */
    function resolve(
        bytes memory name,
        bytes memory data
    ) external view returns (bytes memory);
}
```

--------------------------------

### ENS DAO Security Council Related Links

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.13.mdx

Provides essential links for accessing information about the ENS DAO Security Council, including contract source code, Etherscan addresses, multisig details, and relevant governance proposals.

```APIDOC
Relevant_Links:
  SecurityCouncil_Contract:
    GitHub: https://github.com/blockful-io/security-council-ens/blob/main/src/SecurityCouncil.sol
    Etherscan: https://etherscan.io/address/0xb8fa0ce3f91f41c5292d07475b445c35ddf63ee0#code
  Security_Council_Multisig:
    Safe: https://app.safe.global/home?safe=eth:0xaA5cD05f6B62C3af58AE9c4F3F7A2aCC2Cdc2Cc7
    Etherscan: https://etherscan.io/address/0xaA5cD05f6B62C3af58AE9c4F3F7A2aCC2Cdc2Cc7
  Snapshot_Proposals:
    EP5.7 [Social] Security Council: https://snapshot.org/#/ens.eth/proposal/0xf3a4673fe04a3ecfed4a2f066f6ced1539a5466d61630428333360b843653c54
    EP5.10 [Social] Confirming ENS DAO Security Council Members: https://snapshot.org/#/ens.eth/proposal/0xa0b1bfadf6853b5b0d59d3c4d73c434fc6389339887d05de805361372eb17c3a
  Forum_Discussion: https://discuss.ens.domains/t/temp-check-enable-cancel-role-on-the-dao/19090/19
```

--------------------------------

### Specification Funding Request

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/4.4.2.mdx

Details the requested funding amounts in USDC, ETH, and ENS for the ENS Meta-Gov Main Multisig. This table outlines the total allocation required for the working group's operations.

```APIDOC
Specification:
  USDC: 376,000
  ETH: 40
  $ENS: 52,300
```

--------------------------------

### BaseRegistrar View Methods and Properties

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Details on read-only functions and properties of the BaseRegistrar contract, used for querying name expiry, availability, transfer periods, controller status, and token approvals.

```APIDOC
BaseRegistrar:
  View Methods:
    nameExpires(uint256 label) view returns (uint expiryTimestamp)
      - Returns the Unix timestamp at which the registration for a given name label expires.
      - Parameters:
        - label: The label hash of the ENS name.
      - Returns: The expiry timestamp.

    available(uint256 label) view returns (bool isAvailable)
      - Checks if a name label is available for registration. Note: ETHRegistrarController.available is preferred for checking availability.
      - Parameters:
        - label: The label hash of the ENS name.
      - Returns: True if the name is available, false otherwise.

    getApproved(uint256 tokenId) view returns (address operator)
      - Returns the approved address for a specific ENS token ID.
      - Parameters:
        - tokenId: The ID of the ENS token.
      - Returns: The address approved to transfer the token.

    isApprovedForAll(address owner, address operator) view returns (bool isApproved)
      - Checks if an operator address has been approved to manage all of an owner's ENS tokens.
      - Parameters:
        - owner: The owner's address.
        - operator: The operator's address to check.
      - Returns: True if the operator is approved for all tokens, false otherwise.

    ownerOf(uint256 tokenId) view returns (address owner)
      - Returns the current owner of a specific ENS token ID.
      - Parameters:
        - tokenId: The ID of the ENS token.
      - Returns: The owner's address.

    tokenURI(uint256 tokenId) view returns (string uri)
      - Returns the metadata URI for a specific ENS token ID.
      - Parameters:
        - tokenId: The ID of the ENS token.
      - Returns: The metadata URI string.

  Properties:
    transferPeriodEnds: uint
      - The Unix timestamp at which the transfer period from the legacy registrar ends.
```

--------------------------------

### Upgrade USDC to USDCx Transaction

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.13.mdx

This transaction targets the USDCx contract to upgrade a specified amount of USDC to USDCx. This is part of the process to manage token balances within the Superfluid streaming infrastructure.

```APIDOC
Target: 0x1BA8603DA702602A8657980e825A6DAa03Dee93a (USDCx)
Function: upgrade
Arguments:
  amount: 375000000000000000000000
Calldata:
  0x45977d03000000000000000000000000000000000000000000004f68ca6d8cd91c600000
Reference: Tenderly: https://www.tdly.co/shared/simulation/6abf821b-779e-429b-b8dd-707b71360687
```

--------------------------------

### Generate Uniswap V3 Slippage Checker Data (JavaScript)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.3.mdx

This JavaScript code snippet demonstrates how to generate encoded data for Uniswap v3 slippage checking. It utilizes the ethers.js library to encode slippage tolerance, token paths, and fees, which can be passed to smart contracts for transaction validation.

```javascript
import { ethers } from 'https://cdn.ethers.io/lib/ethers-5.2.esm.min.js'

function getCheckerData(slippage, path, fees) {
  return ethers.utils.defaultAbiCoder.encode(
    ['uint256', 'bytes'],
    [
      slippage,
      ethers.utils.defaultAbiCoder.encode(
        ['address[]', 'uint24[]'],
        [path, fees]
      ),
    ]
  )
}

const checkerData = getCheckerData(
  200,
  [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH9
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  ],
  [5] // Fee tier for the Uniswap v3 pool
)
console.log('checkerData:', checkerData)
```

--------------------------------

### Display Send Transaction Demo Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/design.mdx

Renders a demo component for sending transactions, which likely includes ENS name resolution for recipient addresses. This illustrates ENS integration in write operations, such as user input for transfers or contract interactions.

```typescript
<Card>
  <SendTransactionDemo />
</Card>
```

--------------------------------

### Display ENSIPs Table

Source: https://github.com/ensdomains/docs/blob/master/src/pages/ensip/index.mdx

Renders a table displaying ENS Improvement Proposals (ENSIPs) with their titles and statuses. It utilizes a custom `Table` component and maps data from an `ensips.json` file.

```javascript
import { Table } from '../../components/ui/Table'
import ensips from '../../data/generated/ensips.json'

<Table
  columns={['Title', 'Status']}
  rows={ensips.map((ensip) => [ensip.title, ensip.status])}
/>
```

--------------------------------

### Resolve ENS Name to Address

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/resolution.mdx

Demonstrates how to resolve human-readable ENS names to their corresponding blockchain addresses using various libraries and frameworks. This process is known as a 'forward lookup'. Ensure you are using the correct chain ID for resolution.

```TypeScript
import { useEnsAddress } from 'wagmi'

export const Name = () => {
  const { data: ensAddress } = useEnsAddress({
    name: 'luc.eth', // The name to lookup
    chainId: 1, // The chain to start resolution on (Ethereum Mainnet or a testnet)
  })

  return <div>{ensAddress}</div>
}
```

```JavaScript
const address = await provider.lookupAddress('luc.eth')
```

```TypeScript
import { normalize } from 'viem/ens'

import { publicClient } from './client'

const ensAddress = await publicClient.getEnsAddress({
  name: normalize('luc.eth'),
})
```

```Python
from ens.auto import ns

address = ns.address('alice.eth')
```

```Rust
let provider = Provider::<Http>::try_from("https://mainnet.infura.io/v3/...")?;

let address = provider.lookup_address("luc.eth").await?;
```

```Go
package main

import (
	"fmt"

	"github.com/ethereum/go-ethereum/ethclient"
	ens "github.com/wealdtech/go-ens/v3"
)

func main() {
	client, _ := ethclient.Dial("https://rpc.ankr.com/eth")

	domain, _ := ens.Normalize("luc.eth")
	resolver, _ := ens.NewResolver(client, domain)
	address, _ := resolver.Address()

	fmt.Println("Address:", address.Hex())
}
```

```TypeScript
import { createEnsPublicClient } from '@ensdomains/ensjs'
import { http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createEnsPublicClient({
  chain: mainnet,
  transport: http(),
})

const subgraphRecords = client.getSubgraphRecords({ name: 'ens.eth' })

const records = client.getRecords({
  name: 'ens.eth',
  records: {
    coins: [...(subgraphRecords?.coins || []), 'BTC', 'ETH', 'ETC', 'SOL'],
    texts: [
      ...(subgraphRecords?.texts || []),
      'avatar',
      'email',
      'description',
    ],
    contentHash: true,
    abi: true,
  },
})

```

```C#
var ensService = new Nethereum.ENS.ENSService(web3)
var address = await ensService.ResolveAddressAsync('alice.eth')
```

--------------------------------

### Approve USDC Allowance Transaction

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.13.mdx

Details the ERC-20 `approve` function call for USDC, specifying the spender address and the amount to be approved. Includes the encoded calldata for execution.

```Solidity
Target: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
Function: approve
Arguments:
  spender: 0x1D65c6d3AD39d454Ea8F682c49aE7744706eA96d
  amount: 6375000000000
Calldata:
0x095ea7b30000000000000000000000001d65c6d3ad39d454ea8f682c49ae7744706ea96d000000000000000000000000000000000000000000000000000005cc4b9c4600
```

--------------------------------

### ENS Endowment Permissions Payload

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.14.mdx

This snippet represents the executable payload for the ENS Endowment permissions update, detailing the specific smart contract interactions and configurations approved by the DAO. It includes enabling modules and setting new permissions for yield generation strategies.

```APIDOC
ENS_Endowment_Permissions_Update_v1:
  description: "Payload for EP 5.14 to update ENS Endowment permissions."
  actions:
    - action: "enableModule"
      module_address: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64" # Avatar address of the Endowment
      description: "Enables the specified module for the Endowment."
    - action: "deposit"
      protocol: "Aave v3"
      asset: "osETH"
      description: "Deposits osETH on Aave v3."
    - action: "stake"
      protocol: "Stakewise v3"
      asset: "ETH"
      vault: "Genesis Vault (0xac0f906e433d58fa868f936e8a43230473652885)"
      description: "Stakes ETH on Stakewise v3 through the Genesis Vault."
    - action: "unstake"
      protocol: "Stakewise v3"
      asset: "ETH"
      vault: "Genesis Vault (0xac0f906e433d58fa868f936e8a43230473652885)"
      description: "Unstakes ETH from Stakewise v3 through the Genesis Vault."
    - action: "mint"
      protocol: "Stakewise v3"
      asset: "osETH"
      vault: "Genesis Vault (0xac0f906e433d58fa868f936e8a43230473652885)"
      description: "Mints osETH on Stakewise v3 through the Genesis Vault."
    - action: "burn"
      protocol: "Stakewise v3"
      asset: "osETH"
      vault: "Genesis Vault (0xac0f906e433d58fa868f936e8a43230473652885)"
      description: "Burns osETH on Stakewise v3 through the Genesis Vault."
    - action: "addLiquidity"
      protocol: "Balancer"
      pool: "WETH/osETH"
      description: "Adds liquidity to the WETH/osETH pool on Balancer."
    - action: "addLiquidity"
      protocol: "Aura Finance"
      pool: "WETH/osETH"
      description: "Adds liquidity to the WETH/osETH pool on Aura Finance."
    - action: "swap"
      protocol: "Balancer"
      from_asset: "WETH"
      to_asset: "osETH"
      description: "Swaps WETH for osETH on Balancer."
    - action: "swap"
      protocol: "Balancer"
      from_asset: "osETH"
      to_asset: "WETH"
      description: "Swaps osETH for WETH on Balancer."
    - action: "swap"
      protocol: "Uniswap v3"
      from_asset: "USDC"
      to_asset: "osETH"
      description: "Swaps USDC for osETH on Uniswap v3."
    - action: "swap"
      protocol: "CoW Swap"
      from_asset: "USDC"
      to_asset: "WETH"
      intermediate_asset: "osETH"
      description: "Swaps USDC to WETH via osETH on CoW Swap."
    - action: "swap"
      protocol: "Uniswap v3"
      from_asset: "RPL"
      to_asset: "WETH"
      description: "Swaps RPL for WETH on Uniswap v3."
    - action: "swap"
      protocol: "CoW Swap"
      from_asset: "RPL"
      to_asset: "WETH"
      description: "Swaps RPL for WETH on CoW Swap."
    - action: "unsignOrder"
      protocol: "Cow Protocol"
      description: "Cancels a pending, unexecuted order submitted to Cow Protocol."
  dependencies:
    - "Aave v3"
    - "Stakewise v3"
    - "Balancer"
    - "Aura Finance"
    - "Uniswap v3"
    - "CoW Swap"
    - "Cow Protocol"
  audit_report_available: true
  audit_provider: "ThirdGuard"
  test_safe_used: "0xC01318baB7ee1f5ba734172bF7718b5DC6Ec90E1"
  permissions_visualization_tool: "https://roles.gnosisguild.org/eth:0x703806E61847984346d2D7DDd853049627e50A40/roles/MANAGER/diff/C5Twf3khKv2Ny8PvzoARgHFKFFK8vIiNR7nDkrIM?annotations=false"
  related_documentation:
    - "https://gist.github.com/JeronimoHoulin/55f50e86d1dc874e4e685d5e9b496a67"
    - "https://docs.google.com/document/d/1KU4a7s-AxAAAPJxd8vexn7kCl8hsr3-c7VIDfEPHbKc/edit?usp=sharing"

```

--------------------------------

### ENS DAO Governance Security Bounty Details

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.23.mdx

This entry summarizes the core details of the proposal, including the bounty amount, the nature of the vulnerability, and the team's contribution scope. It serves as a high-level overview of the security initiative.

```APIDOC
Proposal: EP 5.23
Title: [Executable] blockful's governance security bounty
Authors: netto.eth
Status: Passed

Summary:
Compensate blockful team for identifying, analyzing, reporting, and mitigating a severe vulnerability in ENS DAO's governance structure.

Background:
- Vulnerability discovered in March 2024.
- Potential loss: ~$150M theft and protocol capture.
- Mitigation led to implementation of the Security Council.

Contribution Details:
- Comprehensive vulnerability assessment and risk analysis (detailed report available).
- Data analysis of ENS governance metrics and attacker behaviors.
- Design, development, and deployment of the Security Council contract and multisig.
- Smart contract implementation and testing.
- Governance proposal drafting and support.
- Total estimated effort: ~600 hours by 2 researchers, 1 smart contract engineer, and 4 auditors.

Compensation Rationale:
- Bootstrapped team requiring sustainability.
- Prevention of ~$150M loss, DAO capture, and protocol compromise.
- Work exceeded standard code bug bounty scope (ENS bug bounty: $250k USDC).
- Cost significantly lower than other security service providers (e.g., OpenZeppelin rates).
- Months of dedicated team effort.
- Long-term value addition to ENS security.
- Commitment to ENS's long-term success with a 2-year vesting schedule.

Related Links:
- Security Report: https://mirror.xyz/research.blockful.eth/-PfMduhpxdypPrutofr6099T4ROpsAmX0fPNbvDgR_k
- GitHub (Security Council): https://github.com/blockful-io/security-council-ens
- Dune Analytics (ENS Steakhouse): https://dune.com/steakhouse/ens-steakhouse
- Immunefi ENS Bug Bounty: https://immunefi.com/bug-bounty/ens/scope/#assets
- Compound Governance Proposal 76 (OpenZeppelin): https://compound.finance/governance/proposals/76
- Discussion Thread: https://discuss.ens.domains/t/ep-5-23-executable-governance-security-bounty/19553
- Votes (Agora): https://agora.ensdao.org/proposals/46071186312489687574960948336391811341595411932836110873328798657006776570015
```

--------------------------------

### Find ENS Resolver

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/index.mdx

Demonstrates how to find the ENS resolver responsible for a given name. This involves querying the ENS Registry contract. It shows implementations across multiple libraries and languages.

```Solidity
ENS.resolver(bytes32 node) view returns (address)
```

```Wagmi (TypeScript)
// https://wagmi.sh/react/api/hooks/useEnsResolver
import { normalize } from 'viem/ens'
import { useEnsResolver } from 'wagmi'

export const MyResolver = () => {
  const { data: myResolver } = useEnsResolver({
    name: normalize('luc.eth'), // The name to lookup
  })

  return <div>{myResolver}</div>
}
```

```Ethers.js (TypeScript)
const resolver = await provider.getResolver('luc.eth')
```

```viem (TypeScript)
// https://viem.sh/docs/ens/actions/getEnsResolver.html
import { normalize } from 'viem/ens'

import { publicClient } from './client'

const ensResolver = await publicClient.getEnsResolver({
  name: normalize('luc.eth'),
})
```

```Web3.py (Python)
# https://web3py.readthedocs.io/en/latest/ens_overview.html#working-with-resolvers
from ens.auto import ns

resolver = ns.resolver('alice.eth')
```

--------------------------------

### Current Metagov Wallet Balances

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/4.4.2.mdx

Shows current balances of ETH, USDC, and ENS across different ENS Meta-Governance wallets as of October 20th, 2023. This provides an overview of the group's existing financial resources.

```APIDOC
Current Metagov Wallet Balances:
  ens-metagov.pod.xyz:
    ETH: 1.2*
    USDC: 162,653
    $ENS: 1,990
  ens-governance.pod.xyz:
    ETH: 32
    USDC: 83,500
    $ENS: 1,250
  ens-daotooling.pod.xyz:
    ETH: 0
    USDC: 85,993
    $ENS: 
  ens-endowmentfees.pod.xyz:
    ETH: 86.69
    USDC: 
    $ENS: 
*Note: As of 10/18, this wallet also temporarily holds 117 ETH distributed via EP4.3.
```

--------------------------------

### Reverse Resolution Process

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/index.mdx

Explains the process of reverse resolution, which maps an address back to its primary ENS name. This involves looking up the resolver for 'addr.reverse' and then querying the 'name()' field on that resolver. A crucial verification step is to perform a forward resolution on the returned name to ensure it points back to the original address.

```Solidity
/// @dev The starting point for all ENS resolution is the Registry
ENS ens = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;

/// @dev The node hash for "addr.reverse"
bytes32 ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

/// @dev Returns the node hash for a given account's reverse records, "{address}.addr.reverse"
function reverseNode(address addr) public pure returns (bytes32) {
  return keccak256(
      abi.encodePacked(ADDR_REVERSE_NODE, sha3HexAddress(addr))
    );
}

/// @dev Get the reverse record for an address
function getReverseRecord(address addr) public view returns (string) {
    bytes32 reverseNodeHash = reverseNode(addr);

    // Get the resolver for the reverse node
    Resolver resolver = ens.resolver(reverseNodeHash);

    // Get the address's preferred name
    return resolver.name(reverseNodeHash);
}

/// @dev Note: The client MUST perform a forward resolution on a user's reverse record to verify the address matches the one you are looking up. The example above does not perform this verification.
```

--------------------------------

### CCIP Read Gateway Interface Properties

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/ccip-read.mdx

Defines the properties expected by the CCIP Read Gateway Interface as specified in EIP-3668.

```APIDOC
Properties:
  Properties.Property name="sender" type="address":
    Lowercased address of the contract reverting with the `OffchainLookup` error.
  Properties.Property name="data" type="bytes":
    0x prefixed bytes of the data passed to the `OffchainLookup` error.
```

--------------------------------

### ENS Name Wrapper API: Subnode Management

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/usecases.mdx

Methods for managing subnodes within the ENS Name Wrapper contract. These functions allow for the creation and configuration of subdomains, including setting fuses and expiry times.

```APIDOC
setSubnodeOwner(parentNode: bytes32, label: bytes32, owner: address, fuses: uint32, expiry: uint64)
  - Sets the owner, fuses, and expiry for a subnode.
  - Parameters:
    - parentNode: The keccak256 hash of the parent name (e.g., keccak256('mycoolcontract.eth')).
    - label: The keccak256 hash of the subdomain label (e.g., keccak256('1')).
    - owner: The address that will own the subnode.
    - fuses: A uint32 representing the bitmask of fuses to apply.
    - expiry: The expiry timestamp for the subnode.
  - Returns: The address of the newly set owner.

setSubnodeRecord(parentNode: bytes32, label: bytes32, owner: address, resolver: address, ttl: uint64)
  - Sets the owner, resolver, and TTL for a subnode.
  - This method is typically used after wrapping a name and before setting specific subnode records.
  - Parameters:
    - parentNode: The keccak256 hash of the parent name.
    - label: The keccak256 hash of the subdomain label.
    - owner: The address that will own the subnode.
    - resolver: The resolver address for the subnode.
    - ttl: The Time-To-Live for the subnode's records.
  - Returns: The address of the newly set owner.
```

--------------------------------

### Query Resolver for Text Records

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/index.mdx

Illustrates how to query a found ENS resolver for specific information, such as text records. This is a common step after identifying the correct resolver for a name.

```Solidity
Resolver resolver = ens.resolver(node);
// Query for text record
string textRecord = resolver.text(node, "key");
// Query for address record
address addrRecord = resolver.addr(node);
```

--------------------------------

### ENS Registry Getters

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/ens.mdx

Provides functions to query the current state of ENS domains. These methods allow retrieval of the owner, resolver, and TTL associated with a given node, as well as checking approval status and record existence.

```APIDOC
ENS.owner(bytes32 node) view returns (address)
  - Retrieves the owner address for a given ENS node.

ENS.resolver(bytes32 node) view returns (address)
  - Retrieves the resolver address associated with a given ENS node.

ENS.ttl(bytes32 node) view returns (uint64)
  - Retrieves the Time-To-Live (TTL) for a given ENS node.

ENS.isApprovedForAll(address owner, address operator) view returns (bool)
  - Checks if an operator address has been approved to manage domains on behalf of an owner.

ENS.recordExists(bytes32 node) view returns (bool)
  - Verifies if a record (owner, resolver, TTL) exists for the given ENS node.
```

--------------------------------

### NameWrapper.setSubnodeRecord

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

Creates a new subname and sets its owner, resolver, and TTL simultaneously. This method also allows specifying fuses and expiry for the newly created subname, streamlining the process.

```Solidity
NameWrapper.setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry)

// For example
setSubnodeRecord(
    0x6cbc..., // The namehash of the parent node, e.g. "myname.eth"
    "sub", // The label of the subname to create
    0x1234..., // The address you want to be the owner of the new subname
    0x5678..., // The address of the resolver to set for the new subname
    0, // The TTL to set for the new subname
    65536, // The fuse bits OR'd together, that you want to burn
    2021232060 // The expiry for the subname
)
```

--------------------------------

### ENS Proposal Transaction Specification

Source: https://github.com/ensdomains/docs/blob/master/src/public/governance/executable-proposal-template.md

Defines the structure for encoding on-chain transactions within an ENS proposal. It specifies the target address, value, function identifier, and arguments required for execution.

```APIDOC
ENSProposalTransaction:
  description: Represents a single on-chain transaction for a proposal.
  fields:
    address: The target address or ENS name for the transaction.
      type: string
    value: The value (e.g., ETH) to be sent with the transaction.
      type: string
    function: The identifier for the function to be called.
      type: string
    arguments:
      type: array
      items:
        type: object
        properties:
          name: The name of the argument.
            type: string
          value: The value of the argument.
            type: string
  example:
    address: "0x123...abc"
    value: "0.5"
    function: "0x12345678"
    arguments:
      - name: "firstArg"
        value: "0x1"
      - name: "secondArg"
        value: "0x2"
```

--------------------------------

### DNSRegistrar API

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/dns.mdx

API reference for the DNSRegistrar contract, detailing properties for accessing suffixes and oracle addresses, and methods for proving and claiming DNS names.

```APIDOC
DNSRegistrar:
  // Properties
  suffixes: Array<string>
    - Get the list of supported DNS suffixes.
    - Returns: An array of strings representing valid DNS suffixes.

  oracle: string
    - Get the Oracle address used for DNS imports.
    - Returns: The address of the Oracle contract.

  // Methods
  claim(bytes name, bytes proof)
    - Claims a DNS name using a pre-computed proof.
    - Parameters:
      - name: bytes - The DNS name to claim (e.g., 'eth.eth').
      - proof: bytes - The proof data for the DNS name.
    - Returns: None (transaction reverts on failure).

  proveAndClaim(bytes name, tuple[] input, bytes proof)
    - Proves and claims a DNS name with provided input records and proof.
    - Parameters:
      - name: bytes - The DNS name to claim.
      - input: tuple[] - An array of tuples representing DNS records.
      - proof: bytes - The proof data for the DNS name.
    - Returns: None (transaction reverts on failure).

  proveAndClaimWithResolver(bytes name, tuple[] input, bytes proof, address resolver, address addr)
    - Proves and claims a DNS name, setting a specific resolver and address.
    - Parameters:
      - name: bytes - The DNS name to claim.
      - input: tuple[] - An array of tuples representing DNS records.
      - proof: bytes - The proof data for the DNS name.
      - resolver: address - The address of the resolver to set.
      - addr: address - The address to associate with the DNS name.
    - Returns: None (transaction reverts on failure).
```

--------------------------------

### ENS Governor propose() Function

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/submit.mdx

Submits an executable proposal to the ENS governor contract for on-chain voting. Requires a minimum of 100,000 ENS delegated to the submitting address or a delegate. Successful proposals initiate a seven-day voting period followed by a two-day timelock before execution.

```APIDOC
ENS Governor Contract: governor.ensdao.eth
Address: 0x323a76393544d5ecca80cd6ef2a560c6a395b7e3

Method: propose()

Description:
  Submits an executable proposal to the ENS governor contract for on-chain voting.

Prerequisites:
  - Minimum 100,000 ENS delegated to the submitting address or a delegate.

Parameters:
  (Implicit parameters related to transaction submission like 'from', 'gas', 'value' are assumed for on-chain calls)
  - proposalData: (bytes) Encoded data representing the executable proposal.

Returns:
  (Transaction Receipt) Confirmation of proposal submission.

Lifecycle:
  - Upon successful submission, a seven-day voting period begins.
  - If the proposal passes, a two-day timelock period follows before execution.
```

--------------------------------

### BaseRegistrar Events

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Lists significant events emitted by the BaseRegistrar contract, indicating token transfers, name migrations, registrations, and renewals.

```APIDOC
BaseRegistrar Events:
  Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    - Emitted when ownership of an ENS token changes.

  NameMigrated(uint256 indexed hash, address indexed owner, uint expires)
    - Emitted when an ENS name is migrated.

  NameRegistered(uint256 indexed hash, address indexed owner, uint expires)
    - Emitted when a new ENS name is successfully registered.

  NameRenewed(uint256 indexed hash, uint expires)
    - Emitted when an existing ENS name registration is renewed.
```

--------------------------------

### ERC-20 Token Spending Approval

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/creating-subname-registrar.mdx

To allow a registrar contract to spend a user's ERC-20 tokens for registration fees, the user must first approve the registrar contract. This is typically done via the `transferFrom` method.

```APIDOC
approve(address spender, uint256 amount)
  - Allows `spender` to withdraw up to `amount` from the caller's account.
  - Parameters:
    - spender: The address of the contract to approve.
    - amount: The maximum amount of tokens the spender can withdraw.
  - Usage:
    - A registrant calls this on the ERC-20 token contract to allow the registrar to take payment.

transferFrom(address sender, address recipient, uint256 amount)
  - Transfers `amount` tokens from `sender` to `recipient`.
  - Requires the sender to have approved the caller (the registrar contract) to spend tokens.
  - Parameters:
    - sender: The address from which to transfer tokens (the registrant).
    - recipient: The address to which to transfer tokens (the registrar contract).
    - amount: The amount of tokens to transfer.
  - Usage:
    - The registrar contract calls this to collect the registration fee.
```

--------------------------------

### ENS Governance Proposal Links

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.23.mdx

These links point to various governance proposals on Snapshot and Tally related to the security council and the bounty. They represent the formal process of proposing and approving changes within the ENS DAO.

```url
https://snapshot.org/#/ens.eth/proposal/0xf3a4673fe04a3ecfed4a2f066f6ced1539a5466d61630428333360b843653c54
```

```url
https://snapshot.org/#/ens.eth/proposal/0xa0b1bfadf6853b5b0d59d3c4d73c434fc6389339887d05de805361372eb17c3a
```

```url
https://www.tally.xyz/gov/ens/proposal/42329103797433777309488042029679811802172320979541414683300183273376839219133
```

--------------------------------

### ENS Name Normalization Libraries (Javascript)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.7.mdx

Libraries implementing the ENSIP-15 standard for name normalization in Javascript environments. These libraries ensure ENS names are processed according to the latest Unicode standards, enhancing security and consistency.

```javascript
adraffy/ens-normalize
https://github.com/adraffy/ens-normalize.js
```

```javascript
ensdomains/eth-ens-namehash
https://github.com/ensdomains/eth-ens-namehash
```

--------------------------------

### Approve ENS Token Spending

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.29.mdx

Approves the `BatchPlanner` contract to spend a specified amount of ENS tokens from the ENS DAO Wallet. This function is part of the ERC-20 token standard.

```APIDOC
function approve(address spender, uint256 amount) external returns (bool)
  - Approves the `spender` to withdraw `amount` tokens from the caller's account.
  - Parameters:
    - `spender`: The address of the contract or account to be approved.
    - `amount`: The maximum amount that the spender can withdraw.
  - Returns:
    - `true` if the approval was successful.
```

--------------------------------

### OffchainLookup Error Signature

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolvers/ccip-read.mdx

Defines the standard error smart contracts throw to trigger an offchain HTTP request as part of CCIP Read. This error structure is used by clients to unwrap and handle offchain lookups.

```solidity
error OffchainLookup(
    address sender,
    string[] urls,
    bytes callData,
    bytes4 callbackFunction,
    bytes extraData
)
```

--------------------------------

### ENS Governor Proposal Bond Implementation

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.15.mdx

This entry represents the smart contract code for the ProposalBond functionality intended for the ENS DAO Governor. It is based on a pull request to the ENS governance contracts. The functionality allows proposers to stake a bond, which is subject to forfeiture if a proposal fails under specific voting conditions, thereby aligning proposer incentives with community sentiment.

```Solidity
pragma solidity ^0.8.0;

// This is a placeholder for the actual contract code found in the referenced PR.
// The actual implementation would detail the bond staking, forfeiture logic,
// and integration with the existing ENS Governor contract.

contract ENSGovernorWithProposalBond {
    // State variables for bond amount, proposer, proposal status, etc.
    uint256 public constant PROPOSAL_THRESHOLD_ENS = 1000 ether;
    uint256 public constant VOTING_DELAY_SECONDS = 24 * 60 * 60; // 24 hours

    // Mapping from proposal ID to proposer's bond status
    mapping(uint256 => bool) public proposalBondsStaked;

    // Function to propose with a bond
    function proposeWithBond(address target, uint256 value, string memory signature, bytes memory data, string memory description) public payable {
        // Ensure proposer has staked the required bond
        // require(msg.value >= PROPOSAL_THRESHOLD_ENS, "Insufficient bond staked");
        // ... implementation details for proposal creation and bond management ...
    }

    // Function to handle proposal voting outcome and bond return/forfeiture
    function execute(uint256 proposalId) public {
        // ... logic to check voting results and determine bond fate ...
        // If proposal fails and 'Against with penalty' > 'Against', forfeit bond.
        // Otherwise, return bond.
    }

    // Fallback function to receive Ether for bonds
    receive() external payable {}
}

```

--------------------------------

### Set Primary ENS Name

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/reverse.mdx

Configures the caller's reverse ENS record to point to a specified name. This convenience function automates setting ownership, the default resolver, and the canonical name for an address.

```Solidity
function setName(string memory name) public returns (bytes32)
```

--------------------------------

### ETHRegistrarController Events

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Lists significant events emitted by the ETHRegistrarController contract, related to name registration and renewal actions.

```APIDOC
ETHRegistrarController Events:
  NameRegistered(string name, bytes32 indexed label, address indexed owner, uint cost, uint expires)
    - Emitted when an ENS name is registered via the controller.
    - Parameters:
      - name: The registered ENS name.
      - label: The label hash of the registered name.
      - owner: The address that registered the name.
      - cost: The cost of registration.
      - expires: The expiry timestamp of the registration.

  NameRenewed(string name, bytes32 indexed label, uint cost, uint expires)
    - Emitted when an ENS name is renewed via the controller.
    - Parameters:
      - name: The renewed ENS name.
      - label: The label hash of the renewed name.
      - cost: The cost of renewal.
      - expires: The new expiry timestamp.
```

--------------------------------

### Subname Display Component

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/subdomains.mdx

This React component visually renders a list of ENS subnames with associated opacity levels, followed by the '.ens.eth' domain. It uses `EmbedLink` and `Card` components, suggesting a UI framework context for displaying domain-related information.

```javascript
import { EmbedLink } from '../../components/EmbedLink'
import { Card } from '../../components/ui/Card'

// ... other content ...

<Card className="flex items-center justify-center text-xl">
  <div className="text-right font-bold">
    {['root', 'registrar', 'controller', 'resolver', 'registry'].map(
      (subname, i) => (
        <div
          className={
            ['opacity-20', 'opacity-50', '', 'opacity-50', 'opacity-20'][i]
          }
          key={subname}
        >
          {subname}
        </div>
      )
    )}
  </div>
  <div className="text-blue font-bold">.ens.eth</div>
</Card>

// ... other content ...
```

--------------------------------

### ERC-1155 Approval for Wrapped Names

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

Wrapped ENS names function as ERC-1155 NFTs. The `setApprovalForAll` method grants an approved address full control over all wrapped ENS names owned by the caller. This is commonly used by NFT marketplaces.

```APIDOC
setApprovalForAll(address operator, bool approved)

  - Grants or revokes approval for an operator to manage all of your owned tokens.
  - Parameters:
    - operator: The address to approve or reject.
    - approved: A boolean indicating whether to approve (true) or revoke (false) the operator.
  - Returns:
    - None (emits ApprovalForAll event).
  - Usage:
    - Typically used to allow marketplaces or other services to manage your ENS NFTs.
    - Example:
      setApprovalForAll(
        0xMarketplaceAddress..., // The address of the operator
        true // Approve the operator
      )
```

--------------------------------

### Wrap ENS Name (Solidity)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

This function wraps any ENS name other than a .eth 2LD. It transfers the Manager (Controller) of the name to the Name Wrapper contract. The contract issues an ERC-1155 NFT in return.

```Solidity
NameWrapper.wrap(bytes name, address wrappedOwner, address resolver)

// For example
wrapETH2LD(
    0x03737562046e616d650365746800, // The DNS-encoded version of "sub.myname.eth"
    0x1234..., // The address you want to own the wrapped name
    0x1234... // The address of the resolver you want to use
)
```

--------------------------------

### Set Exponential Premium Price Oracle

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/1.5.mdx

This API call is used to update the price oracle for ENS names. It involves setting the controller's price oracle to the address of the newly deployed ExponentialPremiumPriceOracle contract. This action is part of the proposal to transition from a linear to an exponential pricing model.

```APIDOC
Controller Contract Interaction:

Method: setPriceOracle

Description: Updates the price oracle used by the ENS controller.

Parameters:
  - controller.ens.eth: The address of the ENS controller contract.
  - newPriceOracleAddress: The address of the deployed ExponentialPremiumPriceOracle contract (TBD).

Usage Example:
  Call `setPriceOracle` on `controller.ens.eth` with the address of the deployed `ExponentialPremiumPriceOracle`.

Related Methods:
  - Other methods for managing ENS registrar configurations.

Error Conditions:
  - Invalid `newPriceOracleAddress`.
  - Insufficient permissions to call the method.
```

--------------------------------

### Approve USDCx Transaction

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.13.mdx

This transaction targets the USDC contract to approve a spender for a specific amount of USDC tokens. It's a standard ERC-20 approve function call.

```APIDOC
Target: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (USDC)
Function: approve
Arguments:
  spender: 0x1BA8603DA702602A8657980e825A6DAa03Dee93a
  amount: 375000000000
Calldata:
  0x095ea7b30000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a000000000000000000000000000000000000000000000000000000000574fbde600
Reference: Tenderly: https://www.tdly.co/shared/simulation/2207ca50-6804-4e33-be61-4181ecd3f8e5
```

--------------------------------

### Unwrap ETH 2LD ENS Name (Solidity)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

This function unwraps an ETH 2LD ENS name. It can be called by the owner of the wrapped name, provided the permission to unwrap has not been revoked. This reverts the wrapping process.

```Solidity
NameWrapper.unwrapETH2LD(bytes32 labelhash, address registrant, address controller)

// For example
unwrapETH2LD(
    0x952f..., // "myname.eth" but only the labelhash: keccak256('myname')
    0x1234..., // The address you want to own the unwrapped name
    0x1234... // The address you want to be the manager of the unwrapped name
)
```

--------------------------------

### ENS Name Normalization in Web Frameworks (Javascript)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.7.mdx

Popular Javascript web frameworks that have integrated ENSIP-15 for ENS name normalization. This ensures that applications built with these frameworks handle ENS names securely and consistently across different platforms.

```javascript
ethers.js
https://github.com/ethers-io/ethers.js/
```

```javascript
web3.js
https://github.com/web3/web3.js
```

```javascript
viem
https://github.com/wagmi-dev/viem
```

--------------------------------

### Security Council Contract Implementation

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.23.mdx

This snippet refers to the smart contract code developed by blockful for the ENS Security Council. It includes the design, development, and testing of the contract, which balances security and decentralization for ENS DAO's governance.

```solidity
pragma solidity ^0.8.0;

// Example of a simplified Security Council contract structure
contract SecurityCouncil {
    address public guardian;
    mapping(address => bool) public isCouncilMember;

    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    modifier onlyGuardian() {
        require(msg.sender == guardian, "Not the guardian");
        _;
    }

    constructor(address _guardian) {
        guardian = _guardian;
    }

    function addCouncilMember(address _member) public onlyGuardian {
        isCouncilMember[_member] = true;
        emit MemberAdded(_member);
    }

    function removeCouncilMember(address _member) public onlyGuardian {
        isCouncilMember[_member] = false;
        emit MemberRemoved(_member);
    }

    // Placeholder for actual security council logic (e.g., emergency pause, proposal review)
    function executeEmergencyAction() public onlyCouncilMember {
        // ... implementation ...
    }

    function onlyCouncilMember() internal view returns (bool) {
        return isCouncilMember[msg.sender];
    }
}
```

--------------------------------

### ENS Record Setting API

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/reverse.mdx

Provides methods to set primary ENS names for addresses and contracts. Supports direct setting, setting for Ownable contracts, and signature-based setting for EOAs or contracts using ERC-1271/ERC-6492.

```APIDOC
ENS Record Setting Methods:

1.  `setName(msg.sender)`
    - Sets the primary ENS name for the sender's address.
    - Simplest method, directly uses the transaction sender's address.

2.  `setNameForAddr(address addr)`
    - Sets the primary ENS name for a specified address.
    - Suitable for smart contracts implementing the Ownable pattern where `owner() == msg.sender`.

3.  `setNameForAddrWithSignature(string name, address addr, uint256[] coinTypes, uint256 signatureExpiry, bytes signature)`
    - Sets a reverse record on behalf of a user using a signature.
    - Can be used by EOAs or smart contracts with ERC-1271 or ERC-6492 signatures.
    - Parameters:
      - `name`: The ENS name string to set.
      - `addr`: The address for which the ENS name is being set.
      - `coinTypes`: An array of coin type identifiers for which the name is being set.
      - `signatureExpiry`: The expiry timestamp of the signature.
      - `signature`: The signature validating the operation.
    - Example Signature Format (for verification):
      `validatorAddress, functionSignature, name, addr, coinTypes, signatureExpiry`

4.  `setNameForOwnableWithSignature(string name, address contractAddr, address owner, uint256[] coinTypes, uint256 signatureExpiry, bytes signature)`
    - Combines signature verification with Ownable contract functionality to set a reverse record.
    - Used on behalf of a smart contract that implements the `Ownable` pattern.
    - Parameters:
      - `name`: The ENS name string to set.
      - `contractAddr`: The address of the contract setting the record.
      - `owner`: The address of the owner of the contract (the address providing the signature).
      - `coinTypes`: An array of coin type identifiers for which the name is being set.
      - `signatureExpiry`: The expiry timestamp of the signature.
      - `signature`: The signature validating the operation.
    - Example Signature Format (for verification):
      `validatorAddress, functionSignature, name, contractAddr, owner, coinTypes, signatureExpiry`

Note: The `validatorAddress` and `functionSignature` are part of the off-chain signature verification process and not direct parameters to these contract methods.
```

--------------------------------

### ENS Token Transfer Transaction

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/1.9.mdx

Details of a specific ENS token transfer transaction, including the source address, recipient, function, and amount. This format resembles a structured log or command execution.

```APIDOC
TransactionLog:
  - Address: token.ensdao.eth
    Function: transfer
    Argument: recipient
    Value: theprotocolguild.eth
  - Amount: 200000000000000000000000
```

--------------------------------

### Security Council Contract Details

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/security-council.mdx

Details about the Security Council contract deployment on Ethereum Mainnet, including its address and ownership by a multi-sig wallet.

```APIDOC
Contract: SecurityCouncil.sol
Address: 0xb8fa0ce3f91f41c5292d07475b445c35ddf63ee0 (Ethereum Mainnet)
Owner: 4-of-8 multi-sig (0xaA5cD05f6B62C3af58AE9c4F3F7A2aCC2Cdc2Cc7)
Source Code: https://github.com/blockful-io/security-council-ens
```

--------------------------------

### ENS Name Normalization Libraries (Python)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.7.mdx

Python libraries that provide ENSIP-15 compliant name normalization. These tools are crucial for developers working with ENS on the Python ecosystem, ensuring correct handling of Unicode characters and preventing spoofing.

```python
namehash/ens-normalize-python
https://github.com/namehash/ens-normalize-python
```

--------------------------------

### Normalize ENS Names with Viem

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/names.mdx

Demonstrates how to normalize an ENS name using the 'normalize' function from 'viem/ens'. Normalization is a critical step before hashing to ensure a canonical representation, preventing issues with capitalization or character variations. The function throws an error if a name cannot be normalized, indicating an invalid name.

```javascript
import { normalize } from 'viem/ens'

// Uses @adraffy/ens-normalize under the hood

const normalized = normalize('RaFFY🚴‍♂️.eTh')
// => "raffy🚴‍♂.eth"
```

--------------------------------

### ENS Name Wrapper Contract Interactions

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/usecases.mdx

This section details key functions for interacting with the ENS Name Wrapper contract to manage subnames, control ownership, and grant permissions. It covers setting subnode owners, approving operators, and managing fuses for subname features.

```APIDOC
ENS Name Wrapper Contract Functions:

setSubnodeOwner(owner: address, label: bytes32, subnode: bytes32, fuses: uint16, expiry: uint64)
  - Sets the owner and fuses for a subname.
  - Parameters:
    - owner: The address that will own the subname.
    - label: The label of the subname (e.g., 'sub' for 'sub.domain.eth').
    - subnode: The full hash of the subname (e.g., keccak256('sub.domain.eth')).
    - fuses: A bitmask of fuses to burn, controlling subname behavior (e.g., PARENT_CANNOT_CONTD_EXPIRY).
    - expiry: The expiration timestamp for the subname. Required if any fuses are burned.
  - Returns: None.
  - Notes: Burning PARENT_CANNOT_CONTROL emancipates the subname.

setSubnodeRecord(owner: address, label: bytes32, subnode: bytes32, resolver: address, ttl: uint32, fuses: uint16, expiry: uint64)
  - Sets the owner, resolver, TTL, fuses, and expiry for a subname.
  - Parameters:
    - owner: The address that will own the subname.
    - label: The label of the subname.
    - subnode: The full hash of the subname.
    - resolver: The resolver address for the subname.
    - ttl: The Time To Live for the subname's record.
    - fuses: A bitmask of fuses to burn.
    - expiry: The expiration timestamp for the subname.
  - Returns: None.

setApprovalForAll(operator: address, approved: bool)
  - Approves or revokes an operator for managing all subnames owned by the caller.
  - Parameters:
    - operator: The address of the operator to approve or revoke.
    - approved: True to approve, False to revoke.
  - Returns: None.
  - Notes: Allows a contract to manage subnames on behalf of the NFT owner.

setChildFuses(label: bytes32, subnode: bytes32, fuses: uint16, expiry: uint64)
  - Sets fuses and expiry for a subname owned by the caller.
  - Parameters:
    - label: The label of the subname.
    - subnode: The full hash of the subname.
    - fuses: A bitmask of fuses to burn.
    - expiry: The expiration timestamp for the subname.
  - Returns: None.
  - Notes: Used to grant specific perks or time-boxed access to subname owners.
```

--------------------------------

### Transfer 6,000 ETH to TWAP Safe Payload

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.1.mdx

This payload facilitates the transfer of 6,000 ETH from the ENS DAO Wallet to a newly created Safe dedicated for TWAP (Time-Weighted Average Price) swaps. It specifies the source, token, amount, and destination address for the transaction.

```JSON
{
  "from": "wallet.ensdao.eth",
  "token": "ETH",
  "amount": 6000,
  "recipient": "0x02D61347e5c6EA5604f3f814C5b5498421cEBdEB"
}
```

--------------------------------

### DNS Encode Name (Solidity)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/names.mdx

Provides a Solidity function to DNS-encode a given domain name using the `NameEncoder` utility from ENS contracts. This function returns the raw bytes of the DNS-encoded name, suitable for direct use within smart contracts. It requires importing the `NameEncoder` contract.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@ensdomains/ens-contracts/contracts/utils/NameEncoder.sol";

contract MyContract {
    function dnsEncode(string calldata name) public pure returns (bytes memory) {
        (bytes memory dnsEncodedName,) = NameEncoder.dnsEncodeName(name);
        return dnsEncodedName;
    }
}
```

--------------------------------

### ENS DAO Steward $ENS Token Distribution - Term 6

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.18.mdx

Outlines the structure for distributing $ENS tokens to ENS DAO stewards, including valuation, distribution timing, vesting, and calculation methods. This mechanism aims to align token compensation with USDC compensation and incentivize long-term commitment.

```APIDOC
$ENS Token Distribution Mechanism for ENS DAO Stewards - Term 6:

1.  **Token Value Equivalence**: Each steward will receive $ENS tokens equal in value to their total USDC compensation for the year.
2.  **Distribution Date**: $ENS tokens will be distributed on July 1st of the term.
3.  **Vesting**: Tokens will be distributed via 2-year linear vesting contracts.
4.  **Price Calculation**: The $ENS token price used for calculation will be the average daily price of the token between January 1st and July 1st of the term.
5.  **Vesting Start**: The vesting period begins from the start of the term (January 1st).

**Example Calculation:**
-   A regular steward receives $48,000 USDC annually.
-   If the average $ENS price from Jan 1st to July 1st is $12,
-   The steward receives $48,000 / $12 = 4,000 $ENS tokens.
-   These tokens are subject to a 2-year linear vesting contract starting Jan 1st.
-   At the time of distribution (July 1st), 6 months of vesting (25% of total tokens) will have already occurred.
```

--------------------------------

### NameWrapper.setFuses

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

Burns owner-controlled fuses for an ENS name that you own, but not necessarily its parent. The name must be Emancipated. At a minimum, CANNOT_UNWRAP must be burned if not already set.

```Solidity
NameWrapper.setFuses(bytes32 node, uint16 ownerControlledFuses)

// For example
setFuses(
    0x6cbc..., // The namehash of the node, e.g. "myname.eth"
    1 // The owner-controlled fuse bits OR'd together, that you want to burn
)
```

--------------------------------

### ENS Registry Owner Lookup

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/dns.mdx

Provides information on querying the owner of a Top-Level Domain (TLD) within the ENS Registry. This method is crucial for understanding TLD activation status and ownership, especially for DNS-integrated TLDs.

```APIDOC
Registry.owner(bytes32 node)
  - Retrieves the owner of a specific ENS node.
  - Parameters:
    - node: A bytes32 representation of the TLD or subdomain node.
  - Returns:
    - The address of the owner (e.g., DNSRegistrar, registry operator, or 0x0 if not activated).
  - Notes:
    - If a TLD has not been activated on-chain, the owner will return 0x0. Activation typically occurs when the first domain under that TLD is imported.
```

--------------------------------

### ENS Steward Table Structure

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/stewards.mdx

Markdown table structure used to display ENS Stewards, incorporating an Avatar component for each steward. This format is repeated for different working groups and terms.

```html
<table>
  <thead>
    <tr>
      <th>Avatar</th>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><Avatar name="example.eth" width={200} /></td>
      <td>Example / example.eth</td>
    </tr>
  </tbody>
</table>
```

--------------------------------

### Claim Reverse ENS Record

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/reverse.mdx

Claims an address in the reverse registrar, assigning ownership of the reverse record to a specified owner. This function can optionally set a resolver for the record.

```Solidity
function claim(address owner) public returns (bytes32);

function claimWithResolver(address owner, address resolver) public returns (bytes32)
```

--------------------------------

### ENS Owner-Controlled Fuses and States

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/fuses.mdx

Defines owner-controlled fuses for ENS names, which grant or revoke permissions. It also explains the Emancipated and Locked states and the interdependencies between key fuses like PARENT_CANNOT_CONTROL (PCC) and CANNOT_UNWRAP (CU).

```APIDOC
ENS Fuse System Documentation:

Owner-Controlled Fuses:
These fuses can be burned by the owner of the name or the owner of the parent name to revoke permissions on a name.

Fuse Definitions:
- CANNOT_UNWRAP: Locks the name, preventing unwrapping. Must be burned before other owner-controlled fuses can be burned.
- CANNOT_BURN_FUSES: Prevents any further fuses from being burned on the name.
- CANNOT_TRANSFER: Prevents the name (wrapped NFT) from being transferred.
- CANNOT_SET_RESOLVER: Prevents the resolver contract for the name from being updated.
- CANNOT_SET_TTL: Prevents the TTL for the name from being updated.
- CANNOT_CREATE_SUBDOMAIN: Prevents the creation of new subdomains.
- CANNOT_APPROVE: Prevents the approved "subname renewal manager" from being updated.
- Custom Fuses: 9 unreserved fuses available for custom use.

States:
- Emancipated: The parent no longer has control over the child name. This state is achieved when the PARENT_CANNOT_CONTROL (PCC) fuse is burned by the parent, provided the parent is in the Locked state.
- Locked: The name cannot be unwrapped. This assures subnames that the parent owner cannot unwrap and replace subnames against the registry.

Fuse Interdependencies (Recursive):
- To burn owner-controlled or subname fuses, CANNOT_UNWRAP (CU) must be burned.
- To burn CU, PARENT_CANNOT_CONTROL (PCC) must be burned.
- Only the parent can burn PCC on a child name, and only if CU is first burned on the parent.
- Only the grandparent can burn PCC on the parent name, and only if CU is first burned on the grandparent.
- .eth second-level names have PCC automatically burned when wrapped, and the parent 'eth' node is already in the Locked state.

Batch Burning:
A parent name can burn all necessary fuses on a child name in a single transaction, either during subname creation or on an existing subname not yet Emancipated.
```

--------------------------------

### ENS Ownership Transfer Actions

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/0.1.mdx

Details the specific smart contract interactions required to transfer ownership of ENS assets to the ENS DAO. These actions are proposed to be executed by the ENS root keyholders.

```APIDOC
ENS DAO Ownership Transfer Specification:

This section details the proposed actions to be executed by ENS root keyholders to transfer ownership of various ENS protocol components to the ENS DAO.

1.  **Treasury Transfer (Proposal 1):**
    *   **Action:** Transfer all ETH and USDC held by `multisig.ens.eth` to the DAO's timelock contract at `wallet.ensdao.eth`.
    *   **Assumed Method:** A function similar to `transferETHAndERC20` or individual `transfer` calls for each asset.
    *   **Parameters:**
        *   `fromAddress`: `multisig.ens.eth` (source of funds)
        *   `toAddress`: `wallet.ensdao.eth` (destination for funds)
        *   `assets`: List of assets (ETH, USDC) and their amounts (or all available).
    *   **Conditions:** This action is contingent on Proposal 1 passing.

2.  **Registrar Controller & Price Oracle Ownership Transfer (Proposal 2):**
    *   **Action:** Transfer ownership of the ENS Registrar Controller and the ENS Price Oracle contracts to the ENS DAO.
    *   **Methods:**
        *   `transferOwnership(address newOwner)` on `controller.ens.eth`
        *   `transferOwnership(address newOwner)` on ENS Price Oracle contract (`0xb9d374d0fe3d8341155663fae31b7beae0ae233a`)
    *   **Parameters:**
        *   `newOwner`: `wallet.ensdao.eth` (The ENS DAO's timelock contract)
    *   **Conditions:** This action is contingent on Proposal 2 passing.
    *   **Related Capabilities (Post-Transfer):
        *   **Price Oracle:** Ability to set USD-ETH price source, change domain name pricing.
        *   **Registrar Controller:** Ability to replace the price oracle, withdraw funds to DAO treasury, set registration transaction timing.

3.  **ENS Registrar Ownership Transfer (Proposal 3):**
    *   **Action:** Transfer ownership of the .eth Registrar contract to the ENS DAO.
    *   **Method:** `transferOwnership(address newOwner)` on `registrar.ens.eth`
    *   **Parameters:**
        *   `newOwner`: `wallet.ensdao.eth`
    *   **Conditions:** This action is contingent on Proposal 3 passing.
    *   **Related Capabilities (Post-Transfer):
        *   Ability to add/remove controller contracts.
        *   Ability to set the resolver contract for .eth.

4.  **Reverse Namespace Ownership Transfer (Proposal 4):**
    *   **Action:** Transfer ownership of the 'reverse' namespace to the ENS DAO.
    *   **Method:** `setSubnodeOwner(bytes32 node, bytes32 label, address owner)` on the ENS Root contract.
    *   **Parameters:**
        *   `node`: `keccak256('reverse')` (Represents the 'reverse' label under the ENS root)
        *   `label`: `keccak256('reverse')` (The label itself)
        *   `owner`: `wallet.ensdao.eth`
    *   **Conditions:** This action is contingent on Proposal 4 passing.
    *   **Related Capabilities (Post-Transfer):
        *   Ability to replace the reverse registrar for Ethereum addresses.
        *   Ability to create new types of reverse resolution (e.g., for Bitcoin addresses) and update them.

**Note:** Control over the ENS root and the DNSSEC registrar contract are explicitly excluded from this proposal.
```

--------------------------------

### DAO Wallet Allowance and Refund Calldata

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.6.mdx

This section details the calldata payload executed by the DAO Wallet to create an allowance and process a refund. It includes the raw hexadecimal data representing the transaction parameters.

```plaintext
Calldata:
0x6a76120200000000000000000000000040a2accbd92bca938b02010e17a5b8929b49130d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003c000000000000000000000000000000000000000000000000000000000000002448d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001eb004f2083f5fbede34c2714affb3105539775f7fe6400000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000

Target:
0x4f2083f5fbede34c2714affb3105539775f7fe64

Value:
0
```

```plaintext
Calldata:
0x6a76120200000000000000000000000091c32893216de3ea0a55abb9851f581d4503d39b0000000000000000000000000000000000000000000000025c3d2750b08200000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041000000000000000000000000fe89cc7abb2c4183683ab71653c4cdc9b02d44b700000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000

Target:
0x4f2083f5fbede34c2714affb3105539775f7fe64

Value:
0
```

--------------------------------

### DNS Encode Name (Viem)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/names.mdx

Encodes a domain name into its DNS-encoded byte representation using Viem's `packetToBytes` utility. This function is crucial for preparing names for certain ENS contract interactions. The output is a hexadecimal string.

```tsx
import { packetToBytes } from 'viem/ens'
import { toHex } from 'viem/utils'

const name = 'name.eth'
const dnsEncodedName = toHex(packetToBytes(name))
// 0x046e616d650365746800
```

--------------------------------

### Unwrap ENS Name (Solidity)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

This function unwraps any ENS name. It can be called by the owner of the wrapped name, provided the permission to unwrap has not been revoked. This reverts the wrapping process.

```Solidity
NameWrapper.unwrap(bytes32 parentNode, bytes32 labelhash, address controller)

// For example
unwrap(
    0x6cbc..., // The namehash of the parent node, e.g. "myname.eth"
    0xfa1e..., // The labelhash of the child to unwrap, e.g. keccak256('sub')
    0x1234... // The address you want to be the manager of the unwrapped name
)
```

--------------------------------

### Ranked Choice Snapshot Vote Specification

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/1.2.2.mdx

Defines the structure for a ranked-choice voting process on Snapshot for electing an ENS Foundation Director. It lists the candidates and options for voters.

```APIDOC
SnapshotVote:
  title: "Who should be elected as the new Director of the ENS Foundation?"
  choices:
    - name: "avsa.eth"
      url: "https://discuss.ens.domains/t/nominations-for-ens-foundation-director-to-replace-brantly-eth/10634/12"
    - name: "daylon.eth"
      url: "https://discuss.ens.domains/t/nominations-for-ens-foundation-director-to-replace-brantly-eth/10634/9"
    - name: "healingvisions.eth"
      url: "https://discuss.ens.domains/t/nominations-for-ens-foundation-director-to-replace-brantly-eth/10634/3"
    - name: "None of the above."
    - name: "Abstain."
  notes:
    - "This list was randomized by @berrios.eth."
```

--------------------------------

### ENS Airdrop Eligibility Criteria Logic

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/0.2.mdx

This section details the formal criteria for determining eligibility for the retrospective ENS airdrop multiplier. It outlines the conditions related to name ownership, primary name resolution, and event emissions required to qualify for the correction.

```APIDOC
APIDOC:
  description: "Formal criteria for retrospective ENS airdrop multiplier eligibility."
  criteria:
    for_account: "a"
    conditions:
      - "exists name `n` and time `t` before 2021-11-01 00:00:00 UTC"
      - "a is the registrant of n"
      - "n has a resolver, r, set on the ENS registry"
      - "r has an addr record, a', set for n, and has emitted an AddrChanged event"
      - "The reverse record for a' has a resolver, r', set on the ENS registry"
      - "r' has a name record, n', set for the reverse record of a"
      - "r' is either the default reverse resolver, or has emitted a NameChanged event for n' and a'"
      - "n == n'"
  notes:
    - "This logic is implemented by a series of BigQuery queries."
    - "Identified 1,969 accounts meeting these criteria but not qualifying under original rules."
```

--------------------------------

### Calldata JSON for Tx to Ecosystem

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.25.mdx

This JSON object represents transaction calldata for sending tokens to the Ecosystem. It specifies the target address, value, and the encoded calldata for the transaction.

```json
{
    "target": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "value": 0,
    "calldata": "0xa9059cbb0000000000000000000000002686a8919df194aa7673244549e68d42c1685d03000000000000000000000000000000000000000000000000000000c2a57ba800"
}
```

--------------------------------

### NameWrapper.setSubnodeOwner

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

Creates a new subname and sets its owner. This method can also set the fuses and expiry for the subname in the same transaction. Subnames created from wrapped parent names are automatically wrapped.

```Solidity
NameWrapper.setSubnodeOwner(bytes32 parentNode, string label, address owner, uint32 fuses, uint64 expiry)

// For example
setSubnodeOwner(
    0x6cbc..., // The namehash of the parent node, e.g. "myname.eth"
    "sub", // The label of the subname to create
    0x1234..., // The address you want to be the owner of the new subname
    65536, // The fuse bits OR'd together, that you want to burn
    2021232060 // The expiry for the subname
)
```

--------------------------------

### L2 Primary Name: Set Primary Name for Address with Signature

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/reverse.mdx

Sets the `name()` record for the reverse ENS record associated with a provided address using a signature for authorization.

```APIDOC
setNameForAddrWithSignature(address addr, string calldata name, uint256[] calldata coinTypes, uint256 signatureExpiry, bytes calldata signature)
  - Sets the `name()` record for the reverse ENS record associated with the provided address using a signature.
  - Parameters:
    - addr: The address to set the name for (address)
    - name: The name of the reverse record (string calldata)
    - coinTypes: The coin types to set. Must be inclusive of the coin type for the contract (uint256[] calldata)
    - signatureExpiry: Date when the signature expires (uint256)
    - signature: The signature from the addr (bytes calldata)
  - Returns:
    - The ENS node hash of the reverse record (bytes32)
```

--------------------------------

### ENS Security Council Contract and Role Management

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.13.mdx

Documentation for the ENS Security Council smart contract, its role assignment, and its expiration mechanism. This entry covers the contract's purpose in ENS governance, the specific role it assumes, and the function that allows for the revocation of its powers.

```APIDOC
ENS Security Council Contract:
  Purpose: To safeguard the ENS DAO treasury by providing a mechanism to cancel malicious proposals.
  Deployment: The SecurityCouncil contract is deployed and assigned the PROPOSER_ROLE in the ENS timelock contract.
  Address: 0xb8fa0ce3f91f41c5292d07475b445c35ddf63ee0
  Source Code: https://github.com/blockful-io/security-council-ens/blob/main/src/SecurityCouncil.sol

PROPOSER_ROLE Assignment:
  Role: PROPOSER_ROLE
  Granted To: SecurityCouncil contract (0xb8fa0ce3f91f41c5292d07475b445c35ddf63ee0)
  Authority: Grants the ability to cancel proposals within the ENS timelock.
  Limitations: Does not grant the power to initiate or modify other DAO actions.

Expiration Mechanism:
  Feature: Time-based expiration of PROPOSER_ROLE.
  Duration: Two years from deployment.
  Revocation: After two years, any user can call a function to revoke the PROPOSER_ROLE.
  Purpose: To prevent perpetual centralized control and encourage governance distribution.

Revoke Proposer Role Function:
  Function: revokeProposerRole()
  Callable By: Anyone after the two-year expiration period.
  Action: Revokes the PROPOSER_ROLE from the SecurityCouncil contract.
  Reference: https://github.com/blockful-io/security-council-ens/blob/main/src/SecurityCouncil.sol#L59
```

--------------------------------

### ENS Name Wrapper Fuses

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/usecases.mdx

A collection of fuses used with the ENS Name Wrapper to control name behavior and permissions. These flags are typically combined using bitwise OR operations.

```APIDOC
Fuses:
  CANNOT_UNWRAP: Prevents the name from being unwrapped.
  CANNOT_SET_RESOLVER: Prevents the resolver from being changed.
  CANNOT_SET_TTL: Prevents the TTL from being changed.
  CANNOT_PROVE_OWNERSHIP: Prevents proving ownership of the name.
  CANNOT_TRANSFER: Prevents the name from being transferred.
  CANNOT_BURN_FUSES: Prevents fuses from being burned.
  CANNOT_RENEW: Prevents the name from being renewed.
  CANNOT_NAME_WRAP: Prevents the name from being wrapped.
  CANNOT_NAME_UNWRAP: Prevents the name from being unwrapped.
  PARENT_CANNOT_CONTROL: The parent cannot control the name (e.g., set resolver, TTL, or transfer).
  CAN_EXTEND_EXPIRY: Allows extending the expiry of the name.
  CAN_SET_RESOLVER: Allows setting the resolver for the name.
  CAN_SET_TTL: Allows setting the TTL for the name.
  CAN_PROVE_OWNERSHIP: Allows proving ownership of the name.
  CAN_TRANSFER: Allows transferring the name.
  CAN_BURN_FUSES: Allows burning fuses.
  CAN_RENEW: Allows renewing the name.
  CAN_NAME_WRAP: Allows wrapping the name.
  CAN_NAME_UNWRAP: Allows unwrapping the name.

Example Combination (for locking records):
PARENT_CANNOT_CONTROL | CANNOT_UNWRAP | CANNOT_SET_RESOLVER
```

--------------------------------

### ENS DAO Steward USDC Compensation - Term 6

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.18.mdx

Details the monthly and per-term USDC compensation for different roles within the ENS DAO for Term 6, based on the approved structure. This table outlines the quantity of each role, their monthly and total-term compensation, and the overall cost per term.

```APIDOC
ENS DAO Steward USDC Compensation Structure - Term 6:

| Role         | Quantity | Per Steward Per Month | Per Steward Per Term | Total per Term |
|--------------|----------|-----------------------|----------------------|----------------|
| Steward      | 6        | $4,000                | $24,000              | $288,000       |
| Lead Steward | 3        | $5,500                | $33,000              | $198,000       |
| Secretary    | 1        | $5,500                | $33,000              | $66,000        |
| Scribe       | 1        | $3,000                | $18,000              | $36,000        |
| **Total**    |          |                       |                      | **$588,000**   |

Key changes from Term 5 include the removal of discretionary amounts and adjustments to base compensation for regular and lead stewards.
```

--------------------------------

### Expected Expenses through March 2024

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/4.4.2.mdx

Outlines the expected expenditures for the ENS Meta-Governance Working Group until March 2024, categorized by initiative. This table details the planned allocation of funds for various operational aspects.

```APIDOC
Expected Expenses through March 2024:
  Steward + Secretary Compensation:
    USDC: 276,000
    ETH: -
    $ENS: 
  Governance:
    USDC: 50,000
    ETH: -
    $ENS: 52,300
  DAO Tooling:
    USDC: 50,000
    ETH: 30
    $ENS: 
  DAO Sponsorship:
    USDC: -
    ETH: 10
    $ENS: 
  Discretionary:
    USDC: -
    ETH: -
    $ENS: 
  Total Balance:
    USDC: 376,000
    ETH: 40
    $ENS: 52,300
```

--------------------------------

### ENS Working Group Funding Transfers

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.24.mdx

Executes the approved funding transfers for ENS Working Groups as specified in proposal EP 5.24. This includes USDC and ENS token allocations to the respective multisig wallets for Meta-governance, Ecosystem, and Public Goods groups.

```APIDOC
Proposal: EP 5.24

Function: Execute Working Group Funding

Description: Transfers specified amounts of USDC and ENS tokens from the DAO treasury to designated multisig wallets for ENS Working Groups.

Transfers:

1.  **Meta-governance Funding (USDC)**
    - Amount: 354,000 USDC
    - Destination Address: 0x91c32893216dE3eA0a55ABb9851f581d4503d39b

2.  **Ecosystem Funding (USDC)**
    - Amount: 836,000 USDC
    - Destination Address: 0x2686A8919Df194aA7673244549E68D42C1685d03

3.  **Public Goods Funding (USDC)**
    - Amount: 226,000 USDC
    - Destination Address: 0xcD42b4c4D102cc22864e3A1341Bb0529c17fD87d

4.  **Meta-governance Funding (ENS)**
    - Amount: 45,000 ENS
    - Destination Address: 0x91c32893216dE3eA0a55ABb9851f581d4503d39b

Total Transfer Amount: 1,416,000 USDC and 45,000 ENS
```

--------------------------------

### ENS Transaction Verification Details

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.26.mdx

Details for verifying an ENS transaction, including the target contract address, the recipient's ENS name and address, the amount transferred, and the specific function called.

```APIDOC
Ethereum Transaction Verification:

- Target Contract:
  - Address: 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72
  - Description: ENS token contract

- Recipient:
  - ENS Name: main.mg.wg.ens.eth
  - Address: 0x91c32893216dE3eA0a55ABb9851f581d4503d39b

- Amount:
  - Value: 30,000 ENS
  - Wei Representation: 30000000000000000000000

- Function Called:
  - Signature: transfer(address,uint256)
  - Description: Transfers a specified amount of ENS tokens from the sender to a recipient address.

- Post-Transaction Process:
  - The Meta-governance working group will handle subsequent distributions to individual recipients using Hedgey vesting contracts, based on an approved allocation table.
```

--------------------------------

### ETHRegistrarController: renew Function

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/eth.mdx

Renews an existing ENS domain registration. This function can be called by any user, not just the owner, allowing for proactive renewal to prevent expiration. It enables renewal for any arbitrary amount of time.

```Solidity
ETHRegistrarController.renew();
```

--------------------------------

### Embedding External Links

Source: https://github.com/ensdomains/docs/blob/master/src/pages/learn/dns.mdx

A React component used to embed links to external resources, often used for documentation references.

```jsx
<EmbedLink
  title="Importing a DNS name Gaslessly"
  href="/registry/dns#gasless-import"
/>
```

--------------------------------

### NameWrapper.setChildFuses

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

Burns parent-controlled and owner-controlled fuses for a subname that you own the parent of, provided the subname is not yet Emancipated. Requires setting an expiry and the parent name must be Locked. Burning owner-controlled fuses necessitates burning PARENT_CANNOT_CONTROL and CANNOT_UNWRAP on the subname.

```Solidity
NameWrapper.setChildFuses(bytes32 parentNode, bytes32 labelhash, uint32 fuses, uint64 expiry)

// For example
setChildFuses(
    0x6cbc..., // The namehash of the parent node, e.g. "myname.eth"
    0xfa1e..., // The labelhash of the child, e.g. keccak256('sub')
    65537, // The fuse bits OR'd together, that you want to burn
    2021232060 // The expiry for the subname
)
```

--------------------------------

### ENS DAO Treasury Transfers for Working Group Funding

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.11.mdx

Specifies the required token transfers from the ENS DAO treasury to fund the Meta-Governance and Public Goods Working Groups. This includes the amounts, token types, and destination multisig addresses.

```APIDOC
ENS_DAO_Treasury_Transfers:
  description: "Transfers from ENS DAO treasury to working group multisigs."
  operations:
    - name: "Transfer USDC to Meta-Governance Safe"
      action: "Transfer"
      parameters:
        - name: "amount"
          type: "USDC"
          value: "589000"
        - name: "destination"
          type: "address"
          value: "0x91c32893216dE3eA0a55ABb9851f581d4503d39b"
      related_operations: ["Transfer ENS to Meta-Governance Safe", "Transfer USDC to Public Goods Safe"]

    - name: "Transfer ENS to Meta-Governance Safe"
      action: "Transfer"
      parameters:
        - name: "amount"
          type: "ENS"
          value: "100000"
        - name: "destination"
          type: "address"
          value: "0x91c32893216dE3eA0a55ABb9851f581d4503d39b"
      related_operations: ["Transfer USDC to Meta-Governance Safe", "Transfer USDC to Public Goods Safe"]

    - name: "Transfer USDC to Public Goods Safe"
      action: "Transfer"
      parameters:
        - name: "amount"
          type: "USDC"
          value: "356000"
        - name: "destination"
          type: "address"
          value: "0xcD42b4c4D102cc22864e3A1341Bb0529c17fD87d"
      related_operations: ["Transfer USDC to Meta-Governance Safe", "Transfer ENS to Meta-Governance Safe"]

  summary: "Total transfer amount: 945,000 USDC and 100,000 ENS."
```

--------------------------------

### Update BigQuery Queries for ENS Airdrop

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/0.3.mdx

These BigQuery queries are used to identify accounts eligible for the ENS airdrop and calculate their token entitlements. The updated queries reflect changes in criteria or data sources, as indicated by different Gist commit hashes.

```BigQuery
This logic is implemented by [this series of BigQuery queries](https://gist.github.com/Arachnid/667178e854945abaecb6dfd3b6c0c279/1182eea3145394181affe4bb799d6b7858f9eb58), and shows that 1,969 accounts meet these criteria but did not qualify for the multiplier under the original criteria. The sum of the tokens these accounts would be entitled to comes to ~213,049 ENS tokens.
This logic is implemented by [this series of BigQuery queries](https://gist.github.com/Arachnid/667178e854945abaecb6dfd3b6c0c279/106d9bc156988cf96786c71f6448f13fb11599fc), and shows that 1,969 accounts meet these criteria but did not qualify for the multiplier under the original criteria. The sum of the tokens these accounts would be entitled to comes to ~213,049 ENS tokens.
```

--------------------------------

### L2 Primary Name: Set Primary Name with Signature (Ownable Contract)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/reverse.mdx

Sets the `name()` record for the reverse ENS record associated with a contract that implements `Ownable`. Authorization is provided via a signature.

```APIDOC
setNameForOwnableWithSignature(address contractAddr, address owner, string calldata name, uint256[] memory coinTypes, uint256 signatureExpiry, bytes calldata signature)
  - Sets the `name()` record for the reverse ENS record associated with a contract owned by `Ownable` using a signature.
  - Parameters:
    - contractAddr: The address of the contract implementing Ownable (address)
    - owner: The owner of the contract (via Ownable) (address)
    - name: The name to set (string calldata)
    - coinTypes: The coin types to set. Must be inclusive of the coin type for the contract (uint256[] memory)
    - signatureExpiry: The expiry of the signature (uint256)
    - signature: The signature from an address that will return true on isValidSignature for the owner (bytes calldata)
  - Returns:
    - The ENS node hash of the reverse record (bytes32)
```

--------------------------------

### Fund Transfer Specification

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.11.mdx

Details the specific token transfers required by the proposal to fund the Meta-Governance Working Group. This includes the amounts and recipient addresses for USDC and ENS tokens.

```APIDOC
executeTransfer(token: string, amount: number, recipientAddress: string, recipientENS: string)
  - Executes a token transfer from the DAO treasury to a specified recipient.
  - Parameters:
    - token: The type of token to transfer (e.g., "USDC", "ENS").
    - amount: The quantity of tokens to transfer.
    - recipientAddress: The Ethereum address of the recipient.
    - recipientENS: The ENS name associated with the recipient address (for reference).
  - Returns: Transaction status or confirmation.
  - Example:
    executeTransfer(token="USDC", amount=374000, recipientAddress="0x91c32893216dE3eA0a55ABb9851f581d4503d39b", recipientENS="main.mg.wg.ens.eth")
    executeTransfer(token="ENS", amount=150000, recipientAddress="0x91c32893216dE3eA0a55ABb9851f581d4503d39b", recipientENS="main.mg.wg.ens.eth")
  - Related Information:
    - Recipient ENS: main.mg.wg.ens.eth
    - Recipient Address: 0x91c32893216dE3eA0a55ABb9851f581d4503d39b
    - Proposal Reference: EP 5.9 as amended by EP 5.8
```

--------------------------------

### Revoke Legacy Multisig Controller Role

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.8.md

Details the transaction to revoke the controller role from the legacy ENS multisig on the ENS root contract. This involves calling the `setController` function on the Root contract with the multisig's address and setting the controller status to false.

```APIDOC
ENS Root Contract Interaction:
  setController(address _controller, bool _isController)
    - Revokes or grants the controller role on the ENS root.
    - Parameters:
      - _controller: The address to set the controller role for (legacy multisig: 0xCF60916b6CB4753f58533808fA610FcbD4098Ec0).
      - _isController: A boolean indicating whether to grant (true) or revoke (false) the role (set to false).
    - Contract Address: 0xaB528d626EC275E3faD363fF1393A41F581c5897
    - Value: 0 Ether
    - Example Call:
      contract.setController(0xCF60916b6CB4753f58533808fA610FcbD4098Ec0, false)
```

--------------------------------

### Calldata JSON for Tx to Metagov

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.25.mdx

This JSON object represents transaction calldata for sending tokens to Metagov. It specifies the target address, value, and the encoded calldata for the transaction.

```json
{
    "target": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "value": 0,
    "calldata": "0xa9059cbb00000000000000000000000091c32893216de3ea0a55abb9851f581d4503d39b0000000000000000000000000000000000000000000000000000003b23946c00"
}
```

--------------------------------

### Revoke Controller Role from ENS Root Contract

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.9.mdx

This entry details the specific smart contract interaction required to revoke the 'controller' role from the legacy ENS multisig. It specifies the target contract, the function to call, and the parameters needed to execute the revocation.

```APIDOC
ENS Root Contract Interaction:

Contract Address: 0xaB528d626EC275E3faD363fF1393A41F581c5897

Method: setController
  - Description: Sets or revokes the controller for a given domain.
  - Parameters:
    - domain: The domain identifier (e.g., 0 for the root domain).
    - controller: The address to set as the controller or to revoke.
    - expiry: The expiry time for the controller role (0 for permanent revocation).
  - Usage Example:
    Call `setController` on the ENS `Root` contract at `0xaB528d626EC275E3faD363fF1393A41F581c5897`.
    
    Arguments:
    - domain: 0 (representing the ENS root)
    - controller: 0xCF60916b6CB4753f58533808fA610FcbD4098Ec0 (the legacy ENS multisig address)
    - expiry: 0 (to revoke the role permanently)
  - Returns: Transaction receipt indicating success or failure.
```

--------------------------------

### ENS DAO Working Group Funding Transactions

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/3.2.mdx

Details the specific token transfers required to fund the ENS DAO Working Groups as per the proposal. Includes amounts and recipient addresses for USDC, ETH, and ENS tokens.

```APIDOC
ENS DAO Working Group Funding Transactions:

1. Ecosystem Working Group Funding:
   - Transfer 935,000 USDC to ens-ecosystem.pod.xyz (0x2686A8919Df194aA7673244549E68D42C1685d03)
   - Transfer 254 ETH to ens-ecosystem.pod.xyz (0x2686A8919Df194aA7673244549E68D42C1685d03)

2. MetaGovernance Working Group Funding:
   - Transfer 364,000 USDC to ens-metagov.pod.xyz (0x91c32893216dE3eA0a55ABb9851f581d4503d39b)
   - Transfer 125 ETH to ens-metagov.pod.xyz (0x91c32893216dE3eA0a55ABb9851f581d4503d39b)
   - Transfer 3,500 $ENS to ens-metagov.pod.xyz (0x91c32893216dE3eA0a55ABb9851f581d4503d39b)

3. Public Goods Working Group Funding:
   - Transfer 250,000 USDC to ens-publicgoods.pod.xyz (0xcD42b4c4D102cc22864e3A1341Bb0529c17fD87d)
   - Transfer 50 ETH to ens-publicgoods.pod.xyz (0xcD42b4c4D102cc22864e3A1341Bb0529c17fD87d)

Transaction Details (Example using a generic transfer function):

// Transfer USDC to Ecosystem WG
transfer(
  tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC Contract Address
  to: "0x2686A8919Df194aA7673244549E68D42C1685d03",
  value: 935000000000 // 935,000 USDC (assuming 6 decimal places)
)

// Transfer ETH to Ecosystem WG
transferETH(
  to: "0x2686A8919Df194aA7673244549E68D42C1685d03",
  value: 254000000000000000000 // 254 ETH (assuming 18 decimal places)
)

// Transfer ENS to MetaGovernance WG
transfer(
  tokenAddress: "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72", // ENS Contract Address
  to: "0x91c32893216dE3eA0a55ABb9851f581d4503d39b",
  value: 3500000000000000000000 // 3,500 ENS (assuming 18 decimal places)
)

// Note: Specific contract interfaces and function signatures may vary based on the execution environment.
```

--------------------------------

### ENS Registry Setters

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/ens.mdx

Functions for modifying ENS domain records. These methods allow owners to update the owner, resolver, and TTL of their domains, or set records for subdomains. They are typically only callable by the current owner or authorized addresses.

```APIDOC
ENS.setOwner(bytes32 node, address owner)
  - Sets a new owner for the specified ENS node. Only callable by the current owner.

ENS.setResolver(bytes32 node, address resolver)
  - Sets a new resolver address for the specified ENS node. Only callable by the current owner.

ENS.setTTL(bytes32 node, uint64 ttl)
  - Sets a new TTL value for the specified ENS node. Only callable by the current owner.

ENS.setSubnodeOwner(bytes32 node, bytes32 label, address owner)
  - Sets the owner of a subnode. The 'node' is the parent node, 'label' is the subdomain label, and 'owner' is the new owner's address. Only callable by the owner of the parent node.

ENS.setRecord(bytes32 node, address owner, address resolver, uint64 ttl)
  - A convenience function to set the owner, resolver, and TTL for a given ENS node in a single transaction. Only callable by the current owner.

ENS.setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl)
  - A convenience function to set the owner, resolver, and TTL for a subnode in a single transaction. Only callable by the owner of the parent node.

ENS.setApprovalForAll(address operator, bool approved)
  - Grants or revokes approval for an operator to manage all of the caller's ENS domains.
```

--------------------------------

### Parent-Controlled Fuses

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/fuses.mdx

Details the parent-controlled fuses available in the Name Wrapper system. These fuses are burned by the owner of the parent name and grant specific permissions or control over child names. Burning these fuses can emancipate child names or allow child owners to extend their own expiry.

```APIDOC
PARENT_CANNOT_CONTROL:
  Description: Allows a parent owner to Emancipate a child name. After this is burned, the parent will no longer be able to burn any further fuses, and will no longer be able to replace/delete the child name. This fuse must be burned in order for any owner-controlled fuses to be burned on the name.
  Implications: Parent loses control over further fuse burning and name replacement/deletion. Enables owner-controlled fuses.

IS_DOT_ETH:
  Description: This fuse cannot be burned by users of the Name Wrapper; it is only set internally when a .eth 2LD is wrapped.
  Implications: Internal flag for .eth second-level domains.

CAN_EXTEND_EXPIRY:
  Description: The owner of the child name will be able to extend their own expiry. Normally, only the parent owner can extend the expiry of a child name.
  Implications: Child owner gains ability to manage their own name's expiry.

Custom Fuses:
  Description: There are 13 other parent-controlled fuses that are not reserved and can be used in any custom way.
  Implications: Flexibility for custom permission management.
```

--------------------------------

### USDC Transfer for ENS Labs Legal Fees

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.16.mdx

Details the transaction to transfer USDC from the ENS DAO treasury to ENS Labs for legal fee reimbursement. This action is based on the approval from EP 5.3.

```APIDOC
USDC_Transfer_ENS_Labs_Legal_Fees:
  description: "Reimbursement of legal fees for ENS Labs in the eth.link litigation."
  transaction:
    from: "ENS DAO Treasury"
    from_address: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7"
    to_contract: "USDC Token Contract"
    to_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    recipient_address: "0x690F0581eCecCf8389c223170778cD9D029606F2"
    function_called: "transfer"
    parameters:
      - name: "_to"
        type: "address"
        value: "0x690F0581eCecCf8389c223170778cD9D029606F2"
      - name: "_value"
        type: "uint256"
        value: "1218669760000" # 1,218,669.76 USDC (USDC has 6 decimals)
    purpose: "Reimbursement for legal fees in eth.link litigation."
  related_proposals:
    - EP 5.3 (Social Proposal for approval)
  status: "Executable"
```

--------------------------------

### Security Council Responsibilities and Emergency Situations

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.13.mdx

Defines the expected responsibilities and triggers for the ENS DAO Security Council members. The council is expected to act only in emergency situations, such as proposals that violate the ENS constitution or are financially incentivized against the DAO's interests.

```APIDOC
ENS_DAO_Security_Council_Operations:
  Expectations: Act only in emergency situations.
  Triggering Conditions:
    - Proposal goes against the ENS constitution.
    - Proposal approved with malicious intent against DAO longevity/sustainability.
    - Proposal financially incentivized against DAO interests for voter's financial stake.
    - Approved proposal directly benefits an attacker at the DAO's expense.
```

--------------------------------

### ERC-721 Operator Approvals for ENS Names

Source: https://github.com/ensdomains/docs/blob/master/src/pages/wrapper/contracts.mdx

Details the use of ERC-721 standard methods `approve` and `setApprovalForAll` with the ENS Name Wrapper. These methods allow granting specific permissions to other contracts (operators) to manage ENS names, particularly for subname renewals. The `CANNOT_APPROVE` fuse can lock these permissions.

```APIDOC
ERC-721 Operator Approval Methods:

These methods are used to grant or revoke permissions for other contracts (operators) to manage your ENS wrapped names.

1.  **`approve(address to, uint256 tokenId)`**
    *   **Purpose**: Approves a single operator (`to`) for a specific wrapped name (`tokenId`). In the context of subname renewals, this is used to approve a specific 'Subname Renewal Manager' contract for a particular ENS name.
    *   **Parameters**:
        *   `to`: The address of the operator (e.g., the Subname Renewal Manager contract) to approve.
        *   `tokenId`: The ID of the wrapped ENS name NFT.
    *   **Behavior**: Grants the approved operator the ability to set/extend the expiry on subnames associated with the `tokenId`. This approval is reset if the wrapped NFT is burned, re-minted, or transferred (unless the `CANNOT_APPROVE` fuse is burned).
    *   **Limitations**: Approves only one operator for a specific token.

2.  **`setApprovalForAll(address operator, bool approved)`**
    *   **Purpose**: Approves or revokes an operator (`operator`) for all of your wrapped ENS names.
    *   **Parameters**:
        *   `operator`: The address of the contract or user to grant/revoke operator status.
        *   `approved`: A boolean, `true` to approve, `false` to revoke.
    *   **Behavior**: Grants the operator full control over all your wrapped ENS name NFTs. This includes the ability to create subnames and manage renewals. This approval is reset upon transfer of the wrapped NFT, unless the `CANNOT_APPROVE` fuse is burned.
    *   **Usage Example**: Used to grant a 'subname registrar' contract full control over your name to allow users to register/renew subnames.
    *   **Revocation**: You can later revoke approval using `setApprovalForAll(operatorAddress, false)`.

**Fuse Interaction**: Burning the `CANNOT_APPROVE` fuse prevents further changes to operator approvals for the name. This ensures that an approved renewal manager's ability to extend expiry is permanent, even if the wrapped NFT is transferred.
```

--------------------------------

### L2 Primary Name: Set Primary Name for Address

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/reverse.mdx

Sets the `name()` record for the reverse ENS record associated with a provided address. This can be used if the address is a contract owned by an SCA (Smart Contract Account).

```APIDOC
setNameForAddr(address addr, string memory name)
  - Sets the `name()` record for the reverse ENS record associated with the provided address.
  - Parameters:
    - addr: The address to set the name for (address)
    - name: The name to set (string memory)
  - Returns:
    - The ENS node hash of the reverse record (bytes32)
```

--------------------------------

### ENS DAO Treasury Fund Transfers

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.25.mdx

Specifies the transfers of USDC from the ENS DAO treasury to various working group multisig wallets. This includes the amounts and destination addresses for the Meta-governance, Ecosystem, and Public Goods working groups.

```APIDOC
DAO_Treasury.transfer(
  destination: "0x91c32893216dE3eA0a55ABb9851f581d4503d39b",
  amount: 254000,
  currency: "USDC"
)
# Purpose: Fund ENS Meta-governance Working Group
# Related Proposal: EP 5.17.1

DAO_Treasury.transfer(
  destination: "0x2686a8919df194aa7673244549e68d42c1685d03",
  amount: 836000,
  currency: "USDC"
)
# Purpose: Fund ENS Ecosystem Working Group
# Related Proposal: EP 5.17.2

DAO_Treasury.transfer(
  destination: "0xcD42b4c4D102cc22864e3A1341Bb0529c17fD87d",
  amount: 226000,
  currency: "USDC"
)
# Purpose: Fund ENS Public Goods Working Group
# Related Proposal: EP 5.17.3

# Total transfer amount: 1,316,000 USDC
```

--------------------------------

### Service Provider Voting Process Amendment

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/6.4.mdx

Details the proposed changes to the ENS Service Provider voting process, including the current evaluation method, the new amendment allowing separate ranking of basic and extended budgets, and the comprehensive vote processing algorithm.

```APIDOC
APIDOC:
  Service Provider Voting Process Amendment

  Context:
    EP 6.3 established a $4.5M budget for 2025. This proposal amends the voting process to allow delegates to rank both teams and their respective budgets.

  Current Evaluation Process:
    Projects are assessed in ranked order:
    - If "None Below" is reached, evaluation stops.
    - If the candidate has been part of the Service provider program for at least a year AND if the extended budget fits within the remaining two-year stream budget, assign to the two-year stream. Subtract the extended budget from the two-year stream budget.
    - Assign to the one-year stream if:
      - The extended budget fits the one-year budget. Subtract its extended budget from the one-year stream.
      - OR if the basic budget fits the one-year budget, subtract the its basic budget from the one-year stream.
      - If none of these conditions are met, the project is eliminated.

  New Proposed Rule Amendment:
    The vote will present both extended and basic budgets as separate options. A voter can pick either budget to rank their candidates. They do not need to rank both budget options separately, as they are considered the same candidate.
    The rank of each candidate will be the rank of its highest ranked budget option, according to a Copeland methodology (using average support as a tiebreaker). Then a pairwise comparison will be made between the two budget options and the preferred one will be set as its selected budget.

  Vote Processing Algorithm:
    1. Votes Preprocessing:
       - For providers with both basic and extended budget options, enforce the lowest option to be ranked immediately after the highest option (of the same provider).
       - If a provider has only one budget option, no special enforcement is needed.
       - This grouping ensures accurate pairwise comparisons between different providers and their budget options.
    2. Pairwise Comparisons (Copeland):
       - For each pair of candidates (provider), calculate total voting power supporting each over the other.
       - A candidate wins a head-to-head matchup if total voting power ranking them higher exceeds their opponent's.
       - Each win contributes 1 point to a candidate's Copeland score.
       - The pairwise comparison between basic and extended must also be stored for defining budget preference.
    3. "None Below" Handling:
       - The "None Below" option serves as a cutoff point in a voter's ranking.
       - Candidates ranked above "None Below" are considered ranked.
       - Candidates ranked below "None Below" are considered unranked by that voter.
       - A ranked candidate always wins against an unranked candidate in pairwise comparisons.
    4. Scoring and Ranking:
       - Candidates are ranked by their Copeland score (descending), with average support as a tiebreaker.
```

--------------------------------

### ENS Governor Contract Functions

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/governance/process.mdx

Functions for submitting and voting on proposals within the ENS governance system. Requires ENS delegation for proposal submission and voting.

```APIDOC
ENS Governor Contract (governor.ensdao.eth):

propose(proposalId: uint256, targets: address[], values: uint256[], calldatas: bytes[], description: string)
  - Submits a proposal to the governor contract for on-chain voting.
  - Requires at least 100k ENS delegated to the submitting address.
  - Parameters:
    - proposalId: Unique identifier for the proposal.
    - targets: Array of contract addresses to be called.
    - values: Array of ETH values to send with calls.
    - calldatas: Array of encoded function calls.
    - description: A human-readable description of the proposal.
  - Returns: Proposal ID if successful.
  - Related: castVote, castVoteBySig

castVote(proposalId: uint256, support: uint8)
  - Casts a vote (for or against) on an active proposal.
  - Requires ENS delegation to the voting address.
  - Parameters:
    - proposalId: The ID of the proposal to vote on.
    - support: 0 for against, 1 for for, 2 for abstain.
  - Returns: Vote receipt.
  - Related: propose, castVoteBySig

castVoteBySig(proposalId: uint256, support: uint8, v: uint8, r: bytes32, s: bytes32)
  - Casts a vote using an offline signature (EIP-712 compliant).
  - Allows users to vote without directly interacting with the contract during the voting period.
  - Parameters:
    - proposalId: The ID of the proposal to vote on.
    - support: 0 for against, 1 for for, 2 for abstain.
    - v: ECDSA recovery byte.
    - r: ECDSA signature 'r' component.
    - s: ECDSA signature 's' component.
  - Returns: Vote receipt.
  - Related: propose, castVote
```

--------------------------------

### L2 Primary Name: Set Primary Name

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/reverse.mdx

Sets the `name()` record for the reverse ENS record associated with the calling account. This function is part of the L2 reverse registrar contract.

```APIDOC
setName(string memory name)
  - Sets the `name()` record for the reverse ENS record associated with the calling account.
  - Parameters:
    - name: The name to set (string memory)
  - Returns:
    - The ENS node hash of the reverse record (bytes32)
```

--------------------------------

### ETH Transfer for Name Refunds

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/4.3.mdx

Details a specific transaction for transferring ETH to a multisig wallet to facilitate refunds for invalidated .eth names. This entry represents a high-level transaction summary, akin to an API call for fund disbursement.

```APIDOC
Transaction:
  Recipient: 0x91c32893216dE3eA0a55ABb9851f581d4503d39b
  Amount: 117 ETH
  Purpose: Fund Meta-Governance Working Group for ENSIP-15 name refunds.
  Notes: This transfer includes gas fees for the refund process. Leftover funds are to be returned.
```

--------------------------------

### Calldata JSON for Tx to Public Goods

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.25.mdx

This JSON object represents transaction calldata for sending tokens to Public Goods. It specifies the target address, value, and the encoded calldata for the transaction.

```json
{
    "target": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "value": 0,
    "calldata": "0xa9059cbb000000000000000000000000cd42b4c4d102cc22864e3a1341bb0529c17fd87d000000000000000000000000000000000000000000000000000000349ea65400"
}
```

--------------------------------

### ENS Registry Events

Source: https://github.com/ensdomains/docs/blob/master/src/pages/registry/ens.mdx

Emitted when significant changes occur within the ENS registry. These events track domain transfers, resolver updates, TTL changes, and the creation of new subnodes, providing an auditable log of registry modifications.

```APIDOC
event Transfer(bytes32 indexed node, address owner)
  - Emitted when the owner of a node changes.

event NewResolver(bytes32 indexed node, address resolver)
  - Emitted when the resolver for a node is updated.

event NewTTL(bytes32 indexed node, uint64 ttl)
  - Emitted when the TTL for a node is updated.

event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner)
  - Emitted when a new subnode is created and its owner is set.
```

--------------------------------

### ENS Reverse Name Setter Contract

Source: https://github.com/ensdomains/docs/blob/master/src/pages/web/naming-contracts.mdx

A Solidity contract designed to set an ENS name directly in its constructor. It utilizes ENS and IReverseRegistrar interfaces to register the name associated with the contract's address. This contract is useful for contracts where the ENS name should be immutable after deployment.

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface ENS {
    function owner(bytes32 node) external view returns (address);
}

interface IReverseRegistrar {
    function setName(string memory name) external returns (bytes32);
}

// Variation of ReverseClaimer.sol from @ensdomains/ens-contracts that sets the reverse name directly.
contract ReverseSetter {
    /// @dev The ENS registry
    ENS private constant ens = ENS(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e);

    /// @dev Output of namehash("addr.reverse")
    bytes32 private constant ADDR_REVERSE_NODE =
        0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

    /// @param name The reverse name to set for this contract's address.
    constructor(string memory name) {
        IReverseRegistrar reverseRegistrar = IReverseRegistrar(
            ens.owner(ADDR_REVERSE_NODE)
        );
        reverseRegistrar.setName(name);
    }
}
```

--------------------------------

### Security Council Contract Functionality

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.13.mdx

Describes the functionality of the ENS DAO Security Council contract, which is designed to cancel transactions in the timelock contract. This action is triggered by the security council multisig and serves as a safeguard against malicious proposals.

```APIDOC
SecurityCouncilContract:
  Purpose: To cancel transactions in the ENS DAO timelock contract.
  Trigger: Activated by the security council multisig.
  Limitation: Can only perform the CANCEL action.
  Mitigation: Addresses risks associated with broad PROPOSER_ROLE assignments.
  Lifecycle: PROPOSER_ROLE can be removed by anyone after 2 years.
  Reference: https://github.com/blockful-io/security-council-ens/blob/main/src/SecurityCouncil.sol
```

--------------------------------

### USDC ERC20 Transfer Function

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.28.mdx

Documentation for the standard ERC20 `transfer` function used to move USDC tokens. This function allows a token holder to send a specified amount of tokens to another address. The transaction details indicate a call to this function.

```APIDOC
USDC.transfer(address to, uint256 amount)
  - Transfers `amount` tokens from the caller's account to the recipient `to`.
  - Parameters:
    - to: The address to receive the tokens.
    - amount: The number of tokens to transfer. For USDC, this value is multiplied by 10^6 due to its 6 decimal places.
  - Returns:
    - bool: True if the transfer was successful, false otherwise.
  - Example Usage (Calldata):
    - Function Selector: `0xa9059cbb`
    - Encoded Parameters:
      - `to`: `0x000000000000000000000000B352bB4E2a4f27683435f153A259f1B207218b1b` (ethdotlimo.eth address)
      - `amount`: `0x0000000000000000000000000000000000000000000000000000003806ceba60` (240632380000 USDC)
```

--------------------------------

### Update ENS Token Approval for Airdrop

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/0.3.mdx

This JavaScript code snippet demonstrates the process of approving the airdrop contract to spend ENS tokens from the DAO account. The update reflects a change in the total amount of ENS tokens to be approved, incorporating the mistakenly sent funds.

```JavaScript
const tx = await token.populateTransaction.approve(airdropAddress, '213049736662531485206636');
const tx = await token.populateTransaction.approve(airdropAddress, '219295650978169915391391');
```

--------------------------------

### DNS Encode Name (Ethers)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/names.mdx

Encodes a domain name into its DNS-encoded byte representation using Ethers.js's `dnsEncode` utility. This function is part of the hashing utilities and prepares names for specific contract calls. The output is a hexadecimal string.

```tsx
// https://docs.ethers.org/v6/api/hashing/#dnsEncode
import { dnsEncode } from 'ethers/lib/utils'

const dnsEncodedName = dnsEncode('name.eth')
```

--------------------------------

### DNS Decode Name (ENSjs)

Source: https://github.com/ensdomains/docs/blob/master/src/pages/resolution/names.mdx

Decodes a DNS-encoded name back into its human-readable string format using ENSjs's `bytesToPacket` utility. This function takes a hexadecimal string representing the DNS-encoded bytes and converts it back to the original domain name. It requires converting the hex string to bytes first.

```tsx
import { bytesToPacket } from '@ensdomains/ensjs/utils'
import { hexToBytes } from 'viem/utils'

const dnsEncodedName = '0x046e616d650365746800'
const name = bytesToPacket(hexToBytes(dnsEncodedName))
// name.eth
```

--------------------------------

### USDC Transfer Calldata

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.28.mdx

JSON representation of the calldata for a USDC token transfer, specifying the recipient address and the amount.

```JSON
{
  "target": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "value": 0,
  "calldata": "0xa9059cbb000000000000000000000000b352bb4e2a4f27683435f153a259f1b207218b1b0000000000000000000000000000000000000000000000000000003806ceba60"
}
```

--------------------------------

### ENS Transaction Payload

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/5.26.mdx

This JSON object represents a typical transaction payload for an ENS-related operation, specifying the target contract, value, and calldata for execution on the Ethereum blockchain.

```json
{
  "target": "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
  "value": 0,
  "calldata": "0xa9059cbb00000000000000000000000091c32893216de3ea0a55abb9851f581d4503d39b00000000000000000000000000000000000000000000065a4da25d3016c00000"
}
```

--------------------------------

### ENS Token Contract Operations

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/proposals/1.7.mdx

Operations to manage the ENS token contract for airdrop termination. Includes sweeping remaining tokens to a specified destination and revoking token approvals for a specific spender.

```APIDOC
ENS Token Contract:
  sweep(dest: address)
    - Transfers all remaining tokens from the contract to the specified destination address.
    - Parameters:
      - dest: The address to which remaining tokens should be swept.
    - Example Call:
      Address: 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72
      Function: sweep
      Argument: dest
      Value: 0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7

  approve(spender: address, amount: uint256)
    - Sets the allowance for a spender to a specified amount.
    - To revoke approval, set allowance to 0.
    - Parameters:
      - spender: The address that will be approved to spend tokens.
      - amount: The maximum amount that the spender is allowed to spend.
    - Example Call (Revoking Approval):
      Address: 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72
      Function: approve
      Argument: spender
      Value: 0x4A1241C2Cf2fD4a39918BCd738f90Bd7094eC2DC
      Argument: amount
      Value: 0
```

--------------------------------

### Renounce Timelock Role Function

Source: https://github.com/ensdomains/docs/blob/master/src/pages/dao/security-council.mdx

Details the function to permanently disable the Security Council's cancel role. This action can be performed by any address after a specific Unix timestamp, promoting decentralization.

```APIDOC
Function: renounceTimelockRoleByExpiration()

Description:
  Permanently disables the Security Council's role to cancel proposals. This function can be called by any address.

Execution Condition:
  Can be called after the Unix timestamp 1784919179.

Purpose:
  To promote decentralization by time-limiting the council's cancel authority.
```

=== COMPLETE CONTENT === This response contains all available snippets from this library. No additional content exists. Do not make further requests.
