/**
 * Network Manager Service
 * 
 * This service provides utilities for:
 * 1. Managing connections to Solana networks (devnet/mainnet)
 * 2. Switching between networks by updating environment variables
 * 3. Retrieving network-specific configuration
 * 4. Checking wallet balances across networks
 */

import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import type { Commitment } from '@solana/web3.js';
import { getWallet, getWalletSolBalance, getTokenBalance, withRetry } from './walletUtils';
import { ENV } from '../config/env';
import * as logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Network types
export type NetworkType = 'devnet' | 'mainnet';

// Network configuration interface
export interface NetworkConfig {
  SOLANA_RPC_URL: string;
  NETWORK: NetworkType;
  WHIRLPOOL_PROGRAM_ID: string;
  USDC_SOL_WHIRLPOOL_ADDRESS: string;
  SOL_MINT: string;
  USDC_MINT: string;
}

// Network configurations
const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  devnet: {
    SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    NETWORK: 'devnet',
    WHIRLPOOL_PROGRAM_ID: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    USDC_SOL_WHIRLPOOL_ADDRESS: 'Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE',
    SOL_MINT: 'So11111111111111111111111111111111111111112',
    USDC_MINT: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  },
  mainnet: {
    SOLANA_RPC_URL: 'https://mainnet.helius-rpc.com/?api-key=58bf8ac6-817c-4236-b619-eed88a318452',
    NETWORK: 'mainnet',
    WHIRLPOOL_PROGRAM_ID: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    USDC_SOL_WHIRLPOOL_ADDRESS: 'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ',
    SOL_MINT: 'So11111111111111111111111111111111111111112',
    USDC_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  }
};

/**
 * Network Manager class for managing Solana network connections
 */
