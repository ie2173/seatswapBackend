import type { MiddlewareProps } from "@/types";

const errorHandler = (
  err: any,
  req: MiddlewareProps["req"],
  res: MiddlewareProps["res"],
  next: MiddlewareProps["next"]
) => {
  console.error("Error in errorHandler middleware:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
