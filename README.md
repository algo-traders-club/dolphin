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
- Position state persistence across application restarts
- API endpoints for monitoring agent status
- Robust error handling with retry logic for RPC rate limits

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Web Framework**: Hono
- **Database**: PostgreSQL with TimescaleDB extension
- **Containerization**: Docker & Docker Compose
- **Blockchain**: Solana
- **SDKs**: 
  - `@solana/web3.js`
  - `@orca-so/whirlpools-sdk` (v0.13.19)
  - `@orca-so/common-sdk` (v0.3.3)
  - `@orca-so/whirlpools` (v1.1.0)
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

# Database configuration
DATABASE_URL=postgres://postgres:postgres@timescaledb:5432/cashflow
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

# Set an existing position as active
bun run position:set -- --address <position-address>

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
- `GET /api/db/health` - Check database connection status
- `GET /api/position/:address/history` - Get position history data
- `GET /api/transactions` - Get transaction history

### Run with Docker

The application can be run using Docker and Docker Compose, which includes PostgreSQL with TimescaleDB extension for time-series data storage.

```bash
# Build and start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the containers
docker-compose down
```

The Docker setup includes:
- Application container running on port 3000
- TimescaleDB container running on port 5432
- Persistent volume for database data
- Automatic database initialization with required tables and hypertables

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
│   │   ├── database/           # Database services
│   │   │   ├── index.ts              # Database connection pool
│   │   │   ├── positionService.ts    # Position data persistence
│   │   │   └── walletService.ts      # Wallet and transaction data
│   │   ├── liquidityManager.ts  # Position management functions
│   │   ├── orca.ts              # Orca Whirlpool interactions
│   │   ├── positionMonitor.ts   # Position monitoring service
│   │   ├── positionState.ts     # Position state management
│   │   ├── solana.ts            # Solana connection and wallet handling
│   │   └── tokenUtils.ts        # Token-related utilities (SOL/WSOL handling)
│   ├── utils/        # Utility functions
│   ├── main.ts       # Command-line interface and execution
│   └── server.ts     # Hono API server
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile        # Docker container definition
├── init-scripts/     # Database initialization scripts
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

- Added Docker support with PostgreSQL and TimescaleDB for time-series data storage
  - Containerized application with Docker and Docker Compose
  - Added TimescaleDB for efficient time-series data storage
  - Implemented database services for position, wallet, and transaction data
  - Added new API endpoints for historical data access

- Added small liquidity option to reduce SOL requirements for transactions
  - New `position:add:small` command for adding a smaller amount of liquidity (5.0 USDC)
  - Improved error handling for insufficient SOL balance with detailed feedback
  - Added pre-transaction SOL balance checking to avoid transaction failures
  - Enhanced error detection for liquidity-related errors
- Upgraded Orca SDK from v0.11.0 to v0.13.19 for improved compatibility and features
  - Updated transaction handling in all liquidity functions to use the latest SDK patterns
  - Modified position operations to use the new transaction building and execution methods
  - Implemented a workaround for position closing due to SDK changes
- Enhanced transaction reliability with timeout handling and graceful recovery:
  - Added transaction timeouts to prevent hanging operations
  - Implemented graceful recovery from transaction failures
  - Added pre-transaction validation to avoid unnecessary blockchain calls
  - Improved error handling with detailed logging and user feedback
- Implemented position state persistence to disk, allowing the agent to remember positions across restarts
- Added support for Solana Mainnet with Helius RPC endpoint
- Implemented robust error handling and retry logic for RPC rate limits
- Enhanced transaction handling with proper blockhash management and confirmation tracking
- Improved wallet implementation with support for both legacy and versioned transactions
- Added position monitoring functionality with real-time status updates

## Position State Persistence

The agent now maintains position state across application restarts by saving position data to disk. This allows you to:

- Restart the agent without losing track of your active positions
- Automatically load the last active position when the agent starts
- Continue managing existing positions even after application restarts
- Track position performance over time with historical data

Position data is stored in `src/data/position.json` and includes comprehensive details such as:
- Position address and mint
- Whirlpool address
- Tick range (price range)
- Liquidity amount
- Fee amounts for both tokens
- Creation and last updated timestamps
- Current position status (in-range, above-range, below-range)

### How Position State Works

The position state management system uses a singleton `PositionStateManager` class that:

1. Loads position data from disk on startup
2. Updates position data in memory during operations
3. Persists changes to disk after each operation
4. Clears position data when positions are closed

This ensures that your liquidity positions are always tracked correctly, even if the application is restarted or encounters errors.

---

This project was created using `bun init` in bun v1.1.38. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
