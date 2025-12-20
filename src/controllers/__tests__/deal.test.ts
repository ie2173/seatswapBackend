import {
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
  describe,
  test,
  expect,
  mock,
} from "bun:test";
import {
  createTicketDeal,
  getAllOpenDeals,
  getAllDisputedDeals,
  getDealById,
  getUserDeals,
  buyerClaimDeal,
  completeDeal,
  resolveDispute,
  uploadSellerProof,
  confirmDelivery,
  disputeDeal,
} from "../deal";
import {
  createMockRequest,
  createMockResponse,
  createMockFile,
  createMockTransactionReceipt,
} from "../../../test/helpers";
import {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} from "../../../test/setupMongo";
import Deal from "@/models/deals";
import User from "@/models/users";

describe("Deal Controller", () => {
  // Setup real MongoDB connection before all tests
  beforeAll(async () => {
    await connectTestDB();
  });

  // Clear database after each test
  afterEach(async () => {
    await clearTestDB();
  });

  // Disconnect after all tests
  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("createTicketDeal", () => {
    test("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        body: {
          // Missing required fields
        },
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await createTicketDeal(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });
    test("should return 401 if user is not authenticated", async () => {
      const req = createMockRequest({
        body: {
          title: "Test Deal",
          quantity: 2,
          price: 100,
          escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await createTicketDeal(req as any, res as any);

      expect(getStatus()).toBe(401);
      expect(getData().error).toBe("User not authenticated");
    });

    test("should return 400 if user not found in database", async () => {
      const req = createMockRequest({
        body: {
          title: "Test Deal",
          quantity: 2,
          price: 100,
          escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        },
        user: {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await createTicketDeal(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("User not found");
    });

    test("should successfully create a deal", async () => {
      // First, create a user in the database with lowercase address
      const userAddress = "0x742d35cc6634c0532925a3b844bc9e7595f0beb";
      const user = await User.create({
        address: userAddress,
        nonce: "testnonce12345",
      });

      const req = createMockRequest({
        body: {
          title: "Lakers vs Warriors",
          quantity: 2,
          price: 500,
          escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        },
        user: {
          address: userAddress as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await createTicketDeal(req as any, res as any);

      expect(getStatus()).toBe(201);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Deal created successfully");
      expect(data.deal.title).toBe("Lakers vs Warriors");
      expect(data.deal.quantity).toBe(2);
      expect(data.deal.price).toBe(500);
      expect(data.deal.status).toBe("open");
      expect(data.deal.seller.toString()).toBe(user._id.toString());

      // Verify it's in the database
      const deal = await Deal.findOne({ title: "Lakers vs Warriors" });
      expect(deal).toBeTruthy();
      expect(deal?.quantity).toBe(2);
    });
  });

  describe("getAllOpenDeals", () => {
    test("should return empty array when no deals exist", async () => {
      const req = createMockRequest({});
      const { res, getStatus, getData } = createMockResponse();

      await getAllOpenDeals(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    test("should return only open deals", async () => {
      const user = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      // Create deals with different statuses
      await Deal.create({
        title: "Open Deal 1",
        quantity: 1,
        price: 100,
        seller: user._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      await Deal.create({
        title: "Claimed Deal",
        quantity: 1,
        price: 200,
        seller: user._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "claimed",
      });

      await Deal.create({
        title: "Open Deal 2",
        quantity: 2,
        price: 300,
        seller: user._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      const req = createMockRequest({});
      const { res, getStatus, getData } = createMockResponse();

      await getAllOpenDeals(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].title).toBe("Open Deal 1");
      expect(data.data[1].title).toBe("Open Deal 2");
    });

    test("should populate seller address", async () => {
      const user = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      await Deal.create({
        title: "Test Deal",
        quantity: 1,
        price: 100,
        seller: user._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      const req = createMockRequest({});
      const { res, getStatus, getData } = createMockResponse();

      await getAllOpenDeals(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.data[0].seller.address).toBe(user.address);
    });
  });

  describe("getAllDisputedDeals", () => {
    test("should return empty array when no disputed deals exist", async () => {
      const req = createMockRequest({});
      const { res, getStatus, getData } = createMockResponse();

      await getAllDisputedDeals(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    test("should return only disputed deals", async () => {
      const user = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      await Deal.create({
        title: "Disputed Deal",
        quantity: 1,
        price: 100,
        seller: user._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "disputed",
      });

      await Deal.create({
        title: "Open Deal",
        quantity: 1,
        price: 200,
        seller: user._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      const req = createMockRequest({});
      const { res, getStatus, getData } = createMockResponse();

      await getAllDisputedDeals(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe("Disputed Deal");
    });
  });

  describe("getDealById", () => {
    test("should return 400 if deal ID is missing", async () => {
      const req = createMockRequest({ query: {} });
      const { res, getStatus, getData } = createMockResponse();

      await getDealById(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing deal ID");
    });

    test("should return 404 if deal not found", async () => {
      const req = createMockRequest({
        query: { dealId: "507f1f77bcf86cd799439011" }, // Valid ObjectId format
      });
      const { res, getStatus, getData } = createMockResponse();

      await getDealById(req as any, res as any);

      expect(getStatus()).toBe(404);
      expect(getData().error).toBe("Deal not found");
    });

    test("should return deal by ID", async () => {
      const user = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const deal = await Deal.create({
        title: "Test Deal",
        quantity: 1,
        price: 100,
        seller: user._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      const req = createMockRequest({
        query: { dealId: deal._id.toString() },
      });
      const { res, getStatus, getData } = createMockResponse();

      await getDealById(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.deal.title).toBe("Test Deal");
      expect(data.deal.seller.address).toBe(user.address);
    });
  });

  describe("getUserDeals", () => {
    test("should return 400 if address is missing", async () => {
      const req = createMockRequest({ body: {} });
      const { res, getStatus, getData } = createMockResponse();

      await getUserDeals(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing user address");
    });

    test("should return 404 if user not found", async () => {
      const req = createMockRequest({
        body: { address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" },
      });
      const { res, getStatus, getData } = createMockResponse();

      await getUserDeals(req as any, res as any);

      expect(getStatus()).toBe(404);
      expect(getData().error).toBe("User not found");
    });

    test("should return user deals (both seller and buyer)", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const buyer = await User.create({
        address: "0x123456789abcdef123456789abcdef123456789a",
        nonce: "testnonce67890",
      });

      const sellerDeal = await Deal.create({
        title: "Seller Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      const buyerDeal = await Deal.create({
        title: "Buyer Deal",
        quantity: 2,
        price: 200,
        seller: buyer._id,
        buyer: seller._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "claimed",
      });

      await User.updateOne(
        { _id: seller._id },
        { $push: { sellerDeals: sellerDeal._id, buyerDeals: buyerDeal._id } }
      );

      const req = createMockRequest({
        body: { address: seller.address },
      });
      const { res, getStatus, getData } = createMockResponse();

      await getUserDeals(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });
  });

  describe("buyerClaimDeal", () => {
    test("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        body: { id: "507f1f77bcf86cd799439011" },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await buyerClaimDeal(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });

    test("should return 404 if deal not found", async () => {
      const req = createMockRequest({
        body: {
          id: "507f1f77bcf86cd799439011",
          buyerTransaction: "0xabc123",
        },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await buyerClaimDeal(req as any, res as any);

      expect(getStatus()).toBe(404);
      expect(getData().error).toBe("Deal not found");
    });

    test("should return 400 if deal is not open", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const deal = await Deal.create({
        title: "Claimed Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "claimed",
      });

      const req = createMockRequest({
        body: {
          id: deal._id.toString(),
          buyerTransaction: "0xabc123",
        },
        user: {
          address: "0x123456789abcdef123456789abcdef123456789a" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await buyerClaimDeal(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Deal is not open");
    });

    test("should return 404 if buyer not found", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const deal = await Deal.create({
        title: "Open Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      const req = createMockRequest({
        body: {
          id: deal._id.toString(),
          buyerTransaction: "0xabc123",
        },
        user: {
          address: "0x123456789abcdef123456789abcdef123456789a" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await buyerClaimDeal(req as any, res as any);

      expect(getStatus()).toBe(404);
      expect(getData().error).toBe("Buyer not found");
    });

    test("should successfully claim a deal", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const buyer = await User.create({
        address: "0x123456789abcdef123456789abcdef123456789a",
        nonce: "testnonce67890",
      });

      const deal = await Deal.create({
        title: "Open Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      const req = createMockRequest({
        body: {
          id: deal._id.toString(),
          buyerTransaction: "0xabc123",
        },
        user: {
          address: buyer.address as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await buyerClaimDeal(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Claimed deal");

      // Verify the deal was updated
      const updatedDeal = await Deal.findById(deal._id);
      expect(updatedDeal?.status).toBe("claimed");
      expect(updatedDeal?.buyer?.toString()).toBe(buyer._id.toString());
      // Note: buyerPaymentProof would need to be set in the controller to verify here

      // Verify buyer's deals were updated
      const updatedBuyer = await User.findById(buyer._id);
      expect(updatedBuyer?.buyerDeals).toContainEqual(deal._id);
    });
  });

  describe("completeDeal", () => {
    test("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        body: { id: "507f1f77bcf86cd799439011" },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await completeDeal(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });

    test("should return 404 if deal not found", async () => {
      const req = createMockRequest({
        body: {
          id: "507f1f77bcf86cd799439011",
          txId: "0xabc123",
        },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await completeDeal(req as any, res as any);

      expect(getStatus()).toBe(404);
      expect(getData().error).toBe("Deal not found");
    });

    test("should return 400 if deal is not in claimed status", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const deal = await Deal.create({
        title: "Open Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "open",
      });

      const req = createMockRequest({
        body: {
          id: deal._id.toString(),
          txId: "0xabc123",
        },
        user: {
          address: seller.address as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await completeDeal(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Deal is not claimed");
    });

    test("should successfully complete a deal", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const buyer = await User.create({
        address: "0x123456789abcdef123456789abcdef123456789a",
        nonce: "testnonce67890",
      });

      const deal = await Deal.create({
        title: "Claimed Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        buyer: buyer._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "claimed",
      });

      const req = createMockRequest({
        body: {
          id: deal._id.toString(),
          txId: "0xabc123def456",
        },
        user: {
          address: seller.address as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await completeDeal(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Deal completed");

      // Verify the deal was updated
      const updatedDeal = await Deal.findById(deal._id);
      expect(updatedDeal?.status).toBe("completed");
    });
  });

  describe("resolveDispute", () => {
    test("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        body: { id: "507f1f77bcf86cd799439011" },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await resolveDispute(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });

    test("should return 200 when called with required fields", async () => {
      const req = createMockRequest({
        body: {
          id: "507f1f77bcf86cd799439011",
          resolution: "seller",
        },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await resolveDispute(req as any, res as any);

      expect(getStatus()).toBe(200);
      const data = getData();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Dispute resolved");
    });
  });

  describe("uploadSellerProof", () => {
    test("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        body: { id: "507f1f77bcf86cd799439011" },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await uploadSellerProof(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });

    test("should return 404 if deal not found or not claimed", async () => {
      const mockFile = createMockFile();
      const req = createMockRequest({
        body: {
          id: "507f1f77bcf86cd799439011",
          confirmationTxHash: "0xabc123",
        },
        file: mockFile,
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await uploadSellerProof(req as any, res as any);

      expect(getStatus()).toBe(404);
      expect(getData().error).toBe("Deal not found");
    });

    test("should return 403 if user is not the seller", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const deal = await Deal.create({
        title: "Claimed Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "claimed",
      });

      const mockFile = createMockFile();
      const req = createMockRequest({
        body: {
          id: deal._id.toString(),
          confirmationTxHash: "0xabc123",
        },
        file: mockFile,
        user: {
          address: "0x999999999999999999999999999999999999999" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await uploadSellerProof(req as any, res as any);

      expect(getStatus()).toBe(403);
      expect(getData().error).toBe("User not authorized to upload proof");
    });
  });

  describe("confirmDelivery", () => {
    test("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        body: {},
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await confirmDelivery(req as any, res as any);

      expect(getStatus()).toBe(400);
      expect(getData().error).toBe("Missing required fields");
    });

    test("should return 404 if deal not found or not claimed", async () => {
      const req = createMockRequest({
        body: {
          id: "507f1f77bcf86cd799439011",
          confirmationTxHash: "0xabc123",
        },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await confirmDelivery(req as any, res as any);

      expect(getStatus()).toBe(404);
      expect(getData().error).toBe("Deal not found");
    });

    test("should return 403 if user is not the buyer", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const buyer = await User.create({
        address: "0x123456789abcdef123456789abcdef123456789a",
        nonce: "testnonce67890",
      });

      const deal = await Deal.create({
        title: "Claimed Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        buyer: buyer._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "claimed",
      });

      const req = createMockRequest({
        body: {
          id: deal._id.toString(),
          confirmationTxHash: "0xabc123",
        },
        user: {
          address: "0x999999999999999999999999999999999999999" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await confirmDelivery(req as any, res as any);

      expect(getStatus()).toBe(403);
      expect(getData().error).toBe("User not authorized to confirm delivery");
    });
  });

  describe("disputeDeal", () => {
    test("should return 404 if deal not found", async () => {
      const req = createMockRequest({
        body: { id: "507f1f77bcf86cd799439011" },
        user: {
          address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await disputeDeal(req as any, res as any);

      expect(getStatus()).toBe(404);
      expect(getData().error).toBe("Deal not found");
    });

    test("should return 401 if user is not authenticated", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const deal = await Deal.create({
        title: "Claimed Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "claimed",
      });

      const req = createMockRequest({
        body: { id: deal._id.toString() },
      });
      const { res, getStatus, getData } = createMockResponse();

      await disputeDeal(req as any, res as any);

      expect(getStatus()).toBe(401);
      expect(getData().error).toBe("User not authenticated");
    });

    test("should return 403 if user is neither buyer nor seller", async () => {
      const seller = await User.create({
        address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        nonce: "testnonce12345",
      });

      const buyer = await User.create({
        address: "0x123456789abcdef123456789abcdef123456789a",
        nonce: "testnonce67890",
      });

      const deal = await Deal.create({
        title: "Claimed Deal",
        quantity: 1,
        price: 100,
        seller: seller._id,
        buyer: buyer._id,
        escrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "claimed",
      });

      const req = createMockRequest({
        body: { id: deal._id.toString() },
        user: {
          address: "0x999999999999999999999999999999999999999" as any,
          chainId: 84532,
        },
      });
      const { res, getStatus, getData } = createMockResponse();

      await disputeDeal(req as any, res as any);

      expect(getStatus()).toBe(403);
      expect(getData().error).toBe(
        "Only buyer or seller can dispute this deal"
      );
    });
  });
});
