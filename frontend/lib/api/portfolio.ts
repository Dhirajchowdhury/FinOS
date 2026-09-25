import { PortfolioSummary, Holding, AssetAllocation, PerformancePoint } from "@/types/portfolio";
import {
  MOCK_PORTFOLIO_SUMMARY,
  MOCK_HOLDINGS,
  MOCK_ALLOCATIONS,
  MOCK_PERFORMANCE_HISTORY,
} from "@/lib/mock/portfolio";

export const portfolioApi = {
  /**
   * Fetch portfolio executive overview and risk KPIs.
   */
  async getSummary(): Promise<PortfolioSummary> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...MOCK_PORTFOLIO_SUMMARY }), 100);
    });
  },

  /**
   * Fetch all portfolio holdings and positions.
   */
  async getHoldings(): Promise<Holding[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_HOLDINGS]), 120);
    });
  },

  /**
   * Fetch current asset allocation breakdown.
   */
  async getAllocations(): Promise<AssetAllocation[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_ALLOCATIONS]), 100);
    });
  },

  /**
   * Fetch historical NAV performance for a specific timeframe.
   */
  async getPerformanceHistory(timeframe: string = "1M"): Promise<PerformancePoint[]> {
    const data = MOCK_PERFORMANCE_HISTORY[timeframe] || MOCK_PERFORMANCE_HISTORY["1M"];
    return new Promise((resolve) => {
      setTimeout(() => resolve([...data]), 120);
    });
  },
};
