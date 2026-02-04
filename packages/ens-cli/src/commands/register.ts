/**
 * Register Command
 *
 * Register a new ENS name with optional records.
 * Note: L1 ENS uses commit-reveal pattern which requires two transactions.
 */

import colors from "yoctocolors";
import { isAddress, formatEther, keccak256, toBytes } from "viem";
import {
  startSpinner,
  stopSpinner,
  normalizeEnsName,
  checkAvailable,
  getRegisterPrice,
  buildResolverData,
  getSignerAddress,
  getSignerAddressAsync,
  getPublicClient,
  getWalletClient,
  getNetworkConfig,
  closeLedger,
  type RegisterOptions,
} from "../utils";

// Registrar Controller ABI for commit-reveal
const REGISTRAR_CONTROLLER_ABI = [
  {
    name: "makeCommitment",
    type: "function",
    stateMutability: "pure",
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "resolver", type: "address" },
      { name: "data", type: "bytes[]" },
      { name: "reverseRecord", type: "bool" },
      { name: "ownerControlledFuses", type: "uint16" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "commit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitment", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "register",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "resolver", type: "address" },
      { name: "data", type: "bytes[]" },
      { name: "reverseRecord", type: "bool" },
      { name: "ownerControlledFuses", type: "uint16" },
    ],
    outputs: [],
  },
  {
    name: "minCommitmentAge",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

// Duration parsing
function parseDuration(duration: string): bigint {
  const match = duration.match(/^(\d+)(y|m|d)?$/i);
  if (!match) {
    throw new Error("Invalid duration format. Use: 1y, 6m, 30d, or seconds");
  }

  const value = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();

  switch (unit) {
    case "y":
      return BigInt(value * 365 * 24 * 60 * 60);
    case "m":
      return BigInt(value * 30 * 24 * 60 * 60);
    case "d":
      return BigInt(value * 24 * 60 * 60);
    default:
      return BigInt(value);
  }
}

// Parse text records from CLI format: "key=value"
function parseTextRecords(txtArgs: string[]): Record<string, string> {
  const records: Record<string, string> = {};
  for (const txt of txtArgs) {
    const [key, ...valueParts] = txt.split("=");
    if (key && valueParts.length > 0) {
      records[key.trim()] = valueParts.join("=").trim();
    }
  }
  return records;
}

// Generate a random secret for commitment
function generateSecret(): `0x${string}` {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return `0x${Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

// Wait with countdown
async function waitWithCountdown(seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r  Waiting: ${i} seconds remaining...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  process.stdout.write("\r" + " ".repeat(40) + "\r");
}

/**
 * Register a new ENS name using commit-reveal pattern
 */
export async function register(options: RegisterOptions) {
  const {
    name,
    owner,
    address,
    duration,
    txt,
    primary,
    useLedger,
    accountIndex,
  } = options;
  const config = getNetworkConfig(options.network);

  try {
    // Get signer address
    let signerAddress: `0x${string}` | null;

    if (useLedger) {
      console.log(colors.blue("Connecting to Ledger..."));
      signerAddress = await getSignerAddressAsync(true, accountIndex || 0);
      console.log(colors.green("✓ Connected to Ledger"));
      console.log(colors.dim(`  Address: ${signerAddress}`));
      console.log(colors.dim(`  Account Index: ${accountIndex || 0}`));
    } else {
      signerAddress = getSignerAddress();
      if (!signerAddress) {
        console.error(colors.red("Error: ENS_PRIVATE_KEY not set"));
        console.error(
          colors.yellow("Set the environment variable or use --ledger flag")
        );
        return;
      }
    }

    // Use signer address as owner if not provided
    const ownerAddress = owner || signerAddress;

    // Validate owner address
    if (!isAddress(ownerAddress)) {
      console.error(colors.red("Invalid owner address"));
      return;
    }

    // Validate address if provided
    const addressToSet = address || ownerAddress;
    if (!isAddress(addressToSet)) {
      console.error(colors.red("Invalid address"));
      return;
    }

    const { label, fullName, node } = normalizeEnsName(name, options.network);

    // Parse duration
    const durationSeconds = parseDuration(duration || "1y");
    const durationYears = Number(durationSeconds) / (365 * 24 * 60 * 60);

    console.log(colors.blue("\nENS Name Registration"));
    console.log(colors.blue("=====================\n"));
    console.log(`${colors.blue("Name:")}      ${fullName}`);
    console.log(`${colors.blue("Owner:")}     ${ownerAddress}`);
    console.log(`${colors.blue("Address:")}   ${addressToSet}`);
    console.log(`${colors.blue("Duration:")}  ${durationYears.toFixed(1)} year(s)`);
    console.log(`${colors.blue("Primary:")}   ${primary ? "Yes" : "No"}`);
    if (useLedger) {
      console.log(`${colors.blue("Signing:")}   Ledger (index ${accountIndex || 0})`);
    }

    // Check availability
    startSpinner("Checking availability...");
    const isAvailable = await checkAvailable(label, options.network);

    if (!isAvailable) {
      stopSpinner();
      console.error(colors.red(`\n✗ ${fullName} is not available`));
      return;
    }
    stopSpinner();
    console.log(colors.green("✓ Name is available"));

    // Get price
    startSpinner("Getting price...");
    const price = await getRegisterPrice(label, durationSeconds, options.network);
    stopSpinner();
    console.log(`${colors.blue("Price:")}     ${formatEther(price)} ETH`);

    // Parse text records
    const textRecords = txt ? parseTextRecords(txt) : {};

    // Get clients
    const client = getPublicClient(options.network);
    const wallet = await getWalletClient(options.network, useLedger, accountIndex);

    if (!wallet) {
      console.error(colors.red("Error: Wallet not configured"));
      return;
    }

    // Generate secret for commitment
    const secret = generateSecret();
    console.log(colors.dim(`\nSecret: ${secret}`));
    console.log(colors.yellow("⚠ Save this secret! You'll need it if registration is interrupted.\n"));

    // Build resolver data
    const resolverData = buildResolverData(node, addressToSet as `0x${string}`, textRecords);

    // Step 1: Make commitment
    console.log(colors.blue("Step 1: Creating commitment..."));
    startSpinner("Generating commitment...");

    const commitment = await client.readContract({
      address: config.registrarController,
      abi: REGISTRAR_CONTROLLER_ABI,
      functionName: "makeCommitment",
      args: [
        label,
        ownerAddress as `0x${string}`,
        durationSeconds,
        secret,
        config.resolver,
        resolverData,
        primary || false,
        0, // ownerControlledFuses
      ],
    });

    stopSpinner();
    console.log(colors.green(`✓ Commitment: ${commitment}`));

    // Step 2: Submit commitment
    console.log(colors.blue("\nStep 2: Submitting commitment..."));
    if (useLedger) {
      console.log(colors.yellow("Please confirm the transaction on your Ledger device..."));
    }
    startSpinner("Sending commit transaction...");

    const commitTx = await wallet.writeContract({
      address: config.registrarController,
      abi: REGISTRAR_CONTROLLER_ABI,
      functionName: "commit",
      args: [commitment],
    });

    stopSpinner();
    console.log(colors.green(`✓ Commit tx: ${commitTx}`));

    // Wait for commit confirmation
    startSpinner("Waiting for commit confirmation...");
    await client.waitForTransactionReceipt({
      hash: commitTx,
      confirmations: 1,
    });
    stopSpinner();
    console.log(colors.green("✓ Commitment confirmed"));

    // Get min commitment age
    const minAge = await client.readContract({
      address: config.registrarController,
      abi: REGISTRAR_CONTROLLER_ABI,
      functionName: "minCommitmentAge",
    }) as bigint;

    const waitTime = Number(minAge) + 5; // Add 5 second buffer
    console.log(colors.blue(`\nStep 3: Waiting ${waitTime} seconds for commitment to mature...`));
    await waitWithCountdown(waitTime);
    console.log(colors.green("✓ Commitment matured"));

    // Step 4: Register
    console.log(colors.blue("\nStep 4: Completing registration..."));
    if (useLedger) {
      console.log(colors.yellow("Please confirm the transaction on your Ledger device..."));
    }
    startSpinner("Sending register transaction...");

    const registerTx = await wallet.writeContract({
      address: config.registrarController,
      abi: REGISTRAR_CONTROLLER_ABI,
      functionName: "register",
      args: [
        label,
        ownerAddress as `0x${string}`,
        durationSeconds,
        secret,
        config.resolver,
        resolverData,
        primary || false,
        0, // ownerControlledFuses
      ],
      value: price,
    });

    stopSpinner();
    console.log(colors.green(`✓ Register tx: ${registerTx}`));

    // Wait for registration confirmation
    startSpinner("Waiting for registration confirmation...");
    const receipt = await client.waitForTransactionReceipt({
      hash: registerTx,
      confirmations: 2,
    });

    stopSpinner();

    if (receipt.status === "success") {
      console.log(colors.green(`✓ Confirmed in block ${receipt.blockNumber}`));
      console.log(colors.green(`\n Successfully registered ${fullName}!\n`));
      console.log(`${colors.blue("Explorer:")} ${config.explorerUrl}/tx/${registerTx}`);
    } else {
      console.error(colors.red("✗ Transaction reverted"));
    }
  } catch (error) {
    stopSpinner();
    const e = error as Error;
    console.error(colors.red(`Error registering: ${e.message}`));
  } finally {
    if (useLedger) {
      await closeLedger();
    }
  }
}
