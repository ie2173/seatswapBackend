import { describe, test, expect, beforeEach } from "bun:test";
import { generateNonce } from "../siwe";

describe("generateNonce", () => {
  test("should generate a nonce with default length", () => {
    const nonce = generateNonce();
    expect(typeof nonce).toBe("string");
    expect(nonce.length).toBe(32); // 16 bytes = 32 hex characters
  });

  test("should generate a nonce with custom length", () => {
    const nonce = generateNonce(32);
    expect(typeof nonce).toBe("string");
    expect(nonce.length).toBe(64); // 32 bytes = 64 hex characters
  });

  test("should generate unique nonces", () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    expect(nonce1).not.toBe(nonce2);
  });

  test("should generate hex string", () => {
    const nonce = generateNonce();
    const hexRegex = /^[0-9a-f]+$/;
    expect(hexRegex.test(nonce)).toBe(true);
  });

  test("should handle small length", () => {
    const nonce = generateNonce(1);
    expect(nonce.length).toBe(2); // 1 byte = 2 hex characters
  });

  test("should handle large length", () => {
    const nonce = generateNonce(128);
    expect(nonce.length).toBe(256); // 128 bytes = 256 hex characters
  });

  test("should generate different nonces on repeated calls", () => {
    const nonces = new Set();
    for (let i = 0; i < 100; i++) {
      nonces.add(generateNonce());
    }
    expect(nonces.size).toBe(100);
  });
});
