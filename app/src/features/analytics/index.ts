/**
 * Analytics Feature - Barrel Export
 */

// Components
export { YieldChart } from './components/YieldChart';
export { PortfolioAllocation } from './components/PortfolioAllocation';
export { RiskDistribution } from './components/RiskDistribution';
export { PerformanceMetrics } from './components/PerformanceMetrics';

// Hooks
export { useAnalytics, useInvoiceAnalytics } from './hooks/useAnalytics';

// Types
export type {
  PortfolioAllocationData,
  RiskDistributionData,
  YieldDataPoint,
  PerformanceMetrics as PerformanceMetricsData,
} from './hooks/useAnalytics';
