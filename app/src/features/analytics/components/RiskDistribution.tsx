'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import type { RiskDistributionData } from '../hooks/useAnalytics';

interface RiskDistributionProps {
  data: RiskDistributionData[];
  className?: string;
}

export function RiskDistribution({ data, className }: RiskDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={`glass border-glass-border p-6 ${className || ''}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Risk Distribution</h3>
        <p className="text-sm text-muted-foreground">
          Invoices by risk score range
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="range"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Risk Score Range', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={((value: number | undefined, name: string, props: any) =>
              value !== undefined ? [
                `${value} invoices (${((value / total) * 100).toFixed(1)}%)`,
                'Count',
              ] : ['', '']
            ) as any}
            labelFormatter={(label) => `Risk Score: ${label}`}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[hsl(0_84.2%_60.2%)]" />
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[hsl(48_96%_53%)]" />
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[hsl(142.1_70.6%_45.3%)]" />
          <span>Low Risk</span>
        </div>
      </div>
    </Card>
  );
}
