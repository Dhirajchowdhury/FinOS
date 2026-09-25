from typing import Annotated

import pandas as pd
import yfinance as yf

from tradingagents.dataflows.date_window import withhold_live_profile
from tradingagents.dataflows.errors import NoMarketDataError, VendorError, VendorRateLimitError
from tradingagents.dataflows.net import vendor_reachable
from tradingagents.dataflows.symbols import normalize_symbol
from tradingagents.dataflows.vendors.yahoo.ohlcv import (
    YAHOO_HOST,
    raise_for_empty,
    yf_retry,
)


def get_fundamentals(
    ticker: Annotated[str, "ticker symbol of the company"],
    curr_date: Annotated[str, "analysis date in YYYY-MM-DD format"] = None
):
    """Get company fundamentals overview from yfinance.

    ``Ticker.info`` is a present-day snapshot with no historical vintage, so a
    past ``curr_date`` withholds it through the shared point-in-time guard
    (``date_window.withhold_live_profile``, #1300).
    """
    canonical = normalize_symbol(ticker)

    # Guard before the request: the response would only be discarded, and the
    # answer does not depend on it.
    withheld = withhold_live_profile(curr_date, canonical)
    if withheld:
        return withheld

    try:
        ticker_obj = yf.Ticker(canonical)
        info = yf_retry(lambda: ticker_obj.info)

        if not info:
            raise_for_empty(ticker, canonical, "fundamentals")

        fields = [
            ("Name", info.get("longName")),
            ("Sector", info.get("sector")),
            ("Industry", info.get("industry")),
            ("Market Cap", info.get("marketCap")),
            ("PE Ratio (TTM)", info.get("trailingPE")),
            ("Forward PE", info.get("forwardPE")),
            ("PEG Ratio", info.get("pegRatio")),
            ("Price to Book", info.get("priceToBook")),
            ("EPS (TTM)", info.get("trailingEps")),
            ("Forward EPS", info.get("forwardEps")),
            ("Dividend Yield", info.get("dividendYield")),
            ("Beta", info.get("beta")),
            ("52 Week High", info.get("fiftyTwoWeekHigh")),
            ("52 Week Low", info.get("fiftyTwoWeekLow")),
            ("50 Day Average", info.get("fiftyDayAverage")),
            ("200 Day Average", info.get("twoHundredDayAverage")),
            ("Revenue (TTM)", info.get("totalRevenue")),
            ("Gross Profit", info.get("grossProfits")),
            ("EBITDA", info.get("ebitda")),
            ("Net Income", info.get("netIncomeToCommon")),
            ("Profit Margin", info.get("profitMargins")),
            ("Operating Margin", info.get("operatingMargins")),
            ("Return on Equity", info.get("returnOnEquity")),
            ("Return on Assets", info.get("returnOnAssets")),
            ("Debt to Equity", info.get("debtToEquity")),
            ("Current Ratio", info.get("currentRatio")),
            ("Book Value", info.get("bookValue")),
            ("Free Cash Flow", info.get("freeCashflow")),
        ]

        lines = [f"{label}: {v}" for label, v in fields if v is not None]

        # yfinance returns a stub dict (e.g. {"trailingPegRatio": None}) for
        # unknown symbols, so `info` is truthy but every field is empty. Treat
        # "no usable fields" as no data rather than emitting a bare header the
        # agent might fabricate around.
        if not lines:
            raise NoMarketDataError(ticker, canonical, "no fundamental fields returned")

        header = f"# Company Fundamentals for {canonical}\n\n"

        return header + "\n".join(lines)

    except VendorError:
        raise
    except Exception as e:
        raise NoMarketDataError(ticker, canonical, f"fundamentals unavailable: {e}") from e


# This vendor dates a statement by the period it covers, not by the day it was
# filed, and carries no filing date to do better. A company files weeks after its
# period ends, so a run dated in that gap can be served figures that were not yet
# public. Say so rather than implying the stricter guarantee (SEC EDGAR, which
# does carry filing dates, serves US filers as filed).
_PERIOD_END_VINTAGE = (
    "# Periods are cut at the fiscal period end; this vendor does not report "
    "filing dates, so the most recent period may not have been published yet.\n\n"
)


def _statement(ticker, freq, curr_date, title, quarterly_attr, annual_attr) -> str:
    """One financial statement as CSV, cut at ``curr_date`` by period end."""
    canonical = normalize_symbol(ticker)
    what = title.lower()
    try:
        ticker_obj = yf.Ticker(canonical)
        attr = quarterly_attr if freq.lower() == "quarterly" else annual_attr
        data = filter_financials_by_date(yf_retry(lambda: getattr(ticker_obj, attr)), curr_date)
        if data.empty:
            raise_for_empty(ticker, canonical, f"{what} data")
        return f"# {title} data for {canonical} ({freq})\n" + _PERIOD_END_VINTAGE + data.to_csv()
    except VendorError:
        raise
    except Exception as e:
        raise NoMarketDataError(ticker, canonical, f"{what} unavailable: {e}") from e


