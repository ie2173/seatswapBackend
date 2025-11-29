import cors from "cors";

const corsMiddleware = cors({
  origin: [
    "http://seatswap.net",
    "https://seatswap.net",
    "http://www.seatswap.net",
    "https://www.seatswap.net",
  ],
  credentials: true,
});

export default corsMiddleware;
