import type {
  ExpressRequestWithUser,
  ExpressResponseWithUser,
} from "../src/types/controllers";
import type { Address } from "viem";

/**
 * Creates a mock Express request with optional user authentication
 */
export function createMockRequest(options?: {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  file?: any;
  user?: {
    address: Address;
    chainId: number;
  };
}): Partial<ExpressRequestWithUser> {
  return {
    body: options?.body || {},
    params: options?.params || {},
    query: options?.query || {},
    headers: options?.headers || {},
    ...(options?.file && { file: options.file }),
    ...(options?.user && { user: options.user }),
  };
}

/**
 * Creates a mock Express response with methods to capture status and data
 * Returns both the mock response and refs to capture the status code and json data
 */
export function createMockResponse(options?: {
  user?: {
    address: Address;
    chainId: number;
  };
}): {
  res: Partial<ExpressResponseWithUser>;
  getStatus: () => number;
  getData: () => any;
} {
  let statusCode: number = 0;
  let jsonData: any = null;

  const mockRes: Partial<ExpressResponseWithUser> = {
    status: function (code: number) {
      statusCode = code;
      return this;
    },
    json: function (data: any) {
      jsonData = data;
      return this;
    },
    ...(options?.user && { user: options.user }),
  } as any;

  return {
    res: mockRes,
    getStatus: () => statusCode,
    getData: () => jsonData,
  };
}

/**
 * Creates a mock authenticated request with default user
 */
export function createMockAuthRequest(options?: {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  address?: Address;
  chainId?: number;
}): Partial<ExpressRequestWithUser> {
  return createMockRequest({
    ...options,
    user: {
      address: options?.address || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      chainId: options?.chainId || 84532,
    },
  });
}

/**
 * Creates a mock Next function for middleware testing
 */
export function createMockNext(): {
  next: () => void;
  wasCalled: () => boolean;
} {
  let called = false;

  return {
    next: () => {
      called = true;
    },
    wasCalled: () => called,
  };
}

/**
 * Creates a mock viem public client for blockchain read operations
 */
export function createMockPublicClient(overrides?: any) {
  return {
    readContract: async (params: any) => {
      if (overrides?.readContract) {
        return overrides.readContract(params);
      }
      return "0x0000000000000000000000000000000000000000";
    },
    getTransactionReceipt: async (params: any) => {
      if (overrides?.getTransactionReceipt) {
        return overrides.getTransactionReceipt(params);
      }
      return {
        status: "success",
        blockNumber: 12345n,
        transactionHash: params.hash || "0x123...",
        logs: [],
      };
    },
    waitForTransactionReceipt: async (params: any) => {
      if (overrides?.waitForTransactionReceipt) {
        return overrides.waitForTransactionReceipt(params);
      }
      return {
        status: "success",
        blockNumber: 12345n,
        transactionHash: params.hash || "0x123...",
        logs: [],
      };
    },
    ...overrides,
  };
}

/**
 * Creates a mock viem wallet client for blockchain write operations
 */
export function createMockWalletClient(overrides?: any) {
  return {
    writeContract: async (params: any) => {
      if (overrides?.writeContract) {
        return overrides.writeContract(params);
      }
      return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    },
    signMessage: async (params: any) => {
      if (overrides?.signMessage) {
        return overrides.signMessage(params);
      }
      return "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    },
    account: overrides?.account || {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    },
    ...overrides,
  };
}

/**
 * Creates mock transaction receipt
 */
export function createMockTransactionReceipt(overrides?: {
  status?: "success" | "reverted";
  transactionHash?: string;
  blockNumber?: bigint;
  logs?: any[];
}) {
  return {
    status: overrides?.status || "success",
    blockNumber: overrides?.blockNumber || 12345n,
    transactionHash:
      overrides?.transactionHash ||
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    logs: overrides?.logs || [],
    gasUsed: 21000n,
    effectiveGasPrice: 1000000000n,
  };
}

/**
 * Creates mock MongoDB Deal document
 */
export function createMockDeal(overrides?: {
  _id?: string;
  title?: string;
  quantity?: number;
  price?: number;
  seller?: any;
  buyer?: any;
  status?: string;
  escrowAddress?: string;
  sellerProof?: any;
  buyerTransaction?: string;
  completedTxHash?: string;
}) {
  return {
    _id: overrides?._id || "507f1f77bcf86cd799439011",
    title: overrides?.title || "Test Concert Tickets",
    quantity: overrides?.quantity || 2,
    price: overrides?.price || 100,
    seller: overrides?.seller || {
      _id: "user123",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    },
    buyer: overrides?.buyer,
    status: overrides?.status || "open",
    escrowAddress:
      overrides?.escrowAddress || "0x1111111111111111111111111111111111111111",
    sellerProof: overrides?.sellerProof,
    buyerTransaction: overrides?.buyerTransaction,
    completedTxHash: overrides?.completedTxHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Creates mock MongoDB User document
 */
export function createMockUser(overrides?: {
  _id?: string;
  address?: string;
  email?: string;
  rating?: number;
  sellerDeals?: any[];
  buyerDeals?: any[];
}) {
  return {
    _id: overrides?._id || "user123",
    address: overrides?.address || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    email: overrides?.email,
    rating: overrides?.rating || 0,
    sellerDeals: overrides?.sellerDeals || [],
    buyerDeals: overrides?.buyerDeals || [],
  };
}

/**
 * Creates mock Multer file (for file uploads)
 */
export function createMockFile(overrides?: {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
}) {
  return {
    fieldname: overrides?.fieldname || "proof",
    originalname: overrides?.originalname || "ticket-proof.jpg",
    encoding: overrides?.encoding || "7bit",
    mimetype: overrides?.mimetype || "image/jpeg",
    size: overrides?.size || 1024,
    buffer: overrides?.buffer || Buffer.from("fake image data"),
    destination: "",
    filename: "",
    path: "",
    stream: {} as any,
  } as Express.Multer.File;
}

/**
 * Creates mock Deal model with common Mongoose methods
 */
export function createMockDealModel(mockImplementations?: {
  findById?: any;
  find?: any;
  findOne?: any;
  updateOne?: any;
  save?: any;
}) {
  const MockDeal = function (this: any, data: any) {
    this.data = data;
    this.save = mockImplementations?.save || (async () => this.data);
    Object.assign(this, data);
    return this;
  } as any;

  MockDeal.findById = mockImplementations?.findById || (async () => null);
  MockDeal.find = mockImplementations?.find || (async () => []);
  MockDeal.findOne = mockImplementations?.findOne || (async () => null);
  MockDeal.updateOne =
    mockImplementations?.updateOne || (async () => ({ modifiedCount: 1 }));

  return MockDeal;
}

/**
 * Creates mock User model with common Mongoose methods
 */
export function createMockUserModel(mockImplementations?: {
  findById?: any;
  find?: any;
  findOne?: any;
  updateOne?: any;
  save?: any;
}) {
  const MockUser = function (this: any, data: any) {
    this.data = data;
    this.save = mockImplementations?.save || (async () => this.data);
    Object.assign(this, data);
    return this;
  } as any;

  MockUser.findById = mockImplementations?.findById || (async () => null);
  MockUser.find = mockImplementations?.find || (async () => []);
  MockUser.findOne = mockImplementations?.findOne || (async () => null);
  MockUser.updateOne =
    mockImplementations?.updateOne || (async () => ({ modifiedCount: 1 }));

  return MockUser;
}
