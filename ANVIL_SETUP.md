# Anvil Local Testing Configuration

The backend is now configured to work with your local Anvil fork of Base Sepolia.

## Quick Start

1. **Copy environment variables:**

   ```bash
   cp .env.example .env
   ```

2. **Generate contract ABIs** (run in your contract project):

   ```bash
   forge inspect Factory abi > abis/Factory.json
   forge inspect Escrow abi > abis/Escrow.json
   ```

   Then copy these files to the `abis/` directory.

3. **Start your Anvil blockchain** (if not already running):

   ```bash
   anvil --fork-url https://sepolia.base.org
   ```

4. **Start the backend:**

   ```bash
   bun run dev
   ```

5. **Generate an auth token for testing:**
   ```bash
   bun run generate-token
   ```
   Copy the token and paste it into `test/api.http` file.

## Configuration Summary

### Network

- **Chain ID**: 31337 (Anvil default)
- **RPC URL**: http://127.0.0.1:8545

### Contract Addresses

- **TicketFactory**: `0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9`
- **MockUSDC**: `0x5fbdb2315678afecb367f032d93f642f64180aa3`

### Test Accounts (all with 100,000 USDC)

#### Owner/Platform Account

- **Address**: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Usage**: Admin operations, default for backend

#### Seller Account

- **Address**: `0x70997970c51812dc3a010c7d01b50e0d17dc79c8`
- **Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Usage**: Testing ticket listings

#### Buyer Account

- **Address**: `0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc`
- **Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **Usage**: Testing purchases

### Updated Files

1. **src/config/web3.ts** - Now uses `http://127.0.0.1:8545` as default RPC
2. **.env.example** - Updated with Anvil addresses and private keys
3. **test/setupSignature.ts** - Added named exports (OWNER, SELLER, BUYER)
4. **abis/** - New directory for contract ABIs

### Testing Workflow

1. **Generate auth token** (uses Owner account by default):

   ```bash
   bun run generate-token
   ```

2. **Test with different accounts** - modify `test/generateSig.ts`:

   ```typescript
   // For seller account
   const { signature, messageObj } = await generateSiweSignature({
     nonce,
     privateKey: TEST_PRIVATE_KEYS.SELLER,
   });

   // For buyer account
   const { signature, messageObj } = await generateSiweSignature({
     nonce,
     privateKey: TEST_PRIVATE_KEYS.BUYER,
   });
   ```

3. **Use api.http** to test endpoints with the generated token

### Verification Commands

Check Anvil is running and configured correctly:

```bash
# Check connection
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Check factory address
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9","latest"],"id":1}'

# Check USDC balance of owner
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x5fbdb2315678afecb367f032d93f642f64180aa3","data":"0x70a08231000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266"},"latest"],"id":1}'
```

## Notes

- SIWE domain is configured for `localhost` (already set in .env.example)
- All test accounts have 100,000 USDC (100000000000 with 6 decimals)
- MongoDB and S3 configuration remains unchanged
- The backend defaults to the Owner account if `SEATSWAP_EOA_PRIVATE_KEY` is not set
