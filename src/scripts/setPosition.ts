import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { positionState } from '../services/positionState';
import * as logger from '../utils/logger';

// Set the position information based on our previous session
async function main() {
  try {
    // Position details from our memory
    const positionAddress = new PublicKey('HSwifErTLV5yiMrgmYfCGxPtwohekJX9CM4T6NJdzptU');
    const whirlpoolAddress = new PublicKey('HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ');
    
    // We don't have the position mint, but we can set a placeholder
    // The actual mint will be retrieved when we interact with the position
    const positionMint = new PublicKey('11111111111111111111111111111111');
    
    // Set the position in the state manager
    positionState.setActivePosition({
      positionAddress,
      positionMint,
      whirlpoolAddress,
      tickLowerIndex: -39104, // From memory: 0.01 to 0.05 SOL per USDC (ticks -39104 to -22976)
      tickUpperIndex: -22976,
      liquidity: new BN(1), // Minimal liquidity
      createdAt: new Date(),
      feeOwedA: new BN(0),
      feeOwedB: new BN(0),
      lastUpdatedAt: new Date()
    });
    
    logger.info(`Position set successfully: ${positionAddress.toString()}`);
    logger.info(`Whirlpool: ${whirlpoolAddress.toString()}`);
    logger.info(`Tick range: ${-39104} to ${-22976}`);
    
    // Now let's check if the position is recognized
    const activePosition = positionState.getActivePosition();
    if (activePosition) {
      logger.info('Active position found in state!');
    } else {
      logger.error('Failed to set active position.');
    }
  } catch (error) {
    logger.error('Error setting position:', error);
  }
}

main().catch(console.error);
