# Wagmi

## Overview

Wagmi is a collection of React Hooks for Ethereum, designed to build high-performance, type-safe blockchain frontends. It provides tools for accounts, wallets, contracts, transactions, and more, with built-in caching and modularity.

## Installation

```bash
npm install wagmi viem @tanstack/react-query
```

## Setup

```tsx
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

## Connecting Wallets

### useConnect Hook

```tsx
import { useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

function ConnectButton() {
  const { connect } = useConnect()

  return (
    <button onClick={() => connect({ connector: injected() })}>
      Connect
    </button>
  )
}
```

### Display Available Connectors

```tsx
import { useConnect } from 'wagmi'

function App() {
  const { connectors, connect } = useConnect()

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          {connector.name}
        </button>
      ))}
    </div>
  )
}
```

### Full Wallet Options Component

```tsx
import * as React from 'react'
import { Connector, useConnect, useConnectors } from 'wagmi'

export function WalletOptions() {
  const { connect } = useConnect()
  const connectors = useConnectors()

  return connectors.map((connector) => (
    <WalletOption
      key={connector.uid}
      connector={connector}
      onClick={() => connect({ connector })}
    />
  ))
}

function WalletOption({
  connector,
  onClick,
}: {
  connector: Connector
  onClick: () => void
}) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <button disabled={!ready} onClick={onClick}>
      {connector.name}
    </button>
  )
}
```

## useConnect Return Values

```typescript
{
  data: { account: string, chainId: number },
  error: Error | null,
  isError: boolean,
  isIdle: boolean,
  isLoading: boolean,
  isSuccess: boolean,
  mutate: (variables) => void,
  mutateAsync: (variables) => Promise,
  reset: () => void,
  status: 'idle' | 'loading' | 'success' | 'error',
  connectors: Connector[],
}
```

## Common Hooks

### useAccount

```tsx
import { useAccount } from 'wagmi'

function Account() {
  const { address, isConnected } = useAccount()

  if (!isConnected) return <div>Not connected</div>
  return <div>Connected: {address}</div>
}
```

### useBalance

```tsx
import { useBalance } from 'wagmi'

function Balance() {
  const { data } = useBalance({
    address: '0x...',
  })

  return <div>{data?.formatted} {data?.symbol}</div>
}
```

### useContractRead

```tsx
import { useContractRead } from 'wagmi'

function ReadContract() {
  const { data } = useContractRead({
    address: '0x...',
    abi: myAbi,
    functionName: 'balanceOf',
    args: ['0x...'],
  })
}
```

### useContractWrite

```tsx
import { useContractWrite } from 'wagmi'

function WriteContract() {
  const { write } = useContractWrite({
    address: '0x...',
    abi: myAbi,
    functionName: 'transfer',
  })

  return <button onClick={() => write({ args: ['0x...', 100n] })}>Transfer</button>
}
```

## Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [Wagmi GitHub](https://github.com/wevm/wagmi)
- [Wagmi Examples](https://wagmi.sh/examples/connect-wallet)
