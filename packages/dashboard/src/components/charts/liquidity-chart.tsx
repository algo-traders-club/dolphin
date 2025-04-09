"use client";

interface LiquidityChartProps {
  data: Array<{
    date: string;
    liquidity: number;
  }>;
  height?: number;
}

export function LiquidityChart({ data, height = 300 }: LiquidityChartProps) {
  // Find min and max liquidity for scaling
  const maxLiquidity = Math.max(...data.map(item => item.liquidity));
  const minLiquidity = Math.min(...data.map(item => item.liquidity));
  
  // Calculate liquidity range with some padding
  const range = maxLiquidity - minLiquidity;
  const paddedMin = Math.max(0, minLiquidity - range * 0.1);
  const paddedMax = maxLiquidity + range * 0.1;
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        {data.length > 0 && (
          <>
            <div>Initial: ${data[0].liquidity.toFixed(2)}</div>
            <div>Current: ${data[data.length - 1].liquidity.toFixed(2)}</div>
          </>
        )}
      </div>
      
      <div className="relative w-full h-[calc(100%-24px)] bg-background/50 rounded-md border border-accent/10">
        {/* Area chart simulation */}
        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5347EF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#5347EF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Area path */}
          <path
            d={data.map((point, i) => {
              // Calculate x position based on index
              const x = (i / (data.length - 1)) * 100;
              
              // Calculate y position based on liquidity value
              const normalizedY = 100 - ((point.liquidity - paddedMin) / (paddedMax - paddedMin)) * 100;
              
              // For the first point, we use M (move to), for others we use L (line to)
              return `${i === 0 ? 'M' : 'L'} ${x} ${normalizedY}`;
            }).join(' ') + 
              // Complete the path by drawing to the bottom right and bottom left corners
              ` L 100 100 L 0 100 Z`}
            fill="url(#liquidityGradient)"
            stroke="#5347EF"
            strokeWidth="2"
          />
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 inset-x-0 flex justify-between px-2">
          {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((item, index) => (
            <div key={index} className="text-[8px] text-muted-foreground">
              {item.date.slice(5)}
            </div>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute right-0 inset-y-0 flex flex-col justify-between pr-1 py-1 text-[8px] text-muted-foreground">
          <div>${paddedMax.toFixed(2)}</div>
          <div>${((paddedMax + paddedMin) / 2).toFixed(2)}</div>
          <div>${paddedMin.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
