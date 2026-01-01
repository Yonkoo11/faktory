'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import type { YieldDataPoint } from '../hooks/useAnalytics';

interface YieldChartProps {
  data: YieldDataPoint[];
  className?: string;
}

type TimeRange = '7D' | '30D' | '90D' | 'ALL';

export function YieldChart({ data, className }: YieldChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');

  const filteredData = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '7D': 7 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000,
      '90D': 90 * 24 * 60 * 60 * 1000,
      'ALL': Infinity,
    };

    const cutoff = now - ranges[timeRange];
    return data.filter(point => point.timestamp >= cutoff);
  }, [data, timeRange]);

  const ranges: TimeRange[] = ['7D', '30D', '90D', 'ALL'];

  return (
    <Card className={`glass border-glass-border p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Yield Over Time</h3>
          <p className="text-sm text-muted-foreground">Cumulative yield accumulation</p>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {ranges.map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={`Show ${range} data`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={((value: number | undefined) => value !== undefined ? [`$${value.toFixed(2)}`, ''] : ['', '']) as any}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
            name="Total Yield"
          />
          <Line
            type="monotone"
            dataKey="yield"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            name="Daily Yield"
            opacity={0.6}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
