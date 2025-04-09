/**
 * Auto Rebalancer Service
 * 
 * This service is responsible for automatically rebalancing liquidity positions
 * when they go out of range, optimizing for capital efficiency while minimizing
 * transaction costs.
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Decimal from 'decimal.js';
import { positionState } from './positionState';
import { fetchPositionDetails, fetchWhirlpoolData } from './orca';
import { checkPositionRangeStatus, PositionRangeStatus } from '../utils/positionUtils';
import { claimFees, removeLiquidity, closePosition, openPosition, addLiquidity } from './liquidityManager';
import { saveRebalanceHistory } from './database/rebalanceService';
import { getConnection } from './walletUtils';
import * as logger from '../utils/logger';
import { config } from '../config/env';

// Default values for rebalancing parameters
const DEFAULT_REBALANCE_THRESHOLD_PERCENT = 5;
const DEFAULT_MIN_REBALANCE_INTERVAL_MINUTES = 60;
const DEFAULT_POSITION_WIDTH_PERCENT = 20;
const DEFAULT_MAX_DAILY_REBALANCES = 6;
const MIN_OUT_OF_RANGE_MINUTES = 15;

/**
 * Auto Rebalancer class for automatically rebalancing liquidity positions
 */
export class AutoRebalancer {
  private lastRebalanceTime: Date | null = null;
  private rebalanceCount: number = 0;
  private rebalanceCountResetTime: Date = new Date();
  private positionOutOfRangeSince: Date | null = null;
  private isRebalancing: boolean = false;

  /**
   * Create a new auto rebalancer
   */
  constructor() {
    // Reset the daily rebalance count at midnight
    this.scheduleRebalanceCountReset();
  }

  /**
   * Schedule the reset of the rebalance count at midnight
   */
  private scheduleRebalanceCountReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.rebalanceCount = 0;
      this.rebalanceCountResetTime = new Date();
      logger.info('Daily rebalance count reset');
      
