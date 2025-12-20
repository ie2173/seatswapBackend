import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { app, server } from "../src/server";
import { SiweMessage } from "siwe";
import { privateKeyToAccount } from "viem/accounts";
import mongoose from "mongoose";
import UserSchema from "../src/models/users";
import DealSchema from "../src/models/deals";

const BASE_URL = "http://localhost:3000";

// Test wallet for integration tests
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;
const testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);
const TEST_ADDRESS = testAccount.address;

let authToken: string;

beforeAll(async () => {
  console.log("Setting up integration tests...");
  // Clear test data
  const testUser = await UserSchema.findOne({ address: TEST_ADDRESS });
  if (testUser) {
    await DealSchema.deleteMany({
      $or: [{ seller: testUser._id }, { buyer: testUser._id }],
    });
  }
  await UserSchema.deleteMany({ address: TEST_ADDRESS });
});

afterAll(async () => {
  // Clean up test data
  const testUser = await UserSchema.findOne({ address: TEST_ADDRESS });
  if (testUser) {
    await DealSchema.deleteMany({
      $or: [{ seller: testUser._id }, { buyer: testUser._id }],
    });
  }
  await UserSchema.deleteMany({ address: TEST_ADDRESS });
  await mongoose.disconnect();
  server.close();
  console.log("Integration tests completed, cleaned up.");
});

describe("Integration Tests - Full User Flow", () => {
  describe("Authentication Flow", () => {
    let nonce: string;

    test("should get a nonce for authentication", async () => {
      const response = await fetch(`${BASE_URL}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: TEST_ADDRESS }),
      });

      const data = (await response.json()) as { nonce: string };
      expect(response.status).toBe(200);
      expect(data.nonce).toBeDefined();
      expect(typeof data.nonce).toBe("string");
      nonce = data.nonce;
    });

    test("should verify SIWE signature and get JWT token", async () => {
      // Create SIWE message
      const messageObj = {
        domain: "localhost",
        address: TEST_ADDRESS,
        statement: "Sign in to SeatSwap",
        uri: "http://localhost:3000",
        version: "1",
        chainId: 84532,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };
      const siweMessage = new SiweMessage(messageObj);

      // Sign the message
      const signature = await testAccount.signMessage({
        message: siweMessage.prepareMessage(),
      });

      // Verify signature
      const response = await fetch(`${BASE_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: TEST_ADDRESS,
          message: messageObj,
          signature: signature,
        }),
      });

      const data = (await response.json()) as { token: string };
      expect(response.status).toBe(200);
      expect(data.token).toBeDefined();
      authToken = data.token;
    });

    test("should reject invalid signature", async () => {
      const messageObj = {
        domain: "localhost",
        address: TEST_ADDRESS,
        statement: "Sign in to SeatSwap",
        uri: "http://localhost:3000",
        version: "1",
        chainId: 84532,
        nonce: "invalid-nonce",
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      const response = await fetch(`${BASE_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: TEST_ADDRESS,
          message: messageObj,
          signature: "0xinvalidsignature",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Deal Creation Flow", () => {
    let dealId: string;

    test("should create a new deal (authenticated)", async () => {
      const dealData = {
        title: "Test Concert 2024 - Section A Row 10 Seat 5",
        quantity: 1,
        price: 100,
        escrowAddress: "0x1234567890123456789012345678901234567890",
      };

      const response = await fetch(`${BASE_URL}/deals/list-tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(dealData),
      });

      const data = (await response.json()) as { deal: any };
      expect(response.status).toBe(201);
      expect(data.deal).toBeDefined();
      expect(data.deal.seller).toBe(TEST_ADDRESS);
      expect(data.deal.status).toBe("open");
      dealId = data.deal._id;
    });

    test("should reject deal creation without auth token", async () => {
      const dealData = {
        title: "Test Concert",
        quantity: 1,
        price: 100,
        escrowAddress: "0x1234567890123456789012345678901234567890",
      };

      const response = await fetch(`${BASE_URL}/deals/list-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealData),
      });

      expect(response.status).toBe(401);
    });

    test("should get all open deals", async () => {
      const response = await fetch(`${BASE_URL}/deals/open-deals`);
      const data = (await response.json()) as { deals: any[] };

      expect(response.status).toBe(200);
      expect(Array.isArray(data.deals)).toBe(true);
      expect(data.deals.length).toBeGreaterThan(0);
    });

    test("should get deal by ID", async () => {
      const response = await fetch(`${BASE_URL}/deals/deal?dealId=${dealId}`);
      const data = (await response.json()) as { deal: any };

      expect(response.status).toBe(200);
      expect(data.deal._id).toBe(dealId);
      expect(data.deal.seller).toBeDefined();
    });

    // TODO: Add route for getUserDeals
    // test("should get user's deals", async () => {
    //   const response = await fetch(`${BASE_URL}/deals/user/${TEST_ADDRESS}`);
    //   const data = (await response.json()) as { deals: any[] };

    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(data.deals)).toBe(true);
    //   expect(data.deals.some((d: any) => d._id === dealId)).toBe(true);
    // });

    test("should return 404 for non-existent deal", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await fetch(`${BASE_URL}/deals/deal?dealId=${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe("User Profile Flow", () => {
    test("should add email to user profile (authenticated)", async () => {
      const response = await fetch(`${BASE_URL}/users/add-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email: "test@example.com" }),
      });

      const data = (await response.json()) as { user: any };
      expect(response.status).toBe(200);
      expect(data.user.email).toBe("test@example.com");
    });

    test("should reject invalid email format", async () => {
      const response = await fetch(`${BASE_URL}/users/add-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email: "invalid-email" }),
      });

      expect(response.status).toBe(400);
    });

    test("should get user info", async () => {
      const response = await fetch(`${BASE_URL}/users/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: TEST_ADDRESS }),
      });

      const data = (await response.json()) as { user: any };
      expect(response.status).toBe(200);
      expect(data.user.address).toBe(TEST_ADDRESS.toLowerCase());
      expect(data.user.email).toBe("test@example.com");
    });
  });

  describe("Health Check", () => {
    test("should return healthy status", async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = (await response.json()) as {
        message: string;
        version: string;
      };

      expect(response.status).toBe(200);
      expect(data.message).toBe("Healthy");
      expect(data.version).toBe("1.0.0");
    });
  });

  describe("Error Handling", () => {
    test("should return 404 for unknown endpoints", async () => {
      const response = await fetch(`${BASE_URL}/unknown-endpoint`);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(404);
      expect(data.error).toBe("Endpoint Not Found");
    });

    test("should handle malformed JSON", async () => {
      const response = await fetch(`${BASE_URL}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });

      expect([400, 500]).toContain(response.status);
    });
  });
});

