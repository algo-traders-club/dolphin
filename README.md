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
- Auto-rebalancing mechanism for optimizing positions when out of range
- API endpoints for monitoring agent status and rebalancing metrics
- Robust error handling with retry logic for RPC rate limits
- Centralized network management with connection caching
- Enhanced logging system with configurable levels and file rotation
- Modular code architecture for improved maintainability

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Web Framework**: Hono
- **Database**: PostgreSQL with TimescaleDB extension
- **Containerization**: Docker & Docker Compose
- **Blockchain**: Solana
- **Architecture**: Modular command pattern
- **Deployment**: AWS Lightsail Containers (see DEPLOYMENT.md)
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

# Auto-rebalancing configuration
REBALANCE_ENABLED=false
REBALANCE_THRESHOLD_PERCENT=5
MIN_REBALANCE_INTERVAL_MINUTES=60
POSITION_WIDTH_PERCENT=20
MAX_DAILY_REBALANCES=6

# Server configuration
PORT=3000
HOST=0.0.0.0

# Database configuration
DATABASE_URL=postgres://postgres:postgres@timescaledb:5432/cashflow

# For local development without Docker
# DATABASE_URL=postgres://postgres:postgres@localhost:5433/cashflow
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

# Manage auto-rebalancing
bun run src/main.ts rebalance status  # Check rebalancing status
bun run src/main.ts rebalance enable  # Enable auto-rebalancing
bun run src/main.ts rebalance disable  # Disable auto-rebalancing
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
- `GET /api/rebalance/history?position={positionAddress}` - Get rebalancing history for a position
- `GET /api/rebalance/metrics` - Get metrics about rebalancing operations
- `GET /api/rebalance/status` - Get current status of the auto-rebalancing system

### Run with Docker

The application can be run using Docker and Docker Compose, which includes PostgreSQL with TimescaleDB extension for time-series data storage.

```bash
# Build and start the containers
docker compose up -d

# View logs
docker compose logs -f app
docker compose logs -f timescaledb

# Stop the containers
docker compose down
```

The Docker setup includes:
- Application container running on port 3001 (mapped from internal port 3000)
- TimescaleDB container running on port 5433 (mapped from internal port 5432)
- Persistent volume for database data
- Automatic database initialization with required tables and hypertables
- Health checks to ensure proper service dependencies
- Position data persistence across container restarts

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

## Code Architecture

The application follows a modular architecture for improved maintainability and testability:

### Core Modules

- **Commands**: Located in `src/commands/`, contains all CLI commands organized by functionality:
  - `position.ts` - Position management commands
  - `rebalance.ts` - Auto-rebalancing commands
  - `lifecycle.ts` - Full lifecycle demo
  - `cli.ts` - Command parsing and execution

- **Services**: Located in `src/services/`, provides core functionality:
  - `networkManager.ts` - Centralized Solana network connection management
  - `positionMonitor.ts` - Position monitoring and status tracking
  - `autoRebalancer.ts` - Auto-rebalancing logic
  - `liquidityManager.ts` - Liquidity position management
  - `orca.ts` - Orca Whirlpool interactions
  - Database services in `src/services/database/`

- **Utils**: Located in `src/utils/`, contains utility functions:
  - `logger.ts` - Enhanced logging system
  - `positionUtils.ts` - Position-related utilities

- **Config**: Located in `src/config/`, contains configuration:
  - `env.ts` - Environment variable management

## Auto-Rebalancing Mechanism

The agent includes an auto-rebalancing mechanism that optimizes liquidity positions when they go out of range, focusing on capital efficiency and minimizing transaction costs.

### How It Works

1. **Position Monitoring**: The system continuously monitors the position's price range relative to the current market price.

2. **Out-of-Range Detection**: When a position goes out of range (current price is above or below the position's price range), the system tracks how long it has been out of range.

3. **Rebalancing Decision**: The system decides to rebalance based on:
   - How long the position has been out of range
   - How far the current price is from the position's range (threshold percentage)
   - When the last rebalance occurred (minimum interval)
   - How many rebalances have been performed today (maximum daily limit)

4. **Rebalancing Process**:
   - Collects any accrued fees
   - Removes liquidity from the current position
   - Calculates an optimal new price range centered around the current price
   - Creates a new position with the optimal range
   - Adds liquidity back to the new position

5. **Record Keeping**: Each rebalance operation is recorded in the database for analysis and reporting.

For more detailed information, see the [auto-rebalancing documentation](docs/auto-rebalancing.md).

## System Architecture

The Orca Liquidity Agent is designed with a containerized architecture using Docker and Docker Compose:

### Components

1. **Application Container**
   - TypeScript application running on Bun runtime
   - Hono API server for monitoring and management
   - Position monitoring service that runs at regular intervals
   - Direct integration with Solana blockchain and Orca Whirlpools

2. **TimescaleDB Container**
   - PostgreSQL database with TimescaleDB extension for time-series data
   - Stores position snapshots, wallet balances, and transaction history
   - Uses hypertables for efficient time-series queries
   - Persistent volume for data storage across container restarts

3. **Data Flow**
   - Application connects to Solana RPC endpoint to fetch blockchain data
   - Position monitoring service fetches position data at regular intervals
   - Position snapshots are stored in the database for historical analysis
   - API endpoints expose the data for monitoring and visualization

### Containerization

- Docker Compose orchestrates the containers
- Health checks ensure proper service dependencies
- Environment variables for configuration
- Volume mounts for data persistence

## Project Structure

```
├── src/
│   ├── config/       # Configuration and environment variables
│   ├── data/         # Local data storage for position state
│   ├── scripts/      # Utility scripts
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
├── init-scripts/     # Database initialization scripts for TimescaleDB
├── .env              # Environment variables (not committed)
├── wallet.json       # Wallet configuration (not committed)
├── .eslintrc.json    # ESLint configuration
├── .prettierrc       # Prettier configuration
├── package.json      # Project dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Deployment

For detailed deployment instructions to AWS Lightsail containers, see [DEPLOYMENT.md](DEPLOYMENT.md).

## License

MIT

## Recent Updates

### v0.3.0 (2025-04-08)
- Refactored codebase for improved maintainability and deployment
  - Modularized command structure for better organization
  - Enhanced build process for Node.js compatibility
  - Added AWS Lightsail deployment documentation
  - Implemented production-ready Docker configuration
- Improved system reliability and monitoring
  - Centralized network management with connection caching
  - Enhanced logging system with file rotation
  - Added comprehensive error handling with retry logic

### v0.2.0 (2025-04-01)
- Added auto-rebalancing mechanism for optimizing positions when out of range
  - Implemented threshold-based rebalancing logic
  - Added configurable parameters for rebalancing
  - Created database tracking for rebalance history
  - Added API endpoints for rebalancing metrics

### v0.1.0 (2025-03-15)
- Initial release with basic liquidity management features
  - Position creation, monitoring, and management
  - Fee claiming and position closing
  - Basic API for status monitoring
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
