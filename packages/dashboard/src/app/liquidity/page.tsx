import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiquidityChart } from '@/components/charts/liquidity-chart';
import { PriceChart } from '@/components/charts/price-chart';

// Mock data for the liquidity history page
const liquidityHistoryData = [
  { date: '2025-04-01', liquidity: 10.0, price: 0.045, status: 'ABOVE_RANGE' },
  { date: '2025-04-02', liquidity: 10.2, price: 0.048, status: 'ABOVE_RANGE' },
  { date: '2025-04-03', liquidity: 10.4, price: 0.052, status: 'ABOVE_RANGE' },
  { date: '2025-04-04', liquidity: 10.5, price: 0.055, status: 'ABOVE_RANGE' },
  { date: '2025-04-05', liquidity: 10.6, price: 0.058, status: 'ABOVE_RANGE' },
  { date: '2025-04-06', liquidity: 10.7, price: 0.060, status: 'ABOVE_RANGE' },
  { date: '2025-04-07', liquidity: 10.8, price: 0.062, status: 'ABOVE_RANGE' },
  { date: '2025-04-08', liquidity: 10.9, price: 0.063, status: 'ABOVE_RANGE' },
];

const liquidityTransactions = [
  { 
    type: 'OPEN_POSITION', 
    timestamp: '2025-04-01T10:15:22Z', 
    amount: 1.0, 
    signature: '4vJGCkn7RZX1XQ8aT9Kgzj6DnXzs2yY9WMVtpNxW6YnQBvSVK8JLZhqXy2vr3uDZmFnKqGBRLJtZPQWj9BVnRLmk',
    description: 'Initial position with minimal liquidity'
  },
  { 
    type: 'ADD_LIQUIDITY', 
    timestamp: '2025-04-01T12:34:56Z', 
    amount: 9.0, 
    signature: '5UfDMpuBxhTxiRZ1rWqEQnPVs6qJMGVd9WzWDWqjbL5QwYMsYcxtMrza9zPpQSHRVrjRrMJkDT6GCWzY4oUXtZhA',
    description: 'Added main liquidity to position'
  },
  { 
    type: 'REBALANCE', 
    timestamp: '2025-04-03T15:22:11Z', 
    amount: 0.4, 
    signature: '3xGsZnNWYLdNZjRCGVzaGxs4PnmT2sjrz4XwmJbFcVkQj8xyMUPUAcEJQHxqJ1XgJQQKzHyPzQBFTQSrAGZnpyJU',
    description: 'Automatic rebalance due to price movement'
  },
];

const positionRange = {
  lower: 0.01,
  upper: 0.05,
  ticks: {
    lower: -39104,
    upper: -22976,
  }
};

export default function LiquidityPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Liquidity History</h1>
          <div className="flex space-x-2">
            <Button variant="outline">Add Liquidity</Button>
            <Button>Remove Liquidity</Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Liquidity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${liquidityHistoryData[liquidityHistoryData.length - 1].liquidity.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                As of {new Date(liquidityHistoryData[liquidityHistoryData.length - 1].date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Position Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${positionRange.lower} - ${positionRange.upper}</div>
              <p className="text-xs text-muted-foreground mt-1">
                SOL per USDC
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tick Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positionRange.ticks.lower} to {positionRange.ticks.upper}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Whirlpool ticks
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <span className={`inline-block h-3 w-3 rounded-full mr-2 ${
                  liquidityHistoryData[liquidityHistoryData.length - 1].status === 'IN_RANGE' 
                    ? 'bg-chart-3' 
                    : liquidityHistoryData[liquidityHistoryData.length - 1].status === 'ABOVE_RANGE' 
                      ? 'bg-chart-1' 
                      : 'bg-chart-5'
                }`}></span>
                {liquidityHistoryData[liquidityHistoryData.length - 1].status.replace('_', ' ')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current price: ${liquidityHistoryData[liquidityHistoryData.length - 1].price}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Liquidity History Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Liquidity History</CardTitle>
            <CardDescription>Liquidity and price over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div>
                <h3 className="text-sm font-medium mb-2">Liquidity History</h3>
                <LiquidityChart 
                  data={liquidityHistoryData.map(item => ({
                    date: item.date,
                    liquidity: item.liquidity
                  }))}
                  height={200}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Price History</h3>
                <PriceChart 
                  data={liquidityHistoryData.map(item => ({
                    date: item.date,
                    price: item.price
                  }))}
                  height={200}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Liquidity Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Transactions</CardTitle>
            <CardDescription>History of liquidity changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {liquidityTransactions.map((tx, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-3 px-4 text-sm">{tx.type.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-sm">{new Date(tx.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm">${tx.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm">{tx.description}</td>
                      <td className="py-3 px-4 text-sm font-mono text-xs truncate max-w-[200px]">
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
