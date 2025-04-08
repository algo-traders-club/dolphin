import { config } from 'dotenv';
import { PublicKey } from '@solana/web3.js';

// Load environment variables from .env file
config();

// Helper function to get environment variables with validation
function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value || '';
}

// Convert string to PublicKey if provided, otherwise return undefined
function getPublicKeyFromEnv(key: string, required = true): PublicKey | undefined {
  const value = getEnvVar(key, required);
  if (!value) return undefined;
  try {
    return new PublicKey(value);
  } catch (error) {
    throw new Error(`Invalid public key format for ${key}: ${value}`);
  }
}

// Configuration object
export const ENV = {
  // Solana connection
  SOLANA_RPC_URL: getEnvVar('SOLANA_RPC_URL', true),
  WALLET_PRIVATE_KEY: getEnvVar('WALLET_PRIVATE_KEY', true),
  NETWORK: getEnvVar('NETWORK', false) || 'mainnet', // Default to mainnet
  
  // Orca Whirlpool addresses
  WHIRLPOOL_PROGRAM_ID: getPublicKeyFromEnv('WHIRLPOOL_PROGRAM_ID', true),
  USDC_SOL_WHIRLPOOL_ADDRESS: getPublicKeyFromEnv('USDC_SOL_WHIRLPOOL_ADDRESS', false),
  
  // Token mints
  SOL_MINT: getPublicKeyFromEnv('SOL_MINT', false),
  USDC_MINT: getPublicKeyFromEnv('USDC_MINT', false),
  
  // Liquidity position parameters
  DEFAULT_POSITION_LOWER_PRICE: parseFloat(getEnvVar('DEFAULT_POSITION_LOWER_PRICE', false) || '0.01'),
  DEFAULT_POSITION_UPPER_PRICE: parseFloat(getEnvVar('DEFAULT_POSITION_UPPER_PRICE', false) || '0.05'),
  DEFAULT_LIQUIDITY_AMOUNT_USDC: parseFloat(getEnvVar('DEFAULT_LIQUIDITY_AMOUNT_USDC', false) || '10'),
  
  // Server configuration
  PORT: parseInt(getEnvVar('PORT', false) || '3000', 10),
  HOST: getEnvVar('HOST', false) || '0.0.0.0',
};
