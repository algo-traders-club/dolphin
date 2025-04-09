import { PublicKey } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { ENV } from './config/env';
import { fetchWhirlpoolData, fetchPositionDetails } from './services/orca';
import { getWalletSolBalance } from './services/walletUtils';
import { networkManager } from './services/networkManager';
import { openPosition, addLiquidity, claimFees, removeLiquidity, closePosition } from './services/liquidityManager';
import { positionState } from './services/positionState';
import { wrapSol, unwrapSol, getWsolBalance, getTokenBalanceWithRetry } from './services/tokenUtils';
import { positionMonitor } from './services/positionMonitor';
import { checkPositionRangeStatus, PositionRangeStatus, formatFeeAmount } from './utils/positionUtils';
import * as logger from './utils/logger';
import { autoRebalancer } from './services/autoRebalancer';
import { config } from './config/env';

// Sleep utility function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize the logger
logger.initialize();

/**
 * Command to open a new position
 */
async function cmdOpenPosition() {
  try {
    logger.info('Opening a new liquidity position...');
    
    // Check if required environment variables are set
    if (!ENV.USDC_SOL_WHIRLPOOL_ADDRESS) {
      throw new Error('USDC_SOL_WHIRLPOOL_ADDRESS is not set in environment variables');
    }
    
    // Check wallet balances first
    const solBalance = await getWalletSolBalance();
    const wsolBalance = await getWsolBalance();
    
    // Check if USDC_MINT is defined
    if (!ENV.USDC_MINT) {
      logger.warn('USDC_MINT is not defined in environment variables');
      throw new Error('USDC_MINT is required but not set in environment variables');
    }
    
    // Use our new retry-enabled function to get USDC balance
    logger.info('Fetching USDC balance with retry logic...');
    const usdcBalance = await getTokenBalanceWithRetry(new PublicKey(ENV.USDC_MINT));
    
    logger.info(`Current balances:\n- SOL: ${solBalance}\n- WSOL: ${wsolBalance}\n- USDC: ${usdcBalance || 0}`);
    
    // We need USDC to open a position
    if (!usdcBalance || usdcBalance === 0) {
      logger.warn('No USDC available. You need USDC to open a SOL/USDC position.');
      logger.warn('Please acquire some USDC before opening a position.');
      throw new Error('Insufficient USDC balance. Please acquire USDC before opening a position.');
    }
    
    // Skip SOL wrapping for now since we have USDC
    // We'll handle liquidity addition in a separate step
    logger.info('Proceeding with position opening without wrapping SOL...');
    
    // Get the whirlpool address
    const whirlpoolAddress = new PublicKey(ENV.USDC_SOL_WHIRLPOOL_ADDRESS);
    
    // Fetch whirlpool data
    logger.info(`Fetching Whirlpool data...`);
    const whirlpoolData = await fetchWhirlpoolData(whirlpoolAddress);
    logger.info(`Current price: ${whirlpoolData.price} SOL per USDC`);
    
    // Open a new position
    const lowerPrice = new Decimal(ENV.DEFAULT_POSITION_LOWER_PRICE);
    const upperPrice = new Decimal(ENV.DEFAULT_POSITION_UPPER_PRICE);
    
    logger.info(`Price range: ${lowerPrice} to ${upperPrice} SOL per USDC`);
    
    const { positionAddress, positionMint } = await openPosition(
      whirlpoolAddress,
      lowerPrice,
      upperPrice
    );
    
    logger.info(`Position opened successfully: ${positionAddress.toString()}`);
    
    // Wait a bit
    await sleep(2000);
    
    // Start monitoring the position
    logger.info('Starting position monitoring...');
    positionMonitor.start();
    
    return { positionAddress, positionMint };
  } catch (error) {
    logger.error('Error opening position:', error);
    throw error;
  }
}

/**
 * Command to add liquidity to a position
 * @param smallAmount If true, adds a very small amount of liquidity that requires less SOL
 */
