/**
 * Position monitoring service
 * Periodically checks the status of active liquidity positions
 */

import { PublicKey } from '@solana/web3.js';
import { fetchPositionDetails, fetchWhirlpoolData } from './orca';
import { positionState } from './positionState';
import { checkPositionRangeStatus, PositionRangeStatus, formatFeeAmount } from '../utils/positionUtils';
import * as logger from '../utils/logger';

// Default monitoring interval (60 seconds)
const DEFAULT_MONITOR_INTERVAL_MS = 60 * 1000;

let monitoringInterval: NodeJS.Timeout | null = null;
let isMonitoringActive = false;

/**
 * Start monitoring the active position
 * @param intervalMs Optional custom interval in milliseconds
 * @returns True if monitoring started, false if already running or no active position
 */
export function startMonitoring(intervalMs = DEFAULT_MONITOR_INTERVAL_MS): boolean {
  if (isMonitoringActive) {
    logger.warn('Position monitoring is already active');
    return false;
  }

  if (!positionState.hasActivePosition()) {
    logger.warn('Cannot start monitoring: No active position');
    return false;
  }

  // Run the monitoring function immediately once
  monitorActivePosition();

  // Then set up the interval
  monitoringInterval = setInterval(monitorActivePosition, intervalMs);
  isMonitoringActive = true;
  
  logger.info(`Position monitoring started with interval of ${intervalMs / 1000} seconds`);
  return true;
}

/**
 * Stop monitoring the active position
 * @returns True if monitoring was stopped, false if not running
 */
export function stopMonitoring(): boolean {
  if (!isMonitoringActive || !monitoringInterval) {
    logger.warn('Position monitoring is not active');
    return false;
  }

  clearInterval(monitoringInterval);
  monitoringInterval = null;
  isMonitoringActive = false;
  
  logger.info('Position monitoring stopped');
  return true;
}

/**
 * Check if monitoring is currently active
 * @returns True if monitoring is active
 */
export function isMonitoring(): boolean {
  return isMonitoringActive;
}

/**
 * The main monitoring function that checks the position status
 */
async function monitorActivePosition(): Promise<void> {
  try {
    if (!positionState.hasActivePosition()) {
      logger.warn('No active position to monitor');
      stopMonitoring();
      return;
    }

    const position = positionState.getActivePosition()!;
    logger.debug(`Monitoring position: ${position.positionAddress.toString()}`);

    // 1. Fetch current whirlpool data (price/tick)
    const whirlpoolData = await fetchWhirlpoolData(position.whirlpoolAddress);
    const currentTick = whirlpoolData.tickCurrentIndex;
    const currentPrice = whirlpoolData.price;

    // 2. Fetch current position details
    const positionDetails = await fetchPositionDetails(position.positionAddress);

    // 3. Update the position state
    positionState.updatePositionDetails({
      liquidity: positionDetails.liquidity,
      feeOwedA: positionDetails.feeOwedA,
      feeOwedB: positionDetails.feeOwedB
    });

    // 4. Check if the position is in range
    const rangeStatus = checkPositionRangeStatus(
      currentTick,
      position.tickLowerIndex,
      position.tickUpperIndex
    );

    // 5. Log the monitored status
    const updatedPosition = positionState.getActivePosition()!;
    
    // Assuming token A is USDC (6 decimals) and token B is SOL (9 decimals)
    const formattedFeeA = formatFeeAmount(updatedPosition.feeOwedA.toString(), 6);
    const formattedFeeB = formatFeeAmount(updatedPosition.feeOwedB.toString(), 9);
    
    logger.info(`Position Monitoring Status:`);
    logger.info(`- Range Status: ${rangeStatus}`);
    logger.info(`- Current Price: ${currentPrice} SOL/USDC`);
    logger.info(`- Current Tick: ${currentTick}`);
    logger.info(`- Position Range: ${position.tickLowerIndex} to ${position.tickUpperIndex}`);
    logger.info(`- Liquidity: ${updatedPosition.liquidity.toString()}`);
    logger.info(`- Fees Owed: ${formattedFeeA} USDC, ${formattedFeeB} SOL`);
    logger.info(`- Last Updated: ${updatedPosition.lastUpdatedAt.toISOString()}`);
    
  } catch (error) {
    logger.error('Error monitoring position:', error);
    // Don't stop monitoring on error, just log it and continue on next interval
  }
}

// Export monitoring status and functions
export const positionMonitor = {
  start: startMonitoring,
  stop: stopMonitoring,
  isActive: isMonitoring
};
