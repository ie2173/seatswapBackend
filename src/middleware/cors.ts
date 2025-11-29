import cors from "cors";

const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
});

export default corsMiddleware;
