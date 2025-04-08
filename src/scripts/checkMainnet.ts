/**
 * Test script to check wallet balance on Solana mainnet
 */

import { Connection, clusterApiUrl } from '@solana/web3.js';
import { getWallet } from '../services/solana';
import * as logger from '../utils/logger';

async function main() {
  try {
    logger.info('Checking wallet on Solana mainnet...');
    
    // Get the wallet
    const wallet = getWallet();
    logger.info(`Wallet public key: ${wallet.publicKey.toString()}`);
    
    // Connect to mainnet
    const mainnetUrl = clusterApiUrl('mainnet-beta');
    logger.info(`Connecting to Solana mainnet: ${mainnetUrl}`);
    const connection = new Connection(mainnetUrl, 'confirmed');
    
    // Check SOL balance
    const balance = await connection.getBalance(wallet.publicKey);
    const solBalance = balance / 1e9; // Convert lamports to SOL
    logger.info(`SOL balance on mainnet: ${solBalance} SOL`);
    
    // Check recent blockhash to verify connection
    const recentBlockhash = await connection.getLatestBlockhash();
    logger.info(`Successfully connected to Solana mainnet. Recent blockhash: ${recentBlockhash.blockhash.substring(0, 10)}...`);
    
    return { publicKey: wallet.publicKey.toString(), solBalance };
  } catch (error) {
    logger.error('Error checking mainnet wallet:', error);
    throw error;
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => logger.error('Unhandled error:', error));
}

export default main;
