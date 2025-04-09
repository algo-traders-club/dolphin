import { Pool, PoolClient } from 'pg';
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
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Get a client from the pool
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

// Execute a query and return the result
export async function query(text: string, params: any[] = []): Promise<any> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query: ${text} (${duration}ms)`);
    return result;
  } catch (error) {
    logger.error(`Query error: ${text}`, error);
    throw error;
  }
}

// Close the pool
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

// Export the pool for direct access if needed
export { pool };
