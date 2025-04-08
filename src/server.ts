import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { ENV } from './config/env';
import { positionState } from './services/positionState';
import { getOrcaClient } from './services/orca';
import { getConnection, getWalletSolBalance } from './services/solana';
import { getWsolBalance } from './services/tokenUtils';

// Create a new Hono app
const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, 200);
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
    };
    
    // Add position details if active
    if (activePosition) {
      response.position = {
        address: activePosition.positionAddress.toString(),
        mint: activePosition.positionMint.toString(),
        whirlpool: activePosition.whirlpoolAddress.toString(),
        tickLower: activePosition.tickLowerIndex,
        tickUpper: activePosition.tickUpperIndex,
        liquidity: activePosition.liquidity.toString(),
        createdAt: activePosition.createdAt.toISOString(),
      };
      
      // Fetch live position data if available
      try {
        const client = getOrcaClient();
        const position = await client.getPosition(activePosition.positionAddress);
        const positionData = position.getData();
        
        response.position.currentLiquidity = positionData.liquidity.toString();
      } catch (error) {
        console.error('Error fetching live position data:', error);
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

console.log(`Starting Orca Liquidity Agent API server on ${host}:${port}`);
console.log(`Health check available at http://${host}:${port}/health`);
console.log(`Agent status available at http://${host}:${port}/api/status`);

export default {
  port,
  fetch: app.fetch,
};