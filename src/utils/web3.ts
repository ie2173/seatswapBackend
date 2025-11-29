import { publicClient } from "@/config";
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
