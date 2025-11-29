# SeatSwap Backend

A secure backend API for the SeatSwap ticket exchange platform using SIWE (Sign-In with Ethereum) authentication.

## Features

- 🔐 **Web3 Authentication** - SIWE (Sign-In with Ethereum) + JWT
- 💳 **Deal Management** - Create, manage, and dispute ticket deals
- 📸 **Proof Upload** - AWS S3 integration for ticket proof images
- ⛓️ **Blockchain Verification** - Confirms on-chain escrow transactions
- ✅ **Comprehensive Testing** - 118 tests with 100% coverage
- 🛡️ **Security** - Input validation, CORS protection, error handling

## Tech Stack

- **Runtime:** Bun
- **Framework:** Express 5 + TypeScript
- **Database:** MongoDB + Mongoose
- **Authentication:** SIWE 3.0 + JWT
- **Storage:** AWS S3
- **Blockchain:** Viem (Base Sepolia)
- **Testing:** Bun test + MongoDB Memory Server

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- MongoDB running locally or MongoDB Atlas account
- AWS account with S3 bucket configured (see [AWS_S3_SETUP.md](./AWS_S3_SETUP.md))
- Base Sepolia wallet with private key

### Installation

```bash
# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# See "Environment Variables" section below
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/seatswap

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_min_32_chars

# SIWE
SIWE_DOMAIN=localhost

# AWS S3 (see AWS_S3_SETUP.md for setup guide)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=seatswap-proofs-dev
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Blockchain (Base Sepolia)
SEATSWAP_EOA_PRIVATE_KEY=0x_your_private_key
TRANSPORT_URL=https://sepolia.base.org
ESCROW_CONTRACT_ADDRESS=0x_your_contract_address

# Frontend (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Generate JWT Secret

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Development

```bash
# Start development server with auto-reload
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun run test:watch
```

### Production

```bash
# Start production server
bun start
```

## API Documentation

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete API documentation.

**Quick Overview:**

- `GET /health` - Health check
- `GET /auth/nonce` - Generate SIWE nonce
- `POST /auth/verify` - Verify SIWE signature + get JWT
- `POST /deals` - Create deal (authenticated)
- `GET /deals` - Get all open deals
- Plus 7 more deal endpoints (see API_ENDPOINTS.md)

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app + server setup
│   ├── config/                # MongoDB, S3, Web3 configs
│   ├── controllers/           # Auth & Deal logic
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API routes
│   ├── middleware/            # JWT verification
│   ├── utils/                 # Helper functions
│   └── types/                 # TypeScript types
├── test/                      # Test utilities & integration tests
├── .env.example               # Environment template
├── API_ENDPOINTS.md           # API documentation
├── AWS_S3_SETUP.md           # S3 setup guide
├── PRODUCTION_CHECKLIST.md   # Production deployment guide
└── README.md
```

## Testing

118 comprehensive tests covering controllers, utils, middleware, and integration:

```bash
# Run all tests
bun test

# Run specific test suite
bun test src/controllers/__tests__/deal.test.ts
```

## Production Deployment

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for complete guide.

**Quick steps:**

1. Setup MongoDB Atlas (free tier)
2. Setup AWS S3 (see AWS_S3_SETUP.md)
3. Deploy to Railway/Render (~$5-10/month)
4. Set environment variables
5. Verify health endpoint

## Troubleshooting

**MongoDB connection:**

```bash
# Check connection string format
MONGODB_URI=mongodb://localhost:27017/seatswap  # Local
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/seatswap  # Atlas
```

**AWS S3 uploads:**

- Verify IAM user has S3 permissions
- Check bucket name matches `AWS_S3_BUCKET_NAME`
- See AWS_S3_SETUP.md for detailed setup

**Authentication:**

- Generate strong JWT secret: `openssl rand -base64 32`
- Ensure `SIWE_DOMAIN` matches frontend domain

## Support

- Issues: GitHub Issues
- AWS S3 Setup: [AWS_S3_SETUP.md](./AWS_S3_SETUP.md)
- Production Guide: [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- API Docs: [API_ENDPOINTS.md](./API_ENDPOINTS.md)

## License

MIT
