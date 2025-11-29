import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { app, server } from "../src/server";

const BASE_URL = "http://localhost:3000";

beforeAll(() => {
  console.log("Starting server for tests...");
});

afterAll(() => {
  server.close();
  console.log("Test Completed, server closed.");
});

describe('GET "/health" endpoint healthcheck', () => {
  test("should return status 200 and expected JSON response", async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("message", "Healthy");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("version", "1.0.0");
    expect(data).toHaveProperty("endpoints");
  });
});

describe('POST "/auth/nonce" endpoint', () => {
  const address = "0x47dd61a239ad544f95d16ef3dbee88a4e7d0b73f";

  test("should return status 200 and a nonce", async () => {
    const response = await fetch(`${BASE_URL}/auth/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = (await response.json()) as { nonce: string };
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("nonce");
    expect(typeof data.nonce).toBe("string");
  });
  test("should return status 400 for missing address", async () => {
    const response = await fetch(`${BASE_URL}/auth/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error", "Proper Address is required");
  });
});
