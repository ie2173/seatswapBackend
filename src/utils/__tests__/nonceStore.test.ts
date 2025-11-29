import { describe, test, expect, beforeEach } from "bun:test";
import { nonceStore } from "../nonceStore";

describe("NonceStore", () => {
  const testAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const testNonce = "test-nonce-123";

  beforeEach(() => {
    // Clear any existing nonces
    nonceStore.delete({ address: testAddress });
  });

  describe("set", () => {
    test("should store a nonce with default TTL", () => {
      nonceStore.set({ address: testAddress, nonce: testNonce });
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(testNonce);
    });

    test("should store a nonce with custom TTL", () => {
      nonceStore.set({
        address: testAddress,
        nonce: testNonce,
        ttlSeconds: 300,
      });
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(testNonce);
    });

    test("should normalize address to lowercase", () => {
      const upperAddress = testAddress.toUpperCase() as `0x${string}`;
      nonceStore.set({ address: upperAddress, nonce: testNonce });
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(testNonce);
    });

    test("should overwrite existing nonce", () => {
      nonceStore.set({ address: testAddress, nonce: "old-nonce" });
      nonceStore.set({ address: testAddress, nonce: testNonce });
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(testNonce);
    });
  });

  describe("get", () => {
    test("should return nonce for valid address", () => {
      nonceStore.set({ address: testAddress, nonce: testNonce });
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(testNonce);
    });

    test("should return null for non-existent address", () => {
      const retrieved = nonceStore.get({
        address: "0x0000000000000000000000000000000000000000",
      });
      expect(retrieved).toBe(null);
    });

    test("should return null for expired nonce", async () => {
      nonceStore.set({ address: testAddress, nonce: testNonce, ttlSeconds: 1 });
      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(null);
    });

    test("should normalize address to lowercase when getting", () => {
      nonceStore.set({ address: testAddress, nonce: testNonce });
      const retrieved = nonceStore.get({
        address: testAddress.toUpperCase() as `0x${string}`,
      });
      expect(retrieved).toBe(testNonce);
    });

    test("should delete expired nonce when accessed", async () => {
      nonceStore.set({ address: testAddress, nonce: testNonce, ttlSeconds: 1 });
      await new Promise((resolve) => setTimeout(resolve, 1100));
      nonceStore.get({ address: testAddress });
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(null);
    });
  });

  describe("delete", () => {
    test("should delete existing nonce", () => {
      nonceStore.set({ address: testAddress, nonce: testNonce });
      nonceStore.delete({ address: testAddress });
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(null);
    });

    test("should not throw error when deleting non-existent nonce", () => {
      expect(() => {
        nonceStore.delete({
          address: "0x0000000000000000000000000000000000000000",
        });
      }).not.toThrow();
    });

    test("should normalize address when deleting", () => {
      nonceStore.set({ address: testAddress, nonce: testNonce });
      nonceStore.delete({
        address: testAddress.toUpperCase() as `0x${string}`,
      });
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(null);
    });
  });

  describe("cleanup", () => {
    test("should not affect valid nonces", async () => {
      nonceStore.set({
        address: testAddress,
        nonce: testNonce,
        ttlSeconds: 1000,
      });
      // Wait a bit but not long enough for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));
      const retrieved = nonceStore.get({ address: testAddress });
      expect(retrieved).toBe(testNonce);
    });
  });

  describe("multiple addresses", () => {
    test("should handle multiple addresses independently", () => {
      const address1 = "0x1111111111111111111111111111111111111111";
      const address2 = "0x2222222222222222222222222222222222222222";
      const nonce1 = "nonce-1";
      const nonce2 = "nonce-2";

      nonceStore.set({ address: address1, nonce: nonce1 });
      nonceStore.set({ address: address2, nonce: nonce2 });

      expect(nonceStore.get({ address: address1 })).toBe(nonce1);
      expect(nonceStore.get({ address: address2 })).toBe(nonce2);
    });

    test("should delete specific address without affecting others", () => {
      const address1 = "0x1111111111111111111111111111111111111111";
      const address2 = "0x2222222222222222222222222222222222222222";
      const nonce1 = "nonce-1";
      const nonce2 = "nonce-2";

      nonceStore.set({ address: address1, nonce: nonce1 });
      nonceStore.set({ address: address2, nonce: nonce2 });
      nonceStore.delete({ address: address1 });

      expect(nonceStore.get({ address: address1 })).toBe(null);
      expect(nonceStore.get({ address: address2 })).toBe(nonce2);
    });
  });
});