async function cmdAddLiquidity(smallAmount = false) {
  try {
    if (!positionState.hasActivePosition()) {
      throw new Error('No active position found. Please open a position first.');
    }
    
    const position = positionState.getActivePosition()!;
    logger.info(`Adding liquidity to position: ${position.positionAddress.toString()}`);
    
    // Wrap some SOL if needed for liquidity
    const wsolBalance = await getWsolBalance();
    const solBalance = await getWalletSolBalance();
    
    if (wsolBalance < 0.01 && solBalance > 0.02) {
      logger.info('Wrapping some SOL for liquidity...');
      await wrapSol(0.02);
    }
    
    // Get USDC balance
    const usdcBalance = await getTokenBalanceWithRetry(new PublicKey(ENV.USDC_MINT!));
    logger.info(`Available USDC balance: ${usdcBalance}`);
    
    // Determine the amount of USDC to use for liquidity
    let usdcAmount: Decimal;
    
    if (smallAmount) {
      // Use a small amount that requires less SOL but is still enough to create liquidity (5.0 USDC)
      usdcAmount = new Decimal(5.0);
      logger.info(`Using small liquidity amount (${usdcAmount} USDC) to minimize SOL requirements`);
    } else {
      // Use the default amount from environment variables
      usdcAmount = new Decimal(ENV.DEFAULT_LIQUIDITY_AMOUNT_USDC);
      logger.info(`Using default liquidity amount: ${usdcAmount} USDC`);
    }
    
    // Make sure we don't try to add more than available
    if (usdcBalance && usdcAmount.greaterThan(usdcBalance)) {
      logger.warn(`Requested amount (${usdcAmount}) exceeds available USDC balance (${usdcBalance}). Using available balance instead.`);
      usdcAmount = new Decimal(usdcBalance);
    }
    
    logger.info(`Adding ${usdcAmount} USDC worth of liquidity...`);
    
    try {
      await addLiquidity(position.positionAddress, usdcAmount);
      logger.info('Liquidity added successfully!');
      
      // Update position details
      const positionDetails = await fetchPositionDetails(position.positionAddress);
      positionState.updatePositionDetails({
        liquidity: positionDetails.liquidity,
        feeOwedA: positionDetails.feeOwedA,
        feeOwedB: positionDetails.feeOwedB
      });
      
      return { success: true };
    } catch (error: any) {
      // Check if this is a liquidity too small error
      if (error.message && error.message.includes('liquidity amount is too small')) {
        if (smallAmount) {
          // Even the small amount is too small
          logger.warn('The small liquidity amount (5.0 USDC) is still too small to create liquidity.');
          logger.warn('Try increasing the amount to at least 10.0 USDC.');
        } else {
          // Default amount is too small
          logger.warn('The liquidity amount is too small to create liquidity.');
          logger.warn('Try increasing the DEFAULT_LIQUIDITY_AMOUNT_USDC value in your .env file.');
        }
      }
      // Check if this is an insufficient SOL error
      else if (error.message && error.message.includes('Insufficient SOL balance')) {
        if (!smallAmount) {
          // Suggest trying with a smaller amount
          logger.warn('Insufficient SOL for the requested liquidity amount.');
          logger.warn('You can try adding a smaller amount of liquidity by using the position:add:small command.');
        } else {
          // Even the small amount requires too much SOL
          logger.error('Even a small liquidity amount requires more SOL than available in your wallet.');
          logger.error('Please add more SOL to your wallet before proceeding.');
        }
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error adding liquidity:', error);
    throw error;
  }
}

/**
 * Command to claim fees from a position
 */
async function cmdClaimFees() {
  try {
    if (!positionState.hasActivePosition()) {
      throw new Error('No active position found. Please open a position first.');
    }
    
    const position = positionState.getActivePosition()!;
    logger.info(`Claiming fees from position: ${position.positionAddress.toString()}`);
    
    // Fetch current fees before claiming
    const beforeDetails = await fetchPositionDetails(position.positionAddress);
    logger.info(`Fees before claiming: ${formatFeeAmount(beforeDetails.feeOwedA.toString(), 6)} USDC, ${formatFeeAmount(beforeDetails.feeOwedB.toString(), 9)} SOL`);
    
    // Claim fees
    await claimFees(position.positionAddress);
    logger.info('Fees claimed successfully!');
    
    // Update position details after claiming
    const afterDetails = await fetchPositionDetails(position.positionAddress);
    positionState.updatePositionDetails({
      liquidity: afterDetails.liquidity,
      feeOwedA: afterDetails.feeOwedA,
      feeOwedB: afterDetails.feeOwedB
    });
    
    logger.info(`Fees after claiming: ${formatFeeAmount(afterDetails.feeOwedA.toString(), 6)} USDC, ${formatFeeAmount(afterDetails.feeOwedB.toString(), 9)} SOL`);
    
    return { success: true };
  } catch (error) {
    logger.error('Error claiming fees:', error);
    throw error;
  }
}

/**
 * Command to monitor a position
 */
async function cmdMonitorPosition() {
  try {
    if (!positionState.hasActivePosition()) {
      throw new Error('No active position found. Please open a position first.');
    }
    
    const position = positionState.getActivePosition()!;
    logger.info(`Starting monitoring for position: ${position.positionAddress.toString()}`);
    
    // Start monitoring if not already active
    if (!positionMonitor.isActive()) {
      positionMonitor.start();
      logger.info('Position monitoring started. Press Ctrl+C to stop.');
      
      // Keep the process running
      return new Promise(() => {}); // Never resolves, keeps process running
    } else {
      logger.info('Position monitoring is already active. Press Ctrl+C to stop.');
      return new Promise(() => {}); // Never resolves, keeps process running
    }
  } catch (error) {
    logger.error('Error monitoring position:', error);
    throw error;
  }
}

/**
 * Command to check position status
 */
async function cmdCheckPosition() {
  try {
    if (!positionState.hasActivePosition()) {
      logger.info('No active position found.');
      return { hasPosition: false };
    }
    
    const position = positionState.getActivePosition()!;
    logger.info(`Checking position: ${position.positionAddress.toString()}`);
    
    // Fetch position details
    const positionDetails = await fetchPositionDetails(position.positionAddress);
    
    // Update position state
    positionState.updatePositionDetails({
      liquidity: positionDetails.liquidity,
      feeOwedA: positionDetails.feeOwedA,
      feeOwedB: positionDetails.feeOwedB
    });
    
    // Fetch pool data to check range status
    const whirlpoolData = await fetchWhirlpoolData(position.whirlpoolAddress);
    const rangeStatus = checkPositionRangeStatus(
      whirlpoolData.tickCurrentIndex,
      position.tickLowerIndex,
      position.tickUpperIndex
    );
    
    // Log position details
    logger.info('Position Details:');
    logger.info(`- Address: ${position.positionAddress.toString()}`);
    logger.info(`- Whirlpool: ${position.whirlpoolAddress.toString()}`);
    logger.info(`- Liquidity: ${position.liquidity.toString()}`);
    logger.info(`- Range: ${position.tickLowerIndex} to ${position.tickUpperIndex}`);
    logger.info(`- Current Tick: ${whirlpoolData.tickCurrentIndex}`);
    logger.info(`- Range Status: ${rangeStatus}`);
    logger.info(`- Fee Owed A: ${formatFeeAmount(position.feeOwedA.toString(), 6)} USDC`);
    logger.info(`- Fee Owed B: ${formatFeeAmount(position.feeOwedB.toString(), 9)} SOL`);
    logger.info(`- Created: ${position.createdAt.toISOString()}`);
    logger.info(`- Last Updated: ${position.lastUpdatedAt.toISOString()}`);
    
    return {
      hasPosition: true,
      position: {
        address: position.positionAddress.toString(),
        whirlpool: position.whirlpoolAddress.toString(),
        liquidity: position.liquidity.toString(),
        rangeStatus,
        feeOwedA: formatFeeAmount(position.feeOwedA.toString(), 6),
        feeOwedB: formatFeeAmount(position.feeOwedB.toString(), 9),
      }
    };
  } catch (error) {
    logger.error('Error checking position:', error);
    throw error;
  }
}

/**
 * Command to close a position
 */
async function cmdClosePosition() {
  try {
    if (!positionState.hasActivePosition()) {
      throw new Error('No active position found. Please open a position first.');
    }
    
    const position = positionState.getActivePosition()!;
    logger.info(`Closing position: ${position.positionAddress.toString()}`);
    
    // First remove all liquidity
    logger.info('Removing all liquidity...');
    await removeLiquidity(position.positionAddress);
    
    // Wait a bit
    await sleep(2000);
    
    // Then close the position
    logger.info('Closing position...');
    await closePosition(position.positionAddress, position.positionMint);
    
    // Stop monitoring if active
    if (positionMonitor.isActive()) {
      positionMonitor.stop();
      logger.info('Position monitoring stopped.');
    }
    
    logger.info('Position closed successfully!');
    
    return { success: true };
  } catch (error) {
    logger.error('Error closing position:', error);
    throw error;
  }
}

/**
 * Command to manage rebalancing
 * @param action The action to perform (enable, disable, status)
 */
async function cmdManageRebalancing(action: string) {
  try {
    if (!positionState.hasActivePosition()) {
      logger.warn('No active position to manage rebalancing for');
      return { success: false, message: 'No active position' };
    }

    const stats = autoRebalancer.getRebalanceStats();

    switch (action) {
      case 'status':
        logger.info('Auto-rebalancing status:');
        logger.info(`- Enabled: ${config.REBALANCE_ENABLED}`);
        logger.info(`- Last rebalance: ${stats.lastRebalanceTime ? stats.lastRebalanceTime.toISOString() : 'Never'}`);
        logger.info(`- Rebalance count today: ${stats.rebalanceCount}/${config.MAX_DAILY_REBALANCES}`);
        logger.info(`- Count reset time: ${stats.rebalanceCountResetTime.toISOString()}`);
        logger.info(`- Position out of range since: ${stats.positionOutOfRangeSince ? stats.positionOutOfRangeSince.toISOString() : 'In range'}`);
        logger.info(`- Threshold: ${config.REBALANCE_THRESHOLD_PERCENT}%`);
        logger.info(`- Min interval: ${config.MIN_REBALANCE_INTERVAL_MINUTES} minutes`);
        logger.info(`- Position width: ${config.POSITION_WIDTH_PERCENT}%`);
        return { success: true, stats };

      case 'enable':
        // This is just setting the config value in memory
        // In a production app, you'd want to update the .env file or database
        (config as any).REBALANCE_ENABLED = true;
        logger.info('Auto-rebalancing enabled');
        return { success: true, enabled: true };

      case 'disable':
        // This is just setting the config value in memory
        // In a production app, you'd want to update the .env file or database
        (config as any).REBALANCE_ENABLED = false;
        logger.info('Auto-rebalancing disabled');
        return { success: true, enabled: false };

      default:
        logger.warn(`Unknown rebalancing action: ${action}`);
        logger.info('Available actions: status, enable, disable');
        return { success: false, message: 'Unknown action' };
    }
  } catch (error) {
    logger.error('Error managing rebalancing:', error);
    throw error;
  }
}

/**
 * Command to run the full lifecycle demo
 */
async function cmdRunFullLifecycle() {
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

/**
 * Command to remove liquidity from a position
 */
async function cmdRemoveLiquidity() {
  try {
    logger.info('Removing liquidity from position...');
    
    // Get the active position from state
    const activePosition = positionState.getActivePosition();
    if (!activePosition) {
      throw new Error('No active position found. Please open a position first.');
    }
    
    const { positionAddress } = activePosition;
    
    // Get position details before removing liquidity
    const positionDetails = await fetchPositionDetails(positionAddress);
    logger.info(`Current position liquidity: ${positionDetails.liquidity.toString()}`);
    
    // Ask for confirmation before removing liquidity
    logger.info('Removing all liquidity from the position...');
    
    // Remove all liquidity
    const result = await removeLiquidity(positionAddress);
    
    if (result.txId) {
      logger.info(`Liquidity removed successfully! Transaction ID: ${result.txId}`);
      
      // Get updated position details
      const updatedDetails = await fetchPositionDetails(positionAddress);
      logger.info(`Updated position liquidity: ${updatedDetails.liquidity.toString()}`);
      
      return { success: true, txId: result.txId };
    } else {
      logger.warn('No transaction was executed. This could be because there was no liquidity to remove.');
      return { success: false, reason: 'No liquidity to remove' };
    }
  } catch (error) {
    logger.error('Error removing liquidity:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Main function that parses command line arguments and runs the appropriate command
 */
async function main() {
  try {
    // Log application startup
    logger.info(`Orca Liquidity Agent starting on network: ${ENV.NETWORK || 'mainnet'}`);
    logger.info(`Connected to Solana RPC: ${ENV.SOLANA_RPC_URL.replace(/:[^:]*@/, ':****@')}`);
    
    // Check network connection
    const networkStatus = await networkManager.checkNetwork(ENV.NETWORK as any || 'mainnet');
    logger.info(`Network connection established: ${networkStatus.network}`);
    logger.info(`Wallet address: ${networkStatus.publicKey}`);
    logger.info(`SOL balance: ${networkStatus.solBalance}`);
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    // Check wallet balances at startup
    const solBalance = await getWalletSolBalance();
    const wsolBalance = await getWsolBalance();
    const usdcBalance = await getTokenBalanceWithRetry(ENV.USDC_MINT!);
    
    logger.info('Wallet balances:');
    logger.info(`- SOL: ${solBalance}`);
    logger.info(`- WSOL: ${wsolBalance}`);
    logger.info(`- USDC: ${usdcBalance || 0}`);
    
    // Execute the appropriate command
    switch (command) {
      case 'open-position':
        await cmdOpenPosition();
        break;
        
      case 'add-liquidity':
        await cmdAddLiquidity();
        break;
        
      case 'add-liquidity-small':
        await cmdAddLiquidity(true);
        break;
        
      case 'remove-liquidity':
        await cmdRemoveLiquidity();
        break;
        
      case 'claim-fees':
        await cmdClaimFees();
        break;
        
      case 'check-position':
        await cmdCheckPosition();
        break;
        
      case 'monitor-position':
        await cmdMonitorPosition();
        break;
        
      case 'close-position':
        await cmdClosePosition();
        break;
        
      case 'full-lifecycle':
        await cmdRunFullLifecycle();
        break;
        
      case 'rebalance':
        const rebalanceAction = args[1] || 'status';
        await cmdManageRebalancing(rebalanceAction);
        break;
        
      case 'help':
      default:
        logger.info('Orca Liquidity Agent - Command Help');
        logger.info('Available commands:');
        logger.info('  open-position       - Open a new liquidity position');
        logger.info('  add-liquidity       - Add liquidity to the active position');
        logger.info('  add-liquidity-small - Add a small amount of liquidity (requires less SOL)');
        logger.info('  remove-liquidity    - Remove liquidity from the active position');
        logger.info('  claim-fees          - Claim fees from the active position');
        logger.info('  check-position      - Check the status of the active position');
        logger.info('  monitor-position    - Start monitoring the active position');
        logger.info('  close-position      - Close the active position');
        logger.info('  full-lifecycle      - Run the full position lifecycle demo');
        logger.info('  rebalance [action]  - Manage auto-rebalancing (status|enable|disable)');
        logger.info('  help                - Show this help message');
        break;
    }
  } catch (error) {
    logger.error('Error in main execution:', error);
  }
}

// Run the main function
main().catch(error => logger.error('Unhandled error:', error));
