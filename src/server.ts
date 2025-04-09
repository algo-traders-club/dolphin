import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { ENV } from './config/env';
import { positionState } from './services/positionState';
import { getOrcaClient, fetchPositionDetails } from './services/orca';
import { getConnection, getWalletSolBalance } from './services/solana';
import { getWsolBalance } from './services/tokenUtils';
import { positionMonitor } from './services/positionMonitor';
import { checkPositionRangeStatus, PositionRangeStatus, formatFeeAmount } from './utils/positionUtils';
import * as logger from './utils/logger';
import { initDatabase } from './services/database';
import { getRecentSnapshots } from './services/database/positionService';
import { getRecentWalletBalances, getRecentTransactions } from './services/database/walletService';

// Create a new Hono app
const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, 200);
});

// API endpoint to get database health
app.get('/api/db/health', async (c) => {
  try {
    await initDatabase();
    return c.json({
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    return c.json({
      status: 'error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// API endpoint to get position history
app.get('/api/position/:address/history', async (c) => {
  try {
    const address = c.req.param('address');
    const limit = parseInt(c.req.query('limit') || '100');
    const snapshots = await getRecentSnapshots(address, limit);
    
    return c.json({
      positionAddress: address,
      snapshots: snapshots.map(s => ({
        timestamp: s.timestamp,
        tickCurrentIndex: s.tickCurrentIndex,
        rangeStatus: s.rangeStatus,
        liquidity: s.liquidity.toString(),
        feeOwedA: s.feeOwedA.toString(),
        feeOwedB: s.feeOwedB.toString(),
      })),
    }, 200);
  } catch (error) {
    return c.json({
      status: 'error',
      message: (error as Error).message,
    }, 500);
  }
});

// API endpoint to get transactions
app.get('/api/transactions', async (c) => {
  try {
    const positionAddress = c.req.query('position');
    const limit = parseInt(c.req.query('limit') || '100');
    const transactions = await getRecentTransactions(limit, positionAddress || null);
    
    return c.json({
      transactions,
    }, 200);
  } catch (error) {
    return c.json({
      status: 'error',
      message: (error as Error).message,
    }, 500);
  }
});

// API endpoint to get agent status
app.get('/api/status', async (c) => {
  try {
    const activePosition = positionState.getActivePosition();
    
    // Basic status response
    const response: any = {
      isActive: positionState.hasActivePosition(),
      walletAddress: process.env.WALLET_PUBLIC_KEY || 'Not available',
      timestamp: new Date().toISOString(),
      monitoring: {
        isActive: positionMonitor.isActive(),
      }
    };
    
    // Add position details if active
    if (activePosition) {
      // Use the data from positionState which is kept updated by the monitoring service
      response.position = {
        address: activePosition.positionAddress.toString(),
        mint: activePosition.positionMint.toString(),
        whirlpool: activePosition.whirlpoolAddress.toString(),
        tickLower: activePosition.tickLowerIndex,
        tickUpper: activePosition.tickUpperIndex,
        liquidity: activePosition.liquidity.toString(),
        createdAt: activePosition.createdAt.toISOString(),
        lastUpdatedAt: activePosition.lastUpdatedAt.toISOString(),
        feeOwedA: activePosition.feeOwedA.toString(),
        feeOwedB: activePosition.feeOwedB.toString(),
        // Format fees for human readability (assuming USDC and SOL)
        formattedFeeOwedA: formatFeeAmount(activePosition.feeOwedA.toString(), 6) + ' USDC',
        formattedFeeOwedB: formatFeeAmount(activePosition.feeOwedB.toString(), 9) + ' SOL',
      };
      
      // Add range status if monitoring is active
      if (positionMonitor.isActive()) {
        try {
          // Get the current pool data to determine range status
          const client = getOrcaClient();
          const pool = await client.getPool(activePosition.whirlpoolAddress);
          const poolData = pool.getData();
          
          const rangeStatus = checkPositionRangeStatus(
            poolData.tickCurrentIndex,
            activePosition.tickLowerIndex,
            activePosition.tickUpperIndex
          );
          
          response.position.rangeStatus = rangeStatus;
          response.position.currentTick = poolData.tickCurrentIndex;
        } catch (error) {
          logger.error('Error determining position range status:', error);
        }
      }
    }
    
    // Add wallet balances
    try {
      const solBalance = await getWalletSolBalance();
      const wsolBalance = await getWsolBalance();
      
      response.balances = {
        sol: solBalance,
        wsol: wsolBalance,
      };
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    }
    
    return c.json(response, 200);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return c.json({
      status: 'error',
      message: (error as Error).message,
    }, 500);
  }
});

// Start the server
const port = ENV.PORT;
const host = ENV.HOST;

// Initialize the database connection
initDatabase()
  .then(() => {
    logger.info('Database connection initialized successfully');
  })
  .catch((error) => {
    logger.error('Failed to initialize database connection:', error);
  });

// Start position monitoring if there's an active position
if (positionState.hasActivePosition()) {
  logger.info('Starting position monitoring for existing active position');
  positionMonitor.start();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully');
  if (positionMonitor.isActive()) {
    positionMonitor.stop();
  }
  
  // Close database connections
  try {
    const { closePool } = await import('./services/database');
    await closePool();
  } catch (error) {
    logger.error('Error closing database pool:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully');
  if (positionMonitor.isActive()) {
    positionMonitor.stop();
  }
  
  // Close database connections
  try {
    const { closePool } = await import('./services/database');
    await closePool();
  } catch (error) {
    logger.error('Error closing database pool:', error);
  }
  
  process.exit(0);
});

logger.info(`Starting Orca Liquidity Agent API server on ${host}:${port}`);
logger.info(`Health check available at http://${host}:${port}/health`);
logger.info(`Agent status available at http://${host}:${port}/api/status`);

export default {
  port,
  fetch: app.fetch,
};