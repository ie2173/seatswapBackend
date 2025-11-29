import {
  generateSiweSignature,
  getAccountFromPrivateKey,
  TEST_PRIVATE_KEYS,
} from "./setupSignature";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const PRIVATE_KEY = (process.env.TEST_PRIVATE_KEY ||
  TEST_PRIVATE_KEYS.ACCOUNT_0) as `0x${string}`;

async function generateAuthToken() {
  try {
    // Get account from private key
    const account = getAccountFromPrivateKey(PRIVATE_KEY);
    const address = account.address;

    console.log("🔑 Using address:", address);
    console.log("📡 Fetching nonce from server...");

    // Step 1: Get nonce from server
    const nonceResponse = await fetch(`${BASE_URL}/auth/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    if (!nonceResponse.ok) {
      throw new Error(`Failed to get nonce: ${nonceResponse.status}`);
    }

    const { nonce } = (await nonceResponse.json()) as { nonce: string };
    console.log("✅ Received nonce:", nonce);

    // Step 2: Generate SIWE signature
    console.log("✍️  Generating signature...");
    const { messageObj, signature } = await generateSiweSignature({
      nonce,
      privateKey: PRIVATE_KEY,
    });
    console.log("✅ Signature generated");

    // Step 3: Verify signature and get JWT token
    console.log("🔐 Verifying signature with server...");
    const verifyResponse = await fetch(`${BASE_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        message: messageObj,
        signature,
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(`Failed to verify: ${JSON.stringify(error)}`);
    }

    const { token } = (await verifyResponse.json()) as { token: string };
    console.log("✅ Authentication successful!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Copy this token to your api.http file:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`@token = ${token}\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nUse in headers as:");
    console.log("Authorization: Bearer {{token}}\n");

    return token;
  } catch (error) {
    console.error("❌ Error generating auth token:", error);
    process.exit(1);
  }
}

// Run the script
generateAuthToken();
