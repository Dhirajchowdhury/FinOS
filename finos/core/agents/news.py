"""News Agent implementation for FinOS.

Retrieves and analyzes financial news, global macro events, and prediction market data,
producing a structured NewsAssessment in compliance with FinOS domain agent contracts.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent
from tradingagents.dataflows.router import route_to_vendor


class NewsAssessment(BaseModel):
    """Structured assessment produced by the FinOS News Agent."""
    summary: str = ""
    key_events: list[str] = Field(default_factory=list)
    sentiment: str = "neutral"  # bullish, bearish, neutral, mixed
    market_impact: str = ""
    affected_entities: list[str] = Field(default_factory=list)
    affected_sectors: list[str] = Field(default_factory=list)
    risk_factors: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)


class NewsAgent(FinOSDomainAgent):
    """FinOS domain agent for financial news intelligence."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm

    @property
    def name(self) -> str:
        return "News Agent"

    @property
    def status(self) -> AgentStatus:
        return AgentStatus.ACTIVE

    def analyze(self, agent_input: FinOSAgentInput) -> FinOSAgentOutput:
        ticker = (agent_input.entity_id or "").strip()
        as_of_date = (agent_input.as_of_date or "").strip()

        if not ticker:
            return FinOSAgentOutput(
                agent_name=self.name,
                entity_id=ticker,
                as_of_date=as_of_date,
                summary="Invalid entity_id: entity_id cannot be empty.",
                findings=NewsAssessment(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}
        news_report = context.get("news_report", "")
        raw_articles = list(context.get("raw_articles") or [])

        fetched_evidence: list[str] = []
        key_events: list[str] = []
        risk_factors: list[str] = []
        opportunities: list[str] = []
        affected_entities: set[str] = {ticker}
        affected_sectors: set[str] = set()

        pos_count = 0
        neg_count = 0

        company_articles: list[dict[str, Any]] = []
        global_articles: list[dict[str, Any]] = []

        # Step 1: Retrieve news if not supplied in context
        if not news_report and not raw_articles:
            try:
                comp_res = route_to_vendor("get_news", ticker, start_date=as_of_date, end_date=as_of_date)
                if isinstance(comp_res, list):
                    company_articles.extend(comp_res)
                elif isinstance(comp_res, dict) and "articles" in comp_res:
                    company_articles.extend(comp_res.get("articles", []))
                elif isinstance(comp_res, str) and not comp_res.startswith("NO_DATA_AVAILABLE"):
                    news_report = comp_res
            except Exception as exc:
                fetched_evidence.append(f"Company news query note: {exc}")

            try:
                glob_res = route_to_vendor("get_global_news", curr_date=as_of_date, look_back_days=7, limit=5)
                if isinstance(glob_res, list):
                    global_articles.extend(glob_res)
                elif isinstance(glob_res, str) and not glob_res.startswith("DATA_UNAVAILABLE"):
                    fetched_evidence.append(f"Global macro news feed: {glob_res[:200]}")
            except Exception:
                pass
        elif raw_articles:
            company_articles = list(raw_articles)

        # Step 2: Normalize and parse articles
        normalized_articles: list[dict[str, Any]] = []
        target_articles = company_articles if company_articles else global_articles
        news_scope = "COMPANY_SPECIFIC" if company_articles else ("GLOBAL_FALLBACK" if global_articles or fetched_evidence else "NONE")

        for art in target_articles:
            if isinstance(art, dict):
                norm_art = {
                    "title": str(art.get("title") or art.get("headline") or "").strip(),
                    "snippet": str(art.get("summary") or art.get("snippet") or art.get("text") or "").strip(),
                    "source": str(art.get("source") or art.get("publisher") or "yfinance").strip(),
                    "published_at": str(art.get("published_at") or art.get("pubDate") or art.get("time") or as_of_date).strip(),
                }
            else:
                text_str = str(art).strip()
                norm_art = {
                    "title": text_str[:120],
                    "snippet": text_str,
                    "source": "NewsFeed",
                    "published_at": as_of_date,
                }

            if not norm_art["title"] and not norm_art["snippet"]:
                continue

            normalized_articles.append(norm_art)
            title = norm_art["title"] or norm_art["snippet"][:100]
            src = norm_art["source"]
            pub = norm_art["published_at"]

            fetched_evidence.append(f"[{src} ({pub})] {title}")
            key_events.append(title)

            text_lower = f"{norm_art['title']} {norm_art['snippet']}".lower()
            if any(w in text_lower for w in ["growth", "surge", "record", "profit", "beat", "upgraded", "breakthrough", "launch"]):
                pos_count += 1
                opportunities.append(f"Positive momentum signal: {title[:100]}")
            if any(w in text_lower for w in ["drop", "decline", "investigation", "lawsuit", "missed", "downgraded", "loss", "risk", "warning"]):
                neg_count += 1
                risk_factors.append(f"Downside risk signal: {title[:100]}")

        if news_report:
            nr_lower = news_report.lower()
            if "bullish" in nr_lower or "growth" in nr_lower or "outperform" in nr_lower:
                pos_count += 2
            if "bearish" in nr_lower or "decline" in nr_lower or "risk" in nr_lower:
                neg_count += 2

        if pos_count > 0 and neg_count > 0 and abs(pos_count - neg_count) <= 1:
            sentiment = "mixed"
        elif pos_count > neg_count:
            sentiment = "bullish"
        elif neg_count > pos_count:
            sentiment = "bearish"
        else:
            sentiment = "neutral"

        if news_scope == "COMPANY_SPECIFIC":
            summary_str = f"Company-specific news for {ticker} as of {as_of_date} ({sentiment}): Retrieved {len(normalized_articles)} articles."
            confidence = 0.85 if len(normalized_articles) >= 3 else 0.75
        elif news_scope == "GLOBAL_FALLBACK":
            summary_str = f"Company-specific news unavailable for {ticker} on {as_of_date}; evaluated global macro news feed ({sentiment})."
            confidence = 0.55
        else:
            summary_str = f"No news articles found for {ticker} as of {as_of_date}."
            confidence = 0.30

        market_impact = (
            f"{sentiment.capitalize()} sentiment impact based on {'company headlines' if news_scope == 'COMPANY_SPECIFIC' else 'global macro news feed'}."
            if news_scope != "NONE"
            else "Negligible expected market impact due to limited news coverage."
        )

        assessment = NewsAssessment(
            summary=summary_str,
            key_events=key_events[:5] or [f"News tracking active for {ticker}"],
            sentiment=sentiment,
            market_impact=market_impact,
            affected_entities=sorted(list(affected_entities)),
            affected_sectors=sorted(list(affected_sectors)),
            risk_factors=risk_factors[:5],
            opportunities=opportunities[:5],
            evidence=fetched_evidence[:10],
            confidence=confidence,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=assessment.summary,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=assessment.evidence,
            status=self.status,
            metadata={
                "source": "yfinance_news_dataflows",
                "news_scope": news_scope,
                "company_article_count": len(company_articles),
                "global_article_count": len(global_articles),
                "normalized_articles": normalized_articles[:5],
                "as_of_date": as_of_date,
            },
        )

