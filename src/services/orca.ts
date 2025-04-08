import { AccountFetcher, OrcaDAL, OrcaNetwork, OrcaWhirlpoolClient } from '@orca-so/whirlpools-sdk';
import { PublicKey } from '@solana/web3.js';
import { ENV } from '../config/env';
import { getConnection, getProvider } from './solana';
import Decimal from 'decimal.js';

// Singleton instances
let accountFetcher: AccountFetcher | null = null;
let orcaDAL: OrcaDAL | null = null;
let orcaClient: OrcaWhirlpoolClient | null = null;

/**
 * Get the AccountFetcher instance for Orca
 * @returns AccountFetcher instance
 */
export function getAccountFetcher(): AccountFetcher {
  if (!accountFetcher) {
    const connection = getConnection();
    accountFetcher = new AccountFetcher(connection);
  }
  return accountFetcher;
}

/**
 * Get the Orca DAL (Data Access Layer) instance
 * @returns OrcaDAL instance
 */
export function getOrcaDAL(): OrcaDAL {
  if (!orcaDAL) {
    if (!ENV.WHIRLPOOL_PROGRAM_ID) {
      throw new Error('WHIRLPOOL_PROGRAM_ID is not defined in environment variables');
    }
    
    const fetcher = getAccountFetcher();
    orcaDAL = new OrcaDAL({
      network: OrcaNetwork.DEVNET,
      connection: getConnection(),
      fetcher,
      programId: ENV.WHIRLPOOL_PROGRAM_ID,
    });
    
    console.log(`Orca DAL initialized with program ID: ${ENV.WHIRLPOOL_PROGRAM_ID.toString()}`);
  }
  return orcaDAL;
}

/**
 * Get the Orca Whirlpool Client instance
 * @returns OrcaWhirlpoolClient instance
 */
export function getOrcaClient(): OrcaWhirlpoolClient {
  if (!orcaClient) {
    if (!ENV.WHIRLPOOL_PROGRAM_ID) {
      throw new Error('WHIRLPOOL_PROGRAM_ID is not defined in environment variables');
    }
    
    const provider = getProvider();
    orcaClient = new OrcaWhirlpoolClient({
      network: OrcaNetwork.DEVNET,
      provider,
      programId: ENV.WHIRLPOOL_PROGRAM_ID,
    });
    
    console.log('Orca Whirlpool Client initialized');
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
    const fetcher = getAccountFetcher();
    
    // Fetch the pool data
    const pool = await client.getPool(poolAddress);
    const poolData = pool.getData();
    
    // Fetch token data
    const tokenAInfo = await fetcher.getMintInfo(poolData.tokenMintA);
    const tokenBInfo = await fetcher.getMintInfo(poolData.tokenMintB);
    
    // Calculate the current price
    const sqrtPrice = poolData.sqrtPrice;
    const decimalsA = tokenAInfo?.decimals || 0;
    const decimalsB = tokenBInfo?.decimals || 0;
    
    // Price = (sqrtPrice^2) * (10^(decimalsA - decimalsB)) / 2^64
    const sqrtPriceDec = new Decimal(sqrtPrice.toString());
    const price = sqrtPriceDec
      .mul(sqrtPriceDec)
      .mul(Decimal.pow(10, decimalsA - decimalsB))
      .div(Decimal.pow(2, 64));
    
    // Assuming tokenA is USDC and tokenB is SOL
    // Price is in terms of tokenB per tokenA (SOL per USDC)
    const humanReadablePrice = price.toFixed(9);
    
    console.log(`Fetched Whirlpool data for address: ${poolAddress.toString()}`);
    console.log(`Token A: ${poolData.tokenMintA.toString()}`);
    console.log(`Token B: ${poolData.tokenMintB.toString()}`);
    console.log(`Current tick: ${poolData.tickCurrentIndex}`);
    console.log(`Tick spacing: ${poolData.tickSpacing}`);
    console.log(`Current price: ${humanReadablePrice} SOL per USDC`);
    
    return {
      pool,
      poolData,
      tokenAInfo,
      tokenBInfo,
      price: humanReadablePrice,
    };
  } catch (error) {
    console.error(`Error fetching Whirlpool data for ${poolAddress.toString()}:`, error);
    throw new Error(`Failed to fetch Whirlpool data: ${(error as Error).message}`);
  }
}
