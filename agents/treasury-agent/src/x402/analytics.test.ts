import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordFeeEarning, getFeeAnalytics, getRecentEarnings } from './analytics';
import type { FeeEarning } from './types';

// Mock KV namespace
const mockKV = {
  put: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
};

describe('x402 analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordFeeEarning', () => {
    it('should store earning and update totals', async () => {
      mockKV.get.mockResolvedValue(null); // No existing totals

      const earning: FeeEarning = {
        quoteId: 'quote123',
        userAddress: '0x1234567890123456789012345678901234567890',
        feeAmount: '1000000',
        paymentToken: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        txHash: '0xabc123',
        timestamp: Date.now(),
      };

      await recordFeeEarning(mockKV as unknown as KVNamespace, earning);

      // Should store the individual earning
      expect(mockKV.put).toHaveBeenCalledWith(
        'fee:quote123',
        JSON.stringify(earning),
        { expirationTtl: 86400 * 30 }
      );

      // Should update totals
      expect(mockKV.put).toHaveBeenCalledWith(
        'fee:totals',
        expect.stringContaining('"totalEarnings":"1000000"')
      );
    });

    it('should accumulate existing totals', async () => {
      mockKV.get.mockResolvedValue(
        JSON.stringify({
          totalEarnings: '5000000',
          totalExecutions: 5,
          lastUpdated: Date.now() - 1000,
        })
      );

      const earning: FeeEarning = {
        quoteId: 'quote456',
        userAddress: '0x1234567890123456789012345678901234567890',
        feeAmount: '2000000',
        paymentToken: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        txHash: '0xdef456',
        timestamp: Date.now(),
      };

      await recordFeeEarning(mockKV as unknown as KVNamespace, earning);

      // Should update totals with accumulated values
      const totalsCall = mockKV.put.mock.calls.find(
        (call) => call[0] === 'fee:totals'
      );
      const savedTotals = JSON.parse(totalsCall![1] as string);

      expect(savedTotals.totalEarnings).toBe('7000000'); // 5M + 2M
      expect(savedTotals.totalExecutions).toBe(6);
    });
  });

  describe('getFeeAnalytics', () => {
    it('should return null when no data', async () => {
      mockKV.get.mockResolvedValue(null);

      const result = await getFeeAnalytics(mockKV as unknown as KVNamespace);

      expect(result).toBeNull();
    });

    it('should return parsed totals', async () => {
      const totals = {
        totalEarnings: '10000000',
        totalExecutions: 10,
        lastUpdated: Date.now(),
      };
      mockKV.get.mockResolvedValue(JSON.stringify(totals));

      const result = await getFeeAnalytics(mockKV as unknown as KVNamespace);

      expect(result).toEqual(totals);
    });
  });

  describe('getRecentEarnings', () => {
    it('should return empty array when no earnings', async () => {
      mockKV.list.mockResolvedValue({ keys: [] });

      const result = await getRecentEarnings(mockKV as unknown as KVNamespace);

      expect(result).toEqual([]);
    });

    it('should return sorted earnings', async () => {
      const earning1: FeeEarning = {
        quoteId: 'quote1',
        userAddress: '0x1234567890123456789012345678901234567890',
        feeAmount: '1000000',
        paymentToken: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        txHash: '0x111',
        timestamp: 1000,
      };
      const earning2: FeeEarning = {
        quoteId: 'quote2',
        userAddress: '0x1234567890123456789012345678901234567890',
        feeAmount: '2000000',
        paymentToken: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        txHash: '0x222',
        timestamp: 2000,
      };

      mockKV.list.mockResolvedValue({
        keys: [{ name: 'fee:quote1' }, { name: 'fee:quote2' }],
      });
      mockKV.get.mockImplementation((key: string) => {
        if (key === 'fee:quote1') return Promise.resolve(JSON.stringify(earning1));
        if (key === 'fee:quote2') return Promise.resolve(JSON.stringify(earning2));
        return Promise.resolve(null);
      });

      const result = await getRecentEarnings(mockKV as unknown as KVNamespace);

      // Should be sorted by timestamp descending
      expect(result[0].quoteId).toBe('quote2');
      expect(result[1].quoteId).toBe('quote1');
    });

    it('should exclude totals key', async () => {
      mockKV.list.mockResolvedValue({
        keys: [{ name: 'fee:totals' }, { name: 'fee:quote1' }],
      });
      mockKV.get.mockResolvedValue(
        JSON.stringify({
          quoteId: 'quote1',
          userAddress: '0x1234567890123456789012345678901234567890',
          feeAmount: '1000000',
          paymentToken: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
          txHash: '0x111',
          timestamp: 1000,
        })
      );

      const result = await getRecentEarnings(mockKV as unknown as KVNamespace);

      expect(result).toHaveLength(1);
      expect(result[0].quoteId).toBe('quote1');
    });
  });
});
