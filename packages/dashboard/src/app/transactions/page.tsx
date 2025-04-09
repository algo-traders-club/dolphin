import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Mock data for the transactions page
const transactions = [
  { 
    type: 'OPEN_POSITION', 
    timestamp: '2025-04-01T10:15:22Z', 
    amount: 1.0, 
    signature: '4vJGCkn7RZX1XQ8aT9Kgzj6DnXzs2yY9WMVtpNxW6YnQBvSVK8JLZhqXy2vr3uDZmFnKqGBRLJtZPQWj9BVnRLmk',
    status: 'CONFIRMED',
    description: 'Initial position with minimal liquidity'
  },
  { 
    type: 'ADD_LIQUIDITY', 
    timestamp: '2025-04-01T12:34:56Z', 
    amount: 9.0, 
    signature: '5UfDMpuBxhTxiRZ1rWqEQnPVs6qJMGVd9WzWDWqjbL5QwYMsYcxtMrza9zPpQSHRVrjRrMJkDT6GCWzY4oUXtZhA',
    status: 'CONFIRMED',
    description: 'Added main liquidity to position'
  },
  { 
    type: 'FEE_ACCRUAL', 
    timestamp: '2025-04-02T12:34:56Z', 
    amount: 0.003, 
    signature: '5UfDMpuBxhTxiRZ1rWqEQnPVs6qJMGVd9WzWDWqjbL5QwYMsYcxtMrza9zPpQSHRVrjRrMJkDT6GCWzY4oUXtZhA',
    status: 'CONFIRMED',
    description: 'Daily fee accrual'
  },
  { 
    type: 'FEE_ACCRUAL', 
    timestamp: '2025-04-03T15:22:11Z', 
    amount: 0.004, 
    signature: '3xGsZnNWYLdNZjRCGVzaGxs4PnmT2sjrz4XwmJbFcVkQj8xyMUPUAcEJQHxqJ1XgJQQKzHyPzQBFTQSrAGZnpyJU',
    status: 'CONFIRMED',
    description: 'Daily fee accrual'
  },
  { 
    type: 'REBALANCE', 
    timestamp: '2025-04-03T15:22:11Z', 
    amount: 0.4, 
    signature: '3xGsZnNWYLdNZjRCGVzaGxs4PnmT2sjrz4XwmJbFcVkQj8xyMUPUAcEJQHxqJ1XgJQQKzHyPzQBFTQSrAGZnpyJU',
    status: 'CONFIRMED',
    description: 'Automatic rebalance due to price movement'
  },
  { 
    type: 'FEE_ACCRUAL', 
    timestamp: '2025-04-04T09:45:30Z', 
    amount: 0.003, 
    signature: '2zL9JEZ1CnGsAcYxjbCUWHaRXyrMYxDKVYPwJzfBnPzfLXMcVJv5AzZUjQnXyxZF1cYnY1SptUPpYHxkJ9Vb5qHt',
    status: 'CONFIRMED',
    description: 'Daily fee accrual'
  },
  { 
    type: 'FEE_ACCRUAL', 
    timestamp: '2025-04-05T14:12:45Z', 
    amount: 0.005, 
    signature: '4vJGCkn7RZX1XQ8aT9Kgzj6DnXzs2yY9WMVtpNxW6YnQBvSVK8JLZhqXy2vr3uDZmFnKqGBRLJtZPQWj9BVnRLmk',
    status: 'CONFIRMED',
    description: 'Daily fee accrual'
  },
  { 
    type: 'FEE_ACCRUAL', 
    timestamp: '2025-04-06T11:33:22Z', 
    amount: 0.003, 
    signature: '5pQrST8FMnVbWxYZaGcDkEtNuJK7L6RvA9HqXy2wPz3sQmUvB4jDfRgZ5hXnW7tPyLkCrM8N9KqJsRvTgDpVLdEe',
    status: 'CONFIRMED',
    description: 'Daily fee accrual'
  },
  { 
    type: 'FEE_ACCRUAL', 
    timestamp: '2025-04-07T10:05:18Z', 
    amount: 0.003, 
    signature: '2RmNpQyXcV7ZsKL9TbWfGhJkDu8E5vA6FtPwYxZnMrBdUgLjS4HqXy7W9vZ3RkCmNpQrSt8FMnVbWxYZaGcDkEtN',
    status: 'CONFIRMED',
    description: 'Daily fee accrual'
  },
  { 
    type: 'FEE_ACCRUAL', 
    timestamp: '2025-04-08T16:45:33Z', 
    amount: 0.002, 
    signature: '3KtNuJK7L6RvA9HqXy2wPz3sQmUvB4jDfRgZ5hXnW7tPyLkCrM8N9KqJsRvTgDpVLdEe5pQrST8FMnVbWxYZaGcD',
    status: 'CONFIRMED',
    description: 'Daily fee accrual'
  },
];

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-medium tracking-tight">Transactions</h1>
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full md:w-64">
              <Input placeholder="Search transactions..." className="pr-10 h-11 text-base shadow-sm" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute right-3 top-3 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <Button variant="outline" className="h-11 px-5 shadow-sm">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Export
            </Button>
          </div>
        </div>
        
        {/* Transactions Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium tracking-tight">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium tracking-tighter">{transactions.length}</div>
              <p className="text-xs text-muted-foreground mt-1 font-light tracking-tight">
                All time
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium tracking-tight">Liquidity Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium tracking-tighter">
                {transactions.filter(tx => 
                  ['OPEN_POSITION', 'ADD_LIQUIDITY', 'REMOVE_LIQUIDITY', 'REBALANCE'].includes(tx.type)
                ).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Position management
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fee Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.filter(tx => 
                  ['FEE_ACCRUAL', 'CLAIM_FEES'].includes(tx.type)
                ).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fee related
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(transactions[0].timestamp).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions[0].type.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Transaction Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type-filter">Transaction Type</Label>
                <select id="type-filter" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">All Types</option>
                  <option value="OPEN_POSITION">Open Position</option>
                  <option value="ADD_LIQUIDITY">Add Liquidity</option>
                  <option value="REMOVE_LIQUIDITY">Remove Liquidity</option>
                  <option value="REBALANCE">Rebalance</option>
                  <option value="FEE_ACCRUAL">Fee Accrual</option>
                  <option value="CLAIM_FEES">Claim Fees</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <select id="status-filter" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input id="date-from" type="date" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input id="date-to" type="date" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Transactions Table */}
        <Card className="shadow-md border-0 overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border/20 pb-4">
            <CardTitle className="text-2xl font-medium tracking-tight">All Transactions</CardTitle>
            <CardDescription className="text-base mt-1">Complete transaction history for your position</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left py-4 px-6 text-base font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-4 px-6 text-base font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left py-4 px-6 text-base font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-4 px-6 text-base font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 text-base font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-4 px-6 text-base font-medium text-muted-foreground">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <tr key={index} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                      <td className="py-5 px-6 text-base">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          tx.type === 'OPEN_POSITION' || tx.type === 'ADD_LIQUIDITY' 
                            ? 'bg-chart-3/20 text-chart-3 dark:bg-chart-3/30' 
                            : tx.type === 'REMOVE_LIQUIDITY' || tx.type === 'REBALANCE'
                              ? 'bg-chart-1/20 text-chart-1 dark:bg-chart-1/30'
                              : 'bg-chart-5/20 text-chart-5 dark:bg-chart-5/30'
                        }`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-base">{new Date(tx.timestamp).toLocaleString()}</td>
                      <td className="py-5 px-6 text-base font-medium">${tx.amount.toFixed(tx.amount < 1 ? 3 : 2)}</td>
                      <td className="py-5 px-6 text-base">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          tx.status === 'CONFIRMED' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : tx.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-base">{tx.description}</td>
                      <td className="py-5 px-6 text-base font-mono truncate max-w-[200px]">
                        <a 
                          href={`https://explorer.solana.com/tx/${tx.signature}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          <span>{tx.signature.substring(0, 8)}...{tx.signature.substring(tx.signature.length - 8)}</span>
                          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 border-t border-border/30 bg-card/50">
              <div className="text-base text-muted-foreground mb-4 md:mb-0">
                Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">{transactions.length}</span> transactions
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="default" disabled className="h-10 px-4 shadow-sm">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Previous
                </Button>
                <Button variant="outline" size="default" className="h-10 px-4 shadow-sm">
                  Next
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
