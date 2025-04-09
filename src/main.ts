import * as logger from './utils/logger';
import { executeCommand } from './commands/cli';

// Initialize the logger
logger.initialize();

/**
 * Main entry point for the Orca Liquidity Agent
 */
async function main() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    
    // Execute the command
    await executeCommand(args);
  } catch (error) {
    logger.error('Unhandled error:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => logger.error('Unhandled error:', error));
