export type AssetClass =
  | "Equities"
  | "Fixed Income"
  | "Commodities"
  | "Real Estate"
  | "Cash & Equivalents"
  | "Alternative Assets";

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  allocationPercent: number;
  riskScore: "Low" | "Medium" | "High";
  sector?: string;
}

export interface AssetAllocation {
  name: AssetClass;
  value: number;
  percentage: number;
  color: string;
}

export interface PerformancePoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

export interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  beta: number;
  valueAtRisk95: string;
  maxDrawdown: string;
  annualizedVolatility: string;
}

export interface PortfolioSummary {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  cashBalance: number;
  investedBalance: number;
  currency: string;
  lastUpdated: string;
  riskMetrics: RiskMetrics;
}
