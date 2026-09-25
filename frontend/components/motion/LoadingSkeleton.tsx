"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/60 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <Skeleton className="w-16 h-4 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-3/4 h-5 rounded-md" />
        <Skeleton className="w-full h-3 rounded-md" />
        <Skeleton className="w-2/3 h-3 rounded-md" />
      </div>
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <Skeleton className="w-20 h-4 rounded-md" />
        <Skeleton className="w-4 h-4 rounded-md" />
      </div>
    </div>
  );
}
