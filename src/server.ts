import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { MongoDBConnection } from "@config";
import { errorHandler, apiLimiter, corsMiddleware } from "@middleware";
import { authRoutes, dealRoutes, userRoutes } from "@routes";

if (!process.env.RAILWAY_ENVIRONMENT) {
  require("dotenv").config();
}

// express app
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

//Database
MongoDBConnection();

// middleware
app.use(apiLimiter);
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/auth", authRoutes);
app.use("/deals", dealRoutes);
app.use("/users", userRoutes);
app.get("/health", (req: Request, res: Response) => {
  res.json({
    message: "Healthy",
    timestamp: new Date(),
    version: "1.0.0",
    endpoints: {
      "/health": "get - check server health",
      "/auth": {
        "/nonce": "get - generate a nonce for SIWE authentication",
        "/verify": "post - verify SIWE message and signature",
        "/logout": "post - logout the user",
      },
    },
  });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: "Endpoint Not Found",
    path: req.path,
  });
});

// Global error handler
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export { app, server };
