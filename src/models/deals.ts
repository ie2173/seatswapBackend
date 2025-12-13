import mongoose from "mongoose";
import { unique } from "viem/chains";

const dealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  contractId: { type: Number },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  disputeInitiator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  disputeReason: { type: String },
  disputeWinner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["open", "completed", "cancelled", "disputed", "pending"],
    default: "open",
  },
  sellerProof: {
    url: { type: String },
    confirmationTxHash: { type: String, unique: true, sparse: true },
    updatedAt: { type: Date },
  },
  buyerPaymentProof: { type: String, unique: true, sparse: true },
  completedTxHash: { type: String, unique: true, sparse: true },
  escrowAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Deal", dealSchema);
