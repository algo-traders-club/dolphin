/**
 * Script to switch the Orca Liquidity Agent to Solana Devnet
 * This updates the .env file with the correct devnet configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as logger from '../utils/logger';

// Devnet configuration
const DEVNET_CONFIG = {
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  NETWORK: 'devnet',
  WHIRLPOOL_PROGRAM_ID: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  // Devnet USDC/SOL whirlpool address
  USDC_SOL_WHIRLPOOL_ADDRESS: 'Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE',
  SOL_MINT: 'So11111111111111111111111111111111111111112',
  // Devnet USDC mint
  USDC_MINT: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};

async function main() {
  try {
    logger.info('Switching Orca Liquidity Agent to Solana Devnet...');
    
    // Path to .env file
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      logger.error('.env file not found. Please create one first.');
      return;
    }
    
    // Read the current .env file
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Update each configuration value
    Object.entries(DEVNET_CONFIG).forEach(([key, value]) => {
      // Create a regex to match the key and any value after it
      const regex = new RegExp(`${key}=.*`, 'g');
      
      // Check if the key exists in the file
      if (envContent.match(regex)) {
        // Replace the existing value
        envContent = envContent.replace(regex, `${key}=${value}`);
        logger.info(`Updated ${key} to ${value}`);
      } else {
        // Add the key-value pair if it doesn't exist
        envContent += `\n${key}=${value}`;
        logger.info(`Added ${key}=${value}`);
      }
    });
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, envContent);
    
    logger.info('Successfully switched to Solana Devnet!');
    logger.info('Please restart the application for changes to take effect.');
    
  } catch (error) {
    logger.error('Error switching to devnet:', error);
  }
}

// Run the main function
main().catch(error => logger.error('Unhandled error:', error));
