"""FinOS Domain Agents package.

Houses the 10 domain agents and core agent contracts for FinOS.
"""

from finos.core.agents.base import (
    AgentStatus,
    FinOSAgentInput,
    FinOSAgentOutput,
    FinOSDomainAgent,
)
from finos.core.agents.news import NewsAgent, NewsAssessment
from finos.core.agents.macro import MacroEconomyAgent, MacroAssessment
from finos.core.agents.investment import InvestmentAgent, InvestmentAssessment
from finos.core.agents.risk import RiskAgent, RiskAssessment
from finos.core.agents.portfolio import PortfolioAgent, PortfolioAssessment
from finos.core.agents.trading import TradingAgent, TradingProposal
from finos.core.agents.report import ReportAgent, ReportAssessment
from finos.core.agents.credit import CreditAgent, CreditAssessment
from finos.core.agents.tax import TaxAgent, TaxAssessment
from finos.core.agents.fraud import FraudAgent, FraudAssessment




__all__ = [
    "AgentStatus",
    "FinOSAgentInput",
    "FinOSAgentOutput",
    "FinOSDomainAgent",
    "NewsAgent",
    "NewsAssessment",
    "MacroEconomyAgent",
    "MacroAssessment",
    "InvestmentAgent",
    "InvestmentAssessment",
    "RiskAgent",
    "RiskAssessment",
    "PortfolioAgent",
    "PortfolioAssessment",
    "TradingAgent",
    "TradingProposal",
    "ReportAgent",
    "ReportAssessment",
    "TaxAgent",
    "TaxAssessment",
    "FraudAgent",
    "FraudAssessment",
    "CreditAgent",
    "CreditAssessment",
]
