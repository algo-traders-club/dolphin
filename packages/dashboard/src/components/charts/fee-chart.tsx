"use client";

interface FeeChartProps {
  data: Array<{
    period: string;
    fees: number;
  }>;
  height?: number;
}

export function FeeChart({ data, height = 300 }: FeeChartProps) {
  // Find max fee for scaling
  const maxFee = Math.max(...data.map(item => item.fees));
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <div>Period Fees</div>
        <div>Max: ${maxFee.toFixed(2)}</div>
      </div>
      
      <div className="relative w-full h-[calc(100%-24px)] bg-background/50 rounded-md border border-accent/10">
        {/* Fee bars */}
        <div className="absolute inset-0 flex items-end justify-between px-1 pb-6">
          {data.map((item, index) => {
            // Calculate height percentage based on fees
            const heightPercent = maxFee > 0 ? (item.fees / maxFee) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 mx-0.5 flex flex-col items-center">
                <div 
                  className="w-full bg-chart-4 rounded-t"
                  style={{ height: `${heightPercent}%`, minHeight: '1px' }}
                ></div>
                <div className="absolute bottom-1 text-[8px] text-muted-foreground mt-1 truncate w-full text-center" style={{ left: `${(100 / data.length) * index}%`, width: `${100 / data.length}%` }}>
                  {item.period}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Fee indicators */}
        <div className="absolute right-0 inset-y-0 flex flex-col justify-between pr-1 py-1 text-[8px] text-muted-foreground">
          <div>${maxFee.toFixed(2)}</div>
          <div>${(maxFee / 2).toFixed(2)}</div>
          <div>$0.00</div>
        </div>
      </div>
    </div>
  );
}
