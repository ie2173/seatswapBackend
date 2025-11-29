import express from "express";
import { addEmail, getUserInfo, giveRating } from "@/controllers";
import { authMiddleware, authLimiter } from "@/middleware";

const router = express.Router();

// Protected routes
router.post("/add-email", authLimiter, authMiddleware, addEmail);
router.post("/give-rating", authLimiter, authMiddleware, giveRating);

// Public routes
router.post("/info", getUserInfo);

export default router;
