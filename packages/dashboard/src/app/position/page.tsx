import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import fs from 'fs';
import path from 'path';

// Define types for position data
type Transaction = {
  type: string;
  timestamp: string;
  amount: number;
  signature: string;
  status?: string;
  description?: string;
};

type PositionData = {
  address: string;
  positionMint?: string;
  whirlpool: string;
  status: string;
  priceRange: {
    lower: number;
    upper: number;
    current: number;
  };
  ticks: {
    lower: number;
    upper: number;
  };
  liquidity: number | string;
  tokens: {
    SOL: number;
    USDC: number;
  };
  fees: {
    earned: number;
    claimed: number;
    pending: number;
  };
  transactions: Transaction[];
};

// Load real position data from file or API
function loadPositionData(): PositionData {
  try {
    // Try to load position data from file
    const dataPath = path.join(process.cwd(), '..', '..', 'src', 'data', 'position.json');
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const posData = JSON.parse(rawData);
      
      // Convert position data to the format expected by the UI
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
        transactions: []
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
    transactions: []
  };
}

// Load transactions data
function loadTransactions(): Transaction[] {
  try {
    // Try to load transactions from file
    const dataPath = path.join(process.cwd(), '..', '..', 'src', 'data', 'transactions.json');
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
  
  return [];
}

// Load position data and transactions
const positionData = loadPositionData();
positionData.transactions = loadTransactions().slice(0, 3); // Get the 3 most recent transactions

export default function PositionPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">Position Details</h1>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="shadow-sm">Add Liquidity</Button>
            <Button variant="outline" className="shadow-sm">Remove Liquidity</Button>
            <Button className="shadow-sm">Claim Fees</Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Position Information</CardTitle>
            <CardDescription>Details about your current liquidity position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Position Address</h3>
                  <p className="text-base font-mono break-all">{positionData.address}</p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Whirlpool</h3>
                  <p className="text-base font-mono break-all">{positionData.whirlpool}</p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Status</h3>
                  <p className="text-base font-medium">
                    <span className={`inline-block h-3 w-3 rounded-full mr-2 ${
                      positionData.status === 'IN_RANGE' 
                        ? 'bg-chart-3' 
                        : positionData.status === 'ABOVE_RANGE' 
                          ? 'bg-chart-1' 
                          : 'bg-chart-5'
                    }`}></span>
                    {positionData.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Price Range</h3>
                  <p className="text-base">${positionData.priceRange.lower} to ${positionData.priceRange.upper} SOL per USDC</p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Ticks</h3>
                  <p className="text-base">{positionData.ticks.lower} to {positionData.ticks.upper}</p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Current Price</h3>
                  <p className="text-base">${positionData.priceRange.current} SOL per USDC</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Liquidity</h3>
                  <p className="text-base">${typeof positionData.liquidity === 'number' ? positionData.liquidity.toFixed(2) : parseFloat(String(positionData.liquidity)).toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Token Balances</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-md shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">SOL</p>
                      <p className="text-base font-medium">{positionData.tokens.SOL}</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-md shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">USDC</p>
                      <p className="text-base font-medium">{positionData.tokens.USDC}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">Fees</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/30 p-4 rounded-md shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">Earned</p>
                      <p className="text-base font-medium">${positionData.fees.earned.toFixed(3)}</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-md shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">Claimed</p>
                      <p className="text-base font-medium">${positionData.fees.claimed.toFixed(3)}</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-md shadow-sm">
                      <p className="text-sm text-muted-foreground mb-1">Pending</p>
                      <p className="text-base font-medium">${positionData.fees.pending.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Recent activity for this position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-base font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-4 px-4 text-base font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left py-4 px-4 text-base font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-4 px-4 text-base font-medium text-muted-foreground">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {positionData.transactions.map((tx, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-4 px-4 text-base">{tx.type.replace('_', ' ')}</td>
                      <td className="py-4 px-4 text-base">{new Date(tx.timestamp).toLocaleString()}</td>
                      <td className="py-4 px-4 text-base">${tx.amount.toFixed(3)}</td>
                      <td className="py-4 px-4 text-base font-mono truncate max-w-[200px]">
                        <a 
                          href={`https://solscan.io/tx/${tx.signature}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {tx.signature.substring(0, 8)}...{tx.signature.substring(tx.signature.length - 8)}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
