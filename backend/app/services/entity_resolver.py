"""Robust Dynamic Entity Resolver for FinOS.

Implements multi-stage entity resolution priority:
1. Explicit Ticker Detection (e.g. RELIANCE.NS, TCS.NS, VEDL.NS, AAPL)
2. Yahoo Finance Search (yf.Search)
3. Dhan Instrument Master Fallback (with candidate Yahoo conversion & validation)
4. Ambiguity / Unresolved Handling (returns None - NEVER defaults to RELIANCE.NS)
"""

import re
import csv
import io
import time
import urllib.request
from typing import Optional, Dict, Any, List, Tuple
import yfinance as yf

# In-memory cache for Dhan instrument master CSV data
_DHAN_MASTER_CACHE: List[Dict[str, str]] = []
_DHAN_CACHE_TIMESTAMP: float = 0
_DHAN_CACHE_TTL_SECONDS: float = 86400  # 24 hours


def fetch_dhan_scrip_master() -> List[Dict[str, str]]:
    """Fetches and caches the Dhan scrip master CSV reference data."""
    global _DHAN_MASTER_CACHE, _DHAN_CACHE_TIMESTAMP
    now = time.time()
    if _DHAN_MASTER_CACHE and (now - _DHAN_CACHE_TIMESTAMP) < _DHAN_CACHE_TTL_SECONDS:
        return _DHAN_MASTER_CACHE

    url = "https://images.dhan.co/api-data/api-scrip-master.csv"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "FinOS-EntityResolver/1.0"})
        with urllib.request.urlopen(req, timeout=8) as res:
            raw_text = res.read().decode("utf-8", errors="ignore")
            reader = csv.DictReader(io.StringIO(raw_text))
            scrips = []
            for row in reader:
                exch = row.get("SEM_EXM_EXCH_ID", "")
                inst_type = row.get("SEM_INSTRUMENT_NAME", "")
                series = row.get("SEM_SERIES", "")
                if exch in ("NSE", "BSE") and (series == "EQ" or inst_type == "EQUITY"):
                    scrips.append(row)
            _DHAN_MASTER_CACHE = scrips
            _DHAN_CACHE_TIMESTAMP = now
            return scrips
    except Exception:
        return _DHAN_MASTER_CACHE if _DHAN_MASTER_CACHE else []


def validate_yahoo_ticker(symbol: str) -> bool:
    """Validates if a Yahoo symbol resolves to a real active instrument."""
    if not symbol:
        return False
    try:
        t = yf.Ticker(symbol)
        fi = getattr(t, "fast_info", None)
        if fi and (getattr(fi, "last_price", None) is not None or getattr(fi, "currency", None) is not None):
            return True
        df = t.history(period="1d")
        return not df.empty
    except Exception:
        return False


def extract_explicit_ticker(prompt: str) -> Optional[str]:
    """Extracts explicit ticker symbols (e.g. RELIANCE.NS, VEDL.NS, TCS.NS, AAPL)."""
    if not prompt:
        return None

    cleaned = prompt.strip()
    upper = cleaned.upper()

    # Match explicit ticker with exchange suffix
    match = re.search(r'\b([A-Z0-9]{1,12}\.(?:NS|BO|O|K|L|TO|AX|SS|SZ|SA))\b', upper)
    if match:
        return match.group(1)

    # Check for direct standalone ticker format
    tokens = [t.strip(",.!?\"'") for t in upper.split()]
    for token in tokens:
        if token.endswith(".NS") or token.endswith(".BO"):
            return token

    return None


