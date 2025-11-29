import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
// Import the contract ABI here.

// Define Anvil local chain
const anvilLocal = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
});

// Use a dummy private key for tests if not provided or invalid
const getPrivateKey = () => {
  const envKey = process.env.SEATSWAP_EOA_PRIVATE_KEY;

  // Check if key exists and is valid format (0x followed by 64 hex chars)
  if (envKey && /^0x[0-9a-fA-F]{64}$/.test(envKey)) {
    return envKey;
  }

  // Return test private key (DO NOT use in production!)
  console.warn(
    "⚠️  Using test private key. Set SEATSWAP_EOA_PRIVATE_KEY in .env for production"
  );
  return "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Anvil default account
};

const privateKey = getPrivateKey();
const seatSwapEOA = privateKeyToAccount(privateKey as `0x${string}`);

export const walletClient = createWalletClient({
  account: seatSwapEOA,
  chain: anvilLocal,
  transport: http(process.env.TRANSPORT_URL || "http://127.0.0.1:8545"),
});

export const publicClient = createPublicClient({
  chain: anvilLocal,
  transport: http(process.env.TRANSPORT_URL || "http://127.0.0.1:8545"),
});
