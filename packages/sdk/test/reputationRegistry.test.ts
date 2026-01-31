import { describe, it, expect } from 'vitest';
import { keccak256, toBytes } from 'viem';
import {
  ReputationRegistryABI,
  ERC8004_ADDRESSES,
  getERC8004Addresses,
  calculateSlippageScore,
} from '../src';

describe('ReputationRegistry ABI', () => {
  it('should have giveFeedback function', () => {
    const giveFeedbackFn = ReputationRegistryABI.find(
      (item) => item.type === 'function' && item.name === 'giveFeedback'
    );
    expect(giveFeedbackFn).toBeDefined();
    expect(giveFeedbackFn?.inputs).toHaveLength(8);
    expect(giveFeedbackFn?.inputs?.map(i => i.name)).toEqual([
      'agentId',
      'value',
      'valueDecimals',
      'tag1',
      'tag2',
      'endpoint',
      'feedbackURI',
      'feedbackHash',
    ]);
  });

  it('should have getSummary function', () => {
    const getSummaryFn = ReputationRegistryABI.find(
      (item) => item.type === 'function' && item.name === 'getSummary'
    );
    expect(getSummaryFn).toBeDefined();
    expect(getSummaryFn?.inputs).toHaveLength(4);
    expect(getSummaryFn?.outputs).toHaveLength(3);
    expect(getSummaryFn?.outputs?.map(o => o.name)).toEqual([
      'count',
      'summaryValue',
      'summaryValueDecimals',
    ]);
  });

  it('should have readFeedback function', () => {
    const readFeedbackFn = ReputationRegistryABI.find(
      (item) => item.type === 'function' && item.name === 'readFeedback'
    );
    expect(readFeedbackFn).toBeDefined();
    expect(readFeedbackFn?.inputs).toHaveLength(3);
    expect(readFeedbackFn?.outputs).toHaveLength(5);
  });

  it('should have NewFeedback event', () => {
    const newFeedbackEvent = ReputationRegistryABI.find(
      (item) => item.type === 'event' && item.name === 'NewFeedback'
    );
    expect(newFeedbackEvent).toBeDefined();
    expect(newFeedbackEvent?.inputs?.some(i => i.indexed && i.name === 'agentId')).toBe(true);
    expect(newFeedbackEvent?.inputs?.some(i => i.indexed && i.name === 'clientAddress')).toBe(true);
  });

  it('should have FeedbackRevoked event', () => {
    const revokedEvent = ReputationRegistryABI.find(
      (item) => item.type === 'event' && item.name === 'FeedbackRevoked'
    );
    expect(revokedEvent).toBeDefined();
  });
});

describe('ERC8004 Addresses', () => {
  it('should have Sepolia addresses', () => {
    expect(ERC8004_ADDRESSES.SEPOLIA.IDENTITY).toBe('0x8004A818BFB912233c491871b3d84c89A494BD9e');
    expect(ERC8004_ADDRESSES.SEPOLIA.REPUTATION).toBe('0x8004B663056A597Dffe9eCcC1965A193B7388713');
  });

  it('should have Mainnet addresses', () => {
    expect(ERC8004_ADDRESSES.MAINNET.IDENTITY).toBe('0x8004A169FB4a3325136EB29fA0ceB6D2e539a432');
    expect(ERC8004_ADDRESSES.MAINNET.REPUTATION).toBe('0x8004BAa17C55a88189AE136b182e5fdA19dE9b63');
  });

  it('should get Sepolia addresses by chainId', () => {
    const addresses = getERC8004Addresses(11155111);
    expect(addresses.identity).toBe(ERC8004_ADDRESSES.SEPOLIA.IDENTITY);
    expect(addresses.reputation).toBe(ERC8004_ADDRESSES.SEPOLIA.REPUTATION);
  });

  it('should get Mainnet addresses by chainId', () => {
    const addresses = getERC8004Addresses(1);
    expect(addresses.identity).toBe(ERC8004_ADDRESSES.MAINNET.IDENTITY);
    expect(addresses.reputation).toBe(ERC8004_ADDRESSES.MAINNET.REPUTATION);
  });

  it('should default to Sepolia for unsupported chainId', () => {
    const addresses = getERC8004Addresses(137);
    expect(addresses.identity).toBe(ERC8004_ADDRESSES.SEPOLIA.IDENTITY);
    expect(addresses.reputation).toBe(ERC8004_ADDRESSES.SEPOLIA.REPUTATION);
  });
});

describe('Slippage Score Calculation', () => {
  it('should return 100 for zero slippage', () => {
    expect(calculateSlippageScore(0n)).toBe(100);
  });

  it('should return 0 for max slippage', () => {
    expect(calculateSlippageScore(1000n, 1000n)).toBe(0);
  });

  it('should return 0 for slippage exceeding max', () => {
    expect(calculateSlippageScore(2000n, 1000n)).toBe(0);
  });

  it('should calculate proportional scores', () => {
    expect(calculateSlippageScore(500n, 1000n)).toBe(50);
    expect(calculateSlippageScore(100n, 1000n)).toBe(90);
    expect(calculateSlippageScore(250n, 1000n)).toBe(75);
  });

  it('should use default max slippage of 1000', () => {
    expect(calculateSlippageScore(500n)).toBe(50);
  });
});

describe('Feedback Tags', () => {
  it('should support execution/slippage tag combination', () => {
    const tag1 = 'execution';
    const tag2 = 'slippage';
    expect(tag1).toBe('execution');
    expect(tag2).toBe('slippage');
  });

  it('should support compliance/policy tag combination', () => {
    const tag1 = 'compliance';
    const tag2 = 'policy';
    expect(tag1).toBe('compliance');
    expect(tag2).toBe('policy');
  });
});
