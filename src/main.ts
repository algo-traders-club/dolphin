import { PublicKey } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { ENV } from './config/env';
import { fetchWhirlpoolData } from './services/orca';
import { getWalletSolBalance, getTokenBalance } from './services/solana';
import { openPosition, addLiquidity, claimFees, removeLiquidity, closePosition } from './services/liquidityManager';
import { positionState } from './services/positionState';
import { wrapSol, unwrapSol, getWsolBalance } from './services/tokenUtils';

// Sleep utility function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main execution loop for the Orca Liquidity Agent
 */
async function main() {
  try {
    console.log('Starting Orca Liquidity Agent...');
    
    // Check if required environment variables are set
    if (!ENV.USDC_SOL_WHIRLPOOL_ADDRESS) {
      throw new Error('USDC_SOL_WHIRLPOOL_ADDRESS is not set in environment variables');
    }
    
    // Get the whirlpool address
    const whirlpoolAddress = ENV.USDC_SOL_WHIRLPOOL_ADDRESS;
    
    // Check wallet balances
    const solBalance = await getWalletSolBalance();
    const wsolBalance = await getWsolBalance();
    const usdcBalance = await getTokenBalance(ENV.USDC_MINT!);
    
    console.log('Wallet balances:');
    console.log(`- SOL: ${solBalance}`);
    console.log(`- WSOL: ${wsolBalance}`);
    console.log(`- USDC: ${usdcBalance || 0}`);
    
    // Fetch whirlpool data
    console.log(`\nFetching Whirlpool data...`);
    const whirlpoolData = await fetchWhirlpoolData(whirlpoolAddress);
    
    // 1. Open a new position
    console.log(`\n1. Opening a new position...`);
    const lowerPrice = new Decimal(ENV.DEFAULT_POSITION_LOWER_PRICE);
    const upperPrice = new Decimal(ENV.DEFAULT_POSITION_UPPER_PRICE);
    
    const { positionAddress, positionMint } = await openPosition(
      whirlpoolAddress,
      lowerPrice,
      upperPrice
    );
    
    // Wait a bit
    console.log('\nWaiting 5 seconds...');
    await sleep(5000);
    
    // 2. Add liquidity to the position
    console.log(`\n2. Adding liquidity to position...`);
    
    // Wrap some SOL if needed for liquidity
    if (wsolBalance < 0.01 && solBalance > 0.02) {
      console.log('Wrapping some SOL for liquidity...');
      await wrapSol(0.02);
    }
    
    // Add liquidity using USDC amount
    const usdcAmount = new Decimal(ENV.DEFAULT_LIQUIDITY_AMOUNT_USDC);
    await addLiquidity(positionAddress, usdcAmount);
    
    // Wait a bit
    console.log('\nWaiting 10 seconds...');
    await sleep(10000);
    
    // 3. Claim any fees (might be zero if no trades have occurred)
    console.log(`\n3. Claiming fees from position...`);
    await claimFees(positionAddress);
    
    // Wait a bit
    console.log('\nWaiting 5 seconds...');
    await sleep(5000);
    
    // 4. Remove liquidity
    console.log(`\n4. Removing all liquidity from position...`);
    await removeLiquidity(positionAddress);
    
    // Wait a bit
    console.log('\nWaiting 5 seconds...');
    await sleep(5000);
    
    // 5. Close the position
    console.log(`\n5. Closing the position...`);
    await closePosition(positionAddress, positionMint);
    
    // 6. Unwrap any WSOL back to SOL
    console.log(`\n6. Unwrapping WSOL back to SOL...`);
    await unwrapSol();
    
    console.log('\nLiquidity position lifecycle completed successfully!');
    
  } catch (error) {
    console.error('Error in main execution loop:', error);
  }
}

// Run the main function
main().catch(console.error);
