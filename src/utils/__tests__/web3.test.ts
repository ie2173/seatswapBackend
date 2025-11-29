import { describe, test, expect, mock, beforeEach } from "bun:test";
import { confirmConfimation } from "../web3";
import { createMockTransactionReceipt } from "../../../test/helpers";
import type { Address, Hash } from "viem";

// Mock the public client
const mockWaitForTransactionReceipt = mock(() =>
  Promise.resolve(createMockTransactionReceipt())
);

mock.module("@/config", () => ({
  publicClient: {
    waitForTransactionReceipt: mockWaitForTransactionReceipt,
  },
}));

// Mock viem's decodeEventLog
const mockDecodeEventLog = mock((params: any) => ({
  eventName: "TxConfirmed",
  args: {
    transactionId: BigInt(params.testTransactionId || 123),
    confirmee:
      params.testConfirmee || "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  },
}));

mock.module("viem", () => ({
  decodeEventLog: mockDecodeEventLog,
}));

describe("confirmConfimation", () => {
  const mockUser = "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as Address;
  const mockEscrowAddress =
    "0x1234567890abcdef1234567890abcdef12345678" as Address;
  const mockTxHash = "0xabc123def456" as Hash;

  beforeEach(() => {
    mockWaitForTransactionReceipt.mockClear();
    mockDecodeEventLog.mockClear();
  });

  test("should return confirmed true when valid confirmation found", async () => {
    const receipt = createMockTransactionReceipt({
      logs: [
        {
          address: mockEscrowAddress,
          data: "0x",
          topics: [],
        },
      ],
    });

    mockWaitForTransactionReceipt.mockResolvedValueOnce(receipt);
    mockDecodeEventLog.mockReturnValueOnce({
      eventName: "TxConfirmed",
      args: {
        transactionId: BigInt(123),
        confirmee: mockUser,
      },
    });

    const result = await confirmConfimation({
      user: mockUser,
      transactionId: 123,
      escrowAddress: mockEscrowAddress,
      txHash: mockTxHash,
    });

    expect(result.confirmed).toBe(true);
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({
      hash: mockTxHash,
    });
  });

  test("should return confirmed false when no matching logs found", async () => {
    const receipt = createMockTransactionReceipt({
      logs: [],
    });

    mockWaitForTransactionReceipt.mockResolvedValueOnce(receipt);

    const result = await confirmConfimation({
      user: mockUser,
      transactionId: 123,
      escrowAddress: mockEscrowAddress,
      txHash: mockTxHash,
    });

    expect(result.confirmed).toBe(false);
  });

  test("should filter logs by escrow address", async () => {
    const wrongAddress =
      "0x9999999999999999999999999999999999999999" as Address;
    const receipt = createMockTransactionReceipt({
      logs: [
        {
          address: wrongAddress, // Wrong escrow address
          data: "0x",
          topics: [],
        },
      ],
    });

    mockWaitForTransactionReceipt.mockResolvedValueOnce(receipt);

    const result = await confirmConfimation({
      user: mockUser,
      transactionId: 123,
      escrowAddress: mockEscrowAddress,
      txHash: mockTxHash,
    });

    expect(result.confirmed).toBe(false);
  });

  test("should handle case-insensitive address comparison", async () => {
    const upperCaseEscrow = mockEscrowAddress.toUpperCase() as Address;
    const receipt = createMockTransactionReceipt({
      logs: [
        {
          address: upperCaseEscrow,
          data: "0x",
          topics: [],
        },
      ],
    });

    mockWaitForTransactionReceipt.mockResolvedValueOnce(receipt);
    mockDecodeEventLog.mockReturnValueOnce({
      eventName: "TxConfirmed",
      args: {
        transactionId: BigInt(123),
        confirmee: mockUser.toUpperCase(),
      },
    });

    const result = await confirmConfimation({
      user: mockUser,
      transactionId: 123,
      escrowAddress: mockEscrowAddress,
      txHash: mockTxHash,
    });

    expect(result.confirmed).toBe(true);
  });

  test("should return false when transaction ID does not match", async () => {
    const receipt = createMockTransactionReceipt({
      logs: [
        {
          address: mockEscrowAddress,
          data: "0x",
          topics: [],
        },
      ],
    });

    mockWaitForTransactionReceipt.mockResolvedValueOnce(receipt);
    mockDecodeEventLog.mockReturnValueOnce({
      eventName: "TxConfirmed",
      args: {
        transactionId: BigInt(999), // Wrong transaction ID
        confirmee: mockUser,
      },
    });

    const result = await confirmConfimation({
      user: mockUser,
      transactionId: 123,
      escrowAddress: mockEscrowAddress,
      txHash: mockTxHash,
    });

    expect(result.confirmed).toBe(false);
  });

  test("should return false when confirmee does not match", async () => {
    const wrongUser = "0x9999999999999999999999999999999999999999" as Address;
    const receipt = createMockTransactionReceipt({
      logs: [
        {
          address: mockEscrowAddress,
          data: "0x",
          topics: [],
        },
      ],
    });

    mockWaitForTransactionReceipt.mockResolvedValueOnce(receipt);
    mockDecodeEventLog.mockReturnValueOnce({
      eventName: "TxConfirmed",
      args: {
        transactionId: BigInt(123),
        confirmee: wrongUser, // Wrong user
      },
    });

    const result = await confirmConfimation({
      user: mockUser,
      transactionId: 123,
      escrowAddress: mockEscrowAddress,
      txHash: mockTxHash,
    });

    expect(result.confirmed).toBe(false);
  });

  test("should return false when event name is not TxConfirmed", async () => {
    const receipt = createMockTransactionReceipt({
      logs: [
        {
          address: mockEscrowAddress,
          data: "0x",
          topics: [],
        },
      ],
    });

    mockWaitForTransactionReceipt.mockResolvedValueOnce(receipt);
    mockDecodeEventLog.mockReturnValueOnce({
      eventName: "OtherEvent", // Wrong event
      args: {
        transactionId: BigInt(123),
        confirmee: mockUser,
      },
    });

    const result = await confirmConfimation({
      user: mockUser,
      transactionId: 123,
      escrowAddress: mockEscrowAddress,
      txHash: mockTxHash,
    });

    expect(result.confirmed).toBe(false);
  });

  test("should throw error when transaction receipt fails", async () => {
    mockWaitForTransactionReceipt.mockRejectedValueOnce(
      new Error("Transaction not found")
    );

    await expect(
      confirmConfimation({
        user: mockUser,
        transactionId: 123,
        escrowAddress: mockEscrowAddress,
        txHash: mockTxHash,
      })
    ).rejects.toThrow("Failed to confirm delivery");
  });

  test("should handle multiple logs and find correct one", async () => {
    const receipt = createMockTransactionReceipt({
      logs: [
        {
          address: "0x9999999999999999999999999999999999999999" as Address, // Wrong address
          data: "0x",
          topics: [],
        },
        {
          address: mockEscrowAddress, // Correct address
          data: "0x",
          topics: [],
        },
      ],
    });

    mockWaitForTransactionReceipt.mockResolvedValueOnce(receipt);
    mockDecodeEventLog.mockReturnValueOnce({
      eventName: "TxConfirmed",
      args: {
        transactionId: BigInt(123),
        confirmee: mockUser,
      },
    });

    const result = await confirmConfimation({
      user: mockUser,
      transactionId: 123,
      escrowAddress: mockEscrowAddress,
      txHash: mockTxHash,
    });

    expect(result.confirmed).toBe(true);
  });
});
