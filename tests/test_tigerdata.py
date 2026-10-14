"""Unit and integration tests for TigerData / TimescaleDB parallel time-series storage module."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
import pandas as pd
import pytest

from finos.tigerdata.config import TigerDataSettings, get_tigerdata_settings
from finos.tigerdata.db import TigerDataEngine, TimescaleDBError
from finos.tigerdata.ingestion import YahooTigerDataIngestion
from finos.tigerdata.repository import TigerDataRepository
from finos.tigerdata.schema import MarketBar


@pytest.fixture
def memory_db_engine():
    """Return a TigerDataEngine instance backed by in-memory SQLite for fast isolated testing."""
    settings = TigerDataSettings(database_url="sqlite:///:memory:", require_timescaledb=False)
    engine = TigerDataEngine(settings=settings)
    engine.setup_schema(enable_hypertable=False)
    yield engine
    engine.close()


@pytest.fixture
def memory_repository(memory_db_engine):
    """Return a TigerDataRepository instance using in-memory SQLite engine."""
    return TigerDataRepository(db_engine=memory_db_engine)


def test_tigerdata_settings_unconfigured():
    """Verify settings indicate unconfigured when TIGERDATA_DATABASE_URL is missing."""
    settings = TigerDataSettings(database_url=None)
    assert not settings.is_configured

    engine = TigerDataEngine(settings=settings)
    assert not engine.is_configured
    assert not engine.health_check()


def test_tigerdata_settings_configured():
    """Verify settings indicate configured when TIGERDATA_DATABASE_URL is provided."""
    settings = TigerDataSettings(database_url="postgresql://user:pass@localhost:5432/tigerdb")
    assert settings.is_configured


def test_tigerdata_health_check_success(memory_db_engine):
    """Verify health check returns True for responsive database."""
    assert memory_db_engine.health_check()


def test_tigerdata_health_check_failure():
    """Verify health check returns False when database connection fails."""
    settings = TigerDataSettings(database_url="postgresql://invalid:invalid@localhost:9999/nonexistent")
    engine = TigerDataEngine(settings=settings)
    assert not engine.health_check()


def test_timescaledb_error_on_non_postgres():
    """Verify TimescaleDBError is raised when TimescaleDB hypertable is required on non-PostgreSQL DB."""
    settings = TigerDataSettings(database_url="sqlite:///:memory:", require_timescaledb=True)
    engine = TigerDataEngine(settings=settings)
    with pytest.raises(TimescaleDBError, match="TimescaleDB requires a PostgreSQL database connection"):
        engine.setup_schema(enable_hypertable=True)


def test_market_bar_normalization():
    """Verify MarketBar model normalizes attributes correctly."""
    bar = MarketBar(
        symbol=" reliance.ns ",
        timestamp=datetime(2026, 9, 25, 10, 0, 0, tzinfo=timezone.utc),
        open=2850.0,
        high=2890.0,
        low=2840.0,
        close=2875.5,
        volume=1500000.0,
        source="yahoo",
    )
    d = bar.to_dict()
    assert d["symbol"] == "RELIANCE.NS"
    assert d["open"] == 2850.0
    assert d["close"] == 2875.5
    assert d["volume"] == 1500000.0


def test_insert_and_get_market_bars(memory_repository):
    """Verify inserting market bars and reading them back."""
    ts1 = datetime(2026, 9, 24, 0, 0, 0, tzinfo=timezone.utc)
    ts2 = datetime(2026, 9, 25, 0, 0, 0, tzinfo=timezone.utc)

    bars = [
        MarketBar(symbol="NVDA", timestamp=ts1, open=120.0, high=125.0, low=119.0, close=124.0, volume=1000000.0),
        MarketBar(symbol="NVDA", timestamp=ts2, open=124.0, high=128.0, low=123.0, close=127.5, volume=1200000.0),
    ]

    inserted_count = memory_repository.insert_market_bars(bars)
    assert inserted_count == 2

    # Read back
    retrieved = memory_repository.get_market_bars("NVDA")
    assert len(retrieved) == 2
    assert retrieved[0].symbol == "NVDA"
    assert retrieved[0].close == 124.0
    assert retrieved[1].close == 127.5
    assert retrieved[0].volume == 1000000.0


def test_upsert_idempotency(memory_repository):
    """Verify upsert does not create duplicate records for identical (symbol, timestamp)."""
    ts = datetime(2026, 9, 25, 0, 0, 0, tzinfo=timezone.utc)

    bar1 = MarketBar(symbol="TCS.NS", timestamp=ts, open=4000.0, high=4050.0, low=3980.0, close=4020.0, volume=500000.0)
    memory_repository.upsert_market_bars([bar1])

    # Initial check
    initial = memory_repository.get_market_bars("TCS.NS")
    assert len(initial) == 1
    assert initial[0].close == 4020.0

    # Upsert updated bar for same timestamp
    bar2 = MarketBar(symbol="TCS.NS", timestamp=ts, open=4000.0, high=4080.0, low=3980.0, close=4070.0, volume=600000.0)
    memory_repository.upsert_market_bars([bar2])

    # Verify updated record replaced existing record without duplicate row creation
    updated = memory_repository.get_market_bars("TCS.NS")
    assert len(updated) == 1
    assert updated[0].close == 4070.0
    assert updated[0].high == 4080.0
    assert updated[0].volume == 600000.0


def test_get_latest_market_bar(memory_repository):
    """Verify get_latest_market_bar returns the most recent timestamp record."""
    ts1 = datetime(2026, 9, 20, 0, 0, 0, tzinfo=timezone.utc)
    ts2 = datetime(2026, 9, 25, 0, 0, 0, tzinfo=timezone.utc)
    ts3 = datetime(2026, 9, 22, 0, 0, 0, tzinfo=timezone.utc)

    bars = [
        MarketBar(symbol="AAPL", timestamp=ts1, open=220.0, high=222.0, low=219.0, close=221.0, volume=100.0),
        MarketBar(symbol="AAPL", timestamp=ts2, open=225.0, high=228.0, low=224.0, close=227.0, volume=300.0),
        MarketBar(symbol="AAPL", timestamp=ts3, open=221.0, high=224.0, low=220.0, close=223.0, volume=200.0),
    ]

    memory_repository.upsert_market_bars(bars)

    latest = memory_repository.get_latest_market_bar("AAPL")
    assert latest is not None
    assert latest.timestamp == ts2
    assert latest.close == 227.0


def test_yahoo_ingestion_transformation(memory_repository):
    """Verify YahooTigerDataIngestion service transforms yfinance DataFrame into MarketBar records."""
    mock_df = pd.DataFrame(
        {
            "Open": [100.0, 102.0],
            "High": [105.0, 106.0],
            "Low": [99.0, 101.0],
            "Close": [104.0, 105.5],
            "Volume": [10000.0, 12000.0],
        },
        index=pd.to_datetime(["2026-09-24", "2026-09-25"]),
    )

    ingestion = YahooTigerDataIngestion(repository=memory_repository)

    with patch("yfinance.Ticker") as mock_ticker_cls:
        mock_ticker = MagicMock()
        mock_ticker.history.return_value = mock_df
        mock_ticker_cls.return_value = mock_ticker

        count = ingestion.ingest_daily_ohlcv("GOOGL", period="5d")
        assert count == 2

        stored = memory_repository.get_market_bars("GOOGL")
        assert len(stored) == 2
        assert stored[0].symbol == "GOOGL"
        assert stored[0].open == 100.0
        assert stored[1].close == 105.5
        assert stored[0].source == "yahoo"