      // Schedule the next reset
      this.scheduleRebalanceCountReset();
    }, timeUntilMidnight);
  }

  /**
   * Check if a position needs rebalancing
   * @param currentTick The current tick index
   * @param position The position to check
   * @param currentPrice The current price
   * @returns True if the position needs rebalancing
   */
  async checkIfRebalancingNeeded(
    currentTick: number,
    position: {
      tickLowerIndex: number;
      tickUpperIndex: number;
      positionAddress: PublicKey;
      whirlpoolAddress: PublicKey;
    },
    currentPrice: string | number
  ): Promise<boolean> {
    // Check if rebalancing is enabled
    if (!config.REBALANCE_ENABLED) {
      return false;
    }

    // Check if we're already rebalancing
    if (this.isRebalancing) {
      logger.info('Rebalancing is already in progress');
      return false;
    }

    // Check if we've reached the maximum number of rebalances for the day
    const maxDailyRebalances = config.MAX_DAILY_REBALANCES || DEFAULT_MAX_DAILY_REBALANCES;
    if (this.rebalanceCount >= maxDailyRebalances) {
      logger.info(`Maximum daily rebalances reached (${this.rebalanceCount}/${maxDailyRebalances})`);
      return false;
    }

    // Check the position range status
    const rangeStatus = checkPositionRangeStatus(
      currentTick,
      position.tickLowerIndex,
      position.tickUpperIndex
    );

    // If the position is in range, reset the out-of-range timer
    if (rangeStatus === PositionRangeStatus.IN_RANGE) {
      this.positionOutOfRangeSince = null;
      return false;
    }

    // If the position just went out of range, start the timer
    if (!this.positionOutOfRangeSince) {
      this.positionOutOfRangeSince = new Date();
      logger.info(`Position went out of range at ${this.positionOutOfRangeSince.toISOString()}`);
      return false;
    }

    // Check if the position has been out of range for long enough
    const outOfRangeMinutes = (new Date().getTime() - this.positionOutOfRangeSince.getTime()) / (60 * 1000);
    if (outOfRangeMinutes < MIN_OUT_OF_RANGE_MINUTES) {
      logger.info(`Position out of range for ${outOfRangeMinutes.toFixed(1)} minutes, waiting for ${MIN_OUT_OF_RANGE_MINUTES} minutes before rebalancing`);
      return false;
    }

    // Check if we've waited long enough since the last rebalance
    const minRebalanceIntervalMinutes = config.MIN_REBALANCE_INTERVAL_MINUTES || DEFAULT_MIN_REBALANCE_INTERVAL_MINUTES;
    if (this.lastRebalanceTime) {
      const minutesSinceLastRebalance = (new Date().getTime() - this.lastRebalanceTime.getTime()) / (60 * 1000);
      if (minutesSinceLastRebalance < minRebalanceIntervalMinutes) {
        logger.info(`Last rebalance was ${minutesSinceLastRebalance.toFixed(1)} minutes ago, waiting for ${minRebalanceIntervalMinutes} minutes between rebalances`);
        return false;
      }
    }

    // Check if the price has moved beyond the threshold
    const rebalanceThresholdPercent = config.REBALANCE_THRESHOLD_PERCENT || DEFAULT_REBALANCE_THRESHOLD_PERCENT;
    const numericPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    
    // Calculate price thresholds
    let priceThresholdExceeded = false;
    
    if (rangeStatus === PositionRangeStatus.BELOW_RANGE) {
      // If below range, check if price is more than threshold% below lower bound
      const lowerBoundPrice = this.tickToPrice(position.tickLowerIndex);
      const thresholdPrice = lowerBoundPrice * (1 - rebalanceThresholdPercent / 100);
      priceThresholdExceeded = numericPrice < thresholdPrice;
      
      if (priceThresholdExceeded) {
        logger.info(`Price (${numericPrice}) is more than ${rebalanceThresholdPercent}% below lower bound (${lowerBoundPrice})`);
      }
    } else if (rangeStatus === PositionRangeStatus.ABOVE_RANGE) {
      // If above range, check if price is more than threshold% above upper bound
      const upperBoundPrice = this.tickToPrice(position.tickUpperIndex);
      const thresholdPrice = upperBoundPrice * (1 + rebalanceThresholdPercent / 100);
      priceThresholdExceeded = numericPrice > thresholdPrice;
      
      if (priceThresholdExceeded) {
        logger.info(`Price (${numericPrice}) is more than ${rebalanceThresholdPercent}% above upper bound (${upperBoundPrice})`);
      }
    }

    // Check if gas costs are reasonable
    const isGasCostReasonable = await this.checkGasCosts();
    if (!isGasCostReasonable) {
      logger.info('Gas costs are too high for rebalancing');
      return false;
    }

    // If all conditions are met, we need to rebalance
    return priceThresholdExceeded;
  }

  /**
   * Check if gas costs are reasonable for rebalancing
   * @returns True if gas costs are reasonable
   */
  private async checkGasCosts(): Promise<boolean> {
    try {
      const connection = getConnection();
      
      // Get recent prioritization fees
      const recentPrioritizationFees = await connection.getRecentPrioritizationFees();
      
      if (recentPrioritizationFees.length === 0) {
        // No recent fees data, assume it's reasonable
        return true;
      }
      
      // Calculate the average prioritization fee
      const avgFee = recentPrioritizationFees.reduce((sum, fee) => sum + fee.prioritizationFee, 0) / recentPrioritizationFees.length;
      
      // If the average fee is too high, skip rebalancing
      // 100_000 is a reasonable threshold (in micro-lamports)
      const MAX_ACCEPTABLE_FEE = 100_000;
      
      if (avgFee > MAX_ACCEPTABLE_FEE) {
        logger.info(`Average prioritization fee (${avgFee}) is too high for rebalancing`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.warn('Error checking gas costs:', error);
      // Default to true if we can't check
      return true;
    }
  }

  /**
   * Convert a tick index to a price
   * @param tickIndex The tick index
   * @returns The price
   */
  private tickToPrice(tickIndex: number): number {
    // This is a simplified conversion for SOL/USDC
    // In a real implementation, we'd use the SDK's PriceMath.tickIndexToPrice
    return Math.pow(1.0001, tickIndex);
  }

  /**
   * Calculate the optimal price range for a new position
   * @param currentPrice The current price
   * @returns The lower and upper price bounds
   */
  calculateOptimalRange(currentPrice: number): { lowerPrice: Decimal, upperPrice: Decimal } {
    const positionWidthPercent = config.POSITION_WIDTH_PERCENT || DEFAULT_POSITION_WIDTH_PERCENT;
    
    // Calculate the lower and upper bounds
    const lowerPrice = new Decimal(currentPrice).mul(new Decimal(1).minus(new Decimal(positionWidthPercent).div(100)));
    const upperPrice = new Decimal(currentPrice).mul(new Decimal(1).plus(new Decimal(positionWidthPercent).div(100)));
    
    logger.info(`Calculated optimal range: ${lowerPrice.toString()} to ${upperPrice.toString()} (width: ${positionWidthPercent}%)`);
    
    return { lowerPrice, upperPrice };
  }

  /**
   * Execute a rebalance for a position
   * @param position The position to rebalance
   * @param currentPrice The current price
   * @returns The result of the rebalance
   */
  async executeRebalance(
    position: {
      positionAddress: PublicKey;
      positionMint: PublicKey;
      whirlpoolAddress: PublicKey;
    },
    currentPrice: number
  ): Promise<{ success: boolean, txIds: string[] }> {
    try {
      // Set the rebalancing flag
      this.isRebalancing = true;
      
      logger.info(`Starting rebalance for position: ${position.positionAddress.toString()}`);
      logger.info(`Current price: ${currentPrice}`);
      
      const txIds: string[] = [];
      
      // 1. Claim all accumulated fees first
      logger.info('Step 1: Claiming accumulated fees');
      const claimResult = await claimFees(position.positionAddress);
      if (claimResult.txId) {
        txIds.push(claimResult.txId);
      }
      
      // 2. Remove 90% of liquidity (leave 10% to maintain position)
      logger.info('Step 2: Removing 90% of liquidity');
      const positionDetails = await fetchPositionDetails(position.positionAddress);
      const liquidityToRemove = positionDetails.liquidity.mul(new BN(90)).div(new BN(100));
      
      const removeResult = await removeLiquidity(position.positionAddress, liquidityToRemove);
      if (removeResult.txId) {
        txIds.push(removeResult.txId);
      }
      
      // 3. Calculate the optimal range for the new position
      logger.info('Step 3: Calculating optimal range for new position');
      const { lowerPrice, upperPrice } = this.calculateOptimalRange(currentPrice);
      
      // 4. Open a new position with the optimal range
      logger.info('Step 4: Opening new position');
      const openResult = await openPosition(position.whirlpoolAddress, lowerPrice, upperPrice);
      if (openResult.txId) {
        txIds.push(openResult.txId);
      }
      
      // 5. Add liquidity to the new position
      // We need to determine how much USDC we have available
      logger.info('Step 5: Adding liquidity to new position');
      // For simplicity, we'll use a fixed amount of USDC
      // In a real implementation, we'd check the wallet balance
      const usdcAmount = new Decimal(10); // 10 USDC
      
      const addResult = await addLiquidity(
        new PublicKey(openResult.positionAddress),
        usdcAmount
      );
      if (addResult.txId) {
        txIds.push(addResult.txId);
      }
      
      // 6. Close the old position (optional, can keep it open with minimal liquidity)
      // We're skipping this step as per the requirements to leave 10% liquidity
      
      // Update rebalance state
      this.lastRebalanceTime = new Date();
      this.rebalanceCount++;
      this.positionOutOfRangeSince = null;
      
      // Record the rebalance in the database
      await this.recordRebalance(position.positionAddress, txIds);
      
      logger.info(`Rebalance completed successfully for position: ${position.positionAddress.toString()}`);
      logger.info(`New position: ${openResult.positionAddress.toString()}`);
      logger.info(`Transactions: ${txIds.join(', ')}`);
      
      return { success: true, txIds };
    } catch (error) {
      logger.error('Error executing rebalance:', error);
      return { success: false, txIds: [] };
    } finally {
      // Clear the rebalancing flag
      this.isRebalancing = false;
    }
  }

  /**
   * Record a rebalance in the database
   * @param positionAddress The address of the position
   * @param txIds The transaction IDs
   */
  private async recordRebalance(positionAddress: PublicKey, txIds: string[]): Promise<void> {
    try {
      await saveRebalanceHistory({
        positionAddress,
        timestamp: new Date(),
        transactionIds: txIds,
        success: true
      });
    } catch (dbError) {
      logger.error('Error recording rebalance history:', dbError);
    }
  }

  /**
   * Get the rebalance statistics
   * @returns The rebalance statistics
   */
  getRebalanceStats(): {
    lastRebalanceTime: Date | null;
    rebalanceCount: number;
    rebalanceCountResetTime: Date;
    positionOutOfRangeSince: Date | null;
  } {
    return {
      lastRebalanceTime: this.lastRebalanceTime,
      rebalanceCount: this.rebalanceCount,
      rebalanceCountResetTime: this.rebalanceCountResetTime,
      positionOutOfRangeSince: this.positionOutOfRangeSince
    };
  }
}

// Create and export a singleton instance
const autoRebalancerInstance = new AutoRebalancer();

// Export a compatible interface
export const autoRebalancer = {
  checkIfRebalancingNeeded: (currentTick: number, position: any, currentPrice: string | number) => 
    autoRebalancerInstance.checkIfRebalancingNeeded(currentTick, position, currentPrice),
  executeRebalance: (position: any, currentPrice: number) => 
    autoRebalancerInstance.executeRebalance(position, currentPrice),
  calculateOptimalRange: (currentPrice: number) => 
    autoRebalancerInstance.calculateOptimalRange(currentPrice),
  getRebalanceStats: () => 
    autoRebalancerInstance.getRebalanceStats()
};
