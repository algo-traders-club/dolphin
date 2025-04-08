/**
 * Devnet connection and wallet balance check script
 * This script helps verify that we can connect to Solana Devnet
 * and that the wallet has sufficient SOL and USDC for testing
 */

import { getConnection, getWallet, getWalletSolBalance, getTokenBalance } from '../services/solana';
import { ENV } from '../config/env';
import * as logger from '../utils/logger';

async function main() {
  try {
    logger.info('Checking Solana Devnet connection and wallet balances...');
    
    // Check if required environment variables are set
    if (!ENV.WALLET_PRIVATE_KEY) {
      logger.error('WALLET_PRIVATE_KEY is not set in environment variables');
      return;
    }
    
    if (!ENV.USDC_MINT) {
      logger.error('USDC_MINT is not set in environment variables');
      return;
    }
    
    // Get connection and wallet
    const connection = getConnection();
    const wallet = getWallet();
    
    // Log wallet address
    logger.info(`Wallet address: ${wallet.publicKey.toString()}`);
    
    // Check connection by getting the latest blockhash
    const blockhash = await connection.getLatestBlockhash();
    logger.info(`Connected to Solana Devnet. Latest blockhash: ${blockhash.blockhash.slice(0, 10)}...`);
    
    // Check SOL balance
    const solBalance = await getWalletSolBalance();
    logger.info(`SOL balance: ${solBalance}`);
    
    if (solBalance < 0.1) {
      logger.warn('SOL balance is low. You may need to airdrop more SOL for testing.');
      logger.info('You can airdrop SOL using: solana airdrop 1 <your-wallet-address> --url devnet');
    }
    
    // Check USDC balance
    const usdcBalance = await getTokenBalance(ENV.USDC_MINT);
    logger.info(`USDC balance: ${usdcBalance || 0}`);
    
    if (!usdcBalance || usdcBalance < 10) {
      logger.warn('USDC balance is low or zero. You will need Devnet USDC for testing.');
      logger.info('You can get Devnet USDC from Orca or SPL faucets.');
    }
    
    // Check if the whirlpool address is set
    if (!ENV.USDC_SOL_WHIRLPOOL_ADDRESS) {
      logger.warn('USDC_SOL_WHIRLPOOL_ADDRESS is not set in environment variables');
    } else {
      logger.info(`Whirlpool address: ${ENV.USDC_SOL_WHIRLPOOL_ADDRESS.toString()}`);
    }
    
    logger.info('Devnet check completed successfully!');
  } catch (error) {
    logger.error('Error checking Devnet connection:', error);
  }
}

// Run the main function
main().catch(error => logger.error('Unhandled error:', error));
