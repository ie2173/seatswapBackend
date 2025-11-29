import type { MiddlewareProps } from "@/types";

/**
 * Middleware to check if the authenticated user is an admin.
 * Must be used AFTER authMiddleware.
 * @param req - The Express request object with user property.
 * @param res - The Express response object.
 * @param next - The next middleware function in the Express pipeline.
 * @returns A 403 Forbidden response if the user is not an admin, otherwise calls next().
 */
const adminAuthMiddleware = async (
  req: MiddlewareProps["req"],
  res: MiddlewareProps["res"],
  next: MiddlewareProps["next"]
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Error in admin auth middleware:", error);
    return res.status(403).json({ error: "Access denied" });
  }
};

export default adminAuthMiddleware;
