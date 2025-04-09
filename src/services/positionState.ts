import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

/**
 * Interface representing a liquidity position
 */
export interface LiquidityPosition {
  positionAddress: PublicKey;
  positionMint: PublicKey;
  whirlpoolAddress: PublicKey;
  tickLowerIndex: number;
  tickUpperIndex: number;
  liquidity: BN;
  createdAt: Date;
  // New fields for position monitoring
  feeOwedA: BN;
  feeOwedB: BN;
  lastUpdatedAt: Date;
}

import fs from 'fs';
import path from 'path';

// Path to store position data
const POSITION_DATA_PATH = path.join(process.cwd(), 'src', 'data');
const POSITION_FILE_PATH = path.join(POSITION_DATA_PATH, 'position.json');

// Singleton state management for the agent's active position
class PositionStateManager {
  private activePosition: LiquidityPosition | null = null;
  
  constructor() {
    // Try to load position from disk on initialization
    this.loadPositionFromDisk();
  }

  /**
   * Set the active position
   * @param position The position details to store
   */
  setActivePosition(position: LiquidityPosition): void {
    // Initialize fee fields if not provided
    if (!position.feeOwedA) {
      position.feeOwedA = new BN(0);
    }
    if (!position.feeOwedB) {
      position.feeOwedB = new BN(0);
    }
    if (!position.lastUpdatedAt) {
      position.lastUpdatedAt = new Date();
    }
    
    this.activePosition = position;
    console.log(`Position state updated: ${position.positionAddress.toString()}`);
    
    // Save the position data to disk
    this.savePositionToDisk();
  }

  /**
   * Get the currently active position
   * @returns The active position or null if none exists
   */
  getActivePosition(): LiquidityPosition | null {
    return this.activePosition;
  }
  
  /**
   * Save the current position data to disk
   */
  private savePositionToDisk(): void {
    try {
      // Create the data directory if it doesn't exist
      if (!fs.existsSync(POSITION_DATA_PATH)) {
        fs.mkdirSync(POSITION_DATA_PATH, { recursive: true });
      }
      
      if (this.activePosition) {
        // Convert PublicKey objects to strings for JSON serialization
        const serializedPosition = {
          ...this.activePosition,
          positionAddress: this.activePosition.positionAddress.toString(),
          positionMint: this.activePosition.positionMint.toString(),
          whirlpoolAddress: this.activePosition.whirlpoolAddress.toString(),
          liquidity: this.activePosition.liquidity.toString(),
          feeOwedA: this.activePosition.feeOwedA.toString(),
          feeOwedB: this.activePosition.feeOwedB.toString(),
          createdAt: this.activePosition.createdAt.toISOString(),
          lastUpdatedAt: this.activePosition.lastUpdatedAt.toISOString()
        };
        
        fs.writeFileSync(POSITION_FILE_PATH, JSON.stringify(serializedPosition, null, 2));
        console.log(`Position data saved to ${POSITION_FILE_PATH}`);
      } else {
        // If there's no active position but the file exists, remove it
        if (fs.existsSync(POSITION_FILE_PATH)) {
          fs.unlinkSync(POSITION_FILE_PATH);
          console.log(`Removed position data file at ${POSITION_FILE_PATH}`);
        }
      }
    } catch (error) {
      console.error('Error saving position data to disk:', error);
    }
  }
  
  /**
   * Load position data from disk
   */
  private loadPositionFromDisk(): void {
    try {
      if (fs.existsSync(POSITION_FILE_PATH)) {
        const data = fs.readFileSync(POSITION_FILE_PATH, 'utf8');
        const serializedPosition = JSON.parse(data);
        
        // Convert string representations back to their original types
        this.activePosition = {
          positionAddress: new PublicKey(serializedPosition.positionAddress),
          positionMint: new PublicKey(serializedPosition.positionMint),
          whirlpoolAddress: new PublicKey(serializedPosition.whirlpoolAddress),
          tickLowerIndex: serializedPosition.tickLowerIndex,
          tickUpperIndex: serializedPosition.tickUpperIndex,
          liquidity: new BN(serializedPosition.liquidity),
          feeOwedA: new BN(serializedPosition.feeOwedA),
          feeOwedB: new BN(serializedPosition.feeOwedB),
          createdAt: new Date(serializedPosition.createdAt),
          lastUpdatedAt: new Date(serializedPosition.lastUpdatedAt)
        };
        
        console.log(`Loaded position data from ${POSITION_FILE_PATH}`);
      }
    } catch (error) {
      console.error('Error loading position data from disk:', error);
    }
  }

  /**
   * Check if there is an active position
   * @returns True if a position is active, false otherwise
   */
  hasActivePosition(): boolean {
    return this.activePosition !== null;
  }

  /**
   * Clear the active position state (e.g., after closing a position)
   */
  clearActivePosition(): void {
    if (this.activePosition) {
      console.log(`Cleared position state: ${this.activePosition.positionAddress.toString()}`);
    }
    this.activePosition = null;
    
    // Save the updated state (which will remove the position file)
    this.savePositionToDisk();
  }

  /**
   * Update the liquidity amount for the active position
   * @param newLiquidity The new liquidity amount
   */
  updateLiquidity(newLiquidity: BN): void {
    if (!this.activePosition) {
      throw new Error('Cannot update liquidity: No active position');
    }
    this.activePosition.liquidity = newLiquidity;
    this.activePosition.lastUpdatedAt = new Date();
    console.log(`Updated liquidity for position: ${this.activePosition.positionAddress.toString()}`);
    
    // Save the updated position data to disk
    this.savePositionToDisk();
  }
  
  /**
   * Update position details including liquidity and fees
   * @param details The position details to update
   */
  updatePositionDetails(details: { liquidity: BN, feeOwedA: BN, feeOwedB: BN }): void {
    if (!this.activePosition) {
      throw new Error('Cannot update position details: No active position');
    }
    
    this.activePosition.liquidity = details.liquidity;
    this.activePosition.feeOwedA = details.feeOwedA;
    this.activePosition.feeOwedB = details.feeOwedB;
    this.activePosition.lastUpdatedAt = new Date();
    
    console.log(`Updated position details for: ${this.activePosition.positionAddress.toString()}`);
    console.log(`Liquidity: ${details.liquidity.toString()}`);
    console.log(`Fee owed A: ${details.feeOwedA.toString()}`);
    console.log(`Fee owed B: ${details.feeOwedB.toString()}`);
    
    // Save the updated position data to disk
    this.savePositionToDisk();
  }
}

// Export a singleton instance
export const positionState = new PositionStateManager();
