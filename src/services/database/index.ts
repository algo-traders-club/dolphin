import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { ENV } from '../../config/env';
import * as logger from '../../utils/logger';

// Create a connection pool
const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection to become available
});

// Handle pool errors
pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Import the table initialization functions
import { initRebalanceHistoryTable } from './rebalanceService';

// Connect to the database and verify connection
export async function initDatabase(): Promise<void> {
  let client: PoolClient | null = null;
  try {
    logger.info('Connecting to database...');
    client = await pool.connect();
    const result = await client.query('SELECT version()');
    logger.info(`Connected to database: ${result.rows[0].version}`);
    
    // Verify TimescaleDB is installed
    const timescaleResult = await client.query(
      "SELECT default_version, installed_version FROM pg_available_extensions WHERE name = 'timescaledb'"
    );
    
    if (timescaleResult.rows.length > 0 && timescaleResult.rows[0].installed_version) {
      logger.info(`TimescaleDB extension installed: ${timescaleResult.rows[0].installed_version}`);
    } else {
      logger.warn('TimescaleDB extension is not installed');
    }
    
    // Initialize database tables
    await initRebalanceHistoryTable();
    logger.info('Database tables initialized');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Get a client from the pool with retry logic
export async function getClient(maxRetries = 3): Promise<PoolClient> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await pool.connect();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries - 1) {
        logger.error(`Failed to get database client after ${maxRetries} attempts`, error);
        throw lastError;
      }
      
      const delay = Math.pow(2, attempt) * 100; // Exponential backoff
      logger.warn(`Database connection attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError || new Error('Failed to get database client after retries');
}

// Execute a query and return the result with retry logic
export async function query(text: string, params: any[] = [], maxRetries = 3): Promise<any> {
  const start = Date.now();
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug(`Executed query: ${text} (${duration}ms)`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if this is a connection error that might be resolved by retrying
      const isRetryable = 
        error instanceof Error && 
        (error.message.includes('connection') || 
         error.message.includes('timeout') || 
         error.message.includes('network') ||
         error.message.includes('temporarily unavailable'));
      
      if (!isRetryable || attempt === maxRetries - 1) {
        logger.error(`Query error (attempt ${attempt + 1}/${maxRetries}): ${text}`, error);
        throw lastError;
      }
      
      const delay = Math.pow(2, attempt) * 100; // Exponential backoff: 100ms, 200ms, 400ms, etc.
      logger.warn(`Database query attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError || new Error('Failed to execute query after retries');
}

// Close the pool
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

// Export the pool for direct access if needed
export { pool };
