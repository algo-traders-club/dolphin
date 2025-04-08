import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import type { TransactionError } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { PDAUtil, PriceMath, TickUtil, WhirlpoolContext } from '@orca-so/whirlpools-sdk';
import type { WhirlpoolData } from '@orca-so/whirlpools-sdk';
import Decimal from 'decimal.js';
import { getOrcaClient } from './orca';
import { getConnection, getWallet } from './solana';
import { positionState } from './positionState';
import * as logger from '../utils/logger';

// Default slippage tolerance (1%)
const DEFAULT_SLIPPAGE = 0.01;

/**
 * Open a new liquidity position in a Whirlpool
 * @param whirlpoolAddress The address of the Whirlpool
 * @param lowerPrice The lower price bound (in token B per token A)
 * @param upperPrice The upper price bound (in token B per token A)
 * @returns The position details if successful
 */
export async function openPosition(
  whirlpoolAddress: PublicKey,
  lowerPrice: Decimal,
  upperPrice: Decimal
) {
  try {
    logger.info(`Opening position in Whirlpool: ${whirlpoolAddress.toString()}`);
    logger.info(`Price range: ${lowerPrice.toString()} to ${upperPrice.toString()}`);
    
    const client = getOrcaClient();
    const wallet = getWallet();
    const connection = getConnection();
    
    // Fetch the pool data
    const pool = await client.getPool(whirlpoolAddress);
    const poolData = pool.getData();
    
    // Calculate tick indices from prices
    const tickLowerIndex = PriceMath.priceToInitializableTickIndex(
      lowerPrice,
      poolData.tickSpacing,
      poolData.tokenMintA,
      poolData.tokenMintB
    );
    
    const tickUpperIndex = PriceMath.priceToInitializableTickIndex(
      upperPrice,
      poolData.tickSpacing,
      poolData.tokenMintA,
      poolData.tokenMintB
    );
    
    // Ensure ticks are properly spaced
    const alignedTickLower = TickUtil.getInitializableTickIndex(tickLowerIndex, poolData.tickSpacing);
    const alignedTickUpper = TickUtil.getInitializableTickIndex(tickUpperIndex, poolData.tickSpacing);
    
    logger.debug(`Tick indices: ${alignedTickLower} to ${alignedTickUpper}`);
    
    // Generate a new keypair for the position mint
    const positionMintKeypair = Keypair.generate();
    
    // Build the transaction to open a position
    const { transaction, positionAddress } = await pool.openPositionTx({
      tickLowerIndex: alignedTickLower,
      tickUpperIndex: alignedTickUpper,
      owner: wallet.publicKey,
      positionMintKeypair,
    });
    
    // Sign and send the transaction
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    // Sign with both the wallet and the position mint keypair
    transaction.partialSign(positionMintKeypair);
    const signedTx = await wallet.signTransaction(transaction);
    
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, 'confirmed');
    
    logger.info(`Position opened successfully!`);
    logger.transaction(txId, 'Position opened');
    logger.info(`Position Address: ${positionAddress.toString()}`);
    logger.info(`Position Mint: ${positionMintKeypair.publicKey.toString()}`);
    
    // Store the position details
    positionState.setActivePosition({
      positionAddress,
      positionMint: positionMintKeypair.publicKey,
      whirlpoolAddress,
      tickLowerIndex: alignedTickLower,
      tickUpperIndex: alignedTickUpper,
      liquidity: new BN(0),
      createdAt: new Date(),
      // Initialize the new fields for position monitoring
      feeOwedA: new BN(0),
      feeOwedB: new BN(0),
      lastUpdatedAt: new Date(),
    });
    
    return {
      positionAddress,
      positionMint: positionMintKeypair.publicKey,
      txId,
    };
  } catch (error) {
    logger.error('Error opening position:', error);
    throw new Error(`Failed to open position: ${(error as Error).message}`);
  }
}

/**
 * Add liquidity to an existing position
 * @param positionAddress The address of the position
 * @param tokenAAmount The amount of token A to add (e.g., USDC)
 * @returns The transaction details if successful
 */
export async function addLiquidity(
  positionAddress: PublicKey,
  tokenAAmount: Decimal
) {
  try {
    logger.info(`Adding liquidity to position: ${positionAddress.toString()}`);
    logger.info(`Input amount (token A): ${tokenAAmount.toString()}`);
    
    const client = getOrcaClient();
    const wallet = getWallet();
    const connection = getConnection();
    
    // Get the position
    const position = await client.getPosition(positionAddress);
    const positionData = position.getData();
    
    // Get the pool
    const whirlpoolAddress = positionData.whirlpool;
    const pool = await client.getPool(whirlpoolAddress);
    const poolData = pool.getData();
    
    // Convert the input amount to the smallest unit
    const tokenAInfo = await connection.getParsedAccountInfo(poolData.tokenMintA);
    const tokenADecimals = (tokenAInfo.value?.data as any)?.parsed?.info?.decimals || 6;
    const tokenAAmountRaw = tokenAAmount.mul(new Decimal(10).pow(tokenADecimals)).floor();
    
    // Get the quote for increasing liquidity
    const quote = await pool.getIncreaseLiquidityQuote({
      tokenA: new BN(tokenAAmountRaw.toString()),
      tokenB: undefined, // We're only specifying token A
      slippageTolerance: DEFAULT_SLIPPAGE,
    });
    
    logger.debug(`Liquidity quote:`);
    logger.debug(`- Liquidity: ${quote.liquidityAmount.toString()}`);
    logger.debug(`- Token A: ${quote.tokenEstA.toString()}`);
    logger.debug(`- Token B: ${quote.tokenEstB.toString()}`);
    
    // Build the transaction to increase liquidity
    const tx = await pool.increaseLiquidityTx({
      positionAddress,
      liquidityAmount: quote.liquidityAmount,
      tokenMaxA: quote.tokenMaxA,
      tokenMaxB: quote.tokenMaxB,
    });
    
    // Sign and send the transaction
    tx.transaction.feePayer = wallet.publicKey;
    tx.transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const signedTx = await wallet.signTransaction(tx.transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, 'confirmed');
    
    logger.info(`Liquidity added successfully!`);
    logger.transaction(txId, 'Liquidity added');
    
    // Update the position state with the new liquidity amount
    const updatedPosition = await client.getPosition(positionAddress);
    const updatedPositionData = updatedPosition.getData();
    positionState.updateLiquidity(updatedPositionData.liquidity);
    
    return { txId };
  } catch (error) {
    logger.error('Error adding liquidity:', error);
    throw new Error(`Failed to add liquidity: ${(error as Error).message}`);
  }
}

