import express from "express";
import {
  createTicketDeal,
  getAllOpenDeals,
  getAllDisputedDeals,
  getDealById,
  getUserDeals,
  buyerClaimDeal,
  disputeDeal,
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
  authMiddleware,
  (req, res, next) => {
    console.log("Before multer - Content-Type:", req.headers["content-type"]);
    console.log("Before multer - body:", req.body);
    next();
  },
  fileUpload.single("image"),
  (req, res, next) => {
    console.log("After multer - file:", req.file);
    console.log("After multer - body:", req.body);
    next();
  },
  handleUploadErrors,
  uploadSellerProof
);
router.post(
  "/dispute-deal",
  blockchainCallLimiter,
  authMiddleware,
  disputeDeal
);
router.post("/confirm-delivery", authLimiter, authMiddleware, confirmDelivery);

export default router;
