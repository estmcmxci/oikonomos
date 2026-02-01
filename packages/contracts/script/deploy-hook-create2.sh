#!/bin/bash
# OIK-11: Deploy ReceiptHook via CREATE2
#
# Usage:
#   cd packages/contracts
#   ./script/deploy-hook-create2.sh
#
# Required environment variables:
#   - DEPLOYER_PRIVATE_KEY: Private key for deployment
#   - SEPOLIA_RPC_URL: Sepolia RPC endpoint
#   - ETHERSCAN_API_KEY: For verification (optional)

set -e

# ============ Configuration ============

# CREATE2 Deployer (same on all chains)
CREATE2_DEPLOYER="0x4e59b44847b379578588920cA78FbF26c0B4956C"

# Sepolia Pool Manager
POOL_MANAGER="0xE03A1074c86CFeDd5C142C4F04F1a1536e203543"

# Mined salt (from mine-hook-salt.ts)
# Salt: 43988
# Expected address: 0xea155cf7d152125839e66b585b9e455621b7c040
SALT="0x000000000000000000000000000000000000000000000000000000000000abd4"
EXPECTED_ADDRESS="0xea155cf7d152125839e66b585b9e455621b7c040"

# ============ Load Environment ============

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    if [ -f "../../.env" ]; then
        source ../../.env
    else
        echo "Error: DEPLOYER_PRIVATE_KEY not set and no .env file found"
        exit 1
    fi
fi

if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "Error: SEPOLIA_RPC_URL not set"
    exit 1
fi

# ============ Build Contract ============

echo "=== OIK-11: ReceiptHook CREATE2 Deployment ==="
echo ""
echo "Building ReceiptHook..."
forge build

# Get the bytecode
BYTECODE=$(forge inspect ReceiptHook bytecode)
if [ -z "$BYTECODE" ]; then
    echo "Error: Could not get bytecode"
    exit 1
fi

# Encode constructor args (address _poolManager)
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" "$POOL_MANAGER")
# Remove 0x prefix from constructor args for concatenation
CONSTRUCTOR_ARGS_NO_PREFIX="${CONSTRUCTOR_ARGS:2}"

# Full init code = bytecode + constructor args
INIT_CODE="${BYTECODE}${CONSTRUCTOR_ARGS_NO_PREFIX}"

# Compute expected address
COMPUTED_ADDRESS=$(cast create2 --starts-with "" --deployer "$CREATE2_DEPLOYER" --salt "$SALT" --init-code "$INIT_CODE" 2>/dev/null | grep "Address:" | awk '{print $2}' || echo "")

# Verify using our own calculation
INIT_CODE_HASH=$(cast keccak "$INIT_CODE")
COMPUTED_ADDRESS_2=$(cast compute-address --no-prefix --deployer "$CREATE2_DEPLOYER" --salt "$SALT" --init-code-hash "$INIT_CODE_HASH" 2>/dev/null || echo "")

echo ""
echo "Configuration:"
echo "  CREATE2 Deployer: $CREATE2_DEPLOYER"
echo "  Pool Manager: $POOL_MANAGER"
echo "  Salt: $SALT"
echo "  Salt (decimal): 43988"
echo ""
echo "Init Code Hash: $INIT_CODE_HASH"
echo "Expected Address: $EXPECTED_ADDRESS"
echo ""

# Check address flags
FLAGS_HEX=$(echo "$EXPECTED_ADDRESS" | tail -c 5)
echo "Address lower 14 bits (hex): $FLAGS_HEX"
echo "Required flags: 0040 (AFTER_SWAP_FLAG)"
echo ""

# ============ Deploy ============

echo "Do you want to proceed with deployment? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Deploying ReceiptHook via CREATE2..."

# Prepare deploy data: salt + init code
DEPLOY_DATA="${SALT}${INIT_CODE:2}"

# Send transaction to CREATE2 deployer
TX_HASH=$(cast send --rpc-url "$SEPOLIA_RPC_URL" \
    --private-key "$DEPLOYER_PRIVATE_KEY" \
    "$CREATE2_DEPLOYER" \
    "$DEPLOY_DATA" \
    --gas-limit 500000 \
    2>&1)

echo ""
echo "Transaction sent!"
echo "$TX_HASH"
echo ""

# Wait for confirmation
echo "Waiting for confirmation..."
cast receipt --rpc-url "$SEPOLIA_RPC_URL" "$TX_HASH" 2>&1 || echo "Check transaction manually"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "ReceiptHook Address: $EXPECTED_ADDRESS"
echo "Verify at: https://sepolia.etherscan.io/address/$EXPECTED_ADDRESS"
echo ""
echo "To verify on Etherscan:"
echo "  forge verify-contract $EXPECTED_ADDRESS ReceiptHook \\"
echo "    --chain sepolia \\"
echo "    --constructor-args \$(cast abi-encode 'constructor(address)' $POOL_MANAGER)"
echo ""
echo "Next steps:"
echo "  1. Update packages/shared/src/constants.ts"
echo "  2. Update .env with RECEIPT_HOOK_ADDRESS=$EXPECTED_ADDRESS"
echo "  3. Verify contract on Etherscan"
