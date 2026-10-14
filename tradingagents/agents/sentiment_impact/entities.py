"""Verified entity metadata for content-based relevance classification.

A ticker that a news vendor *associates* with an article is not proof the
article is about the company: global/market feeds routinely return articles
about unrelated companies. This module holds a small, explicit registry of
entity profiles -- names, aliases, sector exposures and macro exposures -- and
matches them against an article's *own text* using word-boundary rules, never a
loose substring test.

Only a match on the company's name/aliases (or its ticker symbol) marks an
article ``COMPANY_SPECIFIC``. A match on the profile's sector keywords marks it
``SECTOR_RELEVANT``; sector keywords are only defined where the company's
exposure is verified. Unknown tickers fall back to a minimal profile built from
the symbol itself, which still requires a literal word-boundary match.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from functools import lru_cache


@dataclass(frozen=True)
class EntityProfile:
    """Verified metadata used to decide whether an article is about a company."""

    ticker: str
    name: str
    aliases: tuple[str, ...] = ()
    sector: str | None = None
    sector_keywords: tuple[str, ...] = ()
    macro_factors: tuple[str, ...] = ()

    @property
    def company_terms(self) -> tuple[str, ...]:
        """Name/alias/ticker terms that mark an article as company-specific."""
        terms = {self.name, self.ticker, *self.aliases}
        base = self.ticker.split(".")[0]
        if base:
            terms.add(base)
        return tuple(sorted({t.strip() for t in terms if t and t.strip()}, key=len, reverse=True))


# Sector keyword vocabularies used to annotate events and to classify articles
# as SECTOR_RELEVANT. Kept deliberately narrow: generic macro terms (oil, gold,
# rates) must NOT appear here or shared-macro articles would be mislabelled as
# company-sector news.
_ENERGY_KEYWORDS = ("oil", "gas", "refin", "petroleum", "crude", "upstream", "downstream")
_IT_KEYWORDS = ("software", "it services", "cloud", "semiconductor", "artificial intelligence", "technology")
_STEEL_KEYWORDS = ("steel", "iron ore", "coking coal", "blast furnace", "metals", "mining")
_METALS_KEYWORDS = ("aluminium", "aluminum", "zinc", "copper", "bauxite", "mining", "smelter", "smelting", "metals")
_TELECOM_KEYWORDS = ("telecom", "wireless", "broadband", "spectrum", "5g")
_RETAIL_KEYWORDS = ("retail", "supermarket", "grocery", "apparel", "beverage", "consumer goods")


ENTITY_PROFILES: dict[str, EntityProfile] = {
    # Indian equities (the deployment target).
    "VEDANTA.NS": EntityProfile(
        ticker="VEDANTA.NS",
        name="Vedanta",
        aliases=("vedanta ltd", "vedanta limited", "vedl"),
        sector="Metals & Mining",
        sector_keywords=_METALS_KEYWORDS,
        macro_factors=("commodities", "interest_rates"),
    ),
    "TATASTEEL.NS": EntityProfile(
        ticker="TATASTEEL.NS",
        name="Tata Steel",
        aliases=("tata steel ltd", "tata steel limited", "tatasteel"),
        sector="Steel",
        sector_keywords=_STEEL_KEYWORDS,
        macro_factors=("commodities", "interest_rates"),
    ),
    "RELIANCE.NS": EntityProfile(
        ticker="RELIANCE.NS",
        name="Reliance Industries",
        aliases=("reliance", "reliance industries", "reliance jio", "jio", "ril"),
        sector="Energy & Conglomerate",
        sector_keywords=_ENERGY_KEYWORDS + _TELECOM_KEYWORDS + _RETAIL_KEYWORDS + ("petrochemical",),
        macro_factors=("commodities", "interest_rates"),
    ),
    "TCS.NS": EntityProfile(
        ticker="TCS.NS",
        name="Tata Consultancy Services",
        aliases=("tata consultancy services", "tata consultancy", "tcs"),
        sector="Information Technology",
        sector_keywords=_IT_KEYWORDS,
        macro_factors=(),
    ),
    "INFY.NS": EntityProfile(
        ticker="INFY.NS",
        name="Infosys",
        aliases=("infosys ltd", "infosys limited"),
        sector="Information Technology",
        sector_keywords=_IT_KEYWORDS,
        macro_factors=(),
    ),
    "HDFCBANK.NS": EntityProfile(
        ticker="HDFCBANK.NS",
        name="HDFC Bank",
        aliases=("hdfc bank ltd", "hdfc bank limited"),
        sector="Financials",
        sector_keywords=("bank", "lending", "insurance", "credit", "financial", "loan"),
        macro_factors=("interest_rates", "inflation"),
    ),
    # Common US equities (kept minimal; aliases only, no invented sector data).
    "AAPL": EntityProfile(ticker="AAPL", name="Apple", aliases=("apple inc",)),
    "MSFT": EntityProfile(ticker="MSFT", name="Microsoft", aliases=("microsoft corp",)),
    "NVDA": EntityProfile(ticker="NVDA", name="Nvidia", aliases=("nvidia corp",)),
    "GOOGL": EntityProfile(ticker="GOOGL", name="Alphabet", aliases=("google",)),
    "AMZN": EntityProfile(ticker="AMZN", name="Amazon", aliases=("amazon.com",)),
    "META": EntityProfile(ticker="META", name="Meta Platforms", aliases=("meta platforms", "facebook")),
    "TSLA": EntityProfile(ticker="TSLA", name="Tesla", aliases=("tesla inc",)),
}


@lru_cache(maxsize=None)
def _term_pattern(term: str) -> re.Pattern[str]:
    """A word-boundary regex for ``term``; spaces/hyphens match flexibly.

    ``(?<![A-Za-z0-9])`` / ``(?![A-Za-z0-9])`` prevent matching inside a longer
    token (so ``ril`` does not match ``April`` and ``tcs`` does not match
    ``tcsxyz``). Multi-word terms allow internal whitespace/hyphens.
    """
    parts = [re.escape(p) for p in re.split(r"[\s\-]+", term.strip()) if p]
    body = r"[\s\-]+".join(parts)
    return re.compile(rf"(?<![A-Za-z0-9]){body}(?![A-Za-z0-9])", re.IGNORECASE)


def profile_for_ticker(ticker: str | None) -> EntityProfile:
    """Return the known profile for ``ticker`` or a minimal derived fallback."""
    if not ticker:
        return EntityProfile(ticker="", name="")
    canonical = ticker.strip().upper()
    known = ENTITY_PROFILES.get(canonical)
    if known is not None:
        return known
    base = canonical.split(".")[0]
    return EntityProfile(ticker=canonical, name=base, aliases=())


def match_company(text: str, profile: EntityProfile) -> str | None:
    """Return the company term found in ``text``, or ``None``."""
    for term in profile.company_terms:
        if _term_pattern(term).search(text):
            return term
    return None


def match_sector(text: str, profile: EntityProfile) -> str | None:
    """Return the sector keyword found in ``text``, or ``None`` when unknown."""
    for keyword in profile.sector_keywords:
        if _term_pattern(keyword).search(text):
            return keyword
    return None


def term_matches(text: str, term: str) -> bool:
    """Word-boundary membership test (so 'war' does not match 'software')."""
    return _term_pattern(term).search(text) is not None
