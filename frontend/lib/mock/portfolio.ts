import { PortfolioSummary, Holding, AssetAllocation, PerformancePoint } from "@/types/portfolio";

export const MOCK_HOLDINGS: Holding[] = [];

export const MOCK_ALLOCATIONS: AssetAllocation[] = [];

export const MOCK_PERFORMANCE_HISTORY: Record<string, PerformancePoint[]> = {
  "1M": [],
  "3M": [],
  "1Y": [],
  ALL: [],
};

export const MOCK_PORTFOLIO_SUMMARY: PortfolioSummary = {
  totalValue: 0,
  dayChange: 0,
  dayChangePercent: 0,
  totalReturn: 0,
  totalReturnPercent: 0,
  cashBalance: 0,
  investedBalance: 0,
  currency: "INR (₹)",
  lastUpdated: "Data unavailable",
  riskMetrics: {
    sharpeRatio: 0,
    sortinoRatio: 0,
    beta: 0,
    valueAtRisk95: "N/A",
    maxDrawdown: "N/A",
    annualizedVolatility: "N/A",
  },
};

