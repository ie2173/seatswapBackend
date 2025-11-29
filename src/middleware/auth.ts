import type { MiddlewareProps } from "@/types";
import jwt from "jsonwebtoken";
import type { Address } from "viem";

/**
 * Middleware to authenticate requests using JWT tokens.
 * It checks for the presence of a Bearer token in the Authorization header,
 * verifies the token, and attaches the decoded user information to the request object.
 * @param req - The Express request object, extended with an optional user property.
 * @param res - The Express response object, extended with an optional user property.
 * @param next - The next middleware function in the Express pipeline.
 * @returns A 401 Unauthorized response if the token is missing or invalid, otherwise calls next().
 */

const authMiddleware = async (
  req: MiddlewareProps["req"],
  res: MiddlewareProps["res"],
  next: MiddlewareProps["next"]
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      address: Address;
      chainId: number;
      isAdmin?: boolean;
    };
    req.user = {
      address: decoded.address,
      chainId: decoded.chainId,
      isAdmin: decoded.isAdmin || false,
    };
    next();
  } catch (error) {
    console.error("Error in auth middleware:", error);
    return res.status(401).json({ error: "Invalid Token" });
  }
};

export default authMiddleware;
