/**
 * Generate SEPOLIA_POOLS.md from pools_raw.json
 */
import { readFileSync, writeFileSync } from 'fs';

const INPUT = '/Users/oakgroup/Desktop/webdev/ethglobal/oikonomos/agents/pools_raw.json';
const OUTPUT = '/Users/oakgroup/Desktop/webdev/ethglobal/oikonomos/agents/SEPOLIA_POOLS.md';

interface Pool {
  id: string;
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
  sqrtPriceX96: string;
  tick: number;
  blockNumber: string;
}

// Known tokens
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number; name: string }> = {
  '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8': { symbol: 'USDC', decimals: 6, name: 'USDC (Aave)' },
  '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357': { symbol: 'DAI', decimals: 18, name: 'DAI (Aave)' },
  '0xc558dbdd856501fcd9aaf1e62eae57a9f0629a3c': { symbol: 'WETH', decimals: 18, name: 'WETH (Aave)' },
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC2', decimals: 6, name: 'USDC (Circle)' },
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': { symbol: 'WETH2', decimals: 18, name: 'WETH (Sepolia)' },
  '0x779877a7b0d9e8603169ddbd7836e478b4624789': { symbol: 'LINK', decimals: 18, name: 'LINK' },
  '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18, name: 'Native ETH' },
};

function getTokenInfo(address: string) {
  const lower = address.toLowerCase();
  return KNOWN_TOKENS[lower] || { symbol: lower.slice(0, 10), decimals: 18, name: `Unknown (${lower.slice(0, 10)}...)` };
}

function sqrtPriceToPrice(sqrtPriceX96: string): number {
  const sqrtPrice = BigInt(sqrtPriceX96);
  const Q96 = BigInt(2) ** BigInt(96);
  // price = (sqrtPrice / Q96)^2
  const priceNum = Number(sqrtPrice) / Number(Q96);
  return priceNum * priceNum;
}

function main() {
  const pools: Pool[] = JSON.parse(readFileSync(INPUT, 'utf-8'));
  console.log(`Processing ${pools.length} pools...`);

  // Collect unique tokens
  const uniqueTokens = new Map<string, { symbol: string; name: string; count: number }>();
  for (const pool of pools) {
    for (const addr of [pool.currency0, pool.currency1]) {
      const lower = addr.toLowerCase();
      const info = getTokenInfo(lower);
      if (!uniqueTokens.has(lower)) {
        uniqueTokens.set(lower, { ...info, count: 0 });
      }
      uniqueTokens.get(lower)!.count++;
    }
  }

  // Group pools by token pair
  const pairMap = new Map<string, Pool[]>();
  for (const pool of pools) {
    const t0 = getTokenInfo(pool.currency0).symbol;
    const t1 = getTokenInfo(pool.currency1).symbol;
    const key = `${t0}/${t1}`;
    if (!pairMap.has(key)) pairMap.set(key, []);
    pairMap.get(key)!.push(pool);
  }

  // Sort by pool count
  const sortedPairs = [...pairMap.entries()].sort((a, b) => b[1].length - a[1].length);

  // Generate markdown
  let md = `# Uniswap v4 Pools on Sepolia Testnet

> Auto-generated from on-chain data. Last updated: ${new Date().toISOString().split('T')[0]}

## Overview

- **Total Pools:** ${pools.length}
- **Unique Tokens:** ${uniqueTokens.size}
- **PoolManager:** \`0xE03A1074c86CFeDd5C142C4F04F1a1536e203543\`
- **Quoter:** \`0x61b3f2011a92d183c7dbadbda940a7555ccf9227\`

---

## Token Directory

| Symbol | Name | Address | Pool Count |
|--------|------|---------|------------|
`;

  // Sort tokens by pool count
  const sortedTokens = [...uniqueTokens.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [addr, info] of sortedTokens) {
    md += `| ${info.symbol} | ${info.name} | \`${addr}\` | ${info.count} |\n`;
  }

  md += `
---

## All Pools by Token Pair

`;

  for (const [pair, pairPools] of sortedPairs) {
    md += `### ${pair} (${pairPools.length} pool${pairPools.length > 1 ? 's' : ''})\n\n`;
    md += `| Fee | TickSpacing | Hook | sqrtPriceX96 | Approx Price | Block |\n`;
    md += `|-----|-------------|------|--------------|--------------|-------|\n`;

    for (const p of pairPools) {
      const feePercent = (p.fee / 10000).toFixed(2) + '%';
      const hookLabel = p.hooks === '0x0000000000000000000000000000000000000000'
        ? 'None'
        : `\`${p.hooks.slice(0, 10)}...\``;

      const price = sqrtPriceToPrice(p.sqrtPriceX96);
      let priceStr: string;
      if (price > 1e15) priceStr = 'MAX (broken)';
      else if (price < 1e-15 && price > 0) priceStr = '~0';
      else if (price === 0) priceStr = '0';
      else priceStr = price.toExponential(2);

      md += `| ${feePercent} | ${p.tickSpacing} | ${hookLabel} | \`${p.sqrtPriceX96.slice(0, 15)}...\` | ${priceStr} | ${p.blockNumber} |\n`;
    }
    md += '\n';
  }

  md += `---

## Pool Details (Raw)

<details>
<summary>Click to expand full pool data</summary>

\`\`\`json
${JSON.stringify(pools, null, 2)}
\`\`\`

</details>

---

## Faucets for Testnet Tokens

| Token | Faucet |
|-------|--------|
| Sepolia ETH | [Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia), [Alchemy](https://sepoliafaucet.com/) |
| USDC/DAI/WETH (Aave) | [Aave Faucet](https://staging.aave.com/faucet/) |
| USDC (Circle) | [Circle Faucet](https://faucet.circle.com/) |
| LINK | [Chainlink Faucet](https://faucets.chain.link/sepolia) |

---

## Notes

- Pools with "MAX (broken)" price have drifted to extreme values
- Price shown is approximate token1/token0 ratio
- Many testnet pools have low liquidity
- Custom hooks are shown with abbreviated addresses
`;

  writeFileSync(OUTPUT, md);
  console.log(`Written to ${OUTPUT}`);
  console.log(`Total pools: ${pools.length}`);
  console.log(`Unique pairs: ${pairMap.size}`);
}

main();
