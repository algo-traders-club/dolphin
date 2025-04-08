/**
 * Test script to verify wallet loading functionality
 * This script will attempt to load the wallet from wallet.json or .env
 * and display the public key and SOL balance
 */

import { getWallet, getWalletSolBalance, getConnection } from '../services/solana';
import * as logger from '../utils/logger';

async function main() {
  try {
    logger.info('Testing wallet loading functionality...');
    
    // Get the wallet
    const wallet = getWallet();
    logger.info(`Successfully loaded wallet with public key: ${wallet.publicKey.toString()}`);
    
    // Get connection
    const connection = getConnection();
    
    // Check SOL balance
    const solBalance = await getWalletSolBalance();
    logger.info(`SOL balance: ${solBalance} SOL`);
    
    // Check if the wallet is valid by attempting a simple RPC call
    const recentBlockhash = await connection.getLatestBlockhash();
    logger.info(`Successfully connected to Solana. Recent blockhash: ${recentBlockhash.blockhash.substring(0, 10)}...`);
    
    logger.info('Wallet test completed successfully!');
  } catch (error) {
    logger.error('Error testing wallet:', error);
  }
}

// Run the main function
main().catch(error => logger.error('Unhandled error:', error));
