import type { Address } from 'viem';

interface TokenPosition {
  token: Address;
  symbol: string;
  balance: bigint;
  currentPercentage: number;
  targetPercentage: number;
  decimals: number;
}

interface Trade {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  symbolIn: string;
  symbolOut: string;
}

export function calculateRebalanceTrades(
  positions: TokenPosition[],
  maxSlippageBps: number
): Trade[] {
  const trades: Trade[] = [];

  // Identify sells (over-allocated) and buys (under-allocated)
  const sells = positions.filter(p => p.currentPercentage > p.targetPercentage);
  const buys = positions.filter(p => p.currentPercentage < p.targetPercentage);

  // Calculate total portfolio value (in smallest unit of first token for simplicity)
  const totalBalance = positions.reduce((sum, p) => sum + p.balance, 0n);

  // Match sells to buys
  for (const sell of sells) {
    for (const buy of buys) {
      // Calculate excess to sell
      const targetBalance = (totalBalance * BigInt(Math.floor(sell.targetPercentage * 100))) / 10000n;
      const excessAmount = sell.balance - targetBalance;

      if (excessAmount <= 0n) continue;

      // Calculate deficit to buy
      const buyTargetBalance = (totalBalance * BigInt(Math.floor(buy.targetPercentage * 100))) / 10000n;
      const deficitAmount = buyTargetBalance - buy.balance;

      if (deficitAmount <= 0n) continue;

      // Trade the smaller of the two amounts
      const tradeAmount = excessAmount < deficitAmount ? excessAmount : deficitAmount;

      // Calculate minimum output with slippage
      const slippageFactor = 10000n - BigInt(maxSlippageBps);
      const minAmountOut = (tradeAmount * slippageFactor) / 10000n;

      trades.push({
        tokenIn: sell.token,
        tokenOut: buy.token,
        amountIn: tradeAmount,
        minAmountOut,
        symbolIn: sell.symbol,
        symbolOut: buy.symbol,
      });
    }
  }

  return trades;
}

export function optimizeTrades(trades: Trade[]): Trade[] {
  // Combine trades with same token pairs
  const combined = new Map<string, Trade>();

  for (const trade of trades) {
    const key = `${trade.tokenIn}-${trade.tokenOut}`;
    const existing = combined.get(key);

    if (existing) {
      existing.amountIn += trade.amountIn;
      existing.minAmountOut += trade.minAmountOut;
    } else {
      combined.set(key, { ...trade });
    }
  }

  return Array.from(combined.values());
}

export function validateTradeSize(
  trade: Trade,
  maxDailyUsd: number,
  tokenPriceUsd: number
): boolean {
  // Convert trade amount to USD (simplified)
  const tradeValueUsd = Number(trade.amountIn) * tokenPriceUsd;
  return tradeValueUsd <= maxDailyUsd;
}
