/**
 * Simple logger utility for the Orca Liquidity Agent
 * This could be replaced with a more robust logging library in the future
 */

import { config } from '../config/env';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Default log level
let MIN_LOG_LEVEL = LogLevel.INFO;

/**
 * Initialize the logger with configuration from environment variables
 */
export function initialize(): void {
  // Set log level from environment if available
  const logLevel = config.LOG_LEVEL?.toLowerCase();
  if (logLevel === 'debug') MIN_LOG_LEVEL = LogLevel.DEBUG;
  if (logLevel === 'info') MIN_LOG_LEVEL = LogLevel.INFO;
  if (logLevel === 'warn') MIN_LOG_LEVEL = LogLevel.WARN;
  if (logLevel === 'error') MIN_LOG_LEVEL = LogLevel.ERROR;
  
  info('Logger initialized with level: ' + LogLevel[MIN_LOG_LEVEL]);
}

/**
 * Format the current timestamp for logging
 * @returns Formatted timestamp string
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log a debug message
 * @param message The message to log
 * @param data Optional data to include
 */
export function debug(message: string, data?: any): void {
  if (MIN_LOG_LEVEL <= LogLevel.DEBUG) {
    console.debug(`[${getTimestamp()}] [DEBUG] ${message}`, data || '');
  }
}

/**
 * Log an info message
 * @param message The message to log
 * @param data Optional data to include
 */
export function info(message: string, data?: any): void {
  if (MIN_LOG_LEVEL <= LogLevel.INFO) {
    console.info(`[${getTimestamp()}] [INFO] ${message}`, data || '');
  }
}

/**
 * Log a warning message
 * @param message The message to log
 * @param data Optional data to include
 */
export function warn(message: string, data?: any): void {
  if (MIN_LOG_LEVEL <= LogLevel.WARN) {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`, data || '');
  }
}

/**
 * Log an error message
 * @param message The message to log
 * @param error Optional error object or data to include
 */
export function error(message: string, error?: any): void {
  if (MIN_LOG_LEVEL <= LogLevel.ERROR) {
    console.error(`[${getTimestamp()}] [ERROR] ${message}`, error || '');
  }
}

/**
 * Log a transaction signature with explorer link
 * @param signature The transaction signature
 * @param message Optional message to include
 */
export function transaction(signature: string, message?: string): void {
  if (MIN_LOG_LEVEL <= LogLevel.INFO) {
    const explorerUrl = `https://solscan.io/tx/${signature}`; // Mainnet is default
    console.info(`[${getTimestamp()}] [TX] ${message || 'Transaction'}: ${signature}`);
    console.info(`[${getTimestamp()}] [TX] Explorer URL: ${explorerUrl}`);
  }
}
