/**
 * Position Monitoring Service
 * 
 * This service is responsible for monitoring liquidity positions on Orca Whirlpools.
 * It periodically fetches position data, updates the position state, and saves snapshots
 * to the database for historical tracking.
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { fetchPositionDetails, fetchWhirlpoolData } from './orca';
import { positionState } from './positionState';
import { checkPositionRangeStatus, PositionRangeStatus, formatFeeAmount } from '../utils/positionUtils';
import { savePositionSnapshot } from './database/positionService';
import type { PositionSnapshotData } from './database/positionService';
import * as logger from '../utils/logger';
import { withRetry } from './walletUtils';

// Default monitoring interval (60 seconds)
const DEFAULT_MONITOR_INTERVAL_MS = 60 * 1000;

/**
 * Position Monitor class for tracking liquidity positions
 */
export class PositionMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private active = false;
  private lastPoolData: {
    tickCurrentIndex: number;
    price: number;
    timestamp: Date;
  } | null = null;
  private readonly intervalMs: number;

  /**
   * Create a new position monitor
   * @param intervalMs Optional custom interval in milliseconds
   */
  constructor(intervalMs = DEFAULT_MONITOR_INTERVAL_MS) {
    this.intervalMs = intervalMs;
  }

  /**
   * Start monitoring the active position
   * @returns True if monitoring started, false if already running or no active position
   */
  async start(): Promise<boolean> {
    if (this.active) {
      logger.warn('Position monitoring is already active');
      return false;
    }

    if (!positionState.hasActivePosition()) {
      logger.warn('Cannot start monitoring: No active position');
      return false;
    }

    // Run the monitoring function immediately once
    try {
      await this.monitor();
    } catch (error) {
      logger.error('Error during initial position monitoring:', error);
      // Continue with interval setup even if initial monitoring fails
    }

    // Then set up the interval
    this.intervalId = setInterval(() => this.monitor(), this.intervalMs);
    this.active = true;
    
    logger.info(`Position monitoring started with interval of ${this.intervalMs / 1000} seconds`);
    return true;
  }

  /**
   * Stop monitoring the active position
   * @returns True if monitoring was stopped, false if not running
   */
  stop(): boolean {
    if (!this.active || !this.intervalId) {
      logger.warn('Position monitoring is not active');
      return false;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.active = false;
    
    logger.info('Position monitoring stopped');
    return true;
  }

  /**
   * Check if monitoring is currently active
   * @returns True if monitoring is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get the last cached pool data
   * @returns The last cached pool data or null if not available
   */
  getLastPoolData() {
    return this.lastPoolData;
  }

  /**
   * The main monitoring function that checks the position status
   * This is separated from the public interface to allow for better error handling
   */
  private async monitor(): Promise<void> {
    try {
      if (!positionState.hasActivePosition()) {
        logger.warn('No active position to monitor');
        this.stop();
        return;
      }

      const position = positionState.getActivePosition()!;
      logger.debug(`Monitoring position: ${position.positionAddress.toString()}`);

      // 1. Fetch current whirlpool data (price/tick) with retry
      const whirlpoolData = await this.fetchPoolDataWithRetry(position.whirlpoolAddress);
      const currentTick = whirlpoolData.tickCurrentIndex;
      const currentPrice = whirlpoolData.price;

      // Cache the pool data
      this.lastPoolData = {
        tickCurrentIndex: currentTick,
        price: currentPrice,
        timestamp: new Date()
      };

      // 2. Fetch current position details with retry
      const positionDetails = await this.fetchPositionDetailsWithRetry(position.positionAddress);

      // 3. Update the position state
      await this.updatePositionState(positionDetails);

      // 4. Check if the position is in range
      const rangeStatus = this.checkPositionRange(currentTick, position);

      // 5. Log the monitored status
      this.logPositionStatus(currentTick, currentPrice, position, rangeStatus);
      
      // 6. Save position snapshot to database
      await this.savePositionSnapshot(position, currentTick, rangeStatus);
      
    } catch (error) {
      logger.error('Error monitoring position:', error);
      // Don't stop monitoring on error, just log it and continue on next interval
    }
  }

  /**
   * Fetch pool data with retry logic
   * @param whirlpoolAddress The address of the whirlpool
   * @returns The whirlpool data
   */
  private async fetchPoolDataWithRetry(whirlpoolAddress: PublicKey) {
    return withRetry(async () => {
      logger.debug(`Fetching whirlpool data for ${whirlpoolAddress.toString()}`);
      return await fetchWhirlpoolData(whirlpoolAddress);
    }, 3, 1000);
  }

  /**
   * Fetch position details with retry logic
   * @param positionAddress The address of the position
   * @returns The position details
   */
  private async fetchPositionDetailsWithRetry(positionAddress: PublicKey) {
    return withRetry(async () => {
      logger.debug(`Fetching position details for ${positionAddress.toString()}`);
      return await fetchPositionDetails(positionAddress);
    }, 3, 1000);
  }

  /**
   * Update the position state with new details
   * @param positionDetails The position details to update
   */
  private async updatePositionState(positionDetails: {
    liquidity: BN;
    feeOwedA: BN;
    feeOwedB: BN;
  }) {
    positionState.updatePositionDetails({
      liquidity: positionDetails.liquidity,
      feeOwedA: positionDetails.feeOwedA,
      feeOwedB: positionDetails.feeOwedB
    });
  }

  /**
   * Check if the position is in range
   * @param currentTick The current tick index
   * @param position The position to check
   * @returns The range status
   */
  private checkPositionRange(
    currentTick: number,
    position: {
      tickLowerIndex: number;
      tickUpperIndex: number;
    }
  ): PositionRangeStatus {
    return checkPositionRangeStatus(
      currentTick,
      position.tickLowerIndex,
      position.tickUpperIndex
    );
  }

  /**
   * Log the position status
   * @param currentTick The current tick index
   * @param currentPrice The current price
   * @param position The position
   * @param rangeStatus The range status
   */
  private logPositionStatus(
    currentTick: number,
    currentPrice: number,
    position: {
      tickLowerIndex: number;
      tickUpperIndex: number;
    },
    rangeStatus: PositionRangeStatus
  ) {
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
  }

  /**
   * Save position snapshot to database
   * @param position The position
   * @param currentTick The current tick index
   * @param rangeStatus The range status
   */
  private async savePositionSnapshot(
    position: {
      positionAddress: PublicKey;
      whirlpoolAddress: PublicKey;
    },
    currentTick: number,
    rangeStatus: PositionRangeStatus
  ) {
    try {
      logger.info('Attempting to save position snapshot to database...');
      const updatedPosition = positionState.getActivePosition()!;
      
      const snapshotData: PositionSnapshotData = {
        positionAddress: position.positionAddress,
        whirlpoolAddress: position.whirlpoolAddress,
        tickCurrentIndex: currentTick,
        rangeStatus: rangeStatus,
        liquidity: updatedPosition.liquidity,
        feeOwedA: updatedPosition.feeOwedA,
        feeOwedB: updatedPosition.feeOwedB,
        timestamp: new Date()
      };
      
      logger.debug(`Snapshot data: ${JSON.stringify({
        positionAddress: snapshotData.positionAddress.toString(),
        whirlpoolAddress: snapshotData.whirlpoolAddress.toString(),
        tickCurrentIndex: snapshotData.tickCurrentIndex,
        rangeStatus: snapshotData.rangeStatus,
        liquidity: snapshotData.liquidity.toString(),
        feeOwedA: snapshotData.feeOwedA.toString(),
        feeOwedB: snapshotData.feeOwedB.toString(),
        timestamp: snapshotData.timestamp
      })}`);
      
      await savePositionSnapshot(snapshotData);
      logger.info('Position snapshot saved to database successfully');
    } catch (dbError) {
      logger.error(`Error saving position snapshot to database: ${dbError}`);
      // Continue even if database save fails
    }
  }
}

// Create and export a singleton instance
const positionMonitorInstance = new PositionMonitor();

// Export a compatible interface with the old module
export const positionMonitor = {
  start: () => positionMonitorInstance.start(),
  stop: () => positionMonitorInstance.stop(),
  isActive: () => positionMonitorInstance.isActive(),
  getInstance: () => positionMonitorInstance
};

// For backwards compatibility
export const startMonitoring = positionMonitor.start;
export const stopMonitoring = positionMonitor.stop;
export const isMonitoring = positionMonitor.isActive;
