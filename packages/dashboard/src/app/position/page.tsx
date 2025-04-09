import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data for the position details page
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
  transactions: [
    { 
      type: 'ADD_LIQUIDITY', 
      timestamp: '2025-04-01T12:34:56Z', 
      amount: 10.0, 
      signature: '5UfDMpuBxhTxiRZ1rWqEQnPVs6qJMGVd9WzWDWqjbL5QwYMsYcxtMrza9zPpQSHRVrjRrMJkDT6GCWzY4oUXtZhA' 
    },
    { 
      type: 'REBALANCE', 
      timestamp: '2025-04-03T15:22:11Z', 
      amount: 0.4, 
      signature: '3xGsZnNWYLdNZjRCGVzaGxs4PnmT2sjrz4XwmJbFcVkQj8xyMUPUAcEJQHxqJ1XgJQQKzHyPzQBFTQSrAGZnpyJU' 
    },
    { 
      type: 'CLAIM_FEES', 
      timestamp: '2025-04-06T09:45:30Z', 
      amount: 0.015, 
      signature: '2zL9JEZ1CnGsAcYxjbCUWHaRXyrMYxDKVYPwJzfBnPzfLXMcVJv5AzZUjQnXyxZF1cYnY1SptUPpYHxkJ9Vb5qHt' 
    },
  ]
};

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
                  <p className="text-base">${positionData.liquidity.toFixed(2)}</p>
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
                          href={`https://explorer.solana.com/tx/${tx.signature}`} 
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
