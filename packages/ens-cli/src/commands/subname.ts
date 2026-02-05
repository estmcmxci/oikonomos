/**
 * Subname Commands
 *
 * Commands for managing oikonomos.eth subnames via CCIP-Read.
 */

import colors from "yoctocolors";
import { createPublicClient, createWalletClient, http, type Address, namehash } from "viem";
import { sepolia, mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { privateKeyToAccount } from "viem/accounts";
import {
  startSpinner,
  stopSpinner,
  type LedgerOptions,
  getNetworkConfig,
} from "../utils";
import {
  isSubnameAvailable,
  getSubnameRecord,
  registerSubname,
  validateLabel,
  computeOikonomosParentNode,
  type CCIPConfig,
} from "@oikonomos/sdk";

// ============================================================================
// Types
// ============================================================================

export type SubnameAvailableOptions = {
  label: string;
  network?: string;
};

export type SubnameRegisterOptions = {
  label: string;
  owner: string;
  agentId: string;
  a2aUrl: string;
  expiry?: string;
  network?: string;
} & LedgerOptions;

export type SubnameInfoOptions = {
  label: string;
  network?: string;
};

export type SubnameListOptions = {
  network?: string;
};

// ============================================================================
// Configuration
// ============================================================================

interface CCIPNetworkConfig {
  chain: typeof sepolia | typeof mainnet;
  managerAddress: Address;
  gatewayUrl: string;
  parentNode: `0x${string}`;
  rpcUrl: string;
}

// CCIP configuration by network
// Note: managerAddress should be updated after contract deployment
function getCCIPConfig(network: string = "sepolia"): CCIPNetworkConfig {
  const parentNode = computeOikonomosParentNode();

  if (network === "sepolia") {
    return {
      chain: sepolia,
      managerAddress: "0x89E3740C8b81D90e146c62B6C6451b85Ec8E6E78" as Address,
      gatewayUrl: "https://oikonomos-ccip-gateway.estmcmxci.workers.dev",
      parentNode,
      rpcUrl: process.env.SEPOLIA_RPC_URL || process.env.ETH_RPC_URL_SEPOLIA || "https://rpc.sepolia.org",
    };
  }

  if (network === "mainnet") {
    return {
      chain: mainnet,
      managerAddress: "0x0000000000000000000000000000000000000000" as Address,
      gatewayUrl: "",
      parentNode,
      rpcUrl: process.env.MAINNET_RPC_URL || process.env.ETH_RPC_URL_MAINNET || "https://eth.llamarpc.com",
    };
  }

  throw new Error(`Unsupported network: ${network}. Use 'sepolia' or 'mainnet'.`);
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Check if a subname is available
 */
export async function subnameAvailable(options: SubnameAvailableOptions) {
  const { label, network = "sepolia" } = options;

  // Validate label
  const validation = validateLabel(label);
  if (!validation.valid) {
    console.error(colors.red(`Invalid label: ${validation.error}`));
    return;
  }

  startSpinner(`Checking availability of ${label}.oikonomos.eth...`);

  try {
    const config = getCCIPConfig(network);
    const client = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    const available = await isSubnameAvailable(client, label, {
      managerAddress: config.managerAddress,
      gatewayUrl: config.gatewayUrl,
      parentNode: config.parentNode,
    });

    stopSpinner();

    if (available) {
      console.log(colors.green(`✓ ${label}.oikonomos.eth is available`));
    } else {
      console.log(colors.red(`✗ ${label}.oikonomos.eth is already registered`));

      // Try to get the record to show owner
      const record = await getSubnameRecord(client, label, {
        managerAddress: config.managerAddress,
        gatewayUrl: config.gatewayUrl,
        parentNode: config.parentNode,
      });

      if (record) {
        console.log(colors.dim(`  Owner: ${record.owner}`));
        console.log(colors.dim(`  Agent ID: ${record.agentId}`));
        console.log(colors.dim(`  A2A URL: ${record.a2aUrl}`));
      }
    }
  } catch (error) {
    stopSpinner();
    console.error(colors.red(`Error: ${(error as Error).message}`));
  }
}

/**
 * Register a new subname
 */
export async function subnameRegister(options: SubnameRegisterOptions) {
  const { label, owner, agentId, a2aUrl, expiry = "0", network = "sepolia" } = options;

  // Validate label
  const validation = validateLabel(label);
  if (!validation.valid) {
    console.error(colors.red(`Invalid label: ${validation.error}`));
    return;
  }

  // Validate owner address
  if (!owner.startsWith("0x") || owner.length !== 42) {
    console.error(colors.red("Invalid owner address"));
    return;
  }

  // Validate a2aUrl
  if (!a2aUrl || !a2aUrl.startsWith("https://")) {
    console.error(colors.red("Invalid a2aUrl - must be a valid HTTPS URL"));
    return;
  }

  // Parse agent ID
  let agentIdBigInt: bigint;
  try {
    agentIdBigInt = BigInt(agentId);
  } catch {
    console.error(colors.red("Invalid agent ID - must be a number"));
    return;
  }

  // Parse expiry
  let expiryBigInt: bigint;
  try {
    expiryBigInt = BigInt(expiry);
  } catch {
    console.error(colors.red("Invalid expiry - must be a number (unix timestamp)"));
    return;
  }

  console.log(colors.blue(`\nRegistering ${label}.oikonomos.eth`));
  console.log(colors.dim(`  Owner: ${owner}`));
  console.log(colors.dim(`  Agent ID: ${agentId}`));
  console.log(colors.dim(`  A2A URL: ${a2aUrl}`));
  console.log(colors.dim(`  Network: ${network}`));
  console.log();

  try {
    const config = getCCIPConfig(network);

    // Get private key from environment (check ENS_PRIVATE_KEY first, then DEPLOYER_PRIVATE_KEY)
    const privateKey = process.env.ENS_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        "ENS_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY environment variable required for registration"
      );
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    // Check availability first
    startSpinner("Checking availability...");
    const available = await isSubnameAvailable(publicClient, label, {
      managerAddress: config.managerAddress,
      gatewayUrl: config.gatewayUrl,
      parentNode: config.parentNode,
    });

    if (!available) {
      stopSpinner();
      console.error(colors.red(`${label}.oikonomos.eth is already registered`));
      return;
    }

    stopSpinner();
    startSpinner("Registering subname via CCIP-Read...");

    const txHash = await registerSubname(
      publicClient,
      walletClient,
      {
        label,
        subnameOwner: owner as Address,
        agentId: agentIdBigInt,
        a2aUrl,
        desiredExpiry: expiryBigInt,
      },
      {
        managerAddress: config.managerAddress,
        gatewayUrl: config.gatewayUrl,
        parentNode: config.parentNode,
      }
    );

    stopSpinner();

    console.log(colors.green(`\n✓ Successfully registered ${label}.oikonomos.eth`));
    console.log(colors.dim(`  Transaction: ${txHash}`));
    console.log();
    console.log(colors.blue("ENS records set:"));
    console.log(colors.dim(`  Address: ${owner}`));
    console.log(
      colors.dim(
        `  agent:erc8004: eip155:${config.chain.id}:0x8004A818BFB912233c491871b3d84c89A494BD9e:${agentId}`
      )
    );
    console.log(colors.dim(`  agent:a2a: ${a2aUrl}`));
  } catch (error) {
    stopSpinner();
    console.error(colors.red(`\nRegistration failed: ${(error as Error).message}`));
  }
}

/**
 * Get info about a registered subname
 */
export async function subnameInfo(options: SubnameInfoOptions) {
  const { label, network = "sepolia" } = options;

  startSpinner(`Looking up ${label}.oikonomos.eth...`);

  try {
    const config = getCCIPConfig(network);
    const client = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    const record = await getSubnameRecord(client, label, {
      managerAddress: config.managerAddress,
      gatewayUrl: config.gatewayUrl,
      parentNode: config.parentNode,
    });

    stopSpinner();

    if (!record) {
      console.log(colors.yellow(`${label}.oikonomos.eth is not registered`));
      return;
    }

    console.log(colors.green(`\n${label}.oikonomos.eth`));
    console.log(colors.dim("─".repeat(40)));
    console.log(`  Owner:         ${record.owner}`);
    console.log(`  Agent ID:      ${record.agentId}`);
    console.log(`  A2A URL:       ${record.a2aUrl}`);
    console.log(
      `  Registered:    ${new Date(Number(record.registeredAt) * 1000).toISOString()}`
    );
    if (record.expiry > 0n) {
      console.log(
        `  Expires:       ${new Date(Number(record.expiry) * 1000).toISOString()}`
      );
    } else {
      console.log(`  Expires:       Never`);
    }
    console.log();
  } catch (error) {
    stopSpinner();
    console.error(colors.red(`Error: ${(error as Error).message}`));
  }
}

/**
 * List all registered subnames (requires indexer)
 */
export async function subnameList(options: SubnameListOptions) {
  const { network = "sepolia" } = options;

  console.log(colors.yellow("\nNote: Listing subnames requires the Ponder indexer."));
  console.log(colors.dim("This feature will query the indexer API when available.\n"));

  // TODO: Implement when indexer is set up
  // For now, show instructions
  console.log(colors.blue("To list subnames, query the indexer GraphQL API:"));
  console.log(colors.dim(`
  query {
    subnames(orderBy: "registeredAt", orderDirection: "desc") {
      items {
        label
        owner
        agentId
        registeredAt
      }
    }
  }
  `));
}
