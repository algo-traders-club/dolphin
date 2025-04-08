import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
  createSyncNativeInstruction,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { getConnection, getWallet } from './solana';
import { ENV } from '../config/env';

/**
 * Wrap SOL into WSOL (Wrapped SOL)
 * @param amount Amount of SOL to wrap (in SOL units, not lamports)
 * @returns The transaction signature
 */
export async function wrapSol(amount: number): Promise<string> {
  try {
    console.log(`Wrapping ${amount} SOL to WSOL`);
    
    const connection = getConnection();
    const wallet = getWallet();
    const lamports = Math.floor(amount * 1e9); // Convert SOL to lamports
    
    // Get the associated token account for WSOL
    const wsolAta = await getAssociatedTokenAddress(
      NATIVE_MINT,
      wallet.publicKey
    );
    
    // Check if the WSOL ATA exists
    const ataInfo = await connection.getAccountInfo(wsolAta);
    
    // Create a new transaction
    const transaction = new Transaction();
    
    // If the ATA doesn't exist, create it
    if (!ataInfo) {
      console.log('Creating WSOL Associated Token Account');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          wsolAta, // ata
          wallet.publicKey, // owner
          NATIVE_MINT // mint
        )
      );
    }
    
    // Add instruction to transfer SOL to the WSOL ATA
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: wsolAta,
        lamports,
      })
    );
    
    // Add instruction to sync the WSOL ATA with the native SOL balance
    transaction.add(createSyncNativeInstruction(wsolAta));
    
    // Sign and send the transaction
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const signedTx = await wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, 'confirmed');
    
    console.log(`SOL wrapped successfully!`);
    console.log(`Transaction ID: ${txId}`);
    
    return txId;
  } catch (error) {
    console.error('Error wrapping SOL:', error);
    throw new Error(`Failed to wrap SOL: ${(error as Error).message}`);
  }
}

/**
 * Unwrap WSOL back to SOL
 * @returns The transaction signature
 */
export async function unwrapSol(): Promise<string> {
  try {
    console.log('Unwrapping WSOL to SOL');
    
    const connection = getConnection();
    const wallet = getWallet();
    
    // Get the associated token account for WSOL
    const wsolAta = await getAssociatedTokenAddress(
      NATIVE_MINT,
      wallet.publicKey
    );
    
    // Check if the WSOL ATA exists
    const ataInfo = await connection.getAccountInfo(wsolAta);
    if (!ataInfo) {
      console.log('No WSOL account to unwrap');
      return '';
    }
    
    // Create a transaction to close the WSOL account
    const transaction = new Transaction();
    transaction.add(
      createCloseAccountInstruction(
        wsolAta, // account to close
        wallet.publicKey, // destination
        wallet.publicKey // authority
      )
    );
    
    // Sign and send the transaction
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const signedTx = await wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, 'confirmed');
    
    console.log(`WSOL unwrapped successfully!`);
    console.log(`Transaction ID: ${txId}`);
    
    return txId;
  } catch (error) {
    console.error('Error unwrapping WSOL:', error);
    throw new Error(`Failed to unwrap WSOL: ${(error as Error).message}`);
  }
}

/**
 * Helper function to retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in ms
 * @returns The result of the function
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 500
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Check if it's a rate limit error
      const isRateLimitError = 
        error instanceof Error && 
        (error.message.includes('429') || error.message.includes('Too Many Requests'));
      
      if (!isRateLimitError) {
        throw error;
      }
      
      retries++;
      console.log(`Rate limit hit. Retrying after ${delay}ms delay... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

/**
 * Get token balance with retry logic
 * @param mint The token mint address
 * @returns The token balance
 */
export async function getTokenBalanceWithRetry(mint: PublicKey): Promise<number> {
  const connection = getConnection();
  const wallet = getWallet();
  
  return withRetry(async () => {
    // Get the associated token account
    const ata = await getAssociatedTokenAddress(mint, wallet.publicKey);
    
    try {
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const tokenBalance = await connection.getTokenAccountBalance(ata);
      const decimals = tokenBalance.value.decimals;
      return Number(tokenBalance.value.amount) / Math.pow(10, decimals);
    } catch (e) {
      // If the error is not a rate limit error and the ATA doesn't exist, return 0
      if (e instanceof Error && e.message.includes('could not find account')) {
        return 0;
      }
      throw e;
    }
  });
}

/**
 * Get the WSOL balance for the agent's wallet
 * @returns The WSOL balance
 */
export async function getWsolBalance(): Promise<number> {
  try {
    return await getTokenBalanceWithRetry(NATIVE_MINT);
  } catch (error) {
    console.error('Error getting WSOL balance:', error);
    return 0;
  }
}