/**
 * Claim fees from a position
 * @param positionAddress The address of the position
 * @returns The transaction details if successful
 */
export async function claimFees(positionAddress: PublicKey) {
  try {
    logger.info(`Claiming fees from position: ${positionAddress.toString()}`);
    
    const client = getOrcaClient();
    const wallet = getWallet();
    const connection = getConnection();
    
    // Build the transaction to collect fees
    const { transaction } = await client.collectFeesTx({
      positionAddress,
      receiver: wallet.publicKey,
    });
    
    // Sign and send the transaction
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const signedTx = await wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, 'confirmed');
    
    logger.info(`Fees claimed successfully!`);
    logger.transaction(txId, 'Fees claimed');
    
    return { txId };
  } catch (error) {
    logger.error('Error claiming fees:', error);
    throw new Error(`Failed to claim fees: ${(error as Error).message}`);
  }
}

/**
 * Remove liquidity from a position
 * @param positionAddress The address of the position
 * @param liquidityAmount The amount of liquidity to remove (if undefined, removes all)
 * @returns The transaction details if successful
 */
export async function removeLiquidity(
  positionAddress: PublicKey,
  liquidityAmount?: BN
) {
  try {
    logger.info(`Removing liquidity from position: ${positionAddress.toString()}`);
    
    const client = getOrcaClient();
    const wallet = getWallet();
    const connection = getConnection();
    
    // Get the position
    const position = await client.getPosition(positionAddress);
    const positionData = position.getData();
    
    // If no liquidity amount is specified, remove all liquidity
    const liquidityToRemove = liquidityAmount || positionData.liquidity;
    logger.info(`Liquidity to remove: ${liquidityToRemove.toString()}`);
    
    // Check if there's any liquidity to remove
    if (liquidityToRemove.isZero()) {
      logger.warn('No liquidity to remove');
      return { txId: null };
    }
    
    // Get the pool
    const whirlpoolAddress = positionData.whirlpool;
    const pool = await client.getPool(whirlpoolAddress);
    
    // Get the quote for decreasing liquidity
    const quote = await pool.getDecreaseLiquidityQuote({
      liquidity: liquidityToRemove,
      slippageTolerance: DEFAULT_SLIPPAGE,
    });
    
    logger.debug(`Decrease liquidity quote:`);
    logger.debug(`- Token A min: ${quote.tokenMinA.toString()}`);
    logger.debug(`- Token B min: ${quote.tokenMinB.toString()}`);
    
    // Build the transaction to decrease liquidity
    const tx = await pool.decreaseLiquidityTx({
      positionAddress,
      liquidityAmount: liquidityToRemove,
      tokenMinA: quote.tokenMinA,
      tokenMinB: quote.tokenMinB,
    });
    
    // Sign and send the transaction
    tx.transaction.feePayer = wallet.publicKey;
    tx.transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const signedTx = await wallet.signTransaction(tx.transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, 'confirmed');
    
    logger.info(`Liquidity removed successfully!`);
    logger.transaction(txId, 'Liquidity removed');
    
    // Update the position state with the new liquidity amount
    const updatedPosition = await client.getPosition(positionAddress);
    const updatedPositionData = updatedPosition.getData();
    positionState.updateLiquidity(updatedPositionData.liquidity);
    
    return { txId };
  } catch (error) {
    logger.error('Error removing liquidity:', error);
    throw new Error(`Failed to remove liquidity: ${(error as Error).message}`);
  }
}

/**
 * Close a position
 * @param positionAddress The address of the position
 * @param positionMint The mint address of the position token
 * @returns The transaction details if successful
 */
export async function closePosition(
  positionAddress: PublicKey,
  positionMint: PublicKey
) {
  try {
    logger.info(`Closing position: ${positionAddress.toString()}`);
    
    const client = getOrcaClient();
    const wallet = getWallet();
    const connection = getConnection();
    
    // Get the position
    const position = await client.getPosition(positionAddress);
    const positionData = position.getData();
    
    // Check if the position still has liquidity
    if (!positionData.liquidity.isZero()) {
      logger.warn('Warning: Position still has liquidity. Remove liquidity before closing.');
      // You can choose to throw an error here or continue
    }
    
    // Build the transaction to close the position
    const { transaction } = await client.closePositionTx({
      positionAddress,
      receiver: wallet.publicKey,
    });
    
    // Sign and send the transaction
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const signedTx = await wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, 'confirmed');
    
    logger.info(`Position closed successfully!`);
    logger.transaction(txId, 'Position closed');
    
    // Clear the position from state
    positionState.clearActivePosition();
    
    return { txId };
  } catch (error) {
    logger.error('Error closing position:', error);
    throw new Error(`Failed to close position: ${(error as Error).message}`);
  }
}
