import { describe, test, expect, beforeAll, afterAll, mock } from "bun:test";
import { addEmail, getUserInfo, giveRating } from "../user";
import { createMockRequest, createMockResponse } from "../../../test/helpers";

describe("User Controller", () => {
  describe("addEmail", () => {
    test("should return 400 if email is missing", async () => {
      const req = createMockRequest({
        body: {},
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await addEmail(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Email is required");
    });

    test("should return 400 if email format is invalid", async () => {
      const req = createMockRequest({
        body: { email: "invalid-email" },
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await addEmail(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Invalid email format");
    });

    test("should return 400 for email without @", async () => {
      const req = createMockRequest({
        body: { email: "invalidemail.com" },
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await addEmail(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Invalid email format");
    });

    test("should return 400 for email without domain", async () => {
      const req = createMockRequest({
        body: { email: "test@" },
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await addEmail(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Invalid email format");
    });

    test("should return 400 for email with spaces", async () => {
      const req = createMockRequest({
        body: { email: "test @example.com" },
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await addEmail(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Invalid email format");
    });

    test("should return 401 if user is not authenticated", async () => {
      const req = createMockRequest({
        body: { email: "test@example.com" },
        user: undefined,
      });
      const { res, getStatus, getData } = createMockResponse();

      await addEmail(req as any, res as any);

      expect(getStatus()).toBe(401);
      expect(getData().error).toBe("User not authenticated");
    });

    // Note: Tests that interact with database would need mocking or test database
  });

  describe("getUserInfo", () => {
    test("should return 400 if address is missing from body", async () => {
      const req = createMockRequest({ body: {} });
      const { res, getStatus, getData } = createMockResponse();

      await getUserInfo(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Address is required");
    });

    // Note: Full tests would require database mocking
  });

  describe("giveRating", () => {
    test("should return 400 if user is missing", async () => {
      const req = createMockRequest({
        body: { rating: 5, dealId: "123" },
      });
      const { res, getStatus, getData } = createMockResponse();

      await giveRating(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });

    test("should return 400 if rating is missing", async () => {
      const req = createMockRequest({
        body: { user: { address: "0x123" }, dealId: "123" },
      });
      const { res, getStatus, getData } = createMockResponse();

      await giveRating(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });

    test("should return 400 if dealId is missing", async () => {
      const req = createMockRequest({
        body: { user: { address: "0x123" }, rating: 5 },
      });
      const { res, getStatus, getData } = createMockResponse();

      await giveRating(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });

    // Note: Full tests would require database mocking
  });
});
