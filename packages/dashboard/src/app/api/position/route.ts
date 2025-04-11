import { NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

// Function to load real position data from file
function loadPositionData() {
  try {
    // Try to load position data from file
    const dataPath = path.join(process.cwd(), '..', '..', 'src', 'data', 'position.json');
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const posData = JSON.parse(rawData);
      
      // Convert position data to the format expected by the API
      return {
        address: posData.positionAddress,
        positionMint: posData.positionMint,
        whirlpool: posData.whirlpoolAddress,
        status: posData.rangeStatus || 'ABOVE_RANGE',
        priceRange: {
          lower: Math.pow(1.0001, posData.tickLowerIndex) * (10 ** -12),
          upper: Math.pow(1.0001, posData.tickUpperIndex) * (10 ** -12),
          current: 0.063, // This would come from the latest snapshot
        },
        ticks: {
          lower: posData.tickLowerIndex,
          upper: posData.tickUpperIndex,
        },
        liquidity: typeof posData.liquidity === 'string' ? 
          parseFloat(posData.liquidity) / (10 ** 6) : 
          parseFloat(String(posData.liquidity)) / (10 ** 6),
        tokens: {
          SOL: 0.0,
          USDC: 10.909123, // This would be calculated from liquidity
        },
        fees: {
          earned: parseFloat(posData.feeOwedA || '0') / (10 ** 9) + parseFloat(posData.feeOwedB || '0') / (10 ** 6),
          claimed: 0.0,
          pending: parseFloat(posData.feeOwedA || '0') / (10 ** 9) + parseFloat(posData.feeOwedB || '0') / (10 ** 6),
        },
        history: {
          // Generate some history data based on current position
          // In a real implementation, this would come from the database
          price: generateHistoryData(0.045, 0.063, 8),
          liquidity: generateHistoryData(parseFloat(String(posData.liquidity)) / (10 ** 6) * 0.9, 
                                        parseFloat(String(posData.liquidity)) / (10 ** 6), 8),
          fees: generateHistoryData(0, parseFloat(posData.feeOwedA || '0') / (10 ** 9) + 
                                     parseFloat(posData.feeOwedB || '0') / (10 ** 6), 8)
        }
      };
    }
  } catch (error) {
    console.error('Error loading position data:', error);
  }
  
  // Fallback to default data if file not found or error occurred
  return {
    address: 'HSwifErTLV5yiMrgmYfCGxPtwohekJX9CM4T6NJdzptU',
    whirlpool: 'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ',
    status: 'ABOVE_RANGE',
    priceRange: {
      lower: 0.01,
      upper: 0.05,
      current: 0.063,
    },
    ticks: {
      lower: -39104,
      upper: -22976,
    },
    liquidity: 0,
    tokens: {
      SOL: 0.0,
      USDC: 0,
    },
    fees: {
      earned: 0,
      claimed: 0.0,
      pending: 0,
    },
    history: {
      price: generateHistoryData(0.045, 0.063, 8),
      liquidity: generateHistoryData(0, 0, 8),
      fees: generateHistoryData(0, 0, 8),
    },
  };
}

// Helper function to generate history data points
function generateHistoryData(startValue: number, endValue: number, days: number) {
  const result = [];
  const step = (endValue - startValue) / (days - 1);
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1) + i);
    result.push({
      timestamp: date.toISOString().split('T')[0],
      [endValue === 0 ? 'price' : endValue === startValue ? 'liquidity' : 'fees']: startValue + (step * i)
    });
  }
  
  return result;
}

export async function GET() {
  const positionData = loadPositionData();
  return NextResponse.json(positionData);
}
