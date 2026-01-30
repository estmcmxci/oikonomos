import { describe, it, expect } from 'vitest';
import { keccak256, toBytes } from 'viem';
import {
  buildIntent,
  buildIntentWithStrategyId,
  isIntentExpired,
  ensNameToStrategyId,
  INTENT_TYPES,
  getIntentDomain,
} from '../src';

describe('Intent Builder', () => {
  const testAddress = '0x1234567890123456789012345678901234567890' as const;
  const tokenIn = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const; // USDC
  const tokenOut = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as const; // WETH

  it('should build intent with ENS strategy name', () => {
    const intent = buildIntent({
      user: testAddress,
      tokenIn,
      tokenOut,
      amountIn: 1000000n, // 1 USDC
      maxSlippageBps: 50, // 0.5%
      ttlSeconds: 300, // 5 minutes
      strategyEns: 'strategy.router.oikonomos.eth',
      nonce: 0n,
    });

    expect(intent.user).toBe(testAddress);
    expect(intent.tokenIn).toBe(tokenIn);
    expect(intent.tokenOut).toBe(tokenOut);
    expect(intent.amountIn).toBe(1000000n);
    expect(intent.maxSlippage).toBe(50n);
    expect(intent.strategyId).toBe(keccak256(toBytes('strategy.router.oikonomos.eth')));
    expect(intent.nonce).toBe(0n);
    expect(intent.deadline).toBeGreaterThan(BigInt(Math.floor(Date.now() / 1000)));
  });

  it('should build intent with direct strategyId', () => {
    const strategyId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const;

    const intent = buildIntentWithStrategyId({
      user: testAddress,
      tokenIn,
      tokenOut,
      amountIn: 1000000n,
      maxSlippageBps: 100,
      ttlSeconds: 600,
      strategyId,
      nonce: 5n,
    });

    expect(intent.strategyId).toBe(strategyId);
    expect(intent.nonce).toBe(5n);
  });

  it('should correctly identify expired intents', () => {
    const futureIntent = buildIntent({
      user: testAddress,
      tokenIn,
      tokenOut,
      amountIn: 1000000n,
      maxSlippageBps: 50,
      ttlSeconds: 300,
      strategyEns: 'test.eth',
      nonce: 0n,
    });

    expect(isIntentExpired(futureIntent)).toBe(false);

    // Create an expired intent
    const expiredIntent = {
      ...futureIntent,
      deadline: BigInt(Math.floor(Date.now() / 1000) - 100), // 100 seconds ago
    };

    expect(isIntentExpired(expiredIntent)).toBe(true);
  });
});

describe('ENS Utilities', () => {
  it('should convert ENS name to strategyId', () => {
    const ensName = 'strategy.router.oikonomos.eth';
    const strategyId = ensNameToStrategyId(ensName);

    expect(strategyId).toBe(keccak256(toBytes(ensName)));
    expect(strategyId.startsWith('0x')).toBe(true);
    expect(strategyId.length).toBe(66); // 0x + 64 hex chars
  });
});

describe('EIP-712 Types', () => {
  it('should have correct Intent type definition', () => {
    expect(INTENT_TYPES.Intent).toHaveLength(8);
    expect(INTENT_TYPES.Intent.map(t => t.name)).toEqual([
      'user',
      'tokenIn',
      'tokenOut',
      'amountIn',
      'maxSlippage',
      'deadline',
      'strategyId',
      'nonce',
    ]);
  });

  it('should generate correct domain', () => {
    const routerAddress = '0x1234567890123456789012345678901234567890' as const;
    const chainId = 11155111;

    const domain = getIntentDomain(routerAddress, chainId);

    expect(domain.name).toBe('OikonomosIntentRouter');
    expect(domain.version).toBe('1');
    expect(domain.chainId).toBe(chainId);
    expect(domain.verifyingContract).toBe(routerAddress);
  });
});
