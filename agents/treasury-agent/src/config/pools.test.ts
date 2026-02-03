/**
 * Pool Configuration Tests
 * @see OIK-39: Pool Discovery and Registry for IntentRouter
 */

import { describe, it, expect } from 'vitest';
import {
  getPoolForPair,
  requirePoolForPair,
  listSupportedPairs,
  isPairSupported,
  TOKENS,
  SUPPORTED_POOLS,
} from './pools';

describe('Pool Configuration', () => {
  describe('getPoolForPair', () => {
    it('returns pool config for USDC/DAI pair', () => {
      const pool = getPoolForPair(TOKENS.USDC, TOKENS.DAI);

      expect(pool).not.toBeNull();
      expect(pool?.fee).toBe(3000);
      expect(pool?.tickSpacing).toBe(60);
      expect(pool?.hooks).toBe('0x41a75f07bA1958EcA78805D8419C87a393764040');
    });

    it('returns same pool regardless of token order', () => {
      const poolAB = getPoolForPair(TOKENS.USDC, TOKENS.DAI);
      const poolBA = getPoolForPair(TOKENS.DAI, TOKENS.USDC);

      expect(poolAB).toEqual(poolBA);
    });

    it('returns null for unsupported pair', () => {
      const fakeToken = '0x1111111111111111111111111111111111111111' as `0x${string}`;
      const pool = getPoolForPair(TOKENS.USDC, fakeToken);

      expect(pool).toBeNull();
    });

    it('handles case-insensitive addresses', () => {
      const upperUSDC = TOKENS.USDC.toUpperCase() as `0x${string}`;
      const lowerDAI = TOKENS.DAI.toLowerCase() as `0x${string}`;

      const pool = getPoolForPair(upperUSDC, lowerDAI);
      expect(pool).not.toBeNull();
    });
  });

  describe('requirePoolForPair', () => {
    it('returns pool config for supported pair', () => {
      const pool = requirePoolForPair(TOKENS.USDC, TOKENS.DAI);

      expect(pool.currency0).toBe(TOKENS.USDC);
      expect(pool.currency1).toBe(TOKENS.DAI);
    });

    it('throws for unsupported pair', () => {
      const fakeToken = '0x1111111111111111111111111111111111111111' as `0x${string}`;

      expect(() => requirePoolForPair(TOKENS.USDC, fakeToken)).toThrow(
        /No pool configured for pair/
      );
    });

    it('error message includes available pairs', () => {
      const fakeToken = '0x1111111111111111111111111111111111111111' as `0x${string}`;

      expect(() => requirePoolForPair(TOKENS.USDC, fakeToken)).toThrow(
        /Available pairs:/
      );
    });
  });

  describe('isPairSupported', () => {
    it('returns true for USDC/DAI', () => {
      expect(isPairSupported(TOKENS.USDC, TOKENS.DAI)).toBe(true);
    });

    it('returns false for unsupported pair', () => {
      const fakeToken = '0x1111111111111111111111111111111111111111' as `0x${string}`;
      expect(isPairSupported(TOKENS.USDC, fakeToken)).toBe(false);
    });
  });

  describe('listSupportedPairs', () => {
    it('returns array of supported pairs', () => {
      const pairs = listSupportedPairs();

      expect(Array.isArray(pairs)).toBe(true);
      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs[0]).toMatch(/USDC\/DAI/);
    });
  });

  describe('SUPPORTED_POOLS', () => {
    it('all pools have ReceiptHook attached', () => {
      const receiptHook = '0x41a75f07bA1958EcA78805D8419C87a393764040'.toLowerCase();

      for (const [key, pool] of Object.entries(SUPPORTED_POOLS)) {
        expect(pool.hooks.toLowerCase()).toBe(receiptHook);
      }
    });

    it('all pools have currency0 < currency1 (Uniswap v4 requirement)', () => {
      for (const [key, pool] of Object.entries(SUPPORTED_POOLS)) {
        expect(pool.currency0.toLowerCase() < pool.currency1.toLowerCase()).toBe(true);
      }
    });
  });
});
