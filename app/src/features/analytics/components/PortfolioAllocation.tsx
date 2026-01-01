'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import type { PortfolioAllocationData } from '../hooks/useAnalytics';

interface PortfolioAllocationProps {
  data: PortfolioAllocationData[];
  className?: string;
}

export function PortfolioAllocation({ data, className }: PortfolioAllocationProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    if (percent < 0.05) return null; // Hide labels for small slices

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--card-foreground))"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => {
          const item = data[index];
          return (
            <div key={`legend-${index}`} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.value}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">${item.value.toFixed(2)}</span>
                <span className="text-muted-foreground text-xs">
                  {item.apy.toFixed(1)}% APY
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className={`glass border-glass-border p-6 ${className || ''}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Portfolio Allocation</h3>
        <p className="text-sm text-muted-foreground">Distribution by strategy</p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No deposits yet
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                formatter={((value: number | undefined, name: string, props: any) =>
                  value !== undefined ? [
                    `$${value.toFixed(2)} (${((value / total) * 100).toFixed(1)}%)`,
                    props.payload.strategy,
                  ] : ['', '']
                ) as any}
              />
            </PieChart>
          </ResponsiveContainer>

          <Legend content={renderLegend} />
        </>
      )}
    </Card>
  );
}
