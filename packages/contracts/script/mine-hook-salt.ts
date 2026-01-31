#!/usr/bin/env npx tsx
/**
 * OIK-11: HookMiner - Mine CREATE2 salt for ReceiptHook
 *
 * Finds a salt that produces a hook address where:
 *   (address & 0x3FFF) == AFTER_SWAP_FLAG (0x0040)
 *
 * Usage:
 *   npx tsx packages/contracts/script/mine-hook-salt.ts
 *
 * Requirements:
 *   - npm install ethers (v6)
 */

import { keccak256, concat, AbiCoder } from "ethers";

// ============ Configuration ============

// Deterministic CREATE2 deployer (same on all EVM chains)
const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

// Sepolia Uniswap v4 PoolManager
const POOL_MANAGER = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543";

// AFTER_SWAP_FLAG = 1 << 6 = 0x0040 = 64
const AFTER_SWAP_FLAG = 0x0040n;

// Mask for lower 14 bits (hook permissions)
const FLAG_MASK = 0x3FFFn;

// Maximum iterations
const MAX_ITERATIONS = 10_000_000;

// ============ ReceiptHook Creation Code ============

// This is the bytecode for ReceiptHook contract
// We need to get this from the compiled output
// For now, we'll compute it using forge

async function getCreationCode(): Promise<string> {
  // Run forge to get the creation code
  const { execSync } = await import("child_process");

  try {
    // First, compile the contract
    execSync("forge build", {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    // Get the artifact
    const fs = await import("fs");
    const path = await import("path");

    const artifactPath = path.join(
      process.cwd(),
      "out/ReceiptHook.sol/ReceiptHook.json"
    );

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    return artifact.bytecode.object;
  } catch (error) {
    console.error("Failed to get creation code. Make sure forge is installed and contracts compile.");
    throw error;
  }
}

// ============ CREATE2 Address Computation ============

function computeCreate2Address(
  deployer: string,
  salt: bigint,
  initCodeHash: string
): string {
  // CREATE2 address = keccak256(0xff ++ deployer ++ salt ++ keccak256(initCode))[12:]
  // Convert bigint to hex string, pad to 32 bytes
  const saltHex = "0x" + salt.toString(16).padStart(64, "0");

  const data = concat([
    "0xff",
    deployer,
    saltHex,
    initCodeHash,
  ]);

  const hash = keccak256(data);
  // Take last 20 bytes (40 hex chars) as the address
  return "0x" + hash.slice(-40);
}

// ============ Mining Logic ============

async function mineSalt(): Promise<{ address: string; salt: bigint }> {
  console.log("🔨 OIK-11: HookMiner for ReceiptHook");
  console.log("=====================================");
  console.log(`Target flags: 0x${AFTER_SWAP_FLAG.toString(16).padStart(4, "0")} (AFTER_SWAP_FLAG)`);
  console.log(`Deployer: ${CREATE2_DEPLOYER}`);
  console.log(`PoolManager: ${POOL_MANAGER}`);
  console.log("");

  // Get creation code
  console.log("📦 Compiling ReceiptHook and getting creation code...");
  const creationCode = await getCreationCode();
  console.log(`Creation code length: ${(creationCode.length - 2) / 2} bytes`);

  // Encode constructor args (IPoolManager _poolManager)
  const abiCoder = new AbiCoder();
  const constructorArgs = abiCoder.encode(["address"], [POOL_MANAGER]);
  console.log(`Constructor args: ${constructorArgs}`);

  // Full init code = creation code + constructor args
  const initCode = concat([creationCode, constructorArgs]);
  const initCodeHash = keccak256(initCode);
  console.log(`Init code hash: ${initCodeHash}`);
  console.log("");

  // Mine for a valid salt
  console.log("⛏️  Mining for valid salt...");
  console.log(`Max iterations: ${MAX_ITERATIONS.toLocaleString()}`);
  console.log("");

  const startTime = Date.now();
  let lastLog = startTime;

  for (let salt = 0n; salt < BigInt(MAX_ITERATIONS); salt++) {
    const address = computeCreate2Address(CREATE2_DEPLOYER, salt, initCodeHash);
    const addressBigInt = BigInt(address);
    const flags = addressBigInt & FLAG_MASK;

    // Check if address has correct flags
    if (flags === AFTER_SWAP_FLAG) {
      const elapsed = (Date.now() - startTime) / 1000;
      console.log("");
      console.log("✅ Found valid salt!");
      console.log("=====================================");
      console.log(`Salt (decimal): ${salt}`);
      console.log(`Salt (hex): 0x${salt.toString(16).padStart(64, "0")}`);
      console.log(`Hook address: ${address}`);
      console.log(`Address flags: 0x${flags.toString(16).padStart(4, "0")} (${flags})`);
      console.log(`Time elapsed: ${elapsed.toFixed(2)}s`);
      console.log(`Iterations: ${salt.toLocaleString()}`);
      console.log("");

      // Verify the flags
      const lower14Bits = BigInt(address) & 0x3FFFn;
      console.log("🔍 Verification:");
      console.log(`  address & 0x3FFF = 0x${lower14Bits.toString(16).padStart(4, "0")}`);
      console.log(`  Expected: 0x0040 (AFTER_SWAP_FLAG)`);
      console.log(`  Match: ${lower14Bits === AFTER_SWAP_FLAG ? "✅ YES" : "❌ NO"}`);

      return { address, salt };
    }

    // Progress logging every 100k iterations
    const now = Date.now();
    if (now - lastLog > 5000) {
      const elapsed = (now - startTime) / 1000;
      const rate = Number(salt) / elapsed;
      console.log(
        `  Progress: ${salt.toLocaleString()} iterations, ${rate.toFixed(0)}/s, elapsed: ${elapsed.toFixed(1)}s`
      );
      lastLog = now;
    }
  }

  throw new Error(`Could not find valid salt in ${MAX_ITERATIONS} iterations`);
}

// ============ Main ============

async function main() {
  try {
    const result = await mineSalt();

    // Output deployment instructions
    console.log("");
    console.log("📋 Deployment Instructions");
    console.log("=====================================");
    console.log("");
    console.log("Use this salt in your deployment script:");
    console.log("");
    console.log("```solidity");
    console.log(`bytes32 constant MINED_SALT = bytes32(uint256(${result.salt}));`);
    console.log(`// Expected hook address: ${result.address}`);
    console.log("```");
    console.log("");
    console.log("Or deploy directly with cast:");
    console.log("");
    console.log("```bash");
    console.log(`# Salt: ${result.salt}`);
    console.log(`# Expected address: ${result.address}`);
    console.log("```");

  } catch (error) {
    console.error("❌ Mining failed:", error);
    process.exit(1);
  }
}

main();