describe("Integration Tests - Deal Lifecycle", () => {
  let sellerToken: string;
  let buyerToken: string;
  let dealId: string;

  const SELLER_KEY =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;
  const BUYER_KEY =
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as `0x${string}`;

  const sellerAccount = privateKeyToAccount(SELLER_KEY);
  const buyerAccount = privateKeyToAccount(BUYER_KEY);

  beforeAll(async () => {
    // Authenticate both seller and buyer
    // Seller authentication
    const sellerNonceRes = await fetch(`${BASE_URL}/auth/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: sellerAccount.address }),
    });
    const { nonce: sellerNonce } = (await sellerNonceRes.json()) as {
      nonce: string;
    };

    const sellerMessageObj = {
      domain: "localhost",
      address: sellerAccount.address,
      statement: "Sign in to SeatSwap",
      uri: "http://localhost:3000",
      version: "1",
      chainId: 84532,
      nonce: sellerNonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    const sellerMessage = new SiweMessage(sellerMessageObj);

    const sellerSig = await sellerAccount.signMessage({
      message: sellerMessage.prepareMessage(),
    });

    const sellerVerifyRes = await fetch(`${BASE_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: sellerAccount.address,
        message: sellerMessageObj,
        signature: sellerSig,
      }),
    });
    const sellerData = (await sellerVerifyRes.json()) as { token: string };
    sellerToken = sellerData.token;

    // Buyer authentication
    const buyerNonceRes = await fetch(`${BASE_URL}/auth/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: buyerAccount.address }),
    });
    const { nonce: buyerNonce } = (await buyerNonceRes.json()) as {
      nonce: string;
    };

    const buyerMessageObj = {
      domain: "localhost",
      address: buyerAccount.address,
      statement: "Sign in to SeatSwap",
      uri: "http://localhost:3000",
      version: "1",
      chainId: 84532,
      nonce: buyerNonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    const buyerMessage = new SiweMessage(buyerMessageObj);

    const buyerSig = await buyerAccount.signMessage({
      message: buyerMessage.prepareMessage(),
    });

    const buyerVerifyRes = await fetch(`${BASE_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: buyerAccount.address,
        message: buyerMessageObj,
        signature: buyerSig,
      }),
    });
    const buyerData = (await buyerVerifyRes.json()) as { token: string };
    buyerToken = buyerData.token;
  });

  test("1. Seller creates a deal", async () => {
    const response = await fetch(`${BASE_URL}/deals/list-tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        title: "Integration Test Concert - VIP Section Row 1 Seat A1",
        quantity: 1,
        price: 250,
        escrowAddress: "0x1234567890123456789012345678901234567890",
      }),
    });

    const data = (await response.json()) as { deal: any };
    expect(response.status).toBe(201);
    dealId = data.deal._id;
  });

  test("2. Buyer claims the deal", async () => {
    const response = await fetch(`${BASE_URL}/deals/claim-deal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        dealId: dealId,
        buyerAddress: buyerAccount.address,
        transactionId: "0xabcdef1234567890",
      }),
    });

    const data = (await response.json()) as { deal: any };
    expect(response.status).toBe(200);
    expect(data.deal.status).toBe("claimed");
    expect(data.deal.buyer).toBe(buyerAccount.address);
  });

  test("3. Should prevent seller from claiming their own deal", async () => {
    // Create another deal
    const createRes = await fetch(`${BASE_URL}/deals/list-tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        title: "Test Event - Section A Row 1 Seat 1",
        quantity: 1,
        price: 100,
        escrowAddress: "0x1234567890123456789012345678901234567890",
      }),
    });
    const createData = (await createRes.json()) as { deal: any };
    const newDealId = createData.deal._id;

    // Try to claim own deal
    const claimRes = await fetch(`${BASE_URL}/deals/claim-deal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        dealId: newDealId,
        buyerAddress: sellerAccount.address,
        transactionId: "0x123",
      }),
    });

    expect(claimRes.status).toBe(400);
  });

  afterAll(async () => {
    // Clean up
    const users = await UserSchema.find({
      address: { $in: [sellerAccount.address, buyerAccount.address] },
    });
    const userIds = users.map((u) => u._id);
    if (userIds.length > 0) {
      await DealSchema.deleteMany({
        $or: [{ seller: { $in: userIds } }, { buyer: { $in: userIds } }],
      });
    }
    await UserSchema.deleteMany({
      address: { $in: [sellerAccount.address, buyerAccount.address] },
    });
  });
});
