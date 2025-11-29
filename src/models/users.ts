import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  blacklisted: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  address: { type: String, required: true, unique: true },
  ensName: { type: String, required: false },
  email: { type: String, required: false, unique: true, sparse: true },
  rating: {
    rating: { type: Number, required: false },
    values: [{ type: Number, required: false }],
  },
  sellerDeals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
  buyerDeals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // add here for seller and buyer deals, they will be arrays of deal schema.
});

export default mongoose.model("User", dealSchema);
