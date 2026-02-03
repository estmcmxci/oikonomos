import { describe, it, expect } from 'vitest';
import {
  calculateFee,
  getPaymentAddress,
  DEFAULT_FEE_BPS,
  NETWORK,
  PAYMENT_TOKEN,
} from './config';

describe('x402 config', () => {
  describe('constants', () => {
    it('should have valid network in CAIP-2 format', () => {
      expect(NETWORK).toMatch(/^eip155:\d+$/);
      expect(NETWORK).toBe('eip155:11155111'); // Sepolia
    });

    it('should have valid USDC payment token address', () => {
      expect(PAYMENT_TOKEN).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have default fee of 10 bps (0.1%)', () => {
      expect(DEFAULT_FEE_BPS).toBe(10);
    });
  });

  describe('calculateFee', () => {
    it('should calculate 0.1% fee correctly', () => {
      // 1000 USDC (6 decimals) = 1,000,000,000
      const amountIn = BigInt(1_000_000_000);
      const fee = calculateFee(amountIn);

      // 0.1% of 1000 USDC = 1 USDC = 1,000,000
      expect(fee).toBe(BigInt(1_000_000));
    });

    it('should calculate custom fee rate', () => {
      const amountIn = BigInt(1_000_000_000); // 1000 USDC
      const fee = calculateFee(amountIn, 50); // 0.5%

      // 0.5% of 1000 USDC = 5 USDC = 5,000,000
      expect(fee).toBe(BigInt(5_000_000));
    });

    it('should handle small amounts', () => {
      const amountIn = BigInt(100_000); // 0.1 USDC
      const fee = calculateFee(amountIn);

      // 0.1% of 0.1 USDC = 0.0001 USDC = 100 units (rounded down)
      expect(fee).toBe(BigInt(100));
    });

    it('should return 0 for very small amounts', () => {
      const amountIn = BigInt(99); // Less than 100 units
      const fee = calculateFee(amountIn);

      // 0.1% of 99 = 0 (integer division)
      expect(fee).toBe(BigInt(0));
    });
  });

  describe('getPaymentAddress', () => {
    it('should return AGENT_WALLET if configured', () => {
      const env = { AGENT_WALLET: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' };
      const address = getPaymentAddress(env);

      expect(address).toBe('0xABCDEF1234567890ABCDEF1234567890ABCDEF12');
    });

    it('should return zero address if not configured', () => {
      const env = {};
      const address = getPaymentAddress(env);

      expect(address).toBe('0x0000000000000000000000000000000000000000');
    });
  });
});
