/**
 * Unit tests for authorization validator
 * OIK-42: Authorization validation during rebalance execution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateAuthorization, hasValidAuthorization } from './validator';
import type { UserAuthorization } from '../observation/loop';

// Mock KV namespace
const createMockKV = (data: Record<string, string> = {}) => ({
  get: vi.fn((key: string) => Promise.resolve(data[key] || null)),
  put: vi.fn(() => Promise.resolve()),
  delete: vi.fn(() => Promise.resolve()),
});

// Mock authorization factory
const createMockAuth = (overrides: Partial<UserAuthorization> = {}): UserAuthorization => ({
  signature: '0x123',
  expiry: Date.now() + 86400000, // 24 hours from now
  maxDailyUsd: 10000,
  allowedTokens: [],
  createdAt: Date.now(),
  ...overrides,
});

const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as const;
const DAI = '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' as const;
const WETH = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9' as const;
const USER = '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21' as const;

describe('validateAuthorization', () => {
  describe('authorization exists check', () => {
    it('should reject when no authorization exists', async () => {
      const kv = createMockKV({});

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('No authorization found');
    });

    it('should pass when authorization exists', async () => {
      const auth = createMockAuth();
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100);

      expect(result.valid).toBe(true);
    });
  });

  describe('expiry check', () => {
    it('should reject expired authorization', async () => {
      const auth = createMockAuth({
        expiry: Date.now() - 1000, // Expired 1 second ago
      });
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should pass valid (not expired) authorization', async () => {
      const auth = createMockAuth({
        expiry: Date.now() + 3600000, // Expires in 1 hour
      });
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100);

      expect(result.valid).toBe(true);
    });
  });

  describe('daily limit check', () => {
    it('should reject when daily limit exceeded', async () => {
      const auth = createMockAuth({ maxDailyUsd: 1000 });
      const dateKey = new Date().toISOString().split('T')[0];
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
        [`spending:${USER.toLowerCase()}:${dateKey}`]: '950', // Already spent $950
      });

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100); // Trying to spend $100 more

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Daily limit exceeded');
    });

    it('should pass when within daily limit', async () => {
      const auth = createMockAuth({ maxDailyUsd: 1000 });
      const dateKey = new Date().toISOString().split('T')[0];
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
        [`spending:${USER.toLowerCase()}:${dateKey}`]: '500', // Already spent $500
      });

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100); // Trying to spend $100 more

      expect(result.valid).toBe(true);
    });

    it('should pass when no previous spending', async () => {
      const auth = createMockAuth({ maxDailyUsd: 1000 });
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100);

      expect(result.valid).toBe(true);
    });
  });

  describe('allowed tokens check', () => {
    it('should reject tokenIn not in allowed list', async () => {
      const auth = createMockAuth({
        allowedTokens: [USDC, DAI], // WETH not allowed
      });
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, WETH, DAI, 100);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not in the allowed tokens list');
      expect(result.error).toContain(WETH);
    });

    it('should reject tokenOut not in allowed list', async () => {
      const auth = createMockAuth({
        allowedTokens: [USDC, DAI], // WETH not allowed
      });
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, USDC, WETH, 100);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not in the allowed tokens list');
      expect(result.error).toContain(WETH);
    });

    it('should pass when both tokens in allowed list', async () => {
      const auth = createMockAuth({
        allowedTokens: [USDC, DAI],
      });
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100);

      expect(result.valid).toBe(true);
    });

    it('should pass when allowedTokens is empty (all tokens allowed)', async () => {
      const auth = createMockAuth({
        allowedTokens: [], // Empty = all tokens allowed
      });
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, WETH, DAI, 100);

      expect(result.valid).toBe(true);
    });

    it('should handle case-insensitive token matching', async () => {
      const auth = createMockAuth({
        allowedTokens: [USDC.toLowerCase() as any, DAI.toUpperCase() as any],
      });
      const kv = createMockKV({
        [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
      });

      const result = await validateAuthorization(kv as any, USER, USDC, DAI, 100);

      expect(result.valid).toBe(true);
    });
  });
});

describe('hasValidAuthorization', () => {
  it('should return false when no authorization exists', async () => {
    const kv = createMockKV({});

    const result = await hasValidAuthorization(kv as any, USER);

    expect(result).toBe(false);
  });

  it('should return false when authorization is expired', async () => {
    const auth = createMockAuth({
      expiry: Date.now() - 1000,
    });
    const kv = createMockKV({
      [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
    });

    const result = await hasValidAuthorization(kv as any, USER);

    expect(result).toBe(false);
  });

  it('should return true when authorization exists and is valid', async () => {
    const auth = createMockAuth();
    const kv = createMockKV({
      [`auth:${USER.toLowerCase()}`]: JSON.stringify(auth),
    });

    const result = await hasValidAuthorization(kv as any, USER);

    expect(result).toBe(true);
  });
});
