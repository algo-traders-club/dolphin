import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PriceChart } from '@/components/charts/price-chart';
import { LiquidityChart } from '@/components/charts/liquidity-chart';
import { FeeChart } from '@/components/charts/fee-chart';
import { ClientDolphinLogo, ClientThemeToggle } from '@/components/ui/client-components';

import fs from 'fs';
import path from 'path';

// Define types for position and history data
type HistoryDataPoint = {
  timestamp: string;
  price?: number;
  liquidity?: number;
  fees?: number;
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
  feesEarned: number;
  availableLiquidity: string;
};

// Load real position data from file
function loadPositionData(): PositionData {
  try {
    // Try to load position data from file
    const dataPath = path.join(process.cwd(), '..', '..', 'src', 'data', 'position.json');
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const posData = JSON.parse(rawData);
      
      // Convert position data to the format expected by the UI
      const liquidityValue = typeof posData.liquidity === 'string' ? 
        parseFloat(posData.liquidity) / (10 ** 6) : 
        parseFloat(String(posData.liquidity)) / (10 ** 6);
      
      const feesEarned = parseFloat(posData.feeOwedA || '0') / (10 ** 9) + 
                        parseFloat(posData.feeOwedB || '0') / (10 ** 6);
      
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
        liquidity: liquidityValue,
        tokens: {
          SOL: 0.0,
          USDC: 10.909123, // This would be calculated from liquidity
        },
        fees: {
          earned: feesEarned,
          claimed: 0.0,
          pending: feesEarned,
        },
        feesEarned: feesEarned,
        availableLiquidity: '10.909123 USDC', // Available for adding liquidity
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
    feesEarned: 0,
    availableLiquidity: '0 USDC',
  };
}

// Helper function to generate history data points
function generateHistoryData(startValue: number, endValue: number, days: number, type: 'price' | 'liquidity' | 'fees'): HistoryDataPoint[] {
  const result = [];
  const step = (endValue - startValue) / (days - 1);
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1) + i);
    const dataPoint: HistoryDataPoint = {
      timestamp: date.toISOString().split('T')[0],
    };
    dataPoint[type] = startValue + (step * i);
    result.push(dataPoint);
  }
  
  return result;
}

// Load position data
const positionData = loadPositionData();

// Generate history data based on position data
const priceHistoryData = generateHistoryData(0.045, 0.063, 8, 'price');
const liquidityHistoryData = generateHistoryData(
  typeof positionData.liquidity === 'number' ? positionData.liquidity * 0.9 : 0, 
  typeof positionData.liquidity === 'number' ? positionData.liquidity : 0, 
  8, 
  'liquidity'
);

const feeHistoryData = generateHistoryData(
  0,
  typeof positionData.fees.earned === 'number' ? positionData.fees.earned : 0,
  8,
  'fees'
);

// Add type assertions to ensure the data matches the expected chart format
type ChartDataPoint<T extends string> = {
  date: string;
  [key: string]: string | number;
};

const formattedPriceData: Array<{date: string; price: number}> = priceHistoryData.map(item => ({
  date: item.timestamp,
  price: item.price !== undefined ? item.price : 0
}));

const formattedLiquidityData: Array<{date: string; liquidity: number}> = liquidityHistoryData.map(item => ({
  date: item.timestamp,
  liquidity: item.liquidity !== undefined ? item.liquidity : 0
}));

// Ensure all fees values are numbers with a type assertion
const formattedFeeData = feeHistoryData.map(item => ({
  date: item.timestamp,
  fees: item.fees !== undefined ? item.fees : 0
})) as Array<{date: string; fees: number}>;

// Convert to period format for fee charts with explicit typing
const formattedFeePeriodData = formattedFeeData.map(item => ({
  period: item.date,
  fees: item.fees as number // Explicitly assert this is a number
})) as Array<{period: string; fees: number}>;

// Create a properly typed array for the fee chart
const typedFeeChartData: Array<{period: string; fees: number}> = 
  formattedFeePeriodData.map(item => ({
    period: item.period,
    fees: Number(item.fees) // Ensure it's a number
  }));

// We'll use the formatted data for the charts instead of legacy mock data

