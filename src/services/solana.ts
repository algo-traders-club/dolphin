import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import { ENV } from '../config/env';
import * as fs from 'fs';
import * as path from 'path';
import * as logger from '../utils/logger';

// Singleton instances
let connection: Connection | null = null;
let wallet: Wallet | null = null;
let provider: AnchorProvider | null = null;

/**
 * Get a connection to the Solana network
 * @returns Solana Connection object
 */
export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(ENV.SOLANA_RPC_URL, 'confirmed');
    logger.info(`Connected to Solana RPC: ${ENV.SOLANA_RPC_URL}`);
  }
  return connection;
}

/**
 * Get the agent's wallet from either wallet.json file or environment variables
 * @returns Anchor-compatible Wallet object
 */
export function getWallet(): Wallet {
  if (!wallet) {
    try {
      let keypair: Keypair;
      
      // First try to load from wallet.json file
      const walletJsonPath = path.resolve(process.cwd(), 'wallet.json');
      
      if (fs.existsSync(walletJsonPath)) {
        logger.info('Loading wallet from wallet.json file');
        const walletJson = JSON.parse(fs.readFileSync(walletJsonPath, 'utf-8'));
        
        if (walletJson.secretKey && Array.isArray(walletJson.secretKey)) {
          // Convert the array to Uint8Array
          const secretKeyUint8 = new Uint8Array(walletJson.secretKey);
          keypair = Keypair.fromSecretKey(secretKeyUint8);
        } else {
          throw new Error('Invalid wallet.json format. Expected secretKey array.');
        }
      } 
      // If wallet.json doesn't exist, try loading from .env
      else if (ENV.WALLET_PRIVATE_KEY) {
        logger.info('Loading wallet from environment variables');
        
        // Check if the private key is in array format
        if (ENV.WALLET_PRIVATE_KEY.startsWith('[') && ENV.WALLET_PRIVATE_KEY.endsWith(']')) {
          try {
            // Parse the array string into an actual array
            const privateKeyArray = JSON.parse(ENV.WALLET_PRIVATE_KEY);
            const secretKeyUint8 = new Uint8Array(privateKeyArray);
            keypair = Keypair.fromSecretKey(secretKeyUint8);
          } catch (parseError) {
            logger.error('Failed to parse private key array:', parseError);
            throw new Error('Invalid private key array format in .env file');
          }
        } else {
          // Assume it's a base58 encoded string
          const privateKeyBytes = bs58.decode(ENV.WALLET_PRIVATE_KEY);
          keypair = Keypair.fromSecretKey(privateKeyBytes);
        }
      } else {
        throw new Error('No wallet found. Please provide wallet.json or WALLET_PRIVATE_KEY in .env');
      }
      
      // Create an Anchor-compatible wallet
      wallet = new Wallet(keypair);
      
      // Log the public key for verification (never log the private key)
      logger.info(`Agent wallet loaded with public key: ${wallet.publicKey.toString()}`);
    } catch (error) {
      logger.error('Failed to load wallet:', error);
      throw new Error(`Failed to load wallet: ${(error as Error).message}`);
    }
  }
  return wallet;
}

/**
 * Get an AnchorProvider instance for use with Anchor-based programs
 * @returns AnchorProvider instance
 */
export function getProvider(): AnchorProvider {
  if (!provider) {
    const connection = getConnection();
    const wallet = getWallet();
    
    // Create the provider with default commitment
    provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
  }
  return provider;
}

/**
 * Get the SOL balance of the agent's wallet
 * @returns Promise resolving to the SOL balance
 */
export async function getWalletSolBalance(): Promise<number> {
  const connection = getConnection();
  const wallet = getWallet();
  const balance = await connection.getBalance(wallet.publicKey);
  return balance / 1e9; // Convert lamports to SOL
}

/**
 * Get the token balance for a specific mint
 * @param mint The mint address of the token
 * @returns Promise resolving to the token balance
 */
export async function getTokenBalance(mint: PublicKey): Promise<number | null> {
  const connection = getConnection();
  const wallet = getWallet();
  
  try {
    // Find the associated token account
    const accounts = await connection.getTokenAccountsByOwner(wallet.publicKey, {
      mint,
    });
    
    if (accounts.value.length === 0) {
      return null; // No token account found
    }
    
    // Get the balance from the first account
    const accountInfo = await connection.getTokenAccountBalance(accounts.value[0].pubkey);
    return Number(accountInfo.value.amount) / Math.pow(10, accountInfo.value.decimals);
  } catch (error) {
    logger.error(`Error fetching token balance for mint ${mint.toString()}:`, error);
    return null;
  }
}
