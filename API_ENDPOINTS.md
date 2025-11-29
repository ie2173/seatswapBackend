# SeatSwap API Endpoints

Base URL: `http://localhost:3000`

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
- [Deal Endpoints](#deal-endpoints)
- [User Endpoints](#user-endpoints)

---

## Authentication Endpoints
### Verify JWT Token

**POST** `/auth/verifyAuth`

Verify a JWT token and return its status and account address.

**Request Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (valid):**

```json
{
  "status": "valid",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 84532,
  "isAdmin": false
}
```

**Response (expired):**

```json
{
  "status": "expired",
  "error": "JWT has expired"
}
```

**Response (invalid):**

```json
{
  "status": "invalid",
  "error": "JWT is invalid"
}
```
### Get Nonce

**POST** `/auth/nonce`

Generate a nonce for SIWE authentication.

**Request Body:**

```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**

```json
{
  "nonce": "abc123def456"
}
```

---

### Verify Signature

**POST** `/auth/verify`

Verify SIWE signature and get JWT token.

**Request Body:**

```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": {
    "domain": "localhost",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "statement": "Sign in to SeatSwap",
    "uri": "http://localhost:3000",
    "version": "1",
    "chainId": 84532,
    "nonce": "abc123def456",
    "issuedAt": "2025-11-23T10:00:00.000Z",
    "expirationTime": "2025-11-23T10:10:00.000Z"
  },
  "signature": "0x..."
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Logout

**POST** `/auth/logout`

🔒 **Protected** - Requires authentication

Logout user and invalidate token.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

## Deal Endpoints

### Create Ticket Deal

**POST** `/deals/list-tickets`

🔒 **Protected** - Requires authentication

Create a new ticket listing for sale.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Taylor Swift - Eras Tour",
  "quantity": 2,
  "price": 150.0,
  "escrowAddress": "0x..."
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Deal created successfully",
  "deal": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Taylor Swift - Eras Tour",
    "quantity": 2,
    "price": 150.0,
    "seller": "507f1f77bcf86cd799439010",
    "status": "open",
    "escrowAddress": "0x1234567890123456789012345678901234567890",
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z"
  }
}
```

---

### Get All Open Deals

**GET** `/deals/open-deals`

Get all available ticket listings.

**Response:**

```json
{
  "deals": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Taylor Swift - Eras Tour",
      "quantity": 2,
      "price": 150.0,
      "seller": {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "rating": 4.5
      },
      "status": "open",
      "createdAt": "2025-11-21T10:00:00.000Z"
    }
  ]
}
```

---

### Get All Disputed Deals

**GET** `/deals/disputed-deals`

Get all deals currently in dispute.

**Response:**

```json
{
  "deals": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Concert Tickets",
      "quantity": 2,
      "price": 100.0,
      "seller": {
        "address": "0x...",
        "rating": 4.0
      },
      "buyer": {
        "address": "0x...",
        "rating": 4.2
      },
      "status": "disputed",
      "createdAt": "2025-11-20T10:00:00.000Z"
    }
  ]
}
```

---

### Get Deal by ID

**GET** `/deals/deal?dealId=<dealId>`

Get details of a specific deal.

**Query Parameters:**

- `dealId` - Deal ID

**Response:**

```json
{
  "success": true,
  "deal": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Taylor Swift - Eras Tour",
    "quantity": 2,
    "price": 150.0,
    "seller": {
      "address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb"
    },
    "buyer": null,
    "status": "open",
    "sellerProof": {
      "url": "https://seatswap-proofs-production.s3.us-west-2.amazonaws.com/...",
      "confirmationTxHash": null,
      "updatedAt": "2025-11-21T10:30:00.000Z"
    },
    "escrowAddress": "0x1234567890123456789012345678901234567890",
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:30:00.000Z"
  }
}
```

---

### Get User Deals

**GET** `/deals/user-deals?address=<userAddress>`

Get all deals for a specific user (as buyer or seller).

**Query Parameters:**

- `address` - Ethereum address

**Response:**

```json
{
  "sellerDeals": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Taylor Swift - Eras Tour",
      "quantity": 2,
      "price": 150.0,
      "status": "open"
    }
  ],
  "buyerDeals": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Concert Tickets",
      "quantity": 1,
      "price": 75.0,
      "status": "completed"
    }
  ]
}
```

---

### Claim Deal (Buyer)

**POST** `/deals/claim-deal`

🔒 **Protected** - Requires authentication

Buyer claims a deal to purchase tickets.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "dealId": "507f1f77bcf86cd799439011"
}
```

