import { NextResponse } from 'next/server';

// This would normally fetch data from the agent API
// For now, we'll return mock data that matches our position details from the memories
export async function GET() {
  const positionData = {
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
    liquidity: 10.909123,
    tokens: {
      SOL: 0.0,
      USDC: 10.909123,
    },
    fees: {
      earned: 0.023,
      claimed: 0.0,
      pending: 0.023,
    },
    history: {
      price: [
        { timestamp: '2025-04-01', price: 0.045 },
        { timestamp: '2025-04-02', price: 0.048 },
        { timestamp: '2025-04-03', price: 0.052 },
        { timestamp: '2025-04-04', price: 0.055 },
        { timestamp: '2025-04-05', price: 0.058 },
        { timestamp: '2025-04-06', price: 0.06 },
        { timestamp: '2025-04-07', price: 0.062 },
        { timestamp: '2025-04-08', price: 0.063 },
      ],
      liquidity: [
        { timestamp: '2025-04-01', liquidity: 10.0 },
        { timestamp: '2025-04-02', liquidity: 10.2 },
        { timestamp: '2025-04-03', liquidity: 10.4 },
        { timestamp: '2025-04-04', liquidity: 10.5 },
        { timestamp: '2025-04-05', liquidity: 10.6 },
        { timestamp: '2025-04-06', liquidity: 10.7 },
        { timestamp: '2025-04-07', liquidity: 10.8 },
        { timestamp: '2025-04-08', liquidity: 10.9 },
      ],
      fees: [
        { timestamp: '2025-04-01', fees: 0.0 },
        { timestamp: '2025-04-02', fees: 0.003 },
        { timestamp: '2025-04-03', fees: 0.007 },
        { timestamp: '2025-04-04', fees: 0.01 },
        { timestamp: '2025-04-05', fees: 0.015 },
        { timestamp: '2025-04-06', fees: 0.018 },
        { timestamp: '2025-04-07', fees: 0.021 },
        { timestamp: '2025-04-08', fees: 0.023 },
      ],
    },
  };

  return NextResponse.json(positionData);
}
