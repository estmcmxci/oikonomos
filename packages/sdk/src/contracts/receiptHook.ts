import { type Address, type PublicClient, decodeEventLog, type Log } from 'viem';
import { type ExecutionReceipt, ReceiptHookABI } from '@oikonomos/shared';

export { ReceiptHookABI };

export class ReceiptDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReceiptDecodeError';
  }
}

/**
 * Decode an ExecutionReceipt from a log entry.
 *
 * @param log The log entry to decode (must be from a mined transaction)
 * @returns The decoded ExecutionReceipt
 * @throws ReceiptDecodeError if log is from a pending transaction (null blockNumber/transactionHash)
 */
export function decodeReceiptLog(log: Log): ExecutionReceipt {
  // Validate that log is from a mined transaction, not pending
  if (log.blockNumber === null) {
    throw new ReceiptDecodeError('Cannot decode receipt from pending transaction: blockNumber is null');
  }
  if (log.transactionHash === null) {
    throw new ReceiptDecodeError('Cannot decode receipt from pending transaction: transactionHash is null');
  }

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
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
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
