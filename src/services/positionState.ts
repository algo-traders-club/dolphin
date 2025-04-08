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
}

// Singleton state management for the agent's active position
class PositionStateManager {
  private activePosition: LiquidityPosition | null = null;

  /**
   * Set the active position
   * @param position The position details to store
   */
  setActivePosition(position: LiquidityPosition): void {
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
    console.log(`Updated liquidity for position: ${this.activePosition.positionAddress.toString()}`);
  }
}

// Export a singleton instance
export const positionState = new PositionStateManager();
