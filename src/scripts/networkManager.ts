/**
 * Network Manager Script
 * 
 * This script provides utilities for:
 * 1. Checking connection and balances on Solana networks (devnet/mainnet)
 * 2. Switching between networks by updating environment variables
 * 3. Retrieving network-specific configuration
 */

import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { getConnection, getWallet, getWalletSolBalance, getTokenBalance } from '../services/solana';
import { ENV } from '../config/env';
import * as logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Network configurations
const NETWORK_CONFIGS = {
  devnet: {
    SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    NETWORK: 'devnet',
    WHIRLPOOL_PROGRAM_ID: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    USDC_SOL_WHIRLPOOL_ADDRESS: 'Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE',
    SOL_MINT: 'So11111111111111111111111111111111111111112',
    USDC_MINT: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  },
  mainnet: {
    SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
    NETWORK: 'mainnet',
    WHIRLPOOL_PROGRAM_ID: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    USDC_SOL_WHIRLPOOL_ADDRESS: 'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ',
    SOL_MINT: 'So11111111111111111111111111111111111111112',
    USDC_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  }
};

type NetworkType = 'devnet' | 'mainnet';

/**
 * Check connection and balances on the specified network
 * @param network The network to check ('devnet' or 'mainnet')
 * @returns Object containing wallet address and balances
 */
export async function checkNetwork(network: NetworkType = 'devnet'): Promise<{
  network: NetworkType;
  publicKey: string;
  solBalance: number;
  usdcBalance?: number;
}> {
  try {
    logger.info(`Checking Solana ${network} connection and wallet balances...`);
    
    // Check if required environment variables are set
    if (!ENV.WALLET_PRIVATE_KEY) {
      throw new Error('WALLET_PRIVATE_KEY is not set in environment variables');
    }
    
    let connection: Connection;
    let wallet = getWallet();
    
    // Use appropriate connection based on network
    if (network === 'mainnet') {
      const mainnetUrl = clusterApiUrl('mainnet-beta');
      logger.info(`Connecting to Solana mainnet: ${mainnetUrl}`);
      connection = new Connection(mainnetUrl, 'confirmed');
    } else {
      connection = getConnection();
    }
    
    // Log wallet address
    const publicKey = wallet.publicKey.toString();
    logger.info(`Wallet address: ${publicKey}`);
    
    // Check connection by getting the latest blockhash
    const blockhash = await connection.getLatestBlockhash();
    logger.info(`Connected to Solana ${network}. Latest blockhash: ${blockhash.blockhash.slice(0, 10)}...`);
    
    // Check SOL balance
    let solBalance: number;
    if (network === 'mainnet') {
      const balance = await connection.getBalance(wallet.publicKey);
      solBalance = balance / 1e9; // Convert lamports to SOL
    } else {
      solBalance = await getWalletSolBalance();
    }
    logger.info(`SOL balance: ${solBalance}`);
    
    // Check USDC balance for devnet
    let usdcBalance: number | undefined;
    if (network === 'devnet' && ENV.USDC_MINT) {
      usdcBalance = await getTokenBalance(ENV.USDC_MINT);
      logger.info(`USDC balance: ${usdcBalance || 0}`);
      
      if (!usdcBalance || usdcBalance < 10) {
        logger.warn('USDC balance is low or zero. You will need Devnet USDC for testing.');
      }
    }
    
    // Provide guidance based on balances
    if (solBalance < 0.1) {
      if (network === 'devnet') {
        logger.warn('SOL balance is low. You may need to airdrop more SOL for testing.');
        logger.info('You can airdrop SOL using: solana airdrop 1 <your-wallet-address> --url devnet');
      } else {
        logger.warn('SOL balance is low. You will need to transfer SOL to this wallet for mainnet operations.');
      }
    }
    
    return {
      network,
      publicKey,
      solBalance,
      usdcBalance
    };
  } catch (error) {
    logger.error(`Error checking ${network}:`, error);
    throw error;
  }
}

/**
 * Switch the application to the specified network by updating the .env file
 * @param network The network to switch to ('devnet' or 'mainnet')
 * @returns Object containing the updated configuration
 */
export async function switchNetwork(network: NetworkType): Promise<{
  success: boolean;
  network: NetworkType;
  config: typeof NETWORK_CONFIGS.devnet;
}> {
  try {
    logger.info(`Switching Orca Liquidity Agent to Solana ${network}...`);
    
    // Get the network configuration
    const config = NETWORK_CONFIGS[network];
    
    // Path to .env file
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      throw new Error('.env file not found. Please create one first.');
    }
    
    // Read the current .env file
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Update each configuration value
    Object.entries(config).forEach(([key, value]) => {
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
    fs.writeFileSync(envPath, envContent, 'utf-8');
    
    logger.info(`Successfully switched to ${network}!`);
    logger.info('Please restart the application for changes to take effect.');
    
    return {
      success: true,
      network,
      config
    };
  } catch (error) {
    logger.error(`Error switching to ${network}:`, error);
    throw error;
  }
}

/**
 * Get the configuration for a specific network
 * @param network The network to get configuration for
 * @returns The network configuration
 */
export function getNetworkConfig(network: NetworkType): typeof NETWORK_CONFIGS.devnet {
  return NETWORK_CONFIGS[network];
}

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
    
    checkNetwork(targetNetwork)
      .then(result => {
        logger.info('Check completed successfully!');
      })
      .catch(error => logger.error('Unhandled error:', error));
  } else if (command === 'switch') {
    if (!network || (network !== 'devnet' && network !== 'mainnet')) {
      logger.error('Please specify a valid network to switch to: devnet or mainnet');
      process.exit(1);
    }
    
    switchNetwork(network)
      .then(result => {
        logger.info(`Successfully switched to ${result.network}`);
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
