import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import { ENV } from '../config/env';

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
    console.log(`Connected to Solana RPC: ${ENV.SOLANA_RPC_URL}`);
  }
  return connection;
}

/**
 * Get the agent's wallet from the private key in environment variables
 * @returns Anchor-compatible Wallet object
 */
export function getWallet(): Wallet {
  if (!wallet) {
    try {
      // Convert base58 private key to Keypair
      const privateKeyBytes = bs58.decode(ENV.WALLET_PRIVATE_KEY);
      const keypair = Keypair.fromSecretKey(privateKeyBytes);
      
      // Create an Anchor-compatible wallet
      wallet = new Wallet(keypair);
      
      // Log the public key for verification (never log the private key)
      console.log(`Agent wallet loaded with public key: ${wallet.publicKey.toString()}`);
    } catch (error) {
      console.error('Failed to load wallet from private key:', error);
      throw new Error('Invalid wallet private key. Please check your .env file.');
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
    console.error(`Error fetching token balance for mint ${mint.toString()}:`, error);
    return null;
  }
}
