import { ENV } from '../config/env';
import { getWalletSolBalance } from '../services/walletUtils';
import { getWsolBalance, getTokenBalanceWithRetry, unwrapSol } from '../services/tokenUtils';
import * as logger from '../utils/logger';
import { cmdOpenPosition, cmdAddLiquidity, cmdClaimFees, cmdCheckPosition, cmdClosePosition } from './position';

// Sleep utility function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Command to run the full lifecycle demo
 */
export async function cmdRunFullLifecycle() {
  try {
    logger.info('Starting Orca Liquidity Agent full lifecycle demo...');
    
    // Check wallet balances
    const solBalance = await getWalletSolBalance();
    const wsolBalance = await getWsolBalance();
    const usdcBalance = await getTokenBalanceWithRetry(ENV.USDC_MINT!);
    
    logger.info('Wallet balances:');
    logger.info(`- SOL: ${solBalance}`);
    logger.info(`- WSOL: ${wsolBalance}`);
    logger.info(`- USDC: ${usdcBalance || 0}`);
    
    // 1. Open a new position
    logger.info(`\n1. Opening a new position...`);
    const { positionAddress, positionMint } = await cmdOpenPosition();
    
    // Wait a bit
    logger.info('\nWaiting 5 seconds...');
    await sleep(5000);
    
    // 2. Add liquidity to the position
    logger.info(`\n2. Adding liquidity to position...`);
    await cmdAddLiquidity();
    
    // Wait a bit
    logger.info('\nWaiting 10 seconds...');
    await sleep(10000);
    
    // 3. Claim any fees (might be zero if no trades have occurred)
    logger.info(`\n3. Claiming fees from position...`);
    await cmdClaimFees();
    
    // Wait a bit
    logger.info('\nWaiting 5 seconds...');
    await sleep(5000);
    
    // 4. Check position status
    logger.info(`\n4. Checking position status...`);
    await cmdCheckPosition();
    
    // Wait a bit
    logger.info('\nWaiting 5 seconds...');
    await sleep(5000);
    
    // 5. Close the position
    logger.info(`\n5. Closing the position...`);
    await cmdClosePosition();
    
    // 6. Unwrap any WSOL back to SOL
    logger.info(`\n6. Unwrapping WSOL back to SOL...`);
    await unwrapSol();
    
    logger.info('\nLiquidity position lifecycle completed successfully!');
    return { success: true };
    
  } catch (error) {
    logger.error('Error in full lifecycle execution:', error);
    return { success: false, error: (error as Error).message };
  }
}
