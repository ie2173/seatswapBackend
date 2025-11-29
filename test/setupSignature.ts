import { SiweMessage } from "siwe";
import { privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts";

/**
 * Generate a SIWE signature for testing
 * @param nonce - The nonce from /auth/nonce endpoint
 * @param address - The wallet address
 * @param privateKey - The private key for signing (must match the address)
 * @returns Object containing the message object and signature
 */
export async function generateSiweSignature({
  nonce,
  privateKey,
}: {
  nonce: string;
  privateKey: `0x${string}`;
}): Promise<{
  messageObj: {
    domain: string;
    address: string;
    statement: string;
    uri: string;
    version: string;
    chainId: number;
    nonce: string;
    issuedAt: string;
    expirationTime: string;
  };
  signature: string;
}> {
  const account = privateKeyToAccount(privateKey);

  const messageObj = {
    domain: "localhost",
    address: account.address,
    statement: "Sign in to SeatSwap",
    uri: "http://localhost:3000",
    version: "1",
    chainId: 31337,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
  };

  const siweMessage = new SiweMessage(messageObj);
  const signature = await account.signMessage({
    message: siweMessage.prepareMessage(),
  });
  console.log("generated message Objects: ", messageObj);
  console.log("generated signature: ", signature);

  return { messageObj, signature };
}

/**
 * Get an account from a private key
 * @param privateKey - The private key
 * @returns The account object
 */
export function getAccountFromPrivateKey(
  privateKey: `0x${string}`
): PrivateKeyAccount {
  return privateKeyToAccount(privateKey);
}

/**
 * Anvil test private keys (with 100,000 USDC each)
 */
export const TEST_PRIVATE_KEYS = {
  // Owner/Platform Account: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  OWNER:
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`,
  ACCOUNT_0:
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`,
  // Seller Account: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8
  SELLER:
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as `0x${string}`,
  ACCOUNT_1:
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as `0x${string}`,
  // Buyer Account: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
  BUYER:
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as `0x${string}`,
  ACCOUNT_2:
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as `0x${string}`,
} as const;
