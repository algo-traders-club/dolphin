/**
 * Rebalance History Database Service
 * 
 * This service handles database operations for tracking rebalance history.
 */

import { PublicKey } from '@solana/web3.js';
import { query, getClient } from './index';
import * as logger from '../../utils/logger';

/**
 * Interface for rebalance history data
 */
export interface RebalanceHistoryData {
  positionAddress: PublicKey;
  timestamp: Date;
  transactionIds: string[];
  success: boolean;
  errorMessage?: string;
  metrics?: {
    feesCollected?: string;
    oldRange?: string;
    newRange?: string;
    priceAtRebalance?: string;
    impermanentLoss?: string;
  };
}

/**
 * Initialize the rebalance history table
 */
export async function initRebalanceHistoryTable(): Promise<void> {
  try {
    logger.info('Initializing rebalance_history table...');
    
    // Create the rebalance_history table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS rebalance_history (
        id SERIAL PRIMARY KEY,
        position_address TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        transaction_ids TEXT[] NOT NULL,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        fees_collected TEXT,
        old_range TEXT,
        new_range TEXT,
        price_at_rebalance TEXT,
        impermanent_loss TEXT
      );
    `);
    
    // Create a hypertable for time-series data if TimescaleDB is available
    try {
      await query(`
        SELECT create_hypertable('rebalance_history', 'timestamp', if_not_exists => TRUE);
      `);
      logger.info('Created hypertable for rebalance_history');
    } catch (hypertableError) {
      // If this fails, TimescaleDB might not be available, which is fine
      logger.warn('Could not create hypertable for rebalance_history. TimescaleDB might not be available:', hypertableError);
    }
    
    // Create an index on position_address for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_rebalance_history_position_address
      ON rebalance_history (position_address);
    `);
    
    logger.info('Rebalance history table initialized successfully');
  } catch (error) {
    logger.error('Error initializing rebalance_history table:', error);
    throw error;
  }
}

/**
 * Save rebalance history to the database
 * @param data The rebalance history data to save
 * @returns The ID of the inserted record
 */
export async function saveRebalanceHistory(data: RebalanceHistoryData): Promise<number> {
  try {
    const result = await query(`
      INSERT INTO rebalance_history (
        position_address,
        timestamp,
        transaction_ids,
        success,
        error_message,
        fees_collected,
        old_range,
        new_range,
        price_at_rebalance,
        impermanent_loss
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING id;
    `, [
      data.positionAddress.toString(),
      data.timestamp,
      data.transactionIds,
      data.success,
      data.errorMessage || null,
      data.metrics?.feesCollected || null,
      data.metrics?.oldRange || null,
      data.metrics?.newRange || null,
      data.metrics?.priceAtRebalance || null,
      data.metrics?.impermanentLoss || null
    ]);
    
    logger.info(`Saved rebalance history with ID: ${result.rows[0].id}`);
    return result.rows[0].id;
  } catch (error) {
    logger.error('Error saving rebalance history:', error);
    throw error;
  }
}

/**
 * Get rebalance history for a position
 * @param positionAddress The position address
 * @param limit The maximum number of records to return
 * @returns The rebalance history records
 */
export async function getRebalanceHistory(positionAddress: PublicKey, limit: number = 10): Promise<any[]> {
  try {
    const result = await query(`
      SELECT *
      FROM rebalance_history
      WHERE position_address = $1
      ORDER BY timestamp DESC
      LIMIT $2;
    `, [positionAddress.toString(), limit]);
    
    return result.rows;
  } catch (error) {
    logger.error('Error getting rebalance history:', error);
    throw error;
  }
}

/**
 * Get rebalance metrics
 * @returns The rebalance metrics
 */
export async function getRebalanceMetrics(): Promise<any> {
  try {
    // Get total number of rebalances
    const totalResult = await query(`
      SELECT COUNT(*) as total_rebalances
      FROM rebalance_history;
    `);
    
    // Get success rate
    const successResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE success = true) as successful_rebalances,
        COUNT(*) as total_rebalances,
        ROUND((COUNT(*) FILTER (WHERE success = true)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2) as success_rate
      FROM rebalance_history;
    `);
    
    // Get rebalance frequency by day
    const frequencyResult = await query(`
      SELECT 
        DATE_TRUNC('day', timestamp) as day,
        COUNT(*) as rebalance_count
      FROM rebalance_history
      GROUP BY day
      ORDER BY day DESC
      LIMIT 7;
    `);
    
    return {
      totalRebalances: totalResult.rows[0].total_rebalances,
      successRate: successResult.rows[0].success_rate,
      successfulRebalances: successResult.rows[0].successful_rebalances,
      dailyFrequency: frequencyResult.rows
    };
  } catch (error) {
    logger.error('Error getting rebalance metrics:', error);
    throw error;
  }
}

/**
 * Get the last rebalance time for a position
 * @param positionAddress The position address
 * @returns The timestamp of the last rebalance or null if none
 */
export async function getLastRebalanceTime(positionAddress: PublicKey): Promise<Date | null> {
  try {
    const result = await query(`
      SELECT timestamp
      FROM rebalance_history
      WHERE position_address = $1
      ORDER BY timestamp DESC
      LIMIT 1;
    `, [positionAddress.toString()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].timestamp;
  } catch (error) {
    logger.error('Error getting last rebalance time:', error);
    throw error;
  }
}
