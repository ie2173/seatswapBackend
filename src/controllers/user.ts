import type {
  ExpressRequestWithUser,
  ExpressResponseWithUser,
  AsyncExpressResponseWithUser,
} from "@/types";
import Deal from "@/models/deals";
import User from "@/models/users";
import { geometricMean } from "@/utils";

export const addEmail = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    const { email } = req.body;
    const address = req.user?.address;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!address) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Find the user by address
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the email is already in use by another user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    // Update the user's email
    user.email = email;
    await user.save();

    return res
      .status(200)
      .json({ message: "Email added successfully", email: user.email });
  } catch (error) {
    console.error("Error adding email:", error);
    return res.status(500).json({ error: "Failed to add email" });
  }
};

export const getUserInfo = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const userProfile = await User.findOne({
      address: address.toLowerCase(),
    });

    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return res.status(500).json({ error: "Failed to fetch user info" });
  }
};

export const giveRating = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    const { user, rating, dealId } = req.body;

    if (!user || !rating || !dealId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    const seller = await User.findById(deal.seller);
    if (seller && seller.rating) {
      seller.rating.values.push(rating);
      seller.rating.rating = geometricMean(seller.rating.values);
      await seller.save();
      return res.status(200).json({ message: "Rating added successfully" });
    }
    return res.status(404).json({ error: "Seller not found" });
  } catch (error) {
    console.error("Error giving rating:", error);
    return res.status(500).json({ error: "Failed to give rating" });
  }
};
