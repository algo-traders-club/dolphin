import { Keypair, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import type { TransactionError } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { PDAUtil, PriceMath, TickUtil, WhirlpoolContext } from '@orca-so/whirlpools-sdk';
import type { WhirlpoolData } from '@orca-so/whirlpools-sdk';
import Decimal from 'decimal.js';
import { getOrcaClient } from './orca';
import { getConnection, getWallet } from './solana';
import { positionState } from './positionState';
import * as logger from '../utils/logger';

// Import SPL token constants
import { TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getAssociatedTokenAddress } from '@solana/spl-token';

// Default slippage tolerance (1%)
const DEFAULT_SLIPPAGE = 0.01;

// Constants
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

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
    
    // Get token info from the pool
    const poolTokenAInfo = await pool.getTokenAInfo();
    const poolTokenBInfo = await pool.getTokenBInfo();
    const tokenA = poolTokenAInfo.mint;
    const tokenB = poolTokenBInfo.mint;
    
    logger.info(`Token A: ${tokenA.toString()}, decimals: ${poolTokenAInfo.decimals}`);
    logger.info(`Token B: ${tokenB.toString()}, decimals: ${poolTokenBInfo.decimals}`);
    
    // Get the current price for reference
    const currentPrice = PriceMath.tickIndexToPrice(
      poolData.tickCurrentIndex,
      poolTokenAInfo.decimals,
      poolTokenBInfo.decimals
    );
    
    logger.info(`Current pool price: ${currentPrice.toString()} token B per token A`);
    
    // For SOL/USDC, our prices are in USDC per SOL, but we need to convert to SOL per USDC
    // We need to invert the prices and swap lower/upper because of the direction
    const invertedLowerPrice = new Decimal(1).div(upperPrice); // Note the inversion of upper/lower
    const invertedUpperPrice = new Decimal(1).div(lowerPrice); // Note the inversion of upper/lower
    
    logger.info(`Inverted price range: ${invertedLowerPrice.toString()} to ${invertedUpperPrice.toString()} token A per token B`);
    
    // Calculate tick indices from the inverted prices
    const tickLower = TickUtil.getInitializableTickIndex(
      PriceMath.priceToTickIndex(
        invertedLowerPrice,
        poolTokenAInfo.decimals,
        poolTokenBInfo.decimals
      ),
      poolData.tickSpacing
    );
    
    const tickUpper = TickUtil.getInitializableTickIndex(
      PriceMath.priceToTickIndex(
        invertedUpperPrice,
        poolTokenAInfo.decimals,
        poolTokenBInfo.decimals
      ),
      poolData.tickSpacing
    );
    
    logger.info(`Tick indices: ${tickLower} to ${tickUpper}`);
    
    // Generate a new keypair for the position mint
    const positionMintKeypair = Keypair.generate();
    
    // Get the position PDA
    const positionPda = PDAUtil.getPosition(
      client.getContext().program.programId,
      positionMintKeypair.publicKey
    );
    const positionAddress = positionPda.publicKey;
    
    // Create a minimal liquidity input (required by the SDK)
    const liquidityInput = {
      liquidityAmount: new BN(1),  // Minimal amount
      tokenMaxA: new BN(1),       // Minimal amount
      tokenMaxB: new BN(1)        // Minimal amount
    };
    
    logger.info('Creating position with minimal liquidity to satisfy SDK requirements');
    
    // Use the openPosition method from the Whirlpool object
    // This handles all the account creation and transaction building
    const { tx, positionMint } = await pool.openPosition(
      tickLower,
      tickUpper,
      liquidityInput,
      wallet.publicKey,  // Owner
      wallet.publicKey,  // Funder
      positionMintKeypair.publicKey
    );
    
    // Add the position mint keypair as a signer
    tx.addSigner(positionMintKeypair);
    
    // Execute the transaction
    logger.info('Executing transaction to open position...');
    
    // Variable to store transaction ID
    let txId: string;
    
    try {
      // Build the transaction but don't execute yet
      const builtTx = await tx.build();
      
      // Get a fresh blockhash right before sending
      const latestBlockhash = await connection.getLatestBlockhash('finalized');
      
      // Execute with the fresh blockhash
      txId = await tx.buildAndExecute();
      
      logger.info(`Transaction sent with ID: ${txId}`);
      
      // Wait for confirmation with a shorter timeout
      const confirmationStatus = await connection.confirmTransaction({
        signature: txId,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'processed'); // Use 'processed' instead of 'confirmed' for faster confirmation
      
      if (confirmationStatus.value.err) {
        throw new Error(`Transaction failed: ${confirmationStatus.value.err}`);
      }
      
      logger.info(`Transaction confirmed with ID: ${txId}`);
    } catch (txError) {
      logger.error('Transaction execution failed:', txError);
      throw new Error(`Transaction failed: ${(txError as Error).message}`);
    }
    
    logger.info(`Position opened successfully!`);
    logger.info(`Transaction ID: ${txId}`);
    logger.info(`Position Address: ${positionAddress.toString()}`);
    logger.info(`Position Mint: ${positionMint.toString()}`);
    
    // Store the position details
    positionState.setActivePosition({
      positionAddress,
      positionMint,
      whirlpoolAddress,
      tickLowerIndex: tickLower,
      tickUpperIndex: tickUpper,
      liquidity: new BN(0),
      createdAt: new Date(),
      // Initialize the new fields for position monitoring
      feeOwedA: new BN(0),
      feeOwedB: new BN(0),
      lastUpdatedAt: new Date(),
    });
    
    // Return the position details
    return {
      positionAddress,
      positionMint,
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
