import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RevenueChart } from '@/components/charts/revenue-chart';

// Mock data for the revenue page
const feeData = [
  { month: 'Jan', fees: 0.0 },
  { month: 'Feb', fees: 0.0 },
  { month: 'Mar', fees: 0.0 },
  { month: 'Apr', fees: 0.023 },
  { month: 'May', fees: 0.0 },
  { month: 'Jun', fees: 0.0 },
  { month: 'Jul', fees: 0.0 },
  { month: 'Aug', fees: 0.0 },
  { month: 'Sep', fees: 0.0 },
  { month: 'Oct', fees: 0.0 },
  { month: 'Nov', fees: 0.0 },
  { month: 'Dec', fees: 0.0 },
];

const dailyFeeData = [
  { day: '04/01', fees: 0.0 },
  { day: '04/02', fees: 0.003 },
  { day: '04/03', fees: 0.004 },
  { day: '04/04', fees: 0.003 },
  { day: '04/05', fees: 0.005 },
  { day: '04/06', fees: 0.003 },
  { day: '04/07', fees: 0.003 },
  { day: '04/08', fees: 0.002 },
];

const feeBreakdown = {
  total: 0.023,
  claimed: 0.0,
  pending: 0.023,
  apr: 4.2,
  transactions: [
    { 
      type: 'FEE_ACCRUAL', 
      timestamp: '2025-04-02T12:34:56Z', 
      amount: 0.003, 
      signature: '5UfDMpuBxhTxiRZ1rWqEQnPVs6qJMGVd9WzWDWqjbL5QwYMsYcxtMrza9zPpQSHRVrjRrMJkDT6GCWzY4oUXtZhA' 
    },
    { 
      type: 'FEE_ACCRUAL', 
      timestamp: '2025-04-03T15:22:11Z', 
      amount: 0.004, 
      signature: '3xGsZnNWYLdNZjRCGVzaGxs4PnmT2sjrz4XwmJbFcVkQj8xyMUPUAcEJQHxqJ1XgJQQKzHyPzQBFTQSrAGZnpyJU' 
    },
    { 
      type: 'FEE_ACCRUAL', 
      timestamp: '2025-04-04T09:45:30Z', 
      amount: 0.003, 
      signature: '2zL9JEZ1CnGsAcYxjbCUWHaRXyrMYxDKVYPwJzfBnPzfLXMcVJv5AzZUjQnXyxZF1cYnY1SptUPpYHxkJ9Vb5qHt' 
    },
    { 
      type: 'FEE_ACCRUAL', 
      timestamp: '2025-04-05T14:12:45Z', 
      amount: 0.005, 
      signature: '4vJGCkn7RZX1XQ8aT9Kgzj6DnXzs2yY9WMVtpNxW6YnQBvSVK8JLZhqXy2vr3uDZmFnKqGBRLJtZPQWj9BVnRLmk' 
    },
    { 
      type: 'FEE_ACCRUAL', 
      timestamp: '2025-04-06T11:33:22Z', 
      amount: 0.003, 
      signature: '5pQrST8FMnVbWxYZaGcDkEtNuJK7L6RvA9HqXy2wPz3sQmUvB4jDfRgZ5hXnW7tPyLkCrM8N9KqJsRvTgDpVLdEe' 
    },
    { 
      type: 'FEE_ACCRUAL', 
      timestamp: '2025-04-07T10:05:18Z', 
      amount: 0.003, 
      signature: '2RmNpQyXcV7ZsKL9TbWfGhJkDu8E5vA6FtPwYxZnMrBdUgLjS4HqXy7W9vZ3RkCmNpQrSt8FMnVbWxYZaGcDkEtN' 
    },
    { 
      type: 'FEE_ACCRUAL', 
      timestamp: '2025-04-08T16:45:33Z', 
      amount: 0.002, 
      signature: '3KtNuJK7L6RvA9HqXy2wPz3sQmUvB4jDfRgZ5hXnW7tPyLkCrM8N9KqJsRvTgDpVLdEe5pQrST8FMnVbWxYZaGcD' 
    },
  ]
};

export default function RevenuePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Fees & Revenue</h1>
          <Button>Claim Fees</Button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${feeBreakdown.total.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Since position opened
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${feeBreakdown.pending.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Available to claim
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claimed Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${feeBreakdown.claimed.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Already claimed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated APR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feeBreakdown.apr.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on current performance
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Daily Fee Accrual</CardTitle>
                <CardDescription>Fee earnings per day in April 2025</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <RevenueChart data={dailyFeeData} height={300} barColor="var(--chart-5)" />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Fee Accrual</CardTitle>
                <CardDescription>Fee earnings per month in 2025</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <RevenueChart data={feeData} height={300} barColor="var(--chart-5)" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Fee Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Transactions</CardTitle>
            <CardDescription>Detailed fee accrual history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {feeBreakdown.transactions.map((tx, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-3 px-4 text-sm">{tx.type.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-sm">{new Date(tx.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm">${tx.amount.toFixed(3)}</td>
                      <td className="py-3 px-4 text-sm font-mono text-xs truncate max-w-[200px]">
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