def search_yahoo_finance(query: str, market: str = "NSE India") -> Optional[str]:
    """Searches Yahoo Finance for equity candidates matching query prompt."""
    try:
        search_results = yf.Search(query)
        quotes = getattr(search_results, "quotes", [])
        if not quotes:
            return None

        equity_quotes = [q for q in quotes if q.get("quoteType") in ("EQUITY", "Equity")]
        if not equity_quotes:
            return None

        is_indian_context = "NSE" in market or "INDIA" in market.upper() or any(term in query.upper() for term in ["LIMITED", "LTD", "NS", "INDIA"])

        best_symbol = None
        for q in equity_quotes:
            symbol = q.get("symbol", "")
            exchange = q.get("exchange", "")

            if is_indian_context:
                if symbol.endswith(".NS") or exchange in ("NSI", "NSE"):
                    best_symbol = symbol if symbol.endswith(".NS") else f"{symbol}.NS"
                    break
                elif symbol.endswith(".BO") or exchange == "BSE":
                    best_symbol = symbol if symbol.endswith(".BO") else f"{symbol}.BO"
                    break

        if not best_symbol and equity_quotes:
            best_symbol = equity_quotes[0].get("symbol")

        if best_symbol and validate_yahoo_ticker(best_symbol):
            return best_symbol

        return None
    except Exception:
        return None


def search_dhan_instrument_master(query: str) -> Optional[str]:
    """Searches Dhan Instrument Master fallback, derives Yahoo candidate symbol, and validates with Yahoo."""
    scrips = fetch_dhan_scrip_master()
    if not scrips:
        return None

    clean_query = re.sub(r'^(ANALYZE|SHOW|GET|CHECK|PERFORM|FINANCIAL|ANALYSIS|OF|FOR|THE|STOCK|SHARE)\s+', '', query.strip().upper()).strip()
    if not clean_query:
        clean_query = query.strip().upper()

    matches: List[Tuple[int, str, str]] = []

    for row in scrips:
        name = row.get("SM_SYMBOL_NAME", "").upper()
        custom_sym = row.get("SEM_CUSTOM_SYMBOL", "").upper()
        trading_sym = row.get("SEM_TRADING_SYMBOL", "").upper()
        exch = row.get("SEM_EXM_EXCH_ID", "NSE")

        score = 0
        if clean_query == name or clean_query == custom_sym or clean_query == trading_sym:
            score = 100
        elif clean_query in name or clean_query in custom_sym:
            score = 80
        elif any(token in name for token in clean_query.split() if len(token) > 2):
            score = 50

        if score > 0:
            symbol_base = trading_sym if trading_sym else custom_sym
            if symbol_base:
                matches.append((score, symbol_base, exch))

    if not matches:
        return None

    matches.sort(key=lambda x: x[0], reverse=True)

    for _, base_sym, exch in matches[:3]:
        suffix = ".NS" if exch == "NSE" else ".BO"
        candidate_yahoo = base_sym if (base_sym.endswith(".NS") or base_sym.endswith(".BO")) else f"{base_sym}{suffix}"

        if validate_yahoo_ticker(candidate_yahoo):
            return candidate_yahoo

    return None


def resolve_entity(prompt: str, market: str = "NSE India") -> Optional[str]:
    """Master entity resolution function following Priority 1-4 pipeline.

    Returns canonical ticker string if resolved, or None if unresolved/ambiguous.
    NEVER defaults to RELIANCE.NS.
    """
    if not prompt or not prompt.strip():
        return None

    # 1. Priority 1: Explicit ticker detection
    explicit = extract_explicit_ticker(prompt)
    if explicit:
        return explicit

    # Clean query for search
    query_text = re.sub(r'(?i)\b(analyze|show|get|check|perform|financial|analysis|of|for|the|stock|share|report|risks)\b', '', prompt).strip()
    if not query_text:
        query_text = prompt.strip()

    # 2. Priority 2: Yahoo Finance Search API
    yahoo_result = search_yahoo_finance(query_text, market=market)
    if yahoo_result:
        return yahoo_result

    # 3. Priority 3: Dhan Instrument Master Fallback
    dhan_result = search_dhan_instrument_master(query_text)
    if dhan_result:
        return dhan_result

    # 4. Priority 4: Unresolved / Ambiguous -> Return None
    return None
