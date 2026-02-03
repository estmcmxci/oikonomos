import { describe, it, expect } from 'vitest';
import {
  buildPaymentRequirement,
  create402Response,
  extractPaymentPayload,
} from './middleware';
import { NETWORK, PAYMENT_TIMEOUT_SECONDS } from './config';
import type { Address } from 'viem';

describe('x402 middleware', () => {
  const testPayTo: Address = '0x1234567890123456789012345678901234567890';

  describe('buildPaymentRequirement', () => {
    it('should build valid payment requirement', () => {
      const requirement = buildPaymentRequirement(
        '1000000', // 1 USDC
        testPayTo,
        '/execute?quoteId=test123',
        'Test execution fee'
      );

      expect(requirement.scheme).toBe('exact');
      expect(requirement.network).toBe(NETWORK);
      expect(requirement.maxAmountRequired).toBe('1000000');
      expect(requirement.payTo).toBe(testPayTo);
      expect(requirement.resource).toBe('/execute?quoteId=test123');
      expect(requirement.description).toBe('Test execution fee');
      expect(requirement.asset).toBe('USDC');
      expect(requirement.maxTimeoutSeconds).toBe(PAYMENT_TIMEOUT_SECONDS);
    });
  });

  describe('create402Response', () => {
    it('should return 402 status with payment requirements', () => {
      const requirement = buildPaymentRequirement(
        '1000000',
        testPayTo,
        '/execute',
        'Fee'
      );

      const response = create402Response(requirement, { 'X-Test': 'value' });

      expect(response.status).toBe(402);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Payment-Requirements')).toBeTruthy();
    });

    it('should include payment requirements in body', async () => {
      const requirement = buildPaymentRequirement(
        '1000000',
        testPayTo,
        '/execute',
        'Fee'
      );

      const response = create402Response(requirement, {});
      const body = (await response.json()) as {
        error: string;
        paymentRequirements: typeof requirement;
      };

      expect(body.error).toBe('Payment Required');
      expect(body.paymentRequirements).toEqual(requirement);
    });
  });

  describe('extractPaymentPayload', () => {
    it('should return null when no payment header', () => {
      const request = new Request('http://test.com', {
        method: 'POST',
      });

      const result = extractPaymentPayload(request);
      expect(result).toBeNull();
    });

    it('should extract payload from PAYMENT-SIGNATURE header', () => {
      const payload = {
        x402Version: 1,
        scheme: 'exact',
        network: NETWORK,
        payload: {
          signature: '0xabc123',
          authorization: {
            from: testPayTo,
            to: testPayTo,
            value: '1000000',
            validAfter: '0',
            validBefore: '9999999999',
            nonce: '1',
          },
        },
      };

      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'PAYMENT-SIGNATURE': JSON.stringify(payload),
        },
      });

      const result = extractPaymentPayload(request);
      expect(result).toEqual(payload);
    });

    it('should extract payload from legacy X-PAYMENT header', () => {
      const payload = {
        x402Version: 1,
        scheme: 'exact',
        network: NETWORK,
        payload: {
          signature: '0xdef456',
          authorization: {
            from: testPayTo,
            to: testPayTo,
            value: '500000',
            validAfter: '0',
            validBefore: '9999999999',
            nonce: '2',
          },
        },
      };

      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'X-PAYMENT': JSON.stringify(payload),
        },
      });

      const result = extractPaymentPayload(request);
      expect(result).toEqual(payload);
    });

    it('should return null for invalid JSON', () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'PAYMENT-SIGNATURE': 'not-valid-json',
        },
      });

      const result = extractPaymentPayload(request);
      expect(result).toBeNull();
    });
  });
});
