"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Holding } from "@/types/portfolio";
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Shield } from "lucide-react";

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>("All");
  const [sortField, setSortField] = useState<keyof Holding>("totalValue");
  const [sortAsc, setSortAsc] = useState(false);

  const assetClasses = ["All", ...Array.from(new Set(holdings.map((h) => h.assetClass)))];

  const handleSort = (field: keyof Holding) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredHoldings = holdings
    .filter((h) => {
      const matchesSearch =
        h.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.sector ? h.sector.toLowerCase().includes(searchTerm.toLowerCase()) : false);
      const matchesClass = selectedAssetClass === "All" || h.assetClass === selectedAssetClass;
      return matchesSearch && matchesClass;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Asset Positions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Holdings across equity, fixed income, sovereign debt, and commodities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticker, name, sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {assetClasses.map((ac) => (
              <motion.button
                key={ac}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAssetClass(ac)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedAssetClass === ac
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {ac}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort("symbol")}>
                <div className="flex items-center gap-1.5">
                  <span>Instrument / Asset</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort("assetClass")}>
                Asset Class
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort("shares")}>
                Shares
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort("avgPrice")}>
                Avg Price
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort("currentPrice")}>
                Market Price
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort("totalValue")}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Current Value</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort("unrealizedPnL")}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Unrealized P&L</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort("riskScore")}>
                Risk Guard
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredHoldings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No matching holdings found for the given criteria.
                </td>
              </tr>
            ) : (
              filteredHoldings.map((h) => {
                const isPositive = h.unrealizedPnL >= 0;
                return (
                  <motion.tr
                    key={h.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-default"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{h.symbol}</span>
                          {h.sector && <span className="text-[10px] text-slate-400 font-sans">({h.sector})</span>}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {h.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {h.assetClass}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {h.shares.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                      {formatINR(h.avgPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(h.currentPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(h.totalValue)}
                      <div className="text-[10px] font-normal text-slate-400">{h.allocationPercent}% NAV</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div
                        className={`flex items-center justify-end gap-1 font-bold ${
                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {isPositive ? "+" : ""}
                          {formatINR(h.unrealizedPnL)}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] ${
                          isPositive ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-rose-600/80 dark:text-rose-400/80"
                        }`}
                      >
                        ({isPositive ? "+" : ""}
                        {h.unrealizedPnLPercent}%)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          h.riskScore === "Low"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : h.riskScore === "Medium"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        {h.riskScore}
                      </span>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
