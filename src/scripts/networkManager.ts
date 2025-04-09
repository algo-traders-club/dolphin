/**
 * Network Manager Script
 * 
 * This script provides a command-line interface for:
 * 1. Checking connection and balances on Solana networks (devnet/mainnet)
 * 2. Switching between networks by updating environment variables
 */

import { networkManager } from '../services/networkManager';
import type { NetworkType } from '../services/networkManager';
import * as logger from '../utils/logger';









// Command-line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  const network = args[1]?.toLowerCase() as NetworkType;
  
  if (!command) {
    logger.error('Please specify a command: check or switch');
    process.exit(1);
  }
  
  if (command === 'check') {
    const targetNetwork = network || 'devnet';
    if (targetNetwork !== 'devnet' && targetNetwork !== 'mainnet') {
      logger.error('Invalid network. Please specify devnet or mainnet');
      process.exit(1);
    }
    
    networkManager.checkNetwork(targetNetwork)
      .then(result => {
        logger.info('Check completed successfully!');
        logger.info(`Network: ${result.network}`);
        logger.info(`Wallet: ${result.publicKey}`);
        logger.info(`SOL Balance: ${result.solBalance}`);
        if (result.usdcBalance !== undefined) {
          logger.info(`USDC Balance: ${result.usdcBalance}`);
        }
      })
      .catch(error => logger.error('Unhandled error:', error));
  } else if (command === 'switch') {
    if (!network || (network !== 'devnet' && network !== 'mainnet')) {
      logger.error('Please specify a valid network to switch to: devnet or mainnet');
      process.exit(1);
    }
    
    networkManager.switchNetwork(network)
      .then(result => {
        logger.info(`Successfully switched to ${result.network}`);
        logger.info('Please restart the application for changes to take effect.');
      })
      .catch(error => logger.error('Unhandled error:', error));
  } else {
    logger.error('Invalid command. Please use check or switch');
    logger.info('Examples:');
    logger.info('  bun run src/scripts/networkManager.ts check devnet');
    logger.info('  bun run src/scripts/networkManager.ts check mainnet');
    logger.info('  bun run src/scripts/networkManager.ts switch devnet');
    logger.info('  bun run src/scripts/networkManager.ts switch mainnet');
    process.exit(1);
  }
}