def get_balance_sheet(
    ticker: Annotated[str, "ticker symbol of the company"],
    freq: Annotated[str, "frequency of data: 'annual' or 'quarterly'"] = "quarterly",
    curr_date: Annotated[str, "current date in YYYY-MM-DD format"] = None
):
    """Get balance sheet data from yfinance."""
    return _statement(ticker, freq, curr_date, "Balance Sheet", "quarterly_balance_sheet", "balance_sheet")


def get_cashflow(
    ticker: Annotated[str, "ticker symbol of the company"],
    freq: Annotated[str, "frequency of data: 'annual' or 'quarterly'"] = "quarterly",
    curr_date: Annotated[str, "current date in YYYY-MM-DD format"] = None
):
    """Get cash flow data from yfinance."""
    return _statement(ticker, freq, curr_date, "Cash Flow", "quarterly_cashflow", "cashflow")


def get_income_statement(
    ticker: Annotated[str, "ticker symbol of the company"],
    freq: Annotated[str, "frequency of data: 'annual' or 'quarterly'"] = "quarterly",
    curr_date: Annotated[str, "current date in YYYY-MM-DD format"] = None
):
    """Get income statement data from yfinance."""
    return _statement(ticker, freq, curr_date, "Income Statement", "quarterly_income_stmt", "income_stmt")


# Rows are dated by the transaction, which is when the insider traded, not when
# the market learned of it: a Form 4 is filed up to two business days later and
# this vendor reports no filing date, so the most recent rows may not have been
# public on the analysis date.
_TRANSACTION_DATE_VINTAGE = (
    "# Rows are dated by transaction date. A trade becomes public when its Form 4 "
    "is filed, up to two business days later, so the newest rows may not have been "
    "known on this date.\n\n"
)


def get_insider_transactions(
    ticker: Annotated[str, "ticker symbol of the company"],
    curr_date: Annotated[str | None, "only transactions on or before this date, yyyy-mm-dd"] = None,
):
    """Get insider transactions data from yfinance."""
    canonical = normalize_symbol(ticker)
    try:
        ticker_obj = yf.Ticker(canonical)
        data = yf_retry(lambda: ticker_obj.insider_transactions)

        # Empty is normal here (many valid symbols have no insider filings),
        # so report it plainly rather than treating the symbol as invalid.
        if data is None or data.empty:
            if not vendor_reachable(YAHOO_HOST):
                raise VendorRateLimitError("Yahoo Finance is unreachable; insider filings were not retrieved")
            return f"No insider transactions reported for symbol '{canonical}'"

        if curr_date:
            traded = data["Start Date"]
            kept = data[traded <= pd.Timestamp(curr_date)]
            if kept.empty:
                return (
                    f"<insider transactions unavailable for {canonical} as of {curr_date}: "
                    "Yahoo serves recent transactions only>"
                )
            data = kept

        return f"# Insider Transactions data for {canonical}\n" + _TRANSACTION_DATE_VINTAGE + data.to_csv()

    except VendorError:
        raise
    except Exception as e:
        raise NoMarketDataError(ticker, canonical, f"insider transactions unavailable: {e}") from e


def get_company_profile(ticker: str) -> dict:
    """Yahoo's current profile for ``ticker``: name, sector, industry and the like."""
    canonical = normalize_symbol(ticker)
    try:
        return yf_retry(lambda: yf.Ticker(canonical).info) or {}
    except Exception as e:
        raise NoMarketDataError(ticker, canonical, f"profile unavailable: {e}") from e


def filter_financials_by_date(data: pd.DataFrame, curr_date: str) -> pd.DataFrame:
    """Drop financial statement columns (fiscal period timestamps) after curr_date.

    yfinance financial statements use fiscal period end dates as columns.
    Columns after curr_date represent future data and are removed to
    prevent look-ahead bias.
    """
    if not curr_date or data is None or data.empty:
        return data
    cutoff = pd.Timestamp(curr_date)
    mask = pd.to_datetime(data.columns, errors="coerce") <= cutoff
    return data.loc[:, mask]


