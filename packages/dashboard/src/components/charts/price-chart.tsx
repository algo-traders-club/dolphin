"use client";

interface PriceChartProps {
  data: Array<{
    date: string;
    price: number;
  }>;
  height?: number;
}

export function PriceChart({ data, height = 300 }: PriceChartProps) {
  // Find min and max price for scaling
  const maxPrice = Math.max(...data.map(item => item.price));
  const minPrice = Math.min(...data.map(item => item.price));
  
  // Calculate price range with some padding
  const range = maxPrice - minPrice;
  const paddedMin = Math.max(0, minPrice - range * 0.1);
  const paddedMax = maxPrice + range * 0.1;
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        {data.length > 0 && (
          <>
            <div>Start: ${data[0].price.toFixed(3)}</div>
            <div>Current: ${data[data.length - 1].price.toFixed(3)}</div>
          </>
        )}
      </div>
      
      <div className="relative w-full h-[calc(100%-24px)] bg-background/50 rounded-md border border-accent/10">
        {/* Price bars */}
        <div className="absolute inset-0 flex items-end justify-between px-1">
          {data.map((item, index) => {
            // Calculate height percentage based on price
            const heightPercent = ((item.price - paddedMin) / (paddedMax - paddedMin)) * 100;
            
            // Calculate color based on trend
            const prevPrice = index > 0 ? data[index - 1].price : item.price;
            const isUp = item.price >= prevPrice;
            
            return (
              <div key={index} className="flex-1 mx-0.5 flex flex-col items-center">
                <div 
                  className={`w-full ${isUp ? 'bg-secondary' : 'bg-accent'}`}
                  style={{ height: `${heightPercent}%`, minHeight: '1px' }}
                ></div>
                {index % Math.ceil(data.length / 5) === 0 && (
                  <div className="text-[8px] text-muted-foreground mt-1 truncate w-full text-center">
                    {item.date.slice(5)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Price indicators */}
        <div className="absolute right-0 inset-y-0 flex flex-col justify-between pr-1 py-1 text-[8px] text-gray-500">
          <div>${paddedMax.toFixed(3)}</div>
          <div>${((paddedMax + paddedMin) / 2).toFixed(3)}</div>
          <div>${paddedMin.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
}
