# Backend Test Suite

This directory contains comprehensive unit tests for the SeatSwap backend.

## Test Structure

```
src/
├── __tests__/
│   └── helpers.ts           # Mock utilities for testing
├── controllers/__tests__/
│   ├── auth.test.ts        # Auth controller tests
│   ├── deal.test.ts        # Deal controller tests
│   └── user.test.ts        # User controller tests
├── middleware/__tests__/
│   └── auth.test.ts        # Auth middleware tests
└── utils/__tests__/
    ├── math.test.ts        # Math utility tests
    ├── siwe.test.ts        # SIWE utility tests
    └── nonceStore.test.ts  # NonceStore tests
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/utils/__tests__/math.test.ts
```

## Test Coverage

### Utils (✅ Complete)

- **math.ts**: Geometric mean calculations

  - Valid input scenarios
  - Edge cases (empty arrays, zeros, single values)
  - Error handling

- **siwe.ts**: Nonce generation

  - Default and custom lengths
  - Uniqueness verification
  - Hex format validation

- **nonceStore.ts**: Nonce storage and retrieval
  - Set, get, delete operations
  - TTL expiration
  - Address normalization
  - Multiple address handling

### Controllers (⚠️ Partial - Database mocking needed)

- **auth.ts**: Authentication endpoints

  - getNonce: Address validation, nonce generation
  - verifySignature: Input validation (full tests need valid SIWE signatures)
  - logout: Authentication checks

- **deal.ts**: Deal management

  - createSellTicketDeal: Input validation, authentication
  - getAllOpenDeals, getAllDisputedDeals: Basic structure
  - getDealById, getUserDeals: Input validation
  - buyerClaimDeal: Required fields validation
  - uploadSellerProof, disputeDeal, completeDeal: Complex scenarios (need mocking)

- **user.ts**: User management
  - addEmail: Email validation, authentication
  - getUserInfo, giveRating: Input validation

### Middleware (⚠️ Partial - JWT validation needs real tokens)

- **auth.ts**: JWT authentication
  - Missing token handling
  - Invalid token format
  - Bearer token validation

## Testing Notes

### Known Limitations

1. **Database Tests**: Tests that interact with MongoDB need mocking or test database setup
2. **Blockchain Tests**: Tests for web3 interactions need viem client mocking
3. **JWT Tests**: Valid JWT token tests require proper JWT_SECRET configuration
4. **File Upload Tests**: AWS S3 upload tests need AWS SDK mocking
5. **SIWE Tests**: Full signature verification needs valid SIWE messages and signatures

### Test Philosophy

These tests are designed to:

- ✅ Validate input handling and error responses
- ✅ Test business logic without external dependencies
- ⚠️ Identify integration points that need mocking
- ⚠️ Provide foundation for debugging actual bugs

### Future Improvements

1. **Integration Tests**: Add tests with real database (test container)
2. **E2E Tests**: Full flow tests with mocked blockchain
3. **Mock Libraries**: Add comprehensive mocking for:
   - MongoDB/Mongoose
   - AWS S3 SDK
   - Viem clients
   - JWT verification
4. **Coverage Reports**: Add test coverage reporting
5. **CI/CD Integration**: Automated test runs on commits

## Debugging Failed Tests

When tests fail, check:

1. Environment variables (JWT_SECRET, AWS credentials, etc.)
2. Database connection status
3. Mock configurations
4. Type mismatches in request/response objects

## Adding New Tests

When adding new controllers or utils:

1. Create `__tests__` directory in the same folder
2. Name test files `*.test.ts`
3. Use the mock helpers from `src/__tests__/helpers.ts`
4. Follow existing test patterns
5. Test both success and error cases
6. Add comments for complex test scenarios

## Test Utilities

### Mock Helpers (`src/__tests__/helpers.ts`)

- `createMockRequest()`: Generate mock Express request
- `createMockResponse()`: Generate mock Express response
- `createMockFile()`: Generate mock multer file upload

### Custom Matchers

- `toBeOneOf([values])`: Check if value is one of several options (for flexible error checking)

## Contributing

When writing tests:

- Focus on behavior, not implementation
- Test edge cases and error conditions
- Keep tests isolated and independent
- Use descriptive test names
- Add comments for complex scenarios
- Mock external dependencies appropriately
