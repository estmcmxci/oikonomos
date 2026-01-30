import { createConfig } from 'ponder';
import { http } from 'viem';

export default createConfig({
  networks: {
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.SEPOLIA_RPC_URL),
    },
  },
  contracts: {
    // ReceiptHook contract to be added after deployment
  },
});
