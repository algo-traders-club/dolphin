import { positionState } from '../services/positionState';
import { autoRebalancer } from '../services/autoRebalancer';
import { config } from '../config/env';
import * as logger from '../utils/logger';

/**
 * Command to manage rebalancing
 * @param action The action to perform (enable, disable, status)
 */
export async function cmdManageRebalancing(action: string) {
  try {
    if (!positionState.hasActivePosition()) {
      logger.warn('No active position to manage rebalancing for');
      return { success: false, message: 'No active position' };
    }

    const stats = autoRebalancer.getRebalanceStats();

    switch (action) {
      case 'status':
        logger.info('Auto-rebalancing status:');
        logger.info(`- Enabled: ${config.REBALANCE_ENABLED}`);
        logger.info(`- Last rebalance: ${stats.lastRebalanceTime ? stats.lastRebalanceTime.toISOString() : 'Never'}`);
        logger.info(`- Rebalance count today: ${stats.rebalanceCount}/${config.MAX_DAILY_REBALANCES}`);
        logger.info(`- Count reset time: ${stats.rebalanceCountResetTime.toISOString()}`);
        logger.info(`- Position out of range since: ${stats.positionOutOfRangeSince ? stats.positionOutOfRangeSince.toISOString() : 'In range'}`);
        logger.info(`- Threshold: ${config.REBALANCE_THRESHOLD_PERCENT}%`);
        logger.info(`- Min interval: ${config.MIN_REBALANCE_INTERVAL_MINUTES} minutes`);
        logger.info(`- Position width: ${config.POSITION_WIDTH_PERCENT}%`);
        return { success: true, stats };

      case 'enable':
        // This is just setting the config value in memory
        // In a production app, you'd want to update the .env file or database
        (config as any).REBALANCE_ENABLED = true;
        logger.info('Auto-rebalancing enabled');
        return { success: true, enabled: true };

      case 'disable':
        // This is just setting the config value in memory
        // In a production app, you'd want to update the .env file or database
        (config as any).REBALANCE_ENABLED = false;
        logger.info('Auto-rebalancing disabled');
        return { success: true, enabled: false };

      default:
        logger.warn(`Unknown rebalancing action: ${action}`);
        logger.info('Available actions: status, enable, disable');
        return { success: false, message: 'Unknown action' };
    }
  } catch (error) {
    logger.error('Error managing rebalancing:', error);
    throw error;
  }
}
