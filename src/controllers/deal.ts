import type {
  ExpressRequestWithUser,
  ExpressResponseWithUser,
  AsyncExpressResponseWithUser,
  Address,
  Hash,
} from "@/types";
import Deal from "@/models/deals";
import User from "@/models/users";
import { uploadToS3, confirmConfimation } from "@/utils";
import { publicClient, walletClient } from "@/config";
import { seatSwapFactoryContract } from "@/constants";

/**
 * Create a new sell ticket deal to upload to the mongo database
 * @param title - The title of the deal
 * @param quantity - The quantity of tickets being sold
 * @param price - The price per ticket
 * @param escrowAddress - The address of the escrow contract
 * @returns message - A success message
 * @throws 400 - If any required fields are missing
 * */
export const createTicketDeal = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  const { title, quantity, price, escrowAddress, contractId } = req.body;
  const address = req.user?.address;

  // check that all vars are included in req.body
  if (!title || !quantity || !price || !escrowAddress || !contractId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!address) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    // Find the user by address
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Create new deal document
    const newDeal = new Deal({
      title,
      contractId,
      quantity,
      price,
      seller: user._id,
      escrowAddress,
      status: "open",
    });

    // Save to database
    await newDeal.save();

    // Add deal to user's sellerDeals array
    user.sellerDeals = user.sellerDeals || [];
    user.sellerDeals.push(newDeal._id);
    await user.save();

    // return success so frontend knows it works.
    return res.status(201).json({
      success: true,
      message: "Deal created successfully",
      deal: newDeal,
    });
  } catch (error) {
    console.error("Error creating deal:", error);
    return res.status(500).json({ error: "Failed to create deal" });
  }
};

/**
 * Get all open deals from the database
 * @returns data - An array of open deals
 * @throws 500 - If there is an error fetching the deals
 */
export const getAllOpenDeals = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    const deals = await Deal.find({ status: "open" }).populate(
      "seller",
      "address"
    );
    console.log("Fetched deals:", deals);
    return res.status(200).json({ success: true, data: deals });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return res.status(500).json({ error: "Failed to fetch deals" });
  }
};

/**
 * Get all disputed deals from the database
 * @returns data - An array of disputed deals
 * @throws 500 - If there is an error fetching the disputed deals
 */
export const getAllDisputedDeals = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    const deals = await Deal.find({ status: "disputed" }).populate(
      "seller",
      "address"
    );
    console.log("Fetched disputed deals:", deals);
    return res.status(200).json({ success: true, data: deals });
  } catch (error) {
    console.error("Error fetching disputed deals:", error);
    return res.status(500).json({ error: "Failed to fetch disputed deals" });
  }
};

/**
 * Get a deal by its ID
 * @param id - The ID of the deal to fetch
 * @returns data - The deal with the specified ID
 * @throws 400 - If the deal ID is missing
 * @throws 404 - If the deal is not found
 * @throws 500 - If there is an error fetching the deal
 */
export const getDealById = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  const { dealId } = req.query;
  if (!dealId) {
    return res.status(400).json({ error: "Missing deal ID" });
  }

  try {
    const deal = await Deal.findById(dealId as string)
      .populate("seller", "address email ensName")
      .populate("buyer", "address email ensName");
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    return res.status(200).json({ success: true, deal: deal });
  } catch (error) {
    console.error("Error fetching deal:", error);
    return res.status(500).json({ error: "Failed to fetch deal" });
  }
};

/**
 * Get all deals for a specific user
 * @param address - The Ethereum address of the user
 * @returns data - An array of deals associated with the user
 * @throws 400 - If the user address is missing
 * @throws 404 - If the user is not found
 * @throws 500 - If there is an error fetching the user's deals
 */
export const getUserDeals = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: "Missing user address" });
  }

  try {
    const user = await User.findOne({
      address: address.toLowerCase(),
    }).populate("sellerDeals buyerDeals");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const deals = [...(user.sellerDeals || []), ...(user.buyerDeals || [])];
    return res.status(200).json({ success: true, data: deals });
  } catch (error) {
    console.error("Error fetching user deals:", error);
    return res.status(500).json({ error: "Failed to fetch user deals" });
  }
};

