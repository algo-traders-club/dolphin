/**
 * Wallet Utilities
 * 
 * Consolidated wallet and token utilities for Solana interactions.
 * This file combines functionality from the previous solana.ts and tokenUtils.ts
 * with improved error handling and retry logic.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  SystemProgram,
  Commitment
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
  createSyncNativeInstruction,
  getAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { AnchorProvider, Wallet as AnchorWallet } from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { ENV } from '../config/env';
import * as fs from 'fs';
import * as path from 'path';
import * as logger from '../utils/logger';

// Error types for better error handling
export class ConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class WalletError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'WalletError';
  }
}

export class TransactionError extends Error {
  constructor(message: string, public readonly txId?: string, public readonly cause?: Error) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Custom wallet implementation that works with both @project-serum/anchor and Orca SDK
 */
class CustomWallet implements AnchorWallet {
  // The payer property is required by NodeWallet interface
  readonly payer: Keypair;

  constructor(keypair: Keypair) {
    this.payer = keypair;
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction(tx: any): Promise<any> {
    // Handle different transaction types
    try {
      // Check if it's a VersionedTransaction
      if (tx.version !== undefined) {
        tx.sign([this.payer]);
        return tx;
      }
      
      // Check if it's a regular Transaction with partialSign method
      if (typeof tx.partialSign === 'function') {
        tx.partialSign(this.payer);
        return tx;
      }
      
      // Check if it's a regular Transaction with sign method
      if (typeof tx.sign === 'function') {
        tx.sign(this.payer);
        return tx;
      }
      
      // Handle Orca SDK transaction objects
      if (tx.message && tx.addSignature) {
        const msgBytes = tx.message.serialize();
        const signature = nacl.sign.detached(msgBytes, this.payer.secretKey);
        tx.addSignature(this.payer.publicKey, Buffer.from(signature));
        return tx;
      }
      
      throw new WalletError('Unsupported transaction type');
    } catch (error) {
      throw new WalletError(`Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
    }
  }

  async signAllTransactions(txs: any[]): Promise<any[]> {
    return Promise.all(txs.map(tx => this.signTransaction(tx)));
  }
}

// Singleton instances
let connection: Connection | null = null;
let wallet: CustomWallet | null = null;
let provider: AnchorProvider | null = null;

/**
 * Get a connection to the Solana network with retry logic
 * @returns Solana Connection object
 */
export function getConnection(): Connection {
  if (!connection) {
    if (!ENV.SOLANA_RPC_URL) {
      throw new ConnectionError('SOLANA_RPC_URL is not set in environment variables');
    }
    
    connection = new Connection(ENV.SOLANA_RPC_URL, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
    });
    
    logger.info(`Created connection to Solana ${ENV.NETWORK || 'network'}: ${ENV.SOLANA_RPC_URL}`);
  }
  
  return connection;
}

/**
 * Get the agent's wallet from either wallet.json file or environment variables
 * @returns Anchor-compatible Wallet object
 */
export function getWallet(): CustomWallet {
  if (wallet) {
    return wallet;
  }
  
  try {
    // First try to load from wallet.json
    const walletJsonPath = path.resolve(process.cwd(), 'wallet.json');
    
    if (fs.existsSync(walletJsonPath)) {
      logger.info('Loading wallet from wallet.json');
      const walletJson = JSON.parse(fs.readFileSync(walletJsonPath, 'utf-8'));
      
      if (walletJson.secretKey) {
        // Handle array format
        if (Array.isArray(walletJson.secretKey)) {
          const secretKey = new Uint8Array(walletJson.secretKey);
          wallet = new CustomWallet(Keypair.fromSecretKey(secretKey));
        } 
        // Handle base58 encoded string
        else if (typeof walletJson.secretKey === 'string') {
          const secretKey = bs58.decode(walletJson.secretKey);
          wallet = new CustomWallet(Keypair.fromSecretKey(secretKey));
        }
      }
    }
    
    // If wallet.json didn't work, try environment variable
    if (!wallet && ENV.WALLET_PRIVATE_KEY) {
      logger.info('Loading wallet from environment variable');
      const secretKey = bs58.decode(ENV.WALLET_PRIVATE_KEY);
      wallet = new CustomWallet(Keypair.fromSecretKey(secretKey));
    }
    
    if (!wallet) {
      throw new WalletError('Failed to load wallet from wallet.json or environment variables');
    }
    
    logger.info(`Wallet loaded with public key: ${wallet.publicKey.toString()}`);
    return wallet;
  } catch (error) {
    throw new WalletError(`Error loading wallet: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Get an AnchorProvider instance for use with Anchor-based programs
 * @returns AnchorProvider instance
 */
export function getProvider(): AnchorProvider {
  if (!provider) {
    const walletInstance = getWallet();
    const connectionInstance = getConnection();
    
    provider = new AnchorProvider(
      connectionInstance,
      walletInstance,
      { commitment: 'confirmed' }
    );
  }
  
  return provider;
}

/**
 * Helper function to retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in ms
 * @returns The result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Get the SOL balance of the agent's wallet with retry logic
 * @returns Promise resolving to the SOL balance
 */
export async function getWalletSolBalance(): Promise<number> {
  return withRetry(async () => {
    const connection = getConnection();
    const wallet = getWallet();
    
    const balance = await connection.getBalance(wallet.publicKey);
    return balance / 1e9; // Convert lamports to SOL
  });
}

/**
 * Get the token balance for a specific mint with retry logic
 * @param mint The mint address of the token
 * @returns Promise resolving to the token balance
 */
export async function getTokenBalance(mint: string | PublicKey): Promise<number | null> {
  return withRetry(async () => {
    const connection = getConnection();
    const wallet = getWallet();
    
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    
    try {
      // Get the associated token account
      const ata = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey
      );
      
      // Check if the token account exists
      const accountInfo = await connection.getAccountInfo(ata);
      
      if (!accountInfo) {
        logger.debug(`No token account found for mint ${mintPubkey.toString()}`);
        return null;
      }
      
      // Get the token account data
      const tokenAccount = await getAccount(connection, ata);
      
      // Convert amount to decimal based on decimals
      // For simplicity, we're assuming USDC has 6 decimals
      // In a production app, we would fetch the mint info to get the decimals
      const decimals = mintPubkey.equals(new PublicKey(ENV.USDC_MINT || '')) ? 6 : 9;
      const balance = Number(tokenAccount.amount) / Math.pow(10, decimals);
      
      return balance;
    } catch (error) {
      logger.debug(`Error getting token balance: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  });
}

/**
 * Get the WSOL (Wrapped SOL) balance for the agent's wallet
 * @returns Promise resolving to the WSOL balance
 */
export async function getWsolBalance(): Promise<number | null> {
  return getTokenBalance(NATIVE_MINT);
}

/**
 * Wrap SOL into WSOL (Wrapped SOL)
 * @param amount Amount of SOL to wrap (in SOL units, not lamports)
 * @returns The transaction signature
 */
export async function wrapSol(amount: number): Promise<string> {
  return withRetry(async () => {
    logger.info(`Wrapping ${amount} SOL to WSOL`);
    
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
      logger.info('Creating WSOL Associated Token Account');
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
        lamports
      })
    );
    
    // Add instruction to sync native balance
    transaction.add(createSyncNativeInstruction(wsolAta));
    
    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(transaction);
    logger.info(`Wrapped ${amount} SOL to WSOL. Signature: ${signature}`);
    
    return signature;
  });
}

/**
 * Unwrap WSOL back to SOL
 * @returns The transaction signature
 */
export async function unwrapSol(): Promise<string> {
  return withRetry(async () => {
    logger.info('Unwrapping WSOL back to SOL');
    
    const connection = getConnection();
    const wallet = getWallet();
    
    // Get the associated token account for WSOL
    const wsolAta = await getAssociatedTokenAddress(
      NATIVE_MINT,
      wallet.publicKey
    );
    
    // Check if the WSOL ATA exists
    try {
      await getAccount(connection, wsolAta);
    } catch (error) {
      throw new Error('No WSOL account found to unwrap');
    }
    
    // Create a new transaction to close the account
    const transaction = new Transaction();
    
    // Add instruction to close the WSOL account
    transaction.add(
      createCloseAccountInstruction(
        wsolAta, // account to close
        wallet.publicKey, // destination
        wallet.publicKey, // authority
        [] // multisig signers (empty for single authority)
      )
    );
    
    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(transaction);
    logger.info(`Unwrapped WSOL back to SOL. Signature: ${signature}`);
    
    return signature;
  });
}

/**
 * Send and confirm a transaction with retry and timeout
 * @param transaction Transaction to send
 * @param options Options for sending the transaction
 * @returns Transaction signature
 */
export async function sendAndConfirmTransaction(
  transaction: Transaction | VersionedTransaction,
  options: {
    commitment?: Commitment;
    maxRetries?: number;
    timeoutMs?: number;
  } = {}
): Promise<string> {
  const {
    commitment = 'confirmed',
    maxRetries = 3,
    timeoutMs = 30000
  } = options;
  
  const connection = getConnection();
  const walletInstance = getWallet();
  
  // Get a recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  if (transaction instanceof Transaction) {
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletInstance.publicKey;
  }
  
  // Sign the transaction
  const signedTransaction = await walletInstance.signTransaction(transaction);
  
  // Send the transaction
  const rawTransaction = signedTransaction.serialize ? 
    signedTransaction.serialize() : 
    Buffer.from(signedTransaction.serialize());
  
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: false,
    preflightCommitment: commitment,
  });
  
  logger.debug(`Transaction sent: ${txid}`);
  
  // Set up a timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TransactionError(`Transaction confirmation timeout after ${timeoutMs}ms`, txid));
    }, timeoutMs);
  });
  
  // Set up confirmation
  const confirmationPromise = (async () => {
    let confirmResult;
    try {
      confirmResult = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: txid
      }, commitment);
    } catch (error) {
      throw new TransactionError(`Transaction confirmation failed: ${error instanceof Error ? error.message : String(error)}`, txid, error instanceof Error ? error : undefined);
    }
    
    if (confirmResult.value.err) {
      throw new TransactionError(`Transaction failed: ${JSON.stringify(confirmResult.value.err)}`, txid);
    }
    
    return txid;
  })();
  
  // Wait for either confirmation or timeout
  return Promise.race([confirmationPromise, timeoutPromise]);
}
