import express from "express";
import {
  getNonce,
  verifySignature,
  logout,
  verifyJwt,
} from "@/controllers/auth";
import { authLimiter } from "@/middleware";

const router = express.Router();
router.post("/nonce", getNonce);
router.post("/verify", authLimiter, verifySignature);
router.post("/logout", logout);
router.post("/verifyAuth", verifyJwt);

export default router;