/**
 * Buyer claims a deal
 * @param id - The ID of the deal to claim
 * @param EscrowAddress - The Address to the escrowContract created
 * @returns message - A success message
 * @throws 400 - If any required fields are missing or if the deal is not open
 * @throws 404 - If the deal or buyer is not found
 * @throws 500 - If there is an error claiming the deal
 */
export const buyerClaimDeal = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    const { id, escrowContract } = req.body;
    const address = req.user?.address;
    if (!id || !escrowContract || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (deal.status !== "open") {
      return res.status(400).json({ error: "Deal is not open" });
    }

    const buyer = await User.findOne({ address: address.toLowerCase() });
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    await Deal.updateOne(
      { _id: id },
      {
        $set: {
          buyer: buyer._id,
          escrowAddress: escrowContract,
          status: "claimed",
        },
      }
    );

    await User.updateOne(
      { _id: buyer._id },
      { $push: { buyerDeals: deal._id } }
    );

    return res.status(200).json({ success: true, message: "Claimed deal" });
  } catch (error) {
    console.error("Error claiming deal:", error);
    return res.status(500).json({ error: "Failed to claim deal" });
  }
};

/**
 * Seller uploads proof of delivery to the database via a image uploaded to AWS S3
 * @param id - The ID of the deal to upload proof for
 * @param proofUrl - The URL of the uploaded proof image
 * @returns message - A success message
 * @throws 400 - If any required fields are missing or if the deal is not claimed
 * @throws 404 - If the deal is not found
 * @throws 500 - If there is an error uploading the proof
 */
export const uploadSellerProof = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    // defensive parse: req.body may be undefined if body-parsers/multer ordering
    const body = req.body || {};
    const id =
      (body as any).id || (req.query && (req.query.dealId || req.query.id));
    const confirmationTxHash = (body as any).confirmationTxHash;
    const image = req.file;
    const address = req.user?.address;

    if (!id || !image || !address) {
      console.log("[uploadSellerProof] Missing fields", {
        id,
        imageExists: !!image,
        address,
      });
      return res.status(400).json({ error: "Missing required fields" });
    }
    const deal = await Deal.findById(id).populate("seller");
    if (!deal || deal.status !== "claimed") {
      return res.status(404).json({ error: "Deal not found" });
    }
    if ((deal.seller as any).address.toLowerCase() !== address.toLowerCase()) {
      return res
        .status(403)
        .json({ error: "User not authorized to upload proof" });
    }

    // Upload proof to S3
    const s3Key = `proofs/${id}/${Date.now()}/Seller`;
    const proofUrl = await uploadToS3({ file: image, key: s3Key });

    const sellersProofObject: any = {
      url: proofUrl.url,
      updatedAt: new Date(),
    };
    if (confirmationTxHash) {
      sellersProofObject.confirmationTxHash = confirmationTxHash;
    }

    await Deal.updateOne(
      { _id: id },
      { $set: { sellerProof: sellersProofObject, status: "proof_uploaded" } }
    );
    return res
      .status(200)
      .json({ success: true, message: "Proof uploaded successfully" });
  } catch (error) {
    console.error("Error uploading proof:", error);
    return res.status(500).json({ error: "Failed to upload proof" });
  }
};

/**
 * Buyer confirms that the seller has released the tickets to the buyer.
 * @param id - The ID of the deal to complete
 * @param txId - Optional transaction ID of the buyer's payment
 * @returns message - A success message
 * @throws 400 - If any required fields are missing or if the deal is not claimed
 * @throws 404 - If the deal is not found
 * @throws 500 - If there is an error confirming delivery
 */
export const confirmDelivery = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    console.log("[confirmDelivery] Request received");
    console.log("[confirmDelivery] Request body:", req.body);
    const body = req.body || {};
    const { id, dealId, txId } = body;
    const finalId = id || dealId; // Accept either 'id' or 'dealId'
    const address = req.user?.address;

    console.log("[confirmDelivery] Debug:", {
      id,
      dealId,
      finalId,
      txId,
      hasUser: !!req.user,
      address: address,
      rawBody: body,
    });

    if (!finalId || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const deal = await Deal.findById(finalId).populate("buyer");
    if (
      !deal ||
      (deal.status !== "claimed" && deal.status !== "proof_uploaded")
    ) {
      return res.status(404).json({ error: "Deal not found" });
    }
    if ((deal.buyer as any).address.toLowerCase() !== address.toLowerCase()) {
      return res
        .status(403)
        .json({ error: "User not authorized to confirm delivery" });
    }

    const updateData: any = { status: "completed" };
    if (txId) {
      updateData.buyerTransaction = txId;
    }

    await Deal.updateOne({ _id: finalId }, { $set: updateData });
    return res
      .status(200)
      .json({ success: true, message: "Delivery confirmed" });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    return res.status(500).json({ error: "Failed to confirm delivery" });
  }
};

