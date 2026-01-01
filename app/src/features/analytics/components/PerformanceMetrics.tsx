'use client';

import { TrendingUp, DollarSign, Percent, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { PerformanceMetrics as PerformanceMetricsType } from '../hooks/useAnalytics';

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  className?: string;
}

function MetricCard({ title, value, subtitle, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={`glass border-glass-border p-6 ${className || ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold mb-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`w-3 h-3 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}
              />
              <span
                className={`text-xs font-medium ${
                  trend >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>
      </div>
    </Card>
  );
}

export function PerformanceMetrics({ metrics, className }: PerformanceMetricsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`}>
      <MetricCard
        title="Total Deposited"
        value={`$${Number(metrics.totalDeposited).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        subtitle="Across all strategies"
        icon={<DollarSign className="w-5 h-5" />}
        trend={12.5}
      />

      <MetricCard
        title="Total Yield Earned"
        value={`$${Number(metrics.totalYield).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        subtitle="Lifetime earnings"
        icon={<TrendingUp className="w-5 h-5" />}
        trend={8.3}
      />

      <MetricCard
        title="Average APY"
        value={`${metrics.averageAPY.toFixed(2)}%`}
        subtitle="Weighted across portfolio"
        icon={<Percent className="w-5 h-5" />}
      />

      <MetricCard
        title="Active Invoices"
        value={metrics.activeInvoices.toString()}
        subtitle="Currently deposited"
        icon={<FileText className="w-5 h-5" />}
      />
    </div>
  );
}
