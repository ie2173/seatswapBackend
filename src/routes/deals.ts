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
  confirmDelivery,
  getClaimedDealDetails,
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
router.get("/claimed-deal", authMiddleware, getClaimedDealDetails);

// protected routes
router.post("/list-tickets", authLimiter, authMiddleware, createTicketDeal);
router.post("/claim-deal", authLimiter, authMiddleware, buyerClaimDeal);
router.post(
  "/seller-proof",
  authLimiter,
  authMiddleware,
  fileUpload.single("image"),
  handleUploadErrors,
  uploadSellerProof
);
router.post(
  "/dispute-deal",
  blockchainCallLimiter,
  authMiddleware,
  disputeDeal
);
router.post("/complete-deal", authMiddleware, completeDeal);
router.post("/confirm-delivery", authLimiter, authMiddleware, confirmDelivery);

export default router;
