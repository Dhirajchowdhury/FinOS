"""Tests for FinOS News Agent abstraction."""

from unittest.mock import patch
from finos.core.agents import FinOSAgentInput, NewsAgent, NewsAssessment


def test_news_agent_execution_with_context():
    agent = NewsAgent()
    assert agent.name == "News Agent"

    inp = FinOSAgentInput(
        entity_id="TSLA",
        as_of_date="2025-01-20",
        context={"news_report": "Tesla announced new battery technology breakthrough and surge in deliveries."},
    )

    out = agent.analyze(inp)

    assert out.agent_name == "News Agent"
    assert out.entity_id == "TSLA"
    assert out.as_of_date == "2025-01-20"
    assert isinstance(out.findings, NewsAssessment)
    assert "Tesla announced" in out.findings.summary
    assert out.findings.sentiment in ["bullish", "neutral", "mixed"]
    assert out.findings.affected_entities == ["TSLA"]
    assert out.confidence > 0.0


def test_news_agent_empty_entity_id():
    agent = NewsAgent()
    inp = FinOSAgentInput(entity_id="", as_of_date="2025-01-20")
    out = agent.analyze(inp)

    assert out.confidence == 0.0
    assert "empty" in out.summary.lower()


def test_news_agent_with_raw_articles():
    agent = NewsAgent()
    inp = FinOSAgentInput(
        entity_id="NVDA",
        as_of_date="2025-01-20",
        context={
            "raw_articles": [
                {"title": "Nvidia launches new Blackwell GPU", "summary": "Record demand for AI chips beats expectations", "source": "Bloomberg"},
                {"title": "Tech stocks rally as Nvidia surged", "summary": "Market optimism high", "source": "Reuters"},
            ]
        },
    )
    out = agent.analyze(inp)

    assert isinstance(out.findings, NewsAssessment)
    assert out.findings.sentiment == "bullish"
    assert len(out.findings.opportunities) > 0
    assert out.confidence >= 0.65


def test_news_agent_vendor_routing_fallback():
    agent = NewsAgent()
    inp = FinOSAgentInput(entity_id="AAPL", as_of_date="2025-01-20")

    with patch("finos.core.agents.news.route_to_vendor", side_effect=ValueError("Vendor offline")):
        out = agent.analyze(inp)

    assert out.agent_name == "News Agent"
    assert isinstance(out.findings, NewsAssessment)
    assert out.findings.sentiment == "neutral"
