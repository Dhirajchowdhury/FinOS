import { MarketIndex, SectorPerformance, MarketNewsItem, WatchlistItem } from "@/types/market";
import { MOCK_INDICES, MOCK_SECTORS, MOCK_NEWS, MOCK_WATCHLIST } from "@/lib/mock/market";

export const marketApi = {
  /**
   * Fetch real-time market indices (NIFTY 50, SENSEX, NASDAQ, S&P 500).
   */
  async getIndices(): Promise<MarketIndex[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_INDICES]), 100);
    });
  },

  /**
   * Fetch sector performance and momentum leaders.
   */
  async getSectors(): Promise<SectorPerformance[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_SECTORS]), 100);
    });
  },

  /**
   * Fetch curated market news and sentiment tags.
   */
  async getNews(): Promise<MarketNewsItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_NEWS]), 120);
    });
  },

  /**
   * Fetch user watchlist items.
   */
  async getWatchlist(): Promise<WatchlistItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_WATCHLIST]), 100);
    });
  },
};
