/**
 * Test script for CCIP subname registration
 * Uses raw JSON-RPC to handle OffchainLookup properly
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  encodeFunctionData,
  decodeAbiParameters,
  namehash,
  parseAbiParameters,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { normalize } from "viem/ens";

// Configuration
const config = {
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr",
  privateKey: "0x5bac2a365ad5db99a387f07c3f352032d13063fdc5277cf7fe3385a02f14ae3a",
  managerAddress: "0x89E3740C8b81D90e146c62B6C6451b85Ec8E6E78" as Address,
  gatewayUrl: "https://oikonomos-ccip-gateway.estmcmxci.workers.dev",
  parentNode: namehash(normalize("oikonomos.eth")),
};

// ABI for OffchainSubnameManager
const OffchainSubnameManagerABI = [
  {
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label", type: "string" },
      { name: "subnameOwner", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "a2aUrl", type: "string" },
      { name: "desiredExpiry", type: "uint64" },
    ],
    name: "registerSubname",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "response", type: "bytes" },
      { name: "extraData", type: "bytes" },
    ],
    name: "registerSubnameWithProof",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// OffchainLookup error selector
const OFFCHAIN_LOOKUP_SELECTOR = "0x556f1830";

async function main() {
  // Test parameters
  const label = "testagent" + Math.floor(Math.random() * 10000);
  const agentId = 1n;
  const a2aUrl = `https://${label}.oikonomos.workers.dev`;
  const desiredExpiry = 0n;

  console.log("🧪 Testing CCIP Subname Registration");
  console.log("━".repeat(50));
  console.log(`Label: ${label}`);
  console.log(`Full name: ${label}.oikonomos.eth`);
  console.log(`Agent ID: ${agentId}`);
  console.log(`A2A URL: ${a2aUrl}`);
  console.log("━".repeat(50));

  const account = privateKeyToAccount(config.privateKey as Hex);
  console.log(`\n📬 Using address: ${account.address}`);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(config.rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(config.rpcUrl),
  });

  // Step 1: Make raw RPC call to trigger OffchainLookup
  console.log("\n1️⃣ Triggering OffchainLookup...");

  const callData = encodeFunctionData({
    abi: OffchainSubnameManagerABI,
    functionName: "registerSubname",
    args: [config.parentNode as Hex, label, account.address, agentId, a2aUrl, desiredExpiry],
  });

  // Use raw JSON-RPC to get the error data
  const rpcResponse = await fetch(config.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: config.managerAddress, data: callData }, "latest"],
      id: 1,
    }),
  });

  const rpcResult = await rpcResponse.json() as { error?: { data?: string }; result?: string };

  if (!rpcResult.error?.data) {
    console.log("❌ Expected OffchainLookup error");
    console.log(rpcResult);
    process.exit(1);
  }

  const errorData = rpcResult.error.data as Hex;
  if (!errorData.startsWith(OFFCHAIN_LOOKUP_SELECTOR)) {
    console.log("❌ Unexpected error selector:", errorData.slice(0, 10));
    process.exit(1);
  }

  // Decode OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)
  const decoded = decodeAbiParameters(
    parseAbiParameters("address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData"),
    `0x${errorData.slice(10)}` as Hex
  );

  const [sender, urls, lookupCallData, callbackFunction, extraData] = decoded;
  console.log("✅ Got OffchainLookup");
  console.log(`   URLs: ${(urls as string[]).join(", ")}`);

  // Step 2: Query the gateway
  console.log("\n2️⃣ Querying gateway...");

  const gatewayUrl = (urls as string[])[0] || config.gatewayUrl;
  console.log(`   URL: ${gatewayUrl}`);

  const gatewayResponse = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: sender,
      data: lookupCallData,
    }),
  });

  if (!gatewayResponse.ok) {
    const errorBody = await gatewayResponse.text();
    console.log(`❌ Gateway error: ${gatewayResponse.status}`);
    console.log(errorBody);
    process.exit(1);
  }

  const gatewayResult = await gatewayResponse.json() as { data: Hex; meta?: unknown };
  console.log("✅ Gateway approved");
  if (gatewayResult.meta) {
    console.log(`   Meta:`, gatewayResult.meta);
  }

  // Step 3: Call registerSubnameWithProof
  console.log("\n3️⃣ Submitting proof to contract...");

  try {
    const hash = await walletClient.writeContract({
      address: config.managerAddress,
      abi: OffchainSubnameManagerABI,
      functionName: "registerSubnameWithProof",
      args: [gatewayResult.data, extraData as Hex],
    });

    console.log("✅ Transaction submitted:", hash);

    console.log("   Waiting for confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      console.log("✅ Subname registered successfully!");
      console.log(`\n🎉 ${label}.oikonomos.eth is now live!`);
      console.log(`   ENS records set:`);
      console.log(`   - agent:erc8004 → eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:${agentId}`);
      console.log(`   - agent:a2a → ${a2aUrl}`);
      console.log(`\n   Transaction: https://sepolia.etherscan.io/tx/${hash}`);
    } else {
      console.log("❌ Transaction reverted");
    }
  } catch (error) {
    console.log("❌ Contract call failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
