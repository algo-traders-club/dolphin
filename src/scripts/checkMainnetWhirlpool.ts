/**
 * Script to check the USDC/SOL Whirlpool on Solana mainnet
 * This script will connect to mainnet, load the wallet, and fetch data about the Whirlpool
 */

import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { getWallet } from '../services/solana';
import * as logger from '../utils/logger';
import { WhirlpoolContext, buildWhirlpoolClient, PDAUtil, ORCA_WHIRLPOOL_PROGRAM_ID } from '@orca-so/whirlpools-sdk';
import Decimal from 'decimal.js';

// Mainnet USDC/SOL Whirlpool address (64 tick spacing)
const USDC_SOL_WHIRLPOOL_ADDRESS = 'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ';

// Token mints
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function main() {
  try {
    logger.info('Checking USDC/SOL Whirlpool on Solana mainnet...');
    
    // Get the wallet
    const wallet = getWallet();
    logger.info(`Wallet public key: ${wallet.publicKey.toString()}`);
    
    // Connect to mainnet
    const mainnetUrl = clusterApiUrl('mainnet-beta');
    logger.info(`Connecting to Solana mainnet: ${mainnetUrl}`);
    const connection = new Connection(mainnetUrl, 'confirmed');
    
    // Create a wallet adapter that works with the Orca SDK
    const walletAdapter = {
      publicKey: wallet.publicKey,
      signTransaction: async (tx: any) => {
        return await wallet.signTransaction(tx);
      },
      signAllTransactions: async (txs: any[]) => {
        return await wallet.signAllTransactions(txs);
      }
    };
    
    // Initialize Whirlpool client
    const whirlpoolClient = buildWhirlpoolClient({
      network: 'mainnet-beta',
      connection,
      wallet: walletAdapter as any,
    });
    
    logger.info('Whirlpool client initialized');
    
    // Fetch the Whirlpool data
    const whirlpoolPubkey = new PublicKey(USDC_SOL_WHIRLPOOL_ADDRESS);
    const whirlpool = await whirlpoolClient.getPool(whirlpoolPubkey);
    const poolData = whirlpool.getData();
    
    logger.info(`Whirlpool data retrieved for: ${USDC_SOL_WHIRLPOOL_ADDRESS}`);
    logger.info(`Token A (USDC): ${poolData.tokenMintA.toString()}`);
    logger.info(`Token B (SOL): ${poolData.tokenMintB.toString()}`);
    logger.info(`Current tick index: ${poolData.tickCurrentIndex}`);
    logger.info(`Tick spacing: ${poolData.tickSpacing}`);
    
    // Calculate price
    const sqrtPrice = poolData.sqrtPrice;
    const decimalsA = 6; // USDC has 6 decimals
    const decimalsB = 9; // SOL has 9 decimals
    
    // Price = (sqrtPrice^2) * (10^(decimalsA - decimalsB)) / 2^64
    const sqrtPriceDec = new Decimal(sqrtPrice.toString());
    const price = sqrtPriceDec
      .mul(sqrtPriceDec)
      .mul(Decimal.pow(10, decimalsA - decimalsB))
      .div(Decimal.pow(2, 64));
    
    logger.info(`Current price: ${price.toFixed(9)} SOL per USDC`);
    logger.info(`Inverse price: ${new Decimal(1).div(price).toFixed(2)} USDC per SOL`);
    
    // Check wallet balances
    const solBalance = await connection.getBalance(wallet.publicKey);
    logger.info(`SOL balance: ${solBalance / 1e9} SOL`);
    
    logger.info('Mainnet Whirlpool check completed successfully!');
    
    return {
      whirlpoolAddress: USDC_SOL_WHIRLPOOL_ADDRESS,
      tokenA: poolData.tokenMintA.toString(),
      tokenB: poolData.tokenMintB.toString(),
      currentPrice: price.toFixed(9),
      inversePrice: new Decimal(1).div(price).toFixed(2),
      solBalance: solBalance / 1e9
    };
  } catch (error) {
    logger.error('Error checking mainnet Whirlpool:', error);
    throw error;
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => logger.error('Unhandled error:', error));
}

export default main;
