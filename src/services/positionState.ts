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

// Singleton state management for the agent's active position
class PositionStateManager {
  private activePosition: LiquidityPosition | null = null;

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
  }

  /**
   * Get the currently active position
   * @returns The active position or null if none exists
   */
  getActivePosition(): LiquidityPosition | null {
    return this.activePosition;
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
  }
}

// Export a singleton instance
export const positionState = new PositionStateManager();
