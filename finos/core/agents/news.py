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

        # Step 1: Retrieve news if not supplied in context
        if not news_report and not raw_articles:
            try:
                company_news = route_to_vendor("get_news", ticker, start_date=as_of_date, end_date=as_of_date)
                if isinstance(company_news, dict) and "articles" in company_news:
                    raw_articles.extend(company_news.get("articles", []))
                elif isinstance(company_news, list):
                    raw_articles.extend(company_news)
                elif isinstance(company_news, str) and not company_news.startswith("NO_DATA_AVAILABLE"):
                    news_report = company_news
                    fetched_evidence.append(company_news[:300])
            except Exception as exc:
                fetched_evidence.append(f"Company news vendor note: {exc}")

            try:
                global_news = route_to_vendor("get_global_news", curr_date=as_of_date, look_back_days=7, limit=5)
                if isinstance(global_news, list):
                    raw_articles.extend(global_news)
                elif isinstance(global_news, str) and not global_news.startswith("DATA_UNAVAILABLE"):
                    fetched_evidence.append(f"Global news: {global_news[:200]}")
            except Exception:
                pass

        # Step 2: Parse raw articles if present
        if raw_articles:
            for art in raw_articles:
                if isinstance(art, dict):
                    title = art.get("title", "") or art.get("headline", "")
                    summary = art.get("summary", "") or art.get("snippet", "")
                    source = art.get("source", "") or art.get("publisher", "")
                    text = f"{title}. {summary}"
                else:
                    text = str(art)
                    title = text[:100]
                    source = "NewsFeed"

                if not text.strip():
                    continue

                fetched_evidence.append(f"[{source}] {title}" if source else title)
                key_events.append(title if title else text[:120])

                text_lower = text.lower()
                if any(w in text_lower for w in ["growth", "surge", "record", "profit", "beat", "upgraded", "breakthrough", "launch"]):
                    pos_count += 1
                    opportunities.append(f"Positive momentum signal: {title[:100]}")
                if any(w in text_lower for w in ["drop", "decline", "investigation", "lawsuit", "missed", "downgraded", "loss", "risk", "warning"]):
                    neg_count += 1
                    risk_factors.append(f"Downside risk signal: {title[:100]}")

        # Step 3: Parse news_report string if available
        if news_report:
            lines = [line.strip() for line in news_report.split("\n") if line.strip()]
            for line in lines[:10]:
                if len(line) > 15 and not line.startswith("#"):
                    key_events.append(line[:150])

            nr_lower = news_report.lower()
            if "bullish" in nr_lower or "growth" in nr_lower or "outperform" in nr_lower:
                pos_count += 2
            if "bearish" in nr_lower or "decline" in nr_lower or "risk" in nr_lower:
                neg_count += 2

        # Determine sentiment
        if pos_count > 0 and neg_count > 0 and abs(pos_count - neg_count) <= 1:
            sentiment = "mixed"
        elif pos_count > neg_count:
            sentiment = "bullish"
        elif neg_count > pos_count:
            sentiment = "bearish"
        else:
            sentiment = "neutral"

        # Coverage and confidence assessment
        has_data = bool(raw_articles or news_report or fetched_evidence)
        confidence = 0.80 if len(raw_articles) >= 3 else (0.65 if has_data else 0.30)

        if news_report:
            summary_str = f"News report for {ticker} as of {as_of_date} ({sentiment}): {news_report[:300]}"
        elif raw_articles:
            summary_str = f"News evaluation for {ticker} as of {as_of_date}: Sentiment is {sentiment}. Retrieved {len(raw_articles)} articles."
        elif has_data:
            summary_str = f"News evaluation for {ticker} as of {as_of_date}: Sentiment is {sentiment}."
        else:
            summary_str = f"No recent news articles found for {ticker} as of {as_of_date}."


        market_impact = (
            f"{sentiment.capitalize()} market impact expected based on recent headline sentiment."
            if has_data
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
                "source": "tradingagents_news_dataflows",
                "article_count": len(raw_articles),
                "as_of_date": as_of_date,
            },
        )
