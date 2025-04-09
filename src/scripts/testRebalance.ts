/**
 * Test script for auto-rebalancing functionality
 * 
 * This script simulates a position going out of range and tests the auto-rebalancing mechanism.
 */

import { PublicKey } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { positionState } from '../services/positionState';
import { autoRebalancer } from '../services/autoRebalancer';
import { fetchPositionDetails, fetchWhirlpoolData } from '../services/orca';
import { positionMonitor } from '../services/positionMonitor';
import { config } from '../config/env';
import { networkManager } from '../services/networkManager';
import { initDatabase } from '../services/database';
import * as logger from '../utils/logger';

// Sleep utility function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize the logger
logger.initialize();

/**
 * Main function to test auto-rebalancing
 */
async function testRebalancing() {
  try {
    logger.info('Starting auto-rebalancing test...');
    
    // Initialize the network manager and database
    await networkManager.initialize();
    await initDatabase();
    
    // Check if there's an active position
    if (!positionState.hasActivePosition()) {
      logger.error('No active position found. Please open a position first.');
      return { success: false, message: 'No active position' };
    }
    
    const position = positionState.getActivePosition()!;
    logger.info(`Testing rebalancing for position: ${position.positionAddress.toString()}`);
    
    // Fetch current whirlpool data
    const whirlpoolData = await fetchWhirlpoolData(position.whirlpoolAddress);
    const currentTick = whirlpoolData.tickCurrentIndex;
    const currentPrice = whirlpoolData.price;
    
    logger.info(`Current price: ${currentPrice} SOL per USDC`);
    logger.info(`Current tick: ${currentTick}`);
    
    // Fetch position details
    const positionDetails = await fetchPositionDetails(position.positionAddress);
    logger.info(`Position liquidity: ${positionDetails.liquidity.toString()}`);
    logger.info(`Position range: ${position.lowerPrice} to ${position.upperPrice}`);
    
    // Enable rebalancing for testing
    (config as any).REBALANCE_ENABLED = true;
    logger.info('Auto-rebalancing enabled for testing');
    
    // Simulate position going out of range by temporarily modifying the position state
    // This is just for testing - in a real scenario, the price would move out of range
    const originalLowerPrice = position.lowerPrice;
    const originalUpperPrice = position.upperPrice;
    
    // Create a simulated out-of-range position (price above upper bound)
    const simulatedLowerPrice = new Decimal(currentPrice).mul(0.5).toString();
    const simulatedUpperPrice = new Decimal(currentPrice).mul(0.8).toString();
    
    logger.info(`Simulating position out of range with bounds: ${simulatedLowerPrice} to ${simulatedUpperPrice}`);
    
    // Temporarily modify position state for testing
    positionState.updatePositionPriceRange(
      position.positionAddress,
      simulatedLowerPrice,
      simulatedUpperPrice
    );
    
    // Check if rebalancing is needed
    logger.info('Checking if rebalancing is needed...');
    const needsRebalancing = await autoRebalancer.checkIfRebalancingNeeded(
      currentTick,
      positionState.getActivePosition()!,
      currentPrice
    );
    
    logger.info(`Rebalancing needed: ${needsRebalancing}`);
    
    if (needsRebalancing) {
      logger.info('Executing rebalance...');
      const rebalanceResult = await autoRebalancer.executeRebalance(
        positionState.getActivePosition()!,
        typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice
      );
      
      logger.info(`Rebalance result: ${JSON.stringify(rebalanceResult, null, 2)}`);
    }
    
    // Restore original position state
    positionState.updatePositionPriceRange(
      position.positionAddress,
      originalLowerPrice,
      originalUpperPrice
    );
    
    logger.info('Restored original position state');
    logger.info('Auto-rebalancing test completed');
    
    return { success: true };
  } catch (error) {
    logger.error('Error testing rebalancing:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Run the test
testRebalancing().then(result => {
  if (result.success) {
    logger.info('Rebalancing test completed successfully');
  } else {
    logger.error(`Rebalancing test failed: ${result.message || result.error}`);
  }
  
  // Exit after test completes
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  logger.error('Unhandled error in rebalancing test:', error);
  process.exit(1);
});
