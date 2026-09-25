"use client";

import React, { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatIndian?: boolean;
  className?: string;
}

export function AnimatedNumber({
  value,
  durationMs = 800,
  prefix = "",
  suffix = "",
  decimals = 0,
  formatIndian = false,
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const startTimestampRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const startVal = startValueRef.current;
    const endVal = value;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const progress = Math.min((timestamp - startTimestampRef.current) / durationMs, 1);

      // easeOutExpo curve
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + (endVal - startVal) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        startValueRef.current = endVal;
        startTimestampRef.current = null;
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, durationMs, shouldReduceMotion]);

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals);
    if (formatIndian) {
      const parts = fixed.split(".");
      const intPart = parseInt(parts[0], 10).toLocaleString("en-IN");
      return parts.length > 1 && decimals > 0 ? `${intPart}.${parts[1]}` : intPart;
    }
    return decimals > 0
      ? parseFloat(fixed).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(num).toLocaleString();
  };

  return (
    <span className={className}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}
