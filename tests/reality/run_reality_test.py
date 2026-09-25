"""CLI runner for the FinOS Reality Test Harness."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from dotenv import load_dotenv

from tests.reality.harness import RealityTestHarness


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Run FinOS Reality Test Harness on an asset symbol.")
    parser.add_argument("--symbol", type=str, default="RELIANCE.NS", help="Ticker symbol (default: RELIANCE.NS)")
    parser.add_argument("--as-of-date", type=str, default="2026-09-25", help="As-of date (YYYY-MM-DD)")
    parser.add_argument("--request", type=str, default="Perform a complete financial analysis.", help="Request prompt")
    parser.add_argument("--output-dir", type=str, default=".", help="Directory to save report files")

    args = parser.parse_args()

    harness = RealityTestHarness(output_dir=args.output_dir)
    print(f"Starting FinOS Reality Test Harness for symbol: {args.symbol} (As-of: {args.as_of_date})...")
    
    report = harness.run_validation(symbol=args.symbol, as_of_date=args.as_of_date, request=args.request)
    
    summary = report["overall_summary"]
    print("\n==========================================")
    print("FINOS REALITY TEST COMPLETE")
    print("==========================================")
    print(f"Symbol Tested:       {args.symbol}")
    print(f"Total Agents Tested: {summary['total_agents']}")
    print(f"Status Counts:       {summary['status_counts']}")
    print(f"Execution Time:      {summary['total_execution_time_ms']:.2f} ms")
    print(f"Reports Generated:   reality_test_report.json, REALITY_TEST_REPORT.md")
    print("==========================================\n")


if __name__ == "__main__":
    main()
