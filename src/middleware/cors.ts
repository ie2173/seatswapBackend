import cors from "cors";

// Allowed production and dev origins
const allowedOrigins = [
  "https://seatswap.net",
  "https://www.seatswap.net",
  "http://localhost:5173", // Vite default
  "http://127.0.0.1:5173",
];

// CORS options: respond to preflight and real requests, allow Authorization header
const corsOptions = {
  origin(origin: any, callback: any) {
    // allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // otherwise, reject
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true, // set true only if you use cookies/sessions
  optionsSuccessStatus: 204, // some legacy browsers choke on 204 with no content
  preflightContinue: false, // let cors() handle the response
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
