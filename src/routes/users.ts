import express from "express";
import { addEmail, getUserInfo, giveRating, getMyDeals } from "@/controllers";
import { authMiddleware, authLimiter } from "@/middleware";

const router = express.Router();

// Protected routes
router.post("/add-email", authLimiter, authMiddleware, addEmail);
router.post("/give-rating", authLimiter, authMiddleware, giveRating);
router.get("/my-deals", authLimiter, authMiddleware, getMyDeals);

// Public routes
router.post("/info", getUserInfo);

export default router;
