import { describe, test, expect, mock } from "bun:test";
import authMiddleware from "../auth";
import type { Request, Response, NextFunction } from "express";

describe("Auth Middleware", () => {
  const createMockReq = (overrides: any = {}): Request => {
    return {
      headers: {},
      user: undefined,
      ...overrides,
    } as Request;
  };

  const createMockRes = (): Response => {
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.jsonData = data;
        return this;
      },
    };
    return res as Response;
  };

  const createMockNext = (): NextFunction => {
    return mock(() => {});
  };

  test("should return 401 if no authorization header", async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect((res as any).jsonData.error).toBe("No token provided");
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 401 if authorization header does not start with Bearer", async () => {
    const req = createMockReq({
      headers: { authorization: "Basic token123" },
    });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect((res as any).jsonData.error).toBe("No token provided");
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 401 if token is invalid", async () => {
    const req = createMockReq({
      headers: { authorization: "Bearer invalid-token" },
    });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect((res as any).jsonData.error).toBe("Invalid Token");
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 401 if JWT_SECRET is not configured", async () => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "";

    const req = createMockReq({
      headers: { authorization: "Bearer some-token" },
    });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);

    // Restore original secret
    process.env.JWT_SECRET = originalSecret;
  });

  // Note: Testing valid JWT would require generating a real token with jwt.sign()
  // which would need the actual JWT_SECRET from environment
});
