"""Taxonomy of vendor and market data exceptions for FinOS.

Establishes a uniform behavioral error hierarchy allowing the data routing layer
to react by condition (throttle, missing credential, missing data) rather than vendor.
"""

from __future__ import annotations


class VendorError(Exception):
    """Base exception for all vendor and data integration failures."""


class NoMarketDataError(VendorError):
    """Indicates that no data exists for the requested entity or time window."""

    def __init__(self, entity_id: str, detail: str = ""):
        self.entity_id = entity_id
        self.detail = detail
        msg = f"No market data available for {entity_id!r}"
        if detail:
            msg += f": {detail}"
        super().__init__(msg)


class VendorRateLimitError(VendorError):
    """Raised when an external API throttles or rate-limits requests."""


class VendorNotConfiguredError(VendorError, ValueError):
    """Raised when a selected vendor lacks necessary API keys or configuration."""
