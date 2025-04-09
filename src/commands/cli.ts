import { ENV } from '../config/env';
import { networkManager } from '../services/networkManager';
import { getWalletSolBalance } from '../services/walletUtils';
import { getWsolBalance, getTokenBalanceWithRetry } from '../services/tokenUtils';
import * as logger from '../utils/logger';
import { 
  cmdOpenPosition, 
  cmdAddLiquidity, 
  cmdClaimFees, 
  cmdCheckPosition, 
  cmdMonitorPosition, 
  cmdClosePosition, 
  cmdRemoveLiquidity 
} from './position';
import { cmdManageRebalancing } from './rebalance';
import { cmdRunFullLifecycle } from './lifecycle';

/**
 * Display help information about available commands
 */
function displayHelp() {
  logger.info('Orca Liquidity Agent - Command Help');
  logger.info('Available commands:');
  logger.info('  open-position       - Open a new liquidity position');
  logger.info('  add-liquidity       - Add liquidity to the active position');
  logger.info('  add-liquidity-small - Add a small amount of liquidity (requires less SOL)');
  logger.info('  remove-liquidity    - Remove liquidity from the active position');
  logger.info('  claim-fees          - Claim fees from the active position');
  logger.info('  check-position      - Check the status of the active position');
  logger.info('  monitor-position    - Start monitoring the active position');
  logger.info('  close-position      - Close the active position');
  logger.info('  full-lifecycle      - Run the full position lifecycle demo');
  logger.info('  rebalance [action]  - Manage auto-rebalancing (status|enable|disable)');
  logger.info('  help                - Show this help message');
}

/**
 * Display wallet balances
 */
async function displayWalletBalances() {
  const solBalance = await getWalletSolBalance();
  const wsolBalance = await getWsolBalance();
  const usdcBalance = await getTokenBalanceWithRetry(ENV.USDC_MINT!);
  
  logger.info('Wallet balances:');
  logger.info(`- SOL: ${solBalance}`);
  logger.info(`- WSOL: ${wsolBalance}`);
  logger.info(`- USDC: ${usdcBalance || 0}`);
}

/**
 * Parse and execute CLI commands
 * @param args Command line arguments
 */
export async function executeCommand(args: string[]) {
  try {
    // Log application startup
    logger.info(`Orca Liquidity Agent starting on network: ${ENV.NETWORK || 'mainnet'}`);
    logger.info(`Connected to Solana RPC: ${ENV.SOLANA_RPC_URL.replace(/:[^:]*@/, ':****@')}`);
    
    // Check network connection
    const networkStatus = await networkManager.checkNetwork(ENV.NETWORK as any || 'mainnet');
    logger.info(`Network connection established: ${networkStatus.network}`);
    logger.info(`Wallet address: ${networkStatus.publicKey}`);
    logger.info(`SOL balance: ${networkStatus.solBalance}`);
    
    // Get command
    const command = args[0] || 'help';
    
    // Display wallet balances at startup
    await displayWalletBalances();
    
    // Execute the appropriate command
    switch (command) {
      case 'open-position':
        await cmdOpenPosition();
        break;
        
      case 'add-liquidity':
        await cmdAddLiquidity();
        break;
        
      case 'add-liquidity-small':
        await cmdAddLiquidity(true);
        break;
        
      case 'remove-liquidity':
        await cmdRemoveLiquidity();
        break;
        
      case 'claim-fees':
        await cmdClaimFees();
        break;
        
      case 'check-position':
        await cmdCheckPosition();
        break;
        
      case 'monitor-position':
        await cmdMonitorPosition();
        break;
        
      case 'close-position':
        await cmdClosePosition();
        break;
        
      case 'full-lifecycle':
        await cmdRunFullLifecycle();
        break;
        
      case 'rebalance':
        const rebalanceAction = args[1] || 'status';
        await cmdManageRebalancing(rebalanceAction);
        break;
        
      case 'help':
      default:
        displayHelp();
        break;
    }
  } catch (error) {
    logger.error('Command execution error:', error);
    process.exit(1);
  }
}
