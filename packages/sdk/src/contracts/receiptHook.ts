import { type Address, type PublicClient, decodeEventLog, type Log } from 'viem';
import { type ExecutionReceipt, ReceiptHookABI } from '@oikonomos/shared';

export { ReceiptHookABI };

export function decodeReceiptLog(log: Log): ExecutionReceipt {
  const decoded = decodeEventLog({
    abi: ReceiptHookABI,
    data: log.data,
    topics: log.topics,
  });

  return {
    strategyId: decoded.args.strategyId as `0x${string}`,
    quoteId: decoded.args.quoteId as `0x${string}`,
    sender: decoded.args.sender as `0x${string}`,
    amount0: decoded.args.amount0 as bigint,
    amount1: decoded.args.amount1 as bigint,
    actualSlippage: decoded.args.actualSlippage as bigint,
    policyCompliant: decoded.args.policyCompliant as boolean,
    timestamp: decoded.args.timestamp as bigint,
    blockNumber: log.blockNumber!,
    transactionHash: log.transactionHash!,
  };
}

export async function getReceipts(
  client: PublicClient,
  hookAddress: Address,
  fromBlock: bigint,
  toBlock?: bigint
): Promise<ExecutionReceipt[]> {
  const logs = await client.getLogs({
    address: hookAddress,
    event: ReceiptHookABI[0],
    fromBlock,
    toBlock: toBlock ?? 'latest',
  });

  return logs.map(decodeReceiptLog);
}

export async function getReceiptsByStrategy(
  client: PublicClient,
  hookAddress: Address,
  strategyId: `0x${string}`,
  fromBlock: bigint
): Promise<ExecutionReceipt[]> {
  const logs = await client.getLogs({
    address: hookAddress,
    event: ReceiptHookABI[0],
    args: { strategyId },
    fromBlock,
  });

  return logs.map(decodeReceiptLog);
}

export async function getReceiptsByUser(
  client: PublicClient,
  hookAddress: Address,
  sender: Address,
  fromBlock: bigint
): Promise<ExecutionReceipt[]> {
  const logs = await client.getLogs({
    address: hookAddress,
    event: ReceiptHookABI[0],
    args: { sender },
    fromBlock,
  });

  return logs.map(decodeReceiptLog);
}