**Response:**

```json
{
  "message": "Deal claimed successfully",
  "deal": {
    "_id": "507f1f77bcf86cd799439011",
    "buyer": "0x123...",
    "status": "claimed"
  }
}
```

---

### Upload Seller Proof

**POST** `/deals/seller-proof`

🔒 **Protected** - Requires authentication

Seller uploads proof of ticket ownership/transfer.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**

- `dealId` - Deal ID (string)
- `proof` - Image file (max 5MB)

**Response:**

```json
{
  "message": "Proof uploaded successfully",
  "proofUrl": "https://s3.amazonaws.com/seatswap-proofs/proofs/507f1f77bcf86cd799439011/1732186800000/Seller"
}
```

---

### Dispute Deal

**POST** `/deals/dispute-deal`

🔒 **Protected** - Requires authentication

Either buyer or seller can dispute a deal (triggers blockchain transaction).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "dealId": "507f1f77bcf86cd799439011",
  "txHash": "0x..."
}
```

**Response:**

```json
{
  "message": "Deal disputed successfully",
  "transactionHash": "0x..."
}
```

---

### Complete Deal

**POST** `/deals/complete-deal`

🔒 **Protected** - Requires authentication

Mark deal as completed (buyer confirms receipt).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "dealId": "507f1f77bcf86cd799439011"
}
```

**Response:**

```json
{
  "message": "Deal completed successfully",
  "deal": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "completed"
  }
}
```

---

## User Endpoints

### Add Email

**POST** `/users/add-email`

🔒 **Protected** - Requires authentication

Add or update user's email address.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Email added successfully",
  "user": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "email": "user@example.com"
  }
}
```

---

### Get User Info

**POST** `/users/info`

Get user profile information.

**Request Body:**

```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**

```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439010",
    "address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "email": "user@example.com",
    "nonce": "abc123def456",
    "createdAt": "2025-11-20T10:00:00.000Z"
  }
}
```

---

### Give Rating

**POST** `/users/give-rating`

🔒 **Protected** - Requires authentication

Rate another user after a completed deal.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "rating": 5
}
```

**Response:**

```json
{
  "message": "Rating submitted successfully",
  "user": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "rating": 4.7
  }
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Get the token by completing the SIWE authentication flow:

1. POST `/auth/nonce` with wallet address
2. Sign the SIWE message with your wallet
3. POST `/auth/verify` with message and signature
4. Use the returned token for protected endpoints

Token expires after 1 hour.

---

## Deal Status Flow

```
open → claimed → (proof uploaded) → completed
                              ↓
                          disputed
```

- `open` - Available for purchase
- `claimed` - Buyer has claimed the deal
- `completed` - Deal successfully completed
- `disputed` - Deal is in dispute (blockchain arbitration)
- `cancelled` - Deal cancelled by seller

---

## Notes for Frontend Integration

1. **Base URL**: Update `http://localhost:3000` to your backend URL in production
2. **CORS**: Backend has CORS enabled for all origins in development
3. **File Uploads**: Use `FormData` for `/deals/seller-proof` endpoint
4. **Blockchain**: Chain ID is 84532 (Base Sepolia testnet)
5. **Image Size**: Maximum 5MB for proof uploads
6. **Token Storage**: Store JWT securely (httpOnly cookies recommended)
7. **Rating System**: Ratings are calculated using geometric mean
8. **Nonce TTL**: Nonces expire after 10 minutes
