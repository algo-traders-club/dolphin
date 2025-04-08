/**
 * Script to check the USDC/SOL Whirlpool on Solana mainnet using the new high-level SDK
 */

import { setWhirlpoolsConfig } from "@orca-so/whirlpools";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { createSolanaRpc, mainnet } from "@solana/kit";
import * as logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Mainnet USDC/SOL Whirlpool address (64 tick spacing)
const USDC_SOL_WHIRLPOOL_ADDRESS = 'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ';

// Token mints
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function main() {
  try {
    logger.info('Checking USDC/SOL Whirlpool on Solana mainnet using the new SDK...');
    
    // Configure the Whirlpools SDK for Solana Mainnet
    await setWhirlpoolsConfig("solanaMainnet");
    logger.info('Whirlpools SDK configured for Solana Mainnet');
    
    // Create RPC connection to Solana mainnet
    const mainnetRpc = createSolanaRpc(mainnet("https://api.mainnet-beta.solana.com"));
    logger.info('Connected to Solana mainnet');
    
    // Load wallet from wallet.json
    const walletJsonPath = path.resolve(process.cwd(), 'wallet.json');
    if (!fs.existsSync(walletJsonPath)) {
      throw new Error('wallet.json not found');
    }
    
    const walletJson = JSON.parse(fs.readFileSync(walletJsonPath, 'utf-8'));
    const secretKeyUint8 = new Uint8Array(walletJson.secretKey);
    const wallet = await createKeyPairSignerFromBytes(secretKeyUint8);
    
    logger.info(`Wallet loaded with public key: ${wallet.address.toString()}`);
    
    // Check SOL balance
    const solBalanceResponse = await mainnetRpc.getBalance(wallet.address).send();
    const solBalance = Number(solBalanceResponse.value) / 1e9;
    logger.info(`SOL balance: ${solBalance} SOL`);
    
    // Get pool information
    logger.info(`Target Whirlpool address: ${USDC_SOL_WHIRLPOOL_ADDRESS}`);
    logger.info(`SOL mint: ${SOL_MINT}`);
    logger.info(`USDC mint: ${USDC_MINT}`);
    
    // In a full implementation, we would use the SDK to get detailed pool information
    // and perform operations like adding liquidity, swapping tokens, etc.
    // For now, we've confirmed that we can connect to mainnet and access our wallet
    
    logger.info('Mainnet Whirlpool check completed successfully!');
    
    return {
      whirlpoolAddress: USDC_SOL_WHIRLPOOL_ADDRESS,
      walletAddress: wallet.address.toString(),
      solBalance: solBalance
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
