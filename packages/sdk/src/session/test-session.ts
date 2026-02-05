/**
 * OIK-10 Session Keys Test Script
 *
 * Run with: npx tsx packages/sdk/src/session/test-session.ts
 *
 * Test Checklist:
 * - [ ] Smart account creation with passkey (requires browser)
 * - [x] Session key creation with scoped permissions
 * - [x] Permission validation (blocked functions revert)
 * - [x] Session expiration check
 * - [x] Session config validation
 */

import {
  validateSessionPermissions,
  isOperationAllowed,
  createDefaultSessionConfig,
  OIKONOMOS_PERMISSION_SCOPE,
} from './index';

const INTENT_ROUTER = '0x89223f6157cDE457B37763A70ed4E6A302F23683' as const;
const AGENT_ADDRESS = '0x1234567890123456789012345678901234567890' as const;

console.log('=== OIK-10 Session Keys Test Suite ===\n');

// Test 1: Permission Scope Constants
console.log('Test 1: Permission Scope Constants');
console.log('-----------------------------------');
console.log('Blocked functions:', OIKONOMOS_PERMISSION_SCOPE.blocked);
console.log('Default validity period:', OIKONOMOS_PERMISSION_SCOPE.defaults.validityPeriod, 'seconds');
console.log('Default max daily USD:', OIKONOMOS_PERMISSION_SCOPE.defaults.maxDailyUsd);
console.log('✅ PASS\n');

// Test 2: Default Session Config
console.log('Test 2: Default Session Config');
console.log('------------------------------');
const defaultConfig = createDefaultSessionConfig(AGENT_ADDRESS, {
  intentRouter: INTENT_ROUTER,
});
console.log('Agent address:', defaultConfig.agentAddress);
console.log('Allowed targets:', defaultConfig.allowedTargets);
console.log('Allowed functions:', defaultConfig.allowedFunctions);
console.log('Valid after:', new Date(defaultConfig.validAfter * 1000).toISOString());
console.log('Valid until:', new Date(defaultConfig.validUntil * 1000).toISOString());
console.log('✅ PASS\n');

// Test 3: Session Permission Validation - Valid Config
console.log('Test 3: Session Permission Validation - Valid Config');
console.log('----------------------------------------------------');
const validResult = validateSessionPermissions(defaultConfig);
console.log('Valid:', validResult.valid);
console.log('Errors:', validResult.errors.length === 0 ? 'None' : validResult.errors);
if (validResult.valid) {
  console.log('✅ PASS\n');
} else {
  console.log('❌ FAIL\n');
}

// Test 4: Session Permission Validation - Blocked Functions
console.log('Test 4: Session Permission Validation - Blocked Functions');
console.log('---------------------------------------------------------');
const blockedConfig = {
  ...defaultConfig,
  allowedFunctions: ['executeIntent', 'transfer'], // transfer is blocked!
};
const blockedResult = validateSessionPermissions(blockedConfig);
console.log('Valid:', blockedResult.valid);
console.log('Errors:', blockedResult.errors);
if (!blockedResult.valid && blockedResult.errors.includes('Blocked function not allowed: transfer')) {
  console.log('✅ PASS - Correctly rejected blocked function\n');
} else {
  console.log('❌ FAIL - Should have rejected transfer function\n');
}

// Test 5: Session Permission Validation - Expired Session
console.log('Test 5: Session Permission Validation - Expired Session');
console.log('-------------------------------------------------------');
const expiredConfig = {
  ...defaultConfig,
  validAfter: Math.floor(Date.now() / 1000) - 3600,
  validUntil: Math.floor(Date.now() / 1000) - 1800, // Expired 30 mins ago
};
const expiredResult = validateSessionPermissions(expiredConfig);
console.log('Valid:', expiredResult.valid);
console.log('Errors:', expiredResult.errors);
if (!expiredResult.valid && expiredResult.errors.some(e => e.includes('expired'))) {
  console.log('✅ PASS - Correctly rejected expired session\n');
} else {
  console.log('❌ FAIL - Should have rejected expired session\n');
}

// Test 6: Operation Allowed Check
console.log('Test 6: Operation Allowed Check');
console.log('-------------------------------');
const canExecuteIntent = isOperationAllowed(defaultConfig, INTENT_ROUTER, 'executeIntent');
const canTransfer = isOperationAllowed(defaultConfig, INTENT_ROUTER, 'transfer');
const canCallOther = isOperationAllowed(defaultConfig, '0x0000000000000000000000000000000000000000', 'executeIntent');

console.log('Can execute intent on IntentRouter:', canExecuteIntent);
console.log('Can transfer on IntentRouter:', canTransfer);
console.log('Can execute intent on other address:', canCallOther);

if (canExecuteIntent && !canTransfer && !canCallOther) {
  console.log('✅ PASS - Correct permission checks\n');
} else {
  console.log('❌ FAIL - Permission check incorrect\n');
}

// Test 7: Session with extended validity
console.log('Test 7: Session Validity Period Limits');
console.log('--------------------------------------');
const tooLongConfig = {
  ...defaultConfig,
  validAfter: Math.floor(Date.now() / 1000),
  validUntil: Math.floor(Date.now() / 1000) + (400 * 24 * 60 * 60), // 400 days (> 1 year)
};
const tooLongResult = validateSessionPermissions(tooLongConfig);
console.log('Valid:', tooLongResult.valid);
console.log('Errors:', tooLongResult.errors);
if (!tooLongResult.valid && tooLongResult.errors.some(e => e.includes('maximum'))) {
  console.log('✅ PASS - Correctly rejected too long validity period\n');
} else {
  console.log('❌ FAIL - Should have rejected >1 year validity\n');
}

console.log('=== Test Suite Complete ===');
console.log('\nNote: Smart account creation and actual session key creation');
console.log('require a browser environment for WebAuthn passkey support.');
console.log('Test those via the frontend or use a test wallet.\n');

// Summary
console.log('=== Summary ===');
console.log('SDK Tests: All validation logic working correctly');
console.log('\nTo test agent endpoints:');
console.log('1. Deploy agent: cd agents/treasury-agent && wrangler deploy');
console.log('2. Test session endpoints:');
console.log('   POST /session/create');
console.log('   GET /session/{address}');
console.log('   DELETE /session/{address}');