def get_normalized_financials(
    ticker: Annotated[str, "ticker symbol of the company"],
    curr_date: Annotated[str, "analysis date in YYYY-MM-DD format"] = None
) -> dict:
    """Get structured normalized financial metrics for credit analysis and valuation.

    Extracts revenue, operating income, ebitda, total debt, cash, interest expense,
    equity, current assets, current liabilities, fiscal period, and currency from
    yfinance financial statements and info, respecting point-in-time cutoffs.

    Returns a dict with normalized numbers, TTM aggregates, and field status tracking:
    'REAL', 'DERIVED_FROM_REAL_DATA', or 'MISSING'.
    """
    canonical = normalize_symbol(ticker)

    result = {
        "revenue": None,
        "revenue_ttm": None,
        "operating_income": None,
        "operating_income_ttm": None,
        "ebitda": None,
        "ebitda_ttm": None,
        "total_debt": None,
        "cash": None,
        "interest_expense": None,
        "interest_expense_ttm": None,
        "equity": None,
        "current_assets": None,
        "current_liabilities": None,
        "fiscal_period": None,
        "currency": None,
        "source": "yfinance",
        "field_status": {
            "revenue": "MISSING",
            "operating_income": "MISSING",
            "ebitda": "MISSING",
            "total_debt": "MISSING",
            "cash": "MISSING",
            "interest_expense": "MISSING",
            "equity": "MISSING",
            "current_assets": "MISSING",
            "current_liabilities": "MISSING",
        }
    }

    try:
        ticker_obj = yf.Ticker(canonical)
        info = yf_retry(lambda: ticker_obj.info) or {}
        if isinstance(info, dict):
            result["currency"] = info.get("financialCurrency") or info.get("currency")
    except Exception:
        info = {}

    try:
        ticker_obj = yf.Ticker(canonical)
        inc_df = filter_financials_by_date(yf_retry(lambda: ticker_obj.quarterly_income_stmt), curr_date)
        if inc_df is None or inc_df.empty:
            inc_df = filter_financials_by_date(yf_retry(lambda: ticker_obj.income_stmt), curr_date)
    except Exception:
        inc_df = pd.DataFrame()

    try:
        ticker_obj = yf.Ticker(canonical)
        bs_df = filter_financials_by_date(yf_retry(lambda: ticker_obj.quarterly_balance_sheet), curr_date)
        if bs_df is None or bs_df.empty:
            bs_df = filter_financials_by_date(yf_retry(lambda: ticker_obj.balance_sheet), curr_date)
    except Exception:
        bs_df = pd.DataFrame()

    inc_cols = []
    if inc_df is not None and not inc_df.empty:
        inc_cols = sorted(inc_df.columns, reverse=True)
        if inc_cols:
            latest_inc_col = inc_cols[0]
            result["fiscal_period"] = str(latest_inc_col.date()) if hasattr(latest_inc_col, "date") else str(latest_inc_col)

    bs_cols = []
    if bs_df is not None and not bs_df.empty:
        bs_cols = sorted(bs_df.columns, reverse=True)
        if bs_cols:
            latest_bs_col = bs_cols[0]
            if not result["fiscal_period"]:
                result["fiscal_period"] = str(latest_bs_col.date()) if hasattr(latest_bs_col, "date") else str(latest_bs_col)

    def get_row_val(df, col, candidates):
        if df is None or df.empty or col is None or col not in df.columns:
            return None
        for name in candidates:
            if name in df.index:
                val = df.loc[name, col]
                if pd.notna(val):
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        pass
        return None

    def get_ttm_val(df, cols, candidates):
        if df is None or df.empty or not cols:
            return None, 0
        recent_cols = cols[:4]
        vals = []
        for col in recent_cols:
            v = get_row_val(df, col, candidates)
            if v is not None:
                vals.append(v)
        if not vals:
            return None, 0
        if len(vals) == 4:
            return sum(vals), 4
        return (sum(vals) / len(vals)) * 4.0, len(vals)

    inc_col = inc_cols[0] if inc_cols else None
    bs_col = bs_cols[0] if bs_cols else None

    # 1. Revenue
    rev = get_row_val(inc_df, inc_col, ["Total Revenue", "Operating Revenue"])
    rev_ttm, _ = get_ttm_val(inc_df, inc_cols, ["Total Revenue", "Operating Revenue"])
    if rev is not None:
        result["revenue"] = rev
        result["revenue_ttm"] = rev_ttm or (rev * 4.0)
        result["field_status"]["revenue"] = "REAL"
    elif info.get("totalRevenue") is not None and not withhold_live_profile(curr_date, canonical):
        result["revenue"] = float(info["totalRevenue"])
        result["revenue_ttm"] = float(info["totalRevenue"])
        result["field_status"]["revenue"] = "REAL"

    # 2. Operating Income
    op_inc = get_row_val(inc_df, inc_col, ["Operating Income", "EBIT"])
    op_inc_ttm, _ = get_ttm_val(inc_df, inc_cols, ["Operating Income", "EBIT"])
    if op_inc is not None:
        result["operating_income"] = op_inc
        result["operating_income_ttm"] = op_inc_ttm or (op_inc * 4.0)
        result["field_status"]["operating_income"] = "REAL"

    # 3. EBITDA
    ebitda = get_row_val(inc_df, inc_col, ["EBITDA", "Normalized EBITDA"])
    ebitda_ttm, _ = get_ttm_val(inc_df, inc_cols, ["EBITDA", "Normalized EBITDA"])
    if ebitda is not None:
        result["ebitda"] = ebitda
        result["ebitda_ttm"] = ebitda_ttm or (ebitda * 4.0)
        result["field_status"]["ebitda"] = "REAL"
    else:
        deprec = get_row_val(inc_df, inc_col, [
            "Reconciled Depreciation",
            "Depreciation And Amortization",
            "Depreciation & Amortization",
            "Depreciation Amortization Depletion"
        ])
        if op_inc is not None and deprec is not None:
            result["ebitda"] = op_inc + deprec
            deprec_ttm, _ = get_ttm_val(inc_df, inc_cols, [
                "Reconciled Depreciation",
                "Depreciation And Amortization",
                "Depreciation & Amortization",
                "Depreciation Amortization Depletion"
            ])
            if op_inc_ttm is not None and deprec_ttm is not None:
                result["ebitda_ttm"] = op_inc_ttm + deprec_ttm
            else:
                result["ebitda_ttm"] = (op_inc + deprec) * 4.0
            result["field_status"]["ebitda"] = "DERIVED_FROM_REAL_DATA"
        elif info.get("ebitda") is not None and not withhold_live_profile(curr_date, canonical):
            result["ebitda"] = float(info["ebitda"])
            result["ebitda_ttm"] = float(info["ebitda"])
            result["field_status"]["ebitda"] = "REAL"

    # 4. Interest Expense
    int_exp = get_row_val(inc_df, inc_col, [
        "Interest Expense",
        "Interest Expense Non Operating",
        "Net Non Operating Interest Income Expense"
    ])
    int_exp_ttm, _ = get_ttm_val(inc_df, inc_cols, [
        "Interest Expense",
        "Interest Expense Non Operating",
        "Net Non Operating Interest Income Expense"
    ])
    if int_exp is not None:
        result["interest_expense"] = abs(int_exp)
        result["interest_expense_ttm"] = abs(int_exp_ttm) if int_exp_ttm is not None else abs(int_exp) * 4.0
        result["field_status"]["interest_expense"] = "REAL"

    # 5. Total Debt
    tot_debt = get_row_val(bs_df, bs_col, ["Total Debt"])
    if tot_debt is not None:
        result["total_debt"] = tot_debt
        result["field_status"]["total_debt"] = "REAL"
    else:
        lt_debt = get_row_val(bs_df, bs_col, ["Long Term Debt", "Long Term Debt And Capital Lease Obligation"])
        st_debt = get_row_val(bs_df, bs_col, ["Current Debt", "Current Debt And Capital Lease Obligation", "Commercial Paper"])
        if lt_debt is not None or st_debt is not None:
            result["total_debt"] = (lt_debt or 0.0) + (st_debt or 0.0)
            result["field_status"]["total_debt"] = "DERIVED_FROM_REAL_DATA"

    # 6. Cash
    cash = get_row_val(bs_df, bs_col, [
        "Cash And Cash Equivalents",
        "Cash Financial",
        "Cash Cash Equivalents And Short Term Investments"
    ])
    if cash is not None:
        result["cash"] = cash
        result["field_status"]["cash"] = "REAL"

    # 7. Equity
    eq = get_row_val(bs_df, bs_col, ["Stockholders Equity", "Total Equity Gross Minority Interest", "Common Stock Equity"])
    if eq is not None:
        result["equity"] = eq
        result["field_status"]["equity"] = "REAL"

    # 8. Current Assets
    ca = get_row_val(bs_df, bs_col, ["Current Assets"])
    if ca is not None:
        result["current_assets"] = ca
        result["field_status"]["current_assets"] = "REAL"

    # 9. Current Liabilities
    cl = get_row_val(bs_df, bs_col, ["Current Liabilities"])
    if cl is not None:
        result["current_liabilities"] = cl
        result["field_status"]["current_liabilities"] = "REAL"

    has_any = any(v is not None for k, v in result.items() if k in result["field_status"])
    if not has_any:
        raise NoMarketDataError(ticker, canonical, "no normalized financial metrics available")

    return result

