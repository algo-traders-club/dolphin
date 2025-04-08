/**
 * Test script for position monitoring functionality
 */

import { PublicKey } from '@solana/web3.js';
import { fetchPositionDetails, fetchWhirlpoolData } from '../services/orca';
import { positionState } from '../services/positionState';
import { positionMonitor } from '../services/positionMonitor';
import { checkPositionRangeStatus, PositionRangeStatus } from '../utils/positionUtils';
import * as logger from '../utils/logger';
import { BN } from '@project-serum/anchor';
import { ENV } from '../config/env';

// Mainnet USDC/SOL Whirlpool address
const USDC_SOL_WHIRLPOOL_ADDRESS = new PublicKey(ENV.USDC_SOL_WHIRLPOOL_ADDRESS || 'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ');

async function main() {
  try {
    logger.info('Testing position monitoring functionality with real data...');
    
    // First, let's fetch data about the Whirlpool
    logger.info(`Fetching data for USDC/SOL Whirlpool: ${USDC_SOL_WHIRLPOOL_ADDRESS.toString()}`);
    const whirlpoolData = await fetchWhirlpoolData(USDC_SOL_WHIRLPOOL_ADDRESS);
    logger.info(`Whirlpool data fetched successfully!`);
    logger.info(`Current tick: ${whirlpoolData.tickCurrentIndex}`);
    logger.info(`Current price: ${whirlpoolData.price} SOL per USDC`);
    
    // Check if we have an active position
    if (!positionState.hasActivePosition()) {
      logger.warn('No active position found. Please create a position first using the openPosition function.');
      logger.info('You can create a position by running:');
      logger.info('bun run src/main.ts open-position');
      return;
    }
    
    // Get the active position
    const position = positionState.getActivePosition()!;
    logger.info(`Using position: ${position.positionAddress.toString()}`);
    
    // Fetch real position details
    logger.info(`Fetching details for position: ${position.positionAddress.toString()}`);
    try {
      const positionDetails = await fetchPositionDetails(position.positionAddress);
      logger.info(`Position details fetched successfully!`);
      logger.info(`Liquidity: ${positionDetails.liquidity.toString()}`);
      logger.info(`Fee owed A (USDC): ${positionDetails.feeOwedA.toString()}`);
      logger.info(`Fee owed B (SOL): ${positionDetails.feeOwedB.toString()}`);
      
      // Update position state with real data
      positionState.updatePositionDetails({
        liquidity: positionDetails.liquidity,
        feeOwedA: positionDetails.feeOwedA,
        feeOwedB: positionDetails.feeOwedB
      });
    } catch (error) {
      logger.error(`Error fetching position details: ${(error as Error).message}`);
      logger.warn('Continuing with existing position state data');
    }
    
    // Test position range status with real data
    const rangeStatus = checkPositionRangeStatus(
      whirlpoolData.tickCurrentIndex,
      position.tickLowerIndex,
      position.tickUpperIndex
    );
    logger.info(`Position range status: ${rangeStatus}`);
    
    // Start position monitoring with real data
    logger.info('Starting position monitoring...');
    positionMonitor.start(10000); // Use a shorter interval (10 seconds) for testing
    
    // Keep the script running for a minute to observe monitoring
    logger.info('Monitoring active. Waiting for 60 seconds to observe...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Stop monitoring
    logger.info('Stopping position monitoring...');
    positionMonitor.stop();
    
    logger.info('Position monitoring test completed successfully!');
    
  } catch (error) {
    logger.error('Error testing position monitoring:', error);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => logger.error('Unhandled error:', error));
}

export default main;
