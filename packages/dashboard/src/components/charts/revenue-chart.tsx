"use client"

import * as React from "react"

interface RevenueChartProps {
  data: Array<{
    day?: string
    month?: string
    fees: number
  }>
  height?: number
  barColor?: string
}

export function RevenueChart({ data, height = 300, barColor = "#3b82f6" }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center w-full h-full border border-dashed rounded-md"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.fees))
  const normalizedData = data.map(item => ({
    ...item,
    normalizedValue: maxValue > 0 ? (item.fees / maxValue) * 0.9 : 0 // 90% of height max to leave room for labels
  }))

  return (
    <div className="w-full h-full" style={{ height }}>
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-end">
          <div className="w-full h-full flex items-end">
            {normalizedData.map((item, index) => {
              const label = item.day || item.month || `Item ${index}`
              const heightPercent = item.normalizedValue * 100
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-end h-full flex-1"
                >
                  <div className="w-full px-1 flex flex-col items-center">
                    <div 
                      className="w-full rounded-t-sm transition-all duration-300"
                      style={{ 
                        height: `${heightPercent}%`,
                        backgroundColor: barColor,
                        minHeight: item.fees > 0 ? '4px' : '0'
                      }}
                    />
                    <div className="mt-2 text-xs text-muted-foreground truncate w-full text-center">
                      {label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="h-6 flex justify-between items-center px-2 text-xs text-muted-foreground">
          <div>$0</div>
          <div>${maxValue.toFixed(3)}</div>
        </div>
      </div>
    </div>
  )
}
