export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  high52: number;
  low52: number;
  region: "India" | "US" | "Global";
}

export interface SectorPerformance {
  sector: string;
  changePercent: number;
  trend: "Bullish" | "Neutral" | "Bearish";
  leadingStock: string;
}

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  sentimentScore: number; // 0 - 100
  relatedTickers: string[];
  relevanceToPortfolio: boolean;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  signal: "Buy" | "Hold" | "Trim";
}
