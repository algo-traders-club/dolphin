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
 * Get the WSOL balance for the agent's wallet
 * @returns The WSOL balance
 */
export async function getWsolBalance(): Promise<number> {
  try {
    const connection = getConnection();
    const wallet = getWallet();
    
    // Get the associated token account for WSOL
    const wsolAta = await getAssociatedTokenAddress(
      NATIVE_MINT,
      wallet.publicKey
    );
    
    // Check if the WSOL ATA exists
    try {
      const tokenBalance = await connection.getTokenAccountBalance(wsolAta);
      return Number(tokenBalance.value.amount) / 1e9; // Convert lamports to SOL
    } catch (e) {
      // ATA doesn't exist or has no balance
      return 0;
    }
  } catch (error) {
    console.error('Error getting WSOL balance:', error);
    return 0;
  }
}