export class NetworkManager {
  private static instance: NetworkManager;
  private currentNetwork: NetworkType;
  private connections: Partial<Record<NetworkType, Connection>> = {};
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Determine current network from environment
    this.currentNetwork = this.determineCurrentNetwork();
    logger.debug(`NetworkManager initialized with network: ${this.currentNetwork}`);
  }
  
  /**
   * Get the singleton instance of NetworkManager
   * @returns The NetworkManager instance
   */
  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }
  
  /**
   * Determine the current network from environment variables
   * @returns The current network type
   */
  private determineCurrentNetwork(): NetworkType {
    // Check if we're on mainnet based on the RPC URL or whirlpool address
    const isMainnet = 
      ENV.SOLANA_RPC_URL?.includes('mainnet') || 
      (ENV.USDC_SOL_WHIRLPOOL_ADDRESS && 
       ENV.USDC_SOL_WHIRLPOOL_ADDRESS.toString() === NETWORK_CONFIGS.mainnet.USDC_SOL_WHIRLPOOL_ADDRESS);
    
    return isMainnet ? 'mainnet' : 'devnet';
  }
  
  /**
   * Get the current network
   * @returns The current network type
   */
  public getCurrentNetwork(): NetworkType {
    return this.currentNetwork;
  }
  
  /**
   * Get the configuration for the current network
   * @returns The network configuration
   */
  public getCurrentNetworkConfig(): NetworkConfig {
    return NETWORK_CONFIGS[this.currentNetwork];
  }
  
  /**
   * Get the configuration for a specific network
   * @param network The network to get configuration for
   * @returns The network configuration
   */
  public getNetworkConfig(network: NetworkType): NetworkConfig {
    return NETWORK_CONFIGS[network];
  }
  
  /**
   * Get a connection to the current network
   * @param commitment The commitment level for the connection
   * @returns A Connection object for the current network
   */
  public getConnection(commitment: Commitment = 'confirmed'): Connection {
    if (!this.connections[this.currentNetwork]) {
      const config = this.getCurrentNetworkConfig();
      logger.debug(`Creating new connection to ${this.currentNetwork} at ${config.SOLANA_RPC_URL}`);
      this.connections[this.currentNetwork] = new Connection(config.SOLANA_RPC_URL, commitment);
    }
    return this.connections[this.currentNetwork]!;
  }
  
  /**
   * Get a connection to a specific network
   * @param network The network to connect to
   * @param commitment The commitment level for the connection
   * @returns A Connection object for the specified network
   */
  public getConnectionForNetwork(network: NetworkType, commitment: Commitment = 'confirmed'): Connection {
    if (!this.connections[network]) {
      const config = this.getNetworkConfig(network);
      logger.debug(`Creating new connection to ${network} at ${config.SOLANA_RPC_URL}`);
      this.connections[network] = new Connection(config.SOLANA_RPC_URL, commitment);
    }
    return this.connections[network]!;
  }
  
  /**
   * Check connection and balances on the specified network
   * @param network The network to check ('devnet' or 'mainnet')
   * @returns Object containing wallet address and balances
   */
  public async checkNetwork(network: NetworkType = 'devnet'): Promise<{
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
      
      const wallet = getWallet();
      const connection = this.getConnectionForNetwork(network);
      
      // Log wallet address
      const publicKey = wallet.publicKey.toString();
      logger.info(`Wallet address: ${publicKey}`);
      
      // Check connection by getting the latest blockhash with retry
      const getBlockhash = async () => {
        return await connection.getLatestBlockhash();
      };
      
      const blockhash = await withRetry(getBlockhash);
      logger.info(`Connected to Solana ${network}. Latest blockhash: ${blockhash.blockhash.slice(0, 10)}...`);
      
      // Check SOL balance with retry
      const getSolBalance = async () => {
        const balance = await connection.getBalance(wallet.publicKey);
        return balance / 1e9; // Convert lamports to SOL
      };
      
      const solBalance = await withRetry(getSolBalance);
      logger.info(`SOL balance: ${solBalance}`);
      
      // Check USDC balance
      let usdcBalance: number | undefined;
      const networkConfig = this.getNetworkConfig(network);
      
      if (networkConfig.USDC_MINT) {
        const getUsdcBalance = async () => {
          return await getTokenBalance(networkConfig.USDC_MINT);
        };
        
        usdcBalance = await withRetry(getUsdcBalance) || undefined;
        logger.info(`USDC balance: ${usdcBalance || 0}`);
        
        if (!usdcBalance || usdcBalance < 10) {
          logger.warn(`USDC balance is low or zero. You will need ${network === 'devnet' ? 'Devnet' : ''} USDC for operations.`);
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
  public async switchNetwork(network: NetworkType): Promise<{
    success: boolean;
    network: NetworkType;
    config: NetworkConfig;
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
      
      // Update the current network
      this.currentNetwork = network;
      
      // Clear the connection cache to force new connections with updated config
      this.connections = {};
      
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
   * Get the current whirlpool address for SOL/USDC
   * @returns The whirlpool address
   */
  public getWhirlpoolAddress(): string {
    return this.getCurrentNetworkConfig().USDC_SOL_WHIRLPOOL_ADDRESS;
  }
  
  /**
   * Get the current USDC mint address
   * @returns The USDC mint address
   */
  public getUsdcMint(): string {
    return this.getCurrentNetworkConfig().USDC_MINT;
  }
  
  /**
   * Get the current SOL mint address
   * @returns The SOL mint address
   */
  public getSolMint(): string {
    return this.getCurrentNetworkConfig().SOL_MINT;
  }
  
  /**
   * Get the current whirlpool program ID
   * @returns The whirlpool program ID
   */
  public getWhirlpoolProgramId(): string {
    return this.getCurrentNetworkConfig().WHIRLPOOL_PROGRAM_ID;
  }
}

// Export a singleton instance
export const networkManager = NetworkManager.getInstance();

// For backwards compatibility with scripts
export const checkNetwork = (network: NetworkType = 'devnet') => networkManager.checkNetwork(network);
export const switchNetwork = (network: NetworkType) => networkManager.switchNetwork(network);
export const getNetworkConfig = (network: NetworkType) => networkManager.getNetworkConfig(network);
