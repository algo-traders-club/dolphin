import { config as dotenvConfig } from 'dotenv';
import { PublicKey } from '@solana/web3.js';

// Load environment variables from .env file
dotenvConfig();

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
export const config = {
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
  
  // Auto-rebalancing configuration
  REBALANCE_ENABLED: getEnvVar('REBALANCE_ENABLED', false) === 'true',
  REBALANCE_THRESHOLD_PERCENT: parseFloat(getEnvVar('REBALANCE_THRESHOLD_PERCENT', false) || '5'),
  MIN_REBALANCE_INTERVAL_MINUTES: parseInt(getEnvVar('MIN_REBALANCE_INTERVAL_MINUTES', false) || '60', 10),
  POSITION_WIDTH_PERCENT: parseFloat(getEnvVar('POSITION_WIDTH_PERCENT', false) || '20'),
  MAX_DAILY_REBALANCES: parseInt(getEnvVar('MAX_DAILY_REBALANCES', false) || '6', 10),
  
  // Database configuration
  DATABASE_URL: getEnvVar('DATABASE_URL', false) || 'postgres://postgres:postgres@timescaledb:5432/dolphin',
  
  // Server configuration
  PORT: parseInt(getEnvVar('PORT', false) || '3000', 10),
  HOST: getEnvVar('HOST', false) || '0.0.0.0',
  
  // Logging configuration
  LOG_LEVEL: getEnvVar('LOG_LEVEL', false) || 'info',
  ENABLE_FILE_LOGGING: getEnvVar('ENABLE_FILE_LOGGING', false) === 'true',
  LOG_DIRECTORY: getEnvVar('LOG_DIRECTORY', false) || 'logs',
  LOG_FILENAME: getEnvVar('LOG_FILENAME', false) || 'dolphin.log',
  
  // Rate limiting configuration
  RATE_LIMIT_ENABLED: getEnvVar('RATE_LIMIT_ENABLED', false) === 'true',
  RATE_LIMIT_WINDOW_MS: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', false) || '60000', 10),
  RATE_LIMIT_STANDARD_MAX: parseInt(getEnvVar('RATE_LIMIT_STANDARD_MAX', false) || '60', 10),
  RATE_LIMIT_DATA_MAX: parseInt(getEnvVar('RATE_LIMIT_DATA_MAX', false) || '30', 10),
  RATE_LIMIT_STATUS_MAX: parseInt(getEnvVar('RATE_LIMIT_STATUS_MAX', false) || '120', 10),
};

// For backward compatibility
export const ENV = config;
