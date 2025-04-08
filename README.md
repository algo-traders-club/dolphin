# Autonomous Orca Liquidity Agent (MVP)

A TypeScript-based automated agent for managing liquidity positions in Orca Whirlpools on Solana Devnet. This MVP demonstrates the full lifecycle of creating, managing, and closing a liquidity position.

## Features

- Connect to Solana Devnet and Orca Whirlpools
- Open liquidity positions with customizable price ranges
- Add liquidity to positions (with SOL/WSOL handling)
- Claim fees from positions
- Remove liquidity from positions
- Close positions
- API endpoints for monitoring agent status

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
- Solana Devnet wallet with SOL
- Devnet USDC tokens

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
# Solana RPC Endpoint (Devnet)
SOLANA_RPC_URL=https://api.devnet.solana.com

# Agent wallet private key (base58 encoded)
WALLET_PRIVATE_KEY=your_private_key_here

# Orca Whirlpool addresses (Devnet)
WHIRLPOOL_PROGRAM_ID=whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc
USDC_SOL_WHIRLPOOL_ADDRESS=your_whirlpool_address_here

# Token mints (Devnet)
SOL_MINT=So11111111111111111111111111111111111111112
USDC_MINT=your_usdc_mint_address_here

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

### Run the agent execution loop

This will execute the full lifecycle of a liquidity position (open, add, claim, remove, close):

```bash
bun run start
# or
bun run src/main.ts
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
│   ├── utils/        # Utility functions
│   ├── main.ts       # Agent execution loop
│   └── server.ts     # Hono API server
├── .env.example      # Example environment variables
├── .eslintrc.json    # ESLint configuration
├── .prettierrc       # Prettier configuration
├── package.json      # Project dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## License

MIT

---

This project was created using `bun init` in bun v1.1.38. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
