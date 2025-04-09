import { query } from './index';
import * as logger from '../../utils/logger';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

// Interface for position data
export interface PositionData {
  positionAddress: PublicKey;
  positionMint: PublicKey;
  whirlpoolAddress: PublicKey;
  tickLowerIndex: number;
  tickUpperIndex: number;
  liquidity: BN;
  feeOwedA: BN;
  feeOwedB: BN;
  createdAt: Date;
  lastUpdatedAt: Date;
  isActive: boolean;
}

// Interface for position snapshot data
export interface PositionSnapshotData {
  positionAddress: PublicKey;
  whirlpoolAddress: PublicKey;
  tickCurrentIndex: number;
  rangeStatus: string;
  liquidity: BN;
  feeOwedA: BN;
  feeOwedB: BN;
  timestamp: Date;
}

// Save position data to the database
export async function savePosition(position: PositionData): Promise<void> {
  try {
    const result = await query(
      `INSERT INTO positions (
        position_address, position_mint, whirlpool_address, 
        tick_lower_index, tick_upper_index, liquidity,
        fee_owed_a, fee_owed_b, created_at, last_updated_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (position_address) DO UPDATE SET
        liquidity = $6,
        fee_owed_a = $7,
        fee_owed_b = $8,
        last_updated_at = $10,
        is_active = $11
      RETURNING id`,
      [
        position.positionAddress.toString(),
        position.positionMint.toString(),
        position.whirlpoolAddress.toString(),
        position.tickLowerIndex,
        position.tickUpperIndex,
        position.liquidity.toString(),
        position.feeOwedA.toString(),
        position.feeOwedB.toString(),
        position.createdAt,
        position.lastUpdatedAt,
        position.isActive
      ]
    );
    
    logger.info(`Position saved to database with ID: ${result.rows[0].id}`);
  } catch (error) {
    logger.error('Error saving position to database:', error);
    throw error;
  }
}

// Get position data from the database
export async function getPositionByAddress(positionAddress: string): Promise<PositionData | null> {
  try {
    const result = await query(
      `SELECT * FROM positions WHERE position_address = $1`,
      [positionAddress]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row: any = result.rows[0];
    return {
      positionAddress: new PublicKey(row.position_address),
      positionMint: new PublicKey(row.position_mint),
      whirlpoolAddress: new PublicKey(row.whirlpool_address),
      tickLowerIndex: row.tick_lower_index,
      tickUpperIndex: row.tick_upper_index,
      liquidity: new BN(row.liquidity),
      feeOwedA: new BN(row.fee_owed_a),
      feeOwedB: new BN(row.fee_owed_b),
      createdAt: row.created_at,
      lastUpdatedAt: row.last_updated_at,
      isActive: row.is_active
    };
  } catch (error) {
    logger.error('Error getting position from database:', error);
    throw error;
  }
}

// Save position snapshot to the database
export async function savePositionSnapshot(snapshot: PositionSnapshotData): Promise<void> {
  try {
    await query(
      `INSERT INTO position_snapshots (
        position_address, whirlpool_address, tick_current_index,
        range_status, liquidity, fee_owed_a, fee_owed_b, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        snapshot.positionAddress.toString(),
        snapshot.whirlpoolAddress.toString(),
        snapshot.tickCurrentIndex,
        snapshot.rangeStatus,
        snapshot.liquidity.toString(),
        snapshot.feeOwedA.toString(),
        snapshot.feeOwedB.toString(),
        snapshot.timestamp
      ]
    );
    
    logger.debug(`Position snapshot saved to database for position: ${snapshot.positionAddress.toString()}`);
  } catch (error) {
    logger.error('Error saving position snapshot to database:', error);
    throw error;
  }
}

// Get recent position snapshots
export async function getRecentSnapshots(
  positionAddress: string,
  limit: number = 100
): Promise<PositionSnapshotData[]> {
  try {
    const result = await query(
      `SELECT * FROM position_snapshots 
       WHERE position_address = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [positionAddress, limit]
    );
    
    return result.rows.map((row: any) => ({
      positionAddress: new PublicKey(row.position_address),
      whirlpoolAddress: new PublicKey(row.whirlpool_address),
      tickCurrentIndex: row.tick_current_index,
      rangeStatus: row.range_status,
      liquidity: new BN(row.liquidity),
      feeOwedA: new BN(row.fee_owed_a),
      feeOwedB: new BN(row.fee_owed_b),
      timestamp: row.timestamp
    }));
  } catch (error) {
    logger.error('Error getting position snapshots from database:', error);
    throw error;
  }
}

// Mark position as inactive
export async function deactivatePosition(positionAddress: string): Promise<void> {
  try {
    await query(
      `UPDATE positions SET is_active = false, last_updated_at = NOW() 
       WHERE position_address = $1`,
      [positionAddress]
    );
    
    logger.info(`Position ${positionAddress} marked as inactive in database`);
  } catch (error) {
    logger.error('Error deactivating position in database:', error);
    throw error;
  }
}
