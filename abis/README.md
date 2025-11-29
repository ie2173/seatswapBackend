# Contract ABIs

This directory contains the ABIs for the smart contracts deployed on the local Anvil testnet.

## Generating ABIs

Run the following command in your contract project to generate the ABI files:

```bash
forge inspect Factory abi > abis/Factory.json
forge inspect Escrow abi > abis/Escrow.json
```

Then copy these files to this directory.

## Contract Addresses (Local Anvil Fork)

- **TicketFactory**: `0x9a6873eea7d369b7c20ce1e96fd68ca36c0199dd`
- **MockUSDC**: `0x66ac2c82f9696d087b37e07c7e83cd0fc69e5fa3`

## Network Configuration

- **Chain ID**: 31337 (Anvil default)
- **RPC URL**: http://127.0.0.1:8545

## Test Accounts

All accounts have 100,000 USDC (100000000000 with 6 decimals)

1. **Owner/Platform**: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
2. **Seller**: `0x70997970c51812dc3a010c7d01b50e0d17dc79c8`
3. **Buyer**: `0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc`