/**
 * Get detailed information about a claimed deal including buyer/seller info and proof
 * This is useful for the claimed deals section where both parties need to see each other's info
 * @param dealId - The ID of the deal to get details for
 * @returns deal - Full deal details with populated buyer and seller info including emails
 */
export const getClaimedDealDetails = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    const { dealId } = req.query;
    const address = req.user?.address;

    if (!dealId) {
      return res.status(400).json({ error: "Missing deal ID" });
    }

    if (!address) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const deal = await Deal.findById(dealId as string)
      .populate("seller", "address email ensName rating")
      .populate("buyer", "address email ensName rating");

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Verify that the requesting user is either the buyer or seller
    const isBuyer =
      deal.buyer &&
      (deal.buyer as any).address.toLowerCase() === address.toLowerCase();
    const isSeller =
      (deal.seller as any).address.toLowerCase() === address.toLowerCase();

    if (!isBuyer && !isSeller) {
      return res
        .status(403)
        .json({ error: "User not authorized to view this deal" });
    }

    // Format response with all relevant info for claimed deals section
    const response = {
      deal: {
        _id: deal._id,
        title: deal.title,
        contractId: deal.contractId,
        quantity: deal.quantity,
        price: deal.price,
        status: deal.status,
        escrowAddress: deal.escrowAddress,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        seller: deal.seller,
        buyer: deal.buyer,
        sellerProof: deal.sellerProof,
        completedTxHash: deal.completedTxHash,
      },
      userRole: isBuyer ? "buyer" : "seller",
    };

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching claimed deal details:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch claimed deal details" });
  }
};

/**
 * Buyer disputes a deal
 * @param id - The ID of the deal to dispute
 * @returns message - A success message
 * @throws 400 - If any required fields are missing or if the deal is not claimed
 * @throws 404 - If the deal or buyer is not found
 * @throws 500 - If there is an error disputing the deal
 */
export const disputeDeal = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    console.log("[disputeDeal] Request received");
    console.log("[disputeDeal] Request body:", req.body);
    // defensive parse: req.body may be undefined if body-parsers/multer ordering
    const body = req.body || {};
    const id =
      body.dealId ||
      body.id ||
      (req.query && (req.query.dealId || req.query.id));
    const address = req.user?.address;
    console.log("[disputeDeal] Debug:", {
      id,
      hasUser: !!req.user,
      address: address,
      rawBody: body,
    });

    if (!id || !address) {
      console.log("[disputeDeal] Missing fields", { id, address });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // get deal schema by id
    const deal = await Deal.findById(id).populate("buyer seller");
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    const userAddress = address.toLowerCase();
    const isBuyer =
      deal.buyer && (deal.buyer as any).address?.toLowerCase() === userAddress;
    const isSeller =
      (deal.seller as any).address?.toLowerCase() === userAddress;

    if (!isBuyer && !isSeller) {
      return res
        .status(403)
        .json({ error: "Only buyer or seller can dispute this deal" });
    }

    await Deal.updateOne({ _id: id }, { $set: { status: "disputed" } });

    return res
      .status(200)
      .json({ success: true, message: "Dispute initiated" });
  } catch (error) {
    console.error("Error disputing deal:", error);
    return res.status(500).json({ error: "Failed to dispute deal" });
  }
};

export const resolveDispute = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponseWithUser => {
  try {
    const { id, resolution } = req.body;
    const address = req.user?.address;
    if (!id || !resolution || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    return res.status(200).json({ success: true, message: "Dispute resolved" });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    return res.status(500).json({ error: "Failed to resolve dispute" });
  }
};
