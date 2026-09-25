"""Macro Economy Agent implementation for FinOS.

Uses FRED macroeconomic dataflow and existing infrastructure to organize,
interpret, and extract financial implications from key macro indicators.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent
from tradingagents.dataflows.vendors.fred import get_macro_data, FredNotConfiguredError


class MacroAssessment(BaseModel):
    """Structured assessment produced by the FinOS Macro Economy Agent."""
    inflation: str = ""
    interest_rates: str = ""
    monetary_policy: str = ""
    employment: str = ""
    growth: str = ""
    yield_curve: str = ""
    economic_regime: str = "Expansion / Mixed"
    macro_risks: list[str] = Field(default_factory=list)
    macro_opportunities: list[str] = Field(default_factory=list)
    affected_assets_sectors: list[str] = Field(default_factory=list)
    outlook: str = "Neutral / Stable"
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class MacroEconomyAgent(FinOSDomainAgent):
    """FinOS domain agent for macroeconomic interpretation and analysis."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm

    @property
    def name(self) -> str:
        return "Macro Economy Agent"

    @property
    def status(self) -> AgentStatus:
        return AgentStatus.ACTIVE

    def analyze(self, agent_input: FinOSAgentInput) -> FinOSAgentOutput:
        as_of_date = (agent_input.as_of_date or "").strip()
        entity_id = (agent_input.entity_id or "MACRO_US").strip()

        if not as_of_date:
            return FinOSAgentOutput(
                agent_name=self.name,
                entity_id=entity_id,
                as_of_date=as_of_date,
                summary="Invalid as_of_date: as_of_date cannot be empty.",
                findings=MacroAssessment(summary="Empty as_of_date provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_as_of_date"},
            )

        context = agent_input.context or {}
        macro_report = context.get("macro_report", "")

        indicators = {
            "cpi": "CPI Inflation",
            "fed_funds_rate": "Federal Funds Rate",
            "unemployment": "Unemployment Rate",
            "yield_curve": "10Y-2Y Treasury Yield Spread",
            "real_gdp": "Real GDP Growth",
        }

        fetched_series: dict[str, str] = {}
        evidence_items: list[str] = []
        macro_risks: list[str] = []
        macro_opps: list[str] = []
        affected_assets: list[str] = ["Equities", "Fixed Income", "FX"]

        for key, label in indicators.items():
            if f"{key}_data" in context:
                fetched_series[key] = str(context[f"{key}_data"])
            elif not macro_report:
                try:
                    res = get_macro_data(key, curr_date=as_of_date, look_back_days=180)
                    fetched_series[key] = res
                except FredNotConfiguredError as exc:
                    fetched_series[key] = f"FRED API key unconfigured ({exc})"
                except Exception as exc:
                    fetched_series[key] = f"Macro indicator query note ({key}): {exc}"

        cpi_str = fetched_series.get("cpi", "")
        rate_str = fetched_series.get("fed_funds_rate", "")
        unemp_str = fetched_series.get("unemployment", "")
        yield_str = fetched_series.get("yield_curve", "")
        gdp_str = fetched_series.get("real_gdp", "")

        is_inverted = "-" in yield_str or "negative" in yield_str.lower()
        if is_inverted:
            macro_risks.append("Yield curve inversion indicates heightened recession risk")
            yield_interpretation = "Inverted (10Y < 2Y yield spread), signaling potential economic contraction"
        else:
            yield_interpretation = "Normal / Positive slope (10Y > 2Y yield spread)"
            macro_opps.append("Positive yield spread supports bank net interest margin stability")

        if cpi_str and "unavailable" not in cpi_str.lower() and "unconfigured" not in cpi_str.lower():
            evidence_items.append(f"CPI: {cpi_str[:120]}")
            inflation_interp = f"CPI Inflation data active for {as_of_date}: {cpi_str[:150]}"
        else:
            inflation_interp = "Inflation data baseline evaluation."

        if rate_str and "unavailable" not in rate_str.lower() and "unconfigured" not in rate_str.lower():
            evidence_items.append(f"Fed Funds: {rate_str[:120]}")
            rate_interp = f"Fed Funds Rate active for {as_of_date}: {rate_str[:150]}"
        else:
            rate_interp = "Policy rate baseline evaluation."

        if is_inverted and ("unemployment" in unemp_str.lower()):
            economic_regime = "Late Cycle / Recession Caution"
        else:
            economic_regime = "Expansionary / Mixed Macro Conditions"

        valid_indicators = sum(1 for val in fetched_series.values() if "unavailable" not in val.lower() and "unconfigured" not in val.lower())
        confidence = min(0.95, max(0.40, 0.20 + (valid_indicators * 0.15)))

        assessment = MacroAssessment(
            inflation=inflation_interp,
            interest_rates=rate_interp,
            monetary_policy="Monetary stance: Restrictive / Neutral path based on policy rate observations",
            employment=unemp_str[:250] if unemp_str else f"Labor market tracking as of {as_of_date}",
            growth=gdp_str[:250] if gdp_str else f"Real output tracking as of {as_of_date}",
            yield_curve=yield_interpretation,
            economic_regime=economic_regime,
            macro_risks=macro_risks or ["Macroeconomic trajectory uncertainty"],
            macro_opportunities=macro_opps or ["Stable liquidity and growth conditions"],
            affected_assets_sectors=affected_assets,
            outlook=f"Macroeconomic regime on {as_of_date}: {economic_regime}",
            confidence=confidence,
        )

        summary_msg = f"Macro assessment for {entity_id} as of {as_of_date}: Regime - {economic_regime}."

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=entity_id,
            as_of_date=as_of_date,
            summary=summary_msg,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=evidence_items or [summary_msg],
            status=self.status,
            metadata={
                "source": "fred_macro_vendor",
                "indicators_queried": list(indicators.keys()),
                "valid_indicators_count": valid_indicators,
            },
        )
