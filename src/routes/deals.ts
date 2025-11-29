import express from "express";
import {
  createTicketDeal,
  getAllOpenDeals,
  getAllDisputedDeals,
  getDealById,
  getUserDeals,
  buyerClaimDeal,
  disputeDeal,
  completeDeal,
  uploadSellerProof,
} from "@/controllers";
import {
  authMiddleware,
  fileUpload,
  handleUploadErrors,
  blockchainCallLimiter,
  authLimiter,
} from "@/middleware";
import { file } from "bun";

const router = express.Router();

// public routes
router.get("/open-deals", getAllOpenDeals);
router.get("/disputed-deals", getAllDisputedDeals);
router.get("/deal", getDealById);

// protected routes
router.post("/list-tickets", authLimiter, authMiddleware, createTicketDeal);
router.post("/claim-deal", authLimiter, authMiddleware, buyerClaimDeal);
router.post(
  "/seller-proof",
  authLimiter,
  fileUpload.single("image"),
  handleUploadErrors,
  authMiddleware,
  uploadSellerProof
);
router.post(
  "/dispute-deal",
  blockchainCallLimiter,
  authMiddleware,
  disputeDeal
);
router.post("/complete-deal", authMiddleware, completeDeal);

export default router;
