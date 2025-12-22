import { publicClient, walletClient } from "@/config";
import { decodeEventLog } from "viem";
import type { Address, Hash } from "viem";
import { seatSwapFactoryContract, seatSwapEscrowContract } from "@/constants";

export type ConfirmConfirmationParams = {
  user: Address;
  transactionId: number;
  escrowAddress: Address;
  txHash: Hash;
};
type ConfirmConfirmationResponse = {
  confirmed: boolean;
};

export type AsyncConfirmConfirmationResponse =
  Promise<ConfirmConfirmationResponse>;

export const confirmConfimation = async ({
  user,
  transactionId,
  escrowAddress,
  txHash,
}: ConfirmConfirmationParams): AsyncConfirmConfirmationResponse => {
  try {
    const txReceipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const confirmationLogs = txReceipt.logs.filter((log) => {
      if (log.address.toLowerCase() !== escrowAddress.toLowerCase()) {
        return false;
      }
      const decodedLog = decodeEventLog({
        abi: seatSwapEscrowContract,
        data: log.data,
        topics: log.topics,
      });
      if (!decodedLog) return false;
      if (decodedLog.eventName !== "TxConfirmed") return false;
      if (decodedLog.args.transactionId !== BigInt(transactionId)) return false;
      if (decodedLog.args.confirmee.toLowerCase() !== user.toLowerCase())
        return false;
      return true;
    });
    if (confirmationLogs.length === 0) {
      return { confirmed: false };
    }
    return { confirmed: true };
  } catch (error) {
    console.error("Error confirming delivery:", error);
    throw new Error("Failed to confirm delivery");
  }
};

export type SettleDealParams = {
  contractId: number;
};

export type SettleDealResponse = {
  success: boolean;
  txHash?: Hash;
  error?: string;
};

export type AsyncSettleDealResponse = Promise<SettleDealResponse>;

/**
 * Calls sellerConfirm on the Factory contract to confirm delivery on-chain
 * Seller must call this after uploading proof of delivery
 */
export const confirmSellerDelivery = async ({
  contractId,
}: SettleDealParams): AsyncSettleDealResponse => {
  try {
    console.log(
      "[confirmSellerDelivery] Calling sellerConfirm for contractId:",
      contractId
    );

    // Call sellerConfirm on the Factory contract
    const txHash = await walletClient.writeContract({
      address: seatSwapFactoryContract.address,
      abi: seatSwapFactoryContract.ABI,
      functionName: "sellerConfirm",
      args: [BigInt(contractId)],
    });

    console.log("[confirmSellerDelivery] Transaction sent:", txHash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status !== "success") {
      console.error("[confirmSellerDelivery] Transaction failed:", receipt);
      return {
        success: false,
        error: "Blockchain transaction failed",
      };
    }

    console.log("[confirmSellerDelivery] Transaction confirmed:", txHash);
    return {
      success: true,
      txHash,
    };
  } catch (error) {
    console.error("[confirmSellerDelivery] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Calls buyerConfirm on the Factory contract to settle the deal on-chain
 * This triggers the escrow to release funds when both parties have confirmed
 */
export const settleDeal = async ({
  contractId,
}: SettleDealParams): AsyncSettleDealResponse => {
  try {
    console.log(
      "[settleDeal] Calling buyerConfirm for contractId:",
      contractId
    );

    // Call buyerConfirm on the Factory contract
    const txHash = await walletClient.writeContract({
      address: seatSwapFactoryContract.address,
      abi: seatSwapFactoryContract.ABI,
      functionName: "buyerConfirm",
      args: [BigInt(contractId)],
    });

    console.log("[settleDeal] Transaction sent:", txHash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status !== "success") {
      console.error("[settleDeal] Transaction failed:", receipt);
      return {
        success: false,
        error: "Blockchain transaction failed",
      };
    }

    console.log("[settleDeal] Transaction confirmed:", txHash);
    return {
      success: true,
      txHash,
    };
  } catch (error) {
    console.error("[settleDeal] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