export default function Home() {
  // Calculate position status indicator
  const getPositionStatusColor = (status: string) => {
    switch (status) {
      case 'IN_RANGE':
        return 'text-chart-3';
      case 'ABOVE_RANGE':
        return 'text-chart-1';
      case 'BELOW_RANGE':
        return 'text-chart-5';
      default:
        return 'text-muted-foreground';
    }
  };

  // Calculate price position relative to range
  const calculatePricePosition = () => {
    const { lower, upper, current } = positionData.priceRange;
    if (current < lower) return 0;
    if (current > upper) return 100;
    return ((current - lower) / (upper - lower)) * 100;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card py-5 px-6 rounded-lg shadow-sm border-0">
          <div className="flex items-center my-auto">
            <h2 className="text-2xl font-semibold tracking-tight my-0">SOL/USDC <span className="text-muted-foreground font-normal">Liquidity Position</span></h2>
          </div>
          <div className="flex items-center space-x-3">
            <ClientThemeToggle />
            <button className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-medium tracking-tight text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all duration-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
              <svg width="16" height="16" className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh Data
            </button>
            <button className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium tracking-tight text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all duration-200 dark:bg-blue-700 dark:hover:bg-blue-800">
              <svg width="16" height="16" className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Liquidity
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="pb-2 bg-primary/5 border-b border-accent/10">
              <CardTitle className="text-sm font-medium flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2"></span>
                Position Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <div className={`text-3xl font-bold tracking-tight ${getPositionStatusColor(positionData.status)}`}>
                  {positionData.status.replace('_', ' ')}
                </div>
                <div className={`h-3 w-3 rounded-full ${getPositionStatusColor(positionData.status)}`}></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex items-center">
                <svg width="16" height="16" className="mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
                SOL/USDC Pool
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="pb-2 bg-secondary/5 border-b border-accent/10">
              <CardTitle className="text-sm font-medium flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary mr-2"></span>
                Current Price
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold tracking-tight">${positionData.priceRange.current}</div>
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                  <span>${positionData.priceRange.lower}</span>
                  <span>${positionData.priceRange.upper}</span>
                </div>
                <div className="relative">
                  <Progress value={calculatePricePosition()} className="h-2" />
                  <div 
                    className="absolute top-0 h-4 w-1 bg-accent rounded-full -mt-1" 
                    style={{ 
                      left: `calc(${calculatePricePosition()}% - 2px)` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="pb-2 bg-accent/5 border-b border-accent/10">
              <CardTitle className="text-sm font-medium flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-accent mr-2"></span>
                Available Liquidity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold tracking-tight">${typeof positionData.liquidity === 'number' ? positionData.liquidity.toFixed(2) : parseFloat(String(positionData.liquidity)).toFixed(2)}</div>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="bg-accent/10 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">SOL</p>
                  <p className="text-sm font-medium">{positionData.tokens.SOL}</p>
                </div>
                <div className="bg-accent/10 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">USDC</p>
                  <p className="text-sm font-medium">{positionData.tokens.USDC}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="pb-2 bg-chart-4/5 border-b border-accent/10">
              <CardTitle className="text-sm font-medium flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-chart-4 mr-2"></span>
                Fees Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold tracking-tight">${typeof positionData.fees.earned === 'number' ? positionData.fees.earned.toFixed(3) : parseFloat(String(positionData.fees.earned)).toFixed(3)}</div>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="bg-accent/10 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">Claimed</p>
                  <p className="text-sm font-medium">${typeof positionData.fees.claimed === 'number' ? positionData.fees.claimed.toFixed(3) : parseFloat(String(positionData.fees.claimed)).toFixed(3)}</p>
                </div>
                <div className="bg-accent/10 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-sm font-medium">${typeof positionData.fees.pending === 'number' ? positionData.fees.pending.toFixed(3) : parseFloat(String(positionData.fees.pending)).toFixed(3)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1 border-0 shadow-md overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">Price History</CardTitle>
                  <CardDescription>SOL/USDC price over time</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                    1D
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    1W
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                    1M
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-80 pt-6">
              <PriceChart data={formattedPriceData} />
            </CardContent>
          </Card>
          
          <Card className="col-span-1 border-0 shadow-md overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">Liquidity History</CardTitle>
                  <CardDescription>Available liquidity over time</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                    1D
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    1W
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                    1M
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-80 pt-6">
              <LiquidityChart data={formattedLiquidityData} />
            </CardContent>
          </Card>
        </div>
        
        {/* Fee Chart */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/10 bg-card/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Fee Accumulation</CardTitle>
                <CardDescription>Earned fees over time</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                  1D
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  1W
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                  1M
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-64 pt-6">
            <FeeChart data={typedFeeChartData} />
          </CardContent>
        </Card>
        
        {/* Position Details */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Position Details</CardTitle>
                <CardDescription>Current liquidity position information</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                <svg width="16" height="16" className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                View on Explorer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-secondary/10 p-5 rounded-lg border border-border/10">
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <svg width="16" height="16" className="mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                    Position Address
                  </h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-mono bg-background/80 p-3 rounded-md border border-border/20 flex-1 overflow-hidden text-ellipsis">{positionData.address}</p>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <div className="bg-secondary/10 p-5 rounded-lg border border-border/10">
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <svg width="16" height="16" className="mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                    Whirlpool
                  </h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-mono bg-background/80 p-3 rounded-md border border-border/20 flex-1 overflow-hidden text-ellipsis">{positionData.whirlpool}</p>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/10 p-5 rounded-lg border border-border/10">
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <svg width="16" height="16" className="mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                      </svg>
                      Price Range
                    </h3>
                    <p className="text-sm font-medium">${positionData.priceRange.lower} to ${positionData.priceRange.upper}</p>
                    <p className="text-xs text-muted-foreground mt-2">SOL per USDC</p>
                  </div>
                  
                  <div className="bg-secondary/10 p-5 rounded-lg border border-border/10">
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <svg width="16" height="16" className="mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                      Tick Range
                    </h3>
                    <p className="text-sm font-medium">-39104 to -22976</p>
                    <p className="text-xs text-muted-foreground mt-2">Concentrated range</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary/5 p-6 rounded-lg border border-border/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium">Position Performance</h3>
                  <div className="flex items-center space-x-1 text-xs bg-secondary/20 rounded-full px-2 py-1">
                    <span className="h-2 w-2 rounded-full bg-chart-3"></span>
                    <span>Active since Apr 1, 2025</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-background/80 p-4 rounded-md border border-border/10">
                    <p className="text-xs text-muted-foreground">Total Fees Earned</p>
                    <p className="text-xl font-semibold mt-1">${positionData.feesEarned}</p>
                  </div>
                  <div className="bg-background/80 p-4 rounded-md border border-border/10">
                    <p className="text-xs text-muted-foreground">Current APR</p>
                    <p className="text-xl font-semibold mt-1 text-chart-3">4.2%</p>
                  </div>
                </div>
                
                <div className="h-36">
                  <FeeChart data={feeHistoryData.map(item => ({ period: item.timestamp, fees: item.fees }))} height={150} />
                </div>
                
                <div className="mt-4 flex justify-between">
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold">Available for adding liquidity:</span> {positionData.availableLiquidity}
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                    <svg width="16" height="16" className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Claim Fees
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
