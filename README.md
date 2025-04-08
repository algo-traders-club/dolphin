# Autonomous Orca Liquidity Agent

A TypeScript-based automated agent for managing liquidity positions in Orca Whirlpools on Solana (both Mainnet and Devnet). This application demonstrates the full lifecycle of creating, managing, and closing a liquidity position.

## Features

- Connect to Solana Mainnet/Devnet and Orca Whirlpools
- Open liquidity positions with customizable price ranges
- Add liquidity to positions (with SOL/WSOL handling)
- Claim fees from positions
- Remove liquidity from positions
- Close positions
- Position monitoring with status updates
- API endpoints for monitoring agent status
- Robust error handling with retry logic for RPC rate limits

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Web Framework**: Hono
- **Blockchain**: Solana
- **SDKs**: 
  - `@solana/web3.js`
  - `@orca-so/whirlpools-sdk`
  - `@project-serum/anchor`
  - `@solana/spl-token`

## Prerequisites

- [Bun](https://bun.sh) installed
- Solana wallet with SOL
- USDC tokens for liquidity provision
- RPC endpoint with sufficient rate limits (e.g., Helius)

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:

```
# Solana RPC Endpoint (Mainnet or Devnet)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key_here

# Agent wallet private key (base58 encoded)
WALLET_PRIVATE_KEY=your_private_key_here

# Network (mainnet or devnet)
NETWORK=mainnet

# Orca Whirlpool addresses
WHIRLPOOL_PROGRAM_ID=whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc
USDC_SOL_WHIRLPOOL_ADDRESS=HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ

# Token mints
SOL_MINT=So11111111111111111111111111111111111111112
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Liquidity position parameters
DEFAULT_POSITION_LOWER_PRICE=0.01
DEFAULT_POSITION_UPPER_PRICE=0.05
DEFAULT_LIQUIDITY_AMOUNT_USDC=10

# Server configuration
PORT=3000
HOST=0.0.0.0
```

**Important Security Note**: Never commit your `.env` file with real private keys to version control.

## Usage

### Run individual commands

The agent provides several commands to manage liquidity positions:

```bash
# Open a new position
bun run position:open

# Add liquidity to an existing position
bun run position:add

# Check position status
bun run position:check

# Monitor position in real-time
bun run position:monitor

# Claim fees from a position
bun run position:claim

# Close a position
bun run position:close

# Run the full lifecycle (open, add, claim, remove, close)
bun run position:lifecycle
```

### Start the API server

```bash
bun run start:server
# or
bun run src/server.ts
```

The server provides the following endpoints:
- `GET /health` - Health check endpoint
- `GET /api/status` - Get the current status of the agent and any active position

### Development

Lint the codebase:
```bash
bun run lint
```

Format the codebase:
```bash
bun run format
```

Build the project:
```bash
bun run build
```

## Project Structure

```
├── src/
│   ├── config/       # Configuration and environment variables
│   ├── services/     # Core services for Solana, Orca, and position management
│   │   ├── liquidityManager.ts  # Position management functions
│   │   ├── orca.ts              # Orca Whirlpool interactions
│   │   ├── positionMonitor.ts   # Position monitoring service
│   │   ├── positionState.ts     # Position state management
│   │   ├── solana.ts            # Solana connection and wallet handling
│   │   └── tokenUtils.ts        # Token-related utilities (SOL/WSOL handling)
│   ├── utils/        # Utility functions
│   ├── main.ts       # Command-line interface and execution
│   └── server.ts     # Hono API server
├── .env              # Environment variables (not committed)
├── wallet.json       # Wallet configuration (not committed)
├── .eslintrc.json    # ESLint configuration
├── .prettierrc       # Prettier configuration
├── package.json      # Project dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## License

MIT

## Recent Updates

- Added support for Solana Mainnet
- Implemented robust error handling and retry logic for RPC rate limits
- Enhanced transaction handling with proper blockhash management
- Improved wallet implementation with support for both legacy and versioned transactions
- Added position monitoring functionality with real-time status updates

---

This project was created using `bun init` in bun v1.1.38. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
