import { describe, test, expect, beforeEach, mock, beforeAll } from "bun:test";
import { getNonce, verifySignature, logout } from "../auth";
import { createMockRequest, createMockResponse } from "../../../test/helpers";
import { nonceStore } from "@/utils";
import { version } from "os";

// Mock UserSchema before importing anything that uses it
const mockUserSchema = {
  findOne: mock(async () => null),
};

// Mock the constructor function
const MockUserSchemaConstructor = mock(function (this: any, data: any) {
  this.address = data.address;
  this.save = mock(async () => this);
  return this;
}) as any;

Object.assign(MockUserSchemaConstructor, mockUserSchema);

mock.module("@/models", () => ({
  UserSchema: MockUserSchemaConstructor,
  DealSchema: {},
}));

describe("Auth Controller", () => {
  describe("getNonce", () => {
    test("Should return 200 and return a none for a valid address", () => {
      const req = createMockRequest({
        body: { address: "0x0000000650D7c65Aff5D0EacA6F345bbB6b83783" },
      });
      const { res, getStatus, getData } = createMockResponse();

      getNonce(req as any, res as any);

      expect(getStatus()).toBe(200);
      expect(getData()).toHaveProperty("nonce");
    });
    test("Should return 400 if address is missing", () => {
      const req = createMockRequest({
        body: {},
      });
      const { res, getStatus, getData } = createMockResponse();

      getNonce(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty("error", "Proper Address is required");
    });
    test("Should return 400 if address is invalid", () => {
      const req = createMockRequest({
        body: { address: "0xinvalidAddress" },
      });
      const { res, getStatus, getData } = createMockResponse();

      getNonce(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty("error", "Proper Address is required");
    });
  });

  describe("verifySignature", () => {
    let address: string;
    let message: string;
    let signature: string;
    let nonce: string;
    let domain: string;
    let statement: string;
    let chainId: number;
    let uri: string;
    let version: string;

    beforeEach(async () => {
      // Use a test private key to generate a real signature
      const { privateKeyToAccount } = await import("viem/accounts");
      const { SiweMessage } = await import("siwe");

      const testPrivateKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const account = privateKeyToAccount(testPrivateKey as `0x${string}`);
      address = account.address;

      // Clear any existing nonce
      nonceStore.delete({ address: address as `0x${string}` });

      // Generate and store a nonce (must be alphanumeric, at least 8 characters)
      nonce = "testnonce12345";
      nonceStore.set({ address: address as `0x${string}`, nonce });
      domain = process.env.SIWE_DOMAIN || "localhost";
      statement = "Sign in with Ethereum to the app.";
      chainId = 31337;
      uri = "http://localhost:3000";
      const issuedAt = new Date().toISOString();
      version = "1";

      // Create a proper SIWE message using the library
      const siweMessage = new SiweMessage({
        domain,
        address,
        uri,
        version,
        chainId,
        nonce,
        issuedAt,
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
        statement,
      });

      message = siweMessage.prepareMessage();

      // Sign the message with the test account
      signature = await account.signMessage({ message });
    });

    test("Should return 200 and a token for a valid signature", async () => {
      const req = createMockRequest({
        body: { address, message, signature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(200);
      expect(getData()).toHaveProperty("token");
      expect(typeof getData().token).toBe("string");
    });
    test("returns 400 if message is missing", async () => {
      const req = createMockRequest({
        body: { address, signature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty(
        "error",
        "Address, message, and signature are required"
      );
    });
    test("returns 400 if signature is missing", async () => {
      const req = createMockRequest({
        body: { address, message },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty(
        "error",
        "Address, message, and signature are required"
      );
    });
    test("returns 400 if address is missing", async () => {
      const req = createMockRequest({
        body: { message, signature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty(
        "error",
        "Address, message, and signature are required"
      );
    });
    test("returns 400 if domain is invalid", async () => {
      const { SiweMessage } = await import("siwe");
      const { privateKeyToAccount } = await import("viem/accounts");

      const testPrivateKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const account = privateKeyToAccount(testPrivateKey as `0x${string}`);

      const badMessage = new SiweMessage({
        domain: "bad-domain.com",
        address: address,
        uri: uri,
        version: version,
        chainId: chainId,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        statement: statement,
      });

      const badMessageString = badMessage.prepareMessage();
      const badSignature = await account.signMessage({
        message: badMessageString,
      });

      const req = createMockRequest({
        body: { address, message: badMessageString, signature: badSignature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty("error", "Invalid domain");
    });
    test("returns 400 if nonce is invalid", async () => {
      const { SiweMessage } = await import("siwe");
      const { privateKeyToAccount } = await import("viem/accounts");

      const testPrivateKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const account = privateKeyToAccount(testPrivateKey as `0x${string}`);
      const badNonce = "invalidnonce12345";
      const badMessage = new SiweMessage({
        domain: domain,
        address: address,
        uri: uri,
        version: version,
        chainId: chainId,
        nonce: badNonce,
        issuedAt: new Date().toISOString(),
        statement: statement,
      });

      const badMessageString = badMessage.prepareMessage();
      const badSignature = await account.signMessage({
        message: badMessageString,
      });

      const req = createMockRequest({
        body: { address, message: badMessageString, signature: badSignature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty("error", "Invalid nonce");
    });
    test("returns 400 if chainId is invalid", async () => {
      const { SiweMessage } = await import("siwe");
      const { privateKeyToAccount } = await import("viem/accounts");

      const testPrivateKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const account = privateKeyToAccount(testPrivateKey as `0x${string}`);
      const badChainId = 1; // Mainnet
      const badMessage = new SiweMessage({
        domain: domain,
        address: address,
        uri: uri,
        version: version,
        chainId: badChainId,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        statement: statement,
      });

      const badMessageString = badMessage.prepareMessage();
      const badSignature = await account.signMessage({
        message: badMessageString,
      });

      const req = createMockRequest({
        body: { address, message: badMessageString, signature: badSignature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty("error", "Invalid chainId");
    });
    test("returns 401 if signature is invalid", async () => {
      const req = createMockRequest({
        body: { address, message, signature: "0xinvalidsignature" },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(401);
      expect(getData()).toHaveProperty("error", "Verification failed");
    });
    test("returns 401 if signature comes from a different address", async () => {
      const { SiweMessage } = await import("siwe");
      const { privateKeyToAccount } = await import("viem/accounts");

      const testPrivateKey =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      const account = privateKeyToAccount(testPrivateKey as `0x${string}`);
      const otherAddress = account.address;

      const badMessage = new SiweMessage({
        domain: domain,
        address: otherAddress,
        uri: uri,
        version: version,
        chainId: chainId,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        statement: statement,
      });

      const badMessageString = badMessage.prepareMessage();
      const badSignature = await account.signMessage({
        message: badMessageString,
      });

      const req = createMockRequest({
        body: { address, message: badMessageString, signature: badSignature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty("error", "Address mismatch");
    });
    test("returns 401 if JWT_SECRET is not configured", async () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "";

      const req = createMockRequest({
        body: { address, message, signature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(401);
      expect(getData()).toHaveProperty("error", "Verification failed");

      process.env.JWT_SECRET = originalSecret;
    });
    test("returns 400 if message does not include expirationTime", async () => {
      const { SiweMessage } = await import("siwe");
      const { privateKeyToAccount } = await import("viem/accounts");

      const testPrivateKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const account = privateKeyToAccount(testPrivateKey as `0x${string}`);

      const messageNoExpiry = new SiweMessage({
        domain: domain,
        address: address,
        uri: uri,
        version: version,
        chainId: chainId,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        statement: statement,
        // No expirationTime
      });

      const messageString = messageNoExpiry.prepareMessage();
      const sig = await account.signMessage({ message: messageString });

      const req = createMockRequest({
        body: { address, message: messageString, signature: sig },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty(
        "error",
        "Message must include expiration time"
      );
    });
    test("returns 400 if expiration time is more than 15 minutes in the future", async () => {
      const { SiweMessage } = await import("siwe");
      const { privateKeyToAccount } = await import("viem/accounts");

      const testPrivateKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const account = privateKeyToAccount(testPrivateKey as `0x${string}`);

      const messageTooLongExpiry = new SiweMessage({
        domain: domain,
        address: address,
        uri: uri,
        version: version,
        chainId: chainId,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes in the future
        statement: statement,
      });

      const messageString = messageTooLongExpiry.prepareMessage();
      const sig = await account.signMessage({ message: messageString });

      const req = createMockRequest({
        body: { address, message: messageString, signature: sig },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData()).toHaveProperty(
        "error",
        "Message expiration time must be within 15 minutes"
      );
    });
    test("returns 401 if signature has expired", async () => {
      const { SiweMessage } = await import("siwe");
      const { privateKeyToAccount } = await import("viem/accounts");

      const testPrivateKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const account = privateKeyToAccount(testPrivateKey as `0x${string}`);

      const expiredMessage = new SiweMessage({
        domain: domain,
        address: address,
        uri: uri,
        version: version,
        chainId: chainId,
        nonce: nonce,
        issuedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Issued 1 hour ago
        expirationTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // Expired 30 minutes ago
        statement: statement,
      });

      const expiredMessageString = expiredMessage.prepareMessage();
      const expiredSignature = await account.signMessage({
        message: expiredMessageString,
      });

      const req = createMockRequest({
        body: {
          address,
          message: expiredMessageString,
          signature: expiredSignature,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(401);
      expect(getData().error).toMatch(/expired|Verification failed/i);
    });

    test("returns 200 when user already exists in database", async () => {
      // Mock findOne to return an existing user
      const existingUser = { address: address.toLowerCase(), rating: 4.5 };
      (mockUserSchema.findOne as any) = mock(async () => existingUser);

      const req = createMockRequest({
        body: { address, message, signature },
      });
      const { res, getStatus, getData } = createMockResponse();

      await verifySignature(req as any, res as any);

      expect(getStatus()).toBe(200);
      expect(getData()).toHaveProperty("token");
      expect(typeof getData().token).toBe("string");

      // Reset mock back to null for other tests
      (mockUserSchema.findOne as any) = mock(async () => null);
    });
  });

  describe("logout", () => {
    test("should return 200 and success message", async () => {
      const req = createMockRequest({
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await logout(req as any, res as any);

      expect(getStatus()).toBe(200);
      expect(getData()).toHaveProperty("success", "User logged out");
    });

    test("should return 500 if an error occurs during logout", async () => {
      // Mock nonceStore.delete to throw an error
      const originalDelete = nonceStore.delete;
      nonceStore.delete = mock(() => {
        throw new Error("Database connection failed");
      });

      const req = createMockRequest({
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await logout(req as any, res as any);

      expect(getStatus()).toBe(500);
      expect(getData()).toHaveProperty("error", "Logout failed");

      // Restore original function
      nonceStore.delete = originalDelete;
    });

    test("should return 200 even without user address", async () => {
      const req = createMockRequest({
        user: undefined,
      });
      const { res, getStatus, getData } = createMockResponse();

      await logout(req as any, res as any);

      expect(getStatus()).toBe(200);
      expect(getData()).toHaveProperty("success", "User logged out");
    });
  });
});
