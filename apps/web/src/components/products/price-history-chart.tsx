"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

interface HistoryDataPoint {
  recordedAt: Date;
  supermarketId: number;
  sellingPrice: number;
  listPrice: number;
  isAvailable: boolean;
}

interface PriceHistoryChartProps {
  data: Record<number, HistoryDataPoint[]>;
  supermarkets: Array<{ id: number; name: string }>;
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

const supermarketColors: Record<string, string> = {
  "Carrefour": "#1E40AF", // blue-800
  "Jumbo": "#16A34A",      // green-600
  "Disco": "#DC2626",      // red-600
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
        <p className="font-semibold">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color as string }}
              />
              <span className="text-sm capitalize">
                {entry.name}: ${Number(entry.value).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function PriceHistoryChart({ data, supermarkets }: PriceHistoryChartProps) {
  const [days, setDays] = useState<number>(30);
  
  // Transform data for the chart
  const chartData = useMemo(() => {
    // Flatten all data points and group by date
    const allPoints: HistoryDataPoint[] = [];
    Object.values(data).forEach(points => {
      allPoints.push(...points);
    });
    
    // Group by date
    const groupedByDate: Record<string, Record<string, number>> = {};
    
    allPoints.forEach(point => {
      const dateStr = new Date(point.recordedAt).toLocaleDateString("es-AR");
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {};
      }
      
      const supermarket = supermarkets.find(s => s.id === point.supermarketId);
      if (supermarket) {
        groupedByDate[dateStr][supermarket.name] = point.sellingPrice;
      }
    });
    
    // Convert to chart format
    return Object.entries(groupedByDate).map(([date, prices]) => ({
      date,
      ...prices
    }));
  }, [data, supermarkets]);
  
  // Get unique supermarket names for chart lines
  const supermarketNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(data).forEach(points => {
      points.forEach(point => {
        const supermarket = supermarkets.find(s => s.id === point.supermarketId);
        if (supermarket) {
          names.add(supermarket.name);
        }
      });
    });
    return Array.from(names);
  }, [data, supermarkets]);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <div className="flex space-x-2">
          {[7, 15, 30, 60, 90].map((day) => (
            <button
              key={day}
              onClick={() => setDays(day)}
              className={`px-3 py-1 rounded ${
                days === day
                  ? "bg-blue-600 text-white"
                 : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {day}d
            </button>
          ))}
        </div>
      </div>
      
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // Format date as DD/MM
                const parts = value.split("/");
                return `${parts[0]}/${parts[1]}`;
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toLocaleString("es-AR")}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {supermarketNames.map((name) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={supermarketColors[name] || "#888888"}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}