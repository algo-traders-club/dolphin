import { WhirlpoolContext, buildWhirlpoolClient } from '@orca-so/whirlpools-sdk';
import { PDAUtil, PoolUtil } from '@orca-so/whirlpools-sdk';
import { Percentage } from '@orca-so/common-sdk';
import { PublicKey } from '@solana/web3.js';
import { ENV } from '../config/env';
import { getConnection, getProvider } from './solana';
import * as logger from '../utils/logger';
import Decimal from 'decimal.js';

// Singleton instances
let orcaClient: ReturnType<typeof buildWhirlpoolClient> | null = null;





/**
 * Get the Orca Whirlpool Client instance
 * @returns Whirlpool Client instance
 */
export function getOrcaClient(): ReturnType<typeof buildWhirlpoolClient> {
  if (!orcaClient) {
    if (!ENV.WHIRLPOOL_PROGRAM_ID) {
      throw new Error('WHIRLPOOL_PROGRAM_ID is not defined in environment variables');
    }
    
    const provider = getProvider();
    // Create a wallet adapter that works with the Orca SDK
    const walletAdapter = {
      publicKey: provider.wallet.publicKey,
      signTransaction: async (tx: any) => {
        return await provider.wallet.signTransaction(tx);
      },
      signAllTransactions: async (txs: any[]) => {
        return await provider.wallet.signAllTransactions(txs);
      }
    };
    
    // Use the buildWhirlpoolClient factory function
    orcaClient = buildWhirlpoolClient({
      network: 'mainnet-beta',
      connection: getConnection(),
      wallet: walletAdapter,
      programId: ENV.WHIRLPOOL_PROGRAM_ID,
    });
    
    logger.info('Orca Whirlpool Client initialized');
  }
  return orcaClient;
}

/**
 * Fetch pool data for a specific Whirlpool
 * @param poolAddress The public key of the Whirlpool
 * @returns Promise resolving to the pool data and additional information
 */
export async function fetchWhirlpoolData(poolAddress: PublicKey) {
  try {
    const client = getOrcaClient();
    
    // Fetch the pool data
    const pool = await client.getPool(poolAddress);
    const poolData = pool.getData();
    
    // Fetch token data
    const connection = getConnection();
    // Use getMintInfo from SPL Token program
    const tokenAInfo = await connection.getAccountInfo(poolData.tokenMintA);
    const tokenBInfo = await connection.getAccountInfo(poolData.tokenMintB);
    
    // Default decimals if we can't get the actual values
    const decimalsA = tokenAInfo ? 6 : 6; // USDC has 6 decimals
    const decimalsB = tokenBInfo ? 9 : 9; // SOL has 9 decimals
    
    // Calculate the current price
    const sqrtPrice = poolData.sqrtPrice;
    
    // Price = (sqrtPrice^2) * (10^(decimalsA - decimalsB)) / 2^64
    const sqrtPriceDec = new Decimal(sqrtPrice.toString());
    const price = sqrtPriceDec
      .mul(sqrtPriceDec)
      .mul(Decimal.pow(10, decimalsA - decimalsB))
      .div(Decimal.pow(2, 64));
    
    // Assuming tokenA is USDC and tokenB is SOL
    // Price is in terms of tokenB per tokenA (SOL per USDC)
    const humanReadablePrice = price.toFixed(9);
    
    logger.info(`Fetched Whirlpool data for address: ${poolAddress.toString()}`);
    logger.info(`Token A: ${poolData.tokenMintA.toString()}`);
    logger.info(`Token B: ${poolData.tokenMintB.toString()}`);
    logger.info(`Current tick: ${poolData.tickCurrentIndex}`);
    logger.info(`Tick spacing: ${poolData.tickSpacing}`);
    logger.info(`Current price: ${humanReadablePrice} SOL per USDC`);
    
    return {
      pool,
      poolData,
      tokenAInfo,
      tokenBInfo,
      price: humanReadablePrice,
    };
  } catch (error) {
    logger.error(`Error fetching Whirlpool data for ${poolAddress.toString()}:`, error);
    throw new Error(`Failed to fetch Whirlpool data: ${(error as Error).message}`);
  }
}
