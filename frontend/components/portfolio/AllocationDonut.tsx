"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { MOCK_ALLOCATIONS } from "@/lib/mock/portfolio";

export function AllocationDonut() {
  const total = MOCK_ALLOCATIONS.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Asset Allocation</span>
          <span className="text-xs font-mono font-normal text-slate-500">Target Rebalanced</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Multi-asset class weight distribution vs risk budget
        </p>
      </div>

      <div className="h-48 w-full my-2 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-lg text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                        {data.name}
                      </div>
                      <div className="mt-1 font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(data.value)} ({data.percentage}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={MOCK_ALLOCATIONS}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
            >
              {MOCK_ALLOCATIONS.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total NAV</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
            ₹{(total / 100000).toFixed(1)}L
          </span>
        </div>
      </div>

      {/* Breakdown list */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {MOCK_ALLOCATIONS.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-500 dark:text-slate-400">{formatCurrency(item.value)}</span>
              <span className="font-bold text-slate-900 dark:text-white w-12 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
