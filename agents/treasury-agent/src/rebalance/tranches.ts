import type { Address } from 'viem';

interface Trade {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  decimals: number;
}

interface Tranche {
  trades: Trade[];
  totalValueUsd: number;
  executionDelay: number; // Delay in seconds before executing
}

export function splitIntoTranches(
  trades: Trade[],
  maxTrancheValueUsd: number,
  tokenPriceUsd: number,
  intervalSeconds: number = 3600 // 1 hour default
): Tranche[] {
  const tranches: Tranche[] = [];
  let currentTranche: Trade[] = [];
  let currentTrancheValue = 0;

  for (const trade of trades) {
    // Use token decimals for accurate USD calculation
    const tradeValueUsd = Number(trade.amountIn) * tokenPriceUsd / (10 ** trade.decimals);

    if (currentTrancheValue + tradeValueUsd > maxTrancheValueUsd && currentTranche.length > 0) {
      // Save current tranche and start a new one
      tranches.push({
        trades: currentTranche,
        totalValueUsd: currentTrancheValue,
        executionDelay: tranches.length * intervalSeconds,
      });
      currentTranche = [];
      currentTrancheValue = 0;
    }

    // Split large trades if necessary
    if (tradeValueUsd > maxTrancheValueUsd) {
      const numSplits = Math.ceil(tradeValueUsd / maxTrancheValueUsd);
      const splitAmount = trade.amountIn / BigInt(numSplits);
      const splitMinOut = trade.minAmountOut / BigInt(numSplits);

      for (let i = 0; i < numSplits; i++) {
        tranches.push({
          trades: [{
            ...trade,
            amountIn: splitAmount,
            minAmountOut: splitMinOut,
          }],
          totalValueUsd: tradeValueUsd / numSplits,
          executionDelay: tranches.length * intervalSeconds,
        });
      }
    } else {
      currentTranche.push(trade);
      currentTrancheValue += tradeValueUsd;
    }
  }

  // Don't forget the last tranche
  if (currentTranche.length > 0) {
    tranches.push({
      trades: currentTranche,
      totalValueUsd: currentTrancheValue,
      executionDelay: tranches.length * intervalSeconds,
    });
  }

  return tranches;
}

export function getTrancheSchedule(
  tranches: Tranche[],
  startTime: number = Date.now()
): { tranche: Tranche; executionTime: Date }[] {
  return tranches.map((tranche) => ({
    tranche,
    executionTime: new Date(startTime + tranche.executionDelay * 1000),
  }));
}
