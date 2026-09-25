"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_WATCHLIST } from "@/lib/mock/market";
import { WatchlistItem } from "@/types/market";
import {
  Eye,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Bot,
  Filter,
  Check,
  X,
} from "lucide-react";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(MOCK_WATCHLIST);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSignal, setFilterSignal] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const filtered = watchlist.filter((item) => {
    const matchesSearch =
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSignal = filterSignal === "All" || item.signal === filterSignal;
    return matchesSearch && matchesSignal;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    const newItem: WatchlistItem = {
      symbol: newSymbol.trim().toUpperCase(),
      name: newName.trim() || newSymbol.trim().toUpperCase(),
      price: parseFloat(newPrice) || 1500,
      change: 12.5,
      changePercent: 0.85,
      volume: "1.2M",
      signal: "Buy",
    };

    setWatchlist([newItem, ...watchlist]);
    setNewSymbol("");
    setNewName("");
    setNewPrice("");
    setIsAddModalOpen(false);
  };

  const handleRemove = (symbol: string) => {
    setWatchlist(watchlist.filter((item) => item.symbol !== symbol));
  };

  return (
    <AppShell
      headerTitle="Institutional Watchlist"
      headerSubtitle="High-conviction liquid instruments monitored autonomously by Trading and Risk agents"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          {/* Signal Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {["All", "Buy", "Hold", "Trim"].map((sig) => (
              <button
                key={sig}
                onClick={() => setFilterSignal(sig)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterSignal === sig
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {sig === "All" ? "All Signals" : `${sig} Signals`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Symbol</span>
            </button>
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Instrument / Company</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Market Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">24h Movement</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Volume</th>
                  <th className="py-3.5 px-4 font-semibold text-center">AI Agent Signal</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => {
                  const isPositive = item.change >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                          {item.symbol}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {item.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                        ₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPositive ? "+" : ""}
                            {item.changePercent}%
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {isPositive ? "+" : ""}₹{item.change.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {item.volume}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.signal === "Buy"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : item.signal === "Trim"
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {item.signal}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/ask?q=Analyze%20${item.symbol}%20for%20risk%20and%20valuation`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold transition"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Ask FinOS</span>
                          </Link>
                          <button
                            onClick={() => handleRemove(item.symbol)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition"
                            title="Remove from watchlist"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Symbol Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Instrument to Watchlist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  FinOS Trading Agent will monitor tick flow and order book depth
                </p>
              </div>

              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ticker Symbol
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBIN, WIPRO, MSFT"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Instrument Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India Ltd"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 785.50"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                  >
                    Add to Watchlist
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
