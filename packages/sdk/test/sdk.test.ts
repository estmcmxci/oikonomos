import { describe, it, expect } from 'vitest';
import { keccak256, toBytes } from 'viem';
import {
  buildIntent,
  buildIntentWithStrategyId,
  isIntentExpired,
  ensNameToStrategyId,
  INTENT_TYPES,
  getIntentDomain,
  generateERC8004Record,
  parseERC8004Record,
  buildAgentRegistrationJSON,
  parseAgentRegistrationJSON,
  buildTreasuryAgentRegistration,
  ERC8004_ADDRESSES,
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

describe('ERC-8004 Record Utilities', () => {
  it('should generate ERC-8004 record for Sepolia', () => {
    const record = generateERC8004Record(11155111, 42n);
    expect(record).toBe(`eip155:11155111:${ERC8004_ADDRESSES.SEPOLIA.IDENTITY}:42`);
  });

  it('should generate ERC-8004 record for Mainnet', () => {
    const record = generateERC8004Record(1, 100n);
    expect(record).toBe(`eip155:1:${ERC8004_ADDRESSES.MAINNET.IDENTITY}:100`);
  });

  it('should parse valid ERC-8004 record', () => {
    const record = `eip155:11155111:${ERC8004_ADDRESSES.SEPOLIA.IDENTITY}:42`;
    const parsed = parseERC8004Record(record);

    expect(parsed).not.toBeNull();
    expect(parsed?.chainId).toBe(11155111);
    expect(parsed?.registryAddress).toBe(ERC8004_ADDRESSES.SEPOLIA.IDENTITY);
    expect(parsed?.agentId).toBe(42n);
  });

  it('should return null for invalid ERC-8004 record', () => {
    expect(parseERC8004Record('invalid')).toBeNull();
    expect(parseERC8004Record('eip155:11155111')).toBeNull();
    expect(parseERC8004Record('eip155:notanumber:0x1234:42')).toBeNull();
    expect(parseERC8004Record('eip155:11155111:invalid:42')).toBeNull();
  });

  it('should roundtrip generate and parse', () => {
    const original = generateERC8004Record(11155111, 639n);
    const parsed = parseERC8004Record(original);

    expect(parsed?.chainId).toBe(11155111);
    expect(parsed?.agentId).toBe(639n);
  });
});

describe('Agent Registration', () => {
  it('should build valid registration JSON', () => {
    const uri = buildAgentRegistrationJSON({
      agentType: 'treasury',
      agentName: 'Test Treasury Agent',
      agentDescription: 'A test agent',
      a2aEndpoint: 'https://example.com/a2a',
      ensName: 'test.oikonomos.eth',
      webEndpoint: 'https://example.com',
    });

    expect(uri.startsWith('data:application/json;base64,')).toBe(true);

    const parsed = parseAgentRegistrationJSON(uri);
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('https://eips.ethereum.org/EIPS/eip-8004#registration-v1');
    expect(parsed?.name).toBe('Test Treasury Agent');
    expect(parsed?.active).toBe(true);
    expect(parsed?.services).toHaveLength(3);
    expect(parsed?.services[0].name).toBe('A2A');
    expect(parsed?.services[1].name).toBe('ENS');
    expect(parsed?.services[2].name).toBe('web');
  });

  it('should build treasury agent registration', () => {
    const uri = buildTreasuryAgentRegistration(
      'treasury.oikonomos.eth',
      'https://treasury.example.com'
    );

    const parsed = parseAgentRegistrationJSON(uri);
    expect(parsed?.name).toBe('Oikonomos Treasury Agent');
    expect(parsed?.services[0].endpoint).toBe('https://treasury.example.com/.well-known/agent-card.json');
    expect(parsed?.services[1].endpoint).toBe('treasury.oikonomos.eth');
  });

  it('should return null for invalid registration URI', () => {
    expect(parseAgentRegistrationJSON('invalid')).toBeNull();
    expect(parseAgentRegistrationJSON('data:text/plain;base64,invalid')).toBeNull();
  });
});
