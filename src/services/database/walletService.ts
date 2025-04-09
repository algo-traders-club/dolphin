import { query } from './index';
import * as logger from '../../utils/logger';

// Interface for wallet balance data
export interface WalletBalanceData {
  walletAddress: string;
  solBalance: number;
  wsolBalance: number;
  usdcBalance: number;
  timestamp: Date;
}

// Interface for transaction data
export interface TransactionData {
  transactionSignature: string;
  transactionType: string;
  positionAddress?: string;
  amountA?: number;
  amountB?: number;
  timestamp: Date;
  status: string;
  details?: any;
}

// Save wallet balance to the database
export async function saveWalletBalance(balance: WalletBalanceData): Promise<void> {
  try {
    await query(
      `INSERT INTO wallet_balances (
        wallet_address, sol_balance, wsol_balance, usdc_balance, timestamp
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        balance.walletAddress,
        balance.solBalance,
        balance.wsolBalance,
        balance.usdcBalance,
        balance.timestamp
      ]
    );
    
    logger.debug(`Wallet balance saved to database for wallet: ${balance.walletAddress}`);
  } catch (error) {
    logger.error('Error saving wallet balance to database:', error);
    throw error;
  }
}

// Get recent wallet balances
export async function getRecentWalletBalances(
  walletAddress: string,
  limit: number = 100
): Promise<WalletBalanceData[]> {
  try {
    const result = await query(
      `SELECT * FROM wallet_balances 
       WHERE wallet_address = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [walletAddress, limit]
    );
    
    return result.rows.map((row: any) => ({
      walletAddress: row.wallet_address,
      solBalance: parseFloat(row.sol_balance),
      wsolBalance: parseFloat(row.wsol_balance),
      usdcBalance: parseFloat(row.usdc_balance),
      timestamp: row.timestamp
    }));
  } catch (error) {
    logger.error('Error getting wallet balances from database:', error);
    throw error;
  }
}

// Save transaction to the database
export async function saveTransaction(transaction: TransactionData): Promise<void> {
  try {
    await query(
      `INSERT INTO transactions (
        transaction_signature, transaction_type, position_address,
        amount_a, amount_b, timestamp, status, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (transaction_signature) DO UPDATE SET
        status = $7,
        details = $8`,
      [
        transaction.transactionSignature,
        transaction.transactionType,
        transaction.positionAddress || null,
        transaction.amountA || null,
        transaction.amountB || null,
        transaction.timestamp,
        transaction.status,
        transaction.details ? JSON.stringify(transaction.details) : null
      ]
    );
    
    logger.info(`Transaction saved to database: ${transaction.transactionSignature}`);
  } catch (error) {
    logger.error('Error saving transaction to database:', error);
    throw error;
  }
}

// Get recent transactions
export async function getRecentTransactions(
  limit: number = 100,
  positionAddress?: string | null
): Promise<TransactionData[]> {
  try {
    let query_text = `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT $1`;
    let params = [limit];
    
    if (positionAddress) {
      query_text = `SELECT * FROM transactions WHERE position_address = $1 ORDER BY timestamp DESC LIMIT $2`;
      params = [positionAddress, limit as number];
    }
    
    const result = await query(query_text, params);
    
    return result.rows.map((row: any) => ({
      transactionSignature: row.transaction_signature,
      transactionType: row.transaction_type,
      positionAddress: row.position_address,
      amountA: row.amount_a !== null ? parseFloat(row.amount_a) : undefined,
      amountB: row.amount_b !== null ? parseFloat(row.amount_b) : undefined,
      timestamp: row.timestamp,
      status: row.status,
      details: row.details ? JSON.parse(row.details) : undefined
    }));
  } catch (error) {
    logger.error('Error getting transactions from database:', error);
    throw error;
  }
}
