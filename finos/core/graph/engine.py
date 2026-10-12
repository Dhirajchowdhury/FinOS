from __future__ import annotations

import time
import uuid
from typing import Any

from finos.core.agents.base import FinOSAgentInput
from finos.core.agents.credit import CreditAgent
from finos.core.agents.fraud import FraudAgent
from finos.core.agents.investment import InvestmentAgent
from finos.core.agents.macro import MacroEconomyAgent
from finos.core.agents.news import NewsAgent
from finos.core.agents.portfolio import PortfolioAgent
from finos.core.agents.report import ReportAgent
from finos.core.agents.risk import RiskAgent
from finos.core.agents.tax import TaxAgent
from finos.core.agents.trading import TradingAgent
from finos.core.config import FINOS_CONFIG
from finos.core.graph.propagation import StatePropagator
from finos.core.messaging.publisher import EventPublisher
from finos.core.state.base import FinosState


class FinosGraphEngine:
    """Orchestrates execution of financial intelligence workflows across 10 FinOS domain agents."""

    def __init__(self, config: dict[str, Any] | None = None, llm: Any = None):
        self.config = config or FINOS_CONFIG
        self.llm = llm
        self.propagator = StatePropagator()
        self.publisher = EventPublisher(config=self.config)

        # Instantiate 10 FinOS domain agents
        self.news_agent = NewsAgent(llm=llm)
        self.macro_agent = MacroEconomyAgent(llm=llm)
        self.credit_agent = CreditAgent(llm=llm)
        self.investment_agent = InvestmentAgent(llm=llm)
        self.risk_agent = RiskAgent(llm=llm)
        self.portfolio_agent = PortfolioAgent(llm=llm)
        self.trading_agent = TradingAgent(llm=llm)
        self.tax_agent = TaxAgent(llm=llm)
        self.fraud_agent = FraudAgent(llm=llm)
        self.report_agent = ReportAgent()

    def execute(
        self,
        entity_id: str,
        as_of_date: str,
        request: str = "Perform a complete financial analysis.",
        market: str = "NSE India",
        context: dict[str, Any] | None = None,
    ) -> FinosState:
        """Execute the complete 10-agent FinOS workflow DAG for an entity and date.

        Dependency DAG:
            [News, Macro, Credit] -> Investment -> [Risk, Portfolio] -> Trading -> [Tax, Fraud] -> Report
        """
        start_time = time.perf_counter()

        # Step 1: Create initial FinosState
        state = self.propagator.create_initial_state(
            entity_id=entity_id,
            as_of_date=as_of_date,
            entity_type="equity",
            market=market,
            request=request,
            metadata={"start_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")},
        )
        if context:
            state["metadata"].update(context)

        # Ensure consistent correlation_id spanning the entire workflow execution
        correlation_id = (
            state["metadata"].get("correlation_id")
            or state["metadata"].get("run_id")
            or state["metadata"].get("execution_id")
            or str(uuid.uuid4())
        )
        state["metadata"]["correlation_id"] = correlation_id

        # Publish optional workflow started events
        self.publisher.publish_graph_state_updated(state, stage_name="started", correlation_id=correlation_id)
        self.publisher.publish_analysis_requested(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            correlation_id=correlation_id,
            market=market,
            context=context,
        )

        # Helper to convert output to dict
        def to_dict(out):
            if hasattr(out, "model_dump"):
                return out.model_dump()
            if hasattr(out, "dict"):
                return out.dict()
            return out

        # Helper to wrap agent analysis with optional Kafka event publishing
        def run_agent(agent, agent_input):
            self.publisher.publish_agent_started(
                agent_name=agent.name,
                entity_id=agent_input.entity_id,
                entity_type=agent_input.entity_type,
                as_of_date=agent_input.as_of_date,
                correlation_id=correlation_id,
                context=agent_input.context,
            )
            try:
                out = agent.analyze(agent_input)
                self.publisher.publish_agent_completed(
                    agent_output=out,
                    correlation_id=correlation_id,
                )
                return out
            except Exception as exc:
                self.publisher.publish_agent_failed(
                    agent_name=agent.name,
                    entity_id=agent_input.entity_id,
                    entity_type=agent_input.entity_type,
                    as_of_date=agent_input.as_of_date,
                    correlation_id=correlation_id,
                    error_message=str(exc),
                )
                raise

        # ---------------------------------------------------------
        # STAGE 1: Parallel Primary Intelligence (News, Macro, Credit)
        # ---------------------------------------------------------
        base_input = FinOSAgentInput(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
        )

        news_out = run_agent(self.news_agent, base_input)
        state["news"] = to_dict(news_out)

        macro_input = FinOSAgentInput(
            entity_id="MACRO_US",
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
        )
        macro_out = run_agent(self.macro_agent, macro_input)
        state["macro"] = to_dict(macro_out)

        credit_out = run_agent(self.credit_agent, base_input)
        state["credit"] = to_dict(credit_out)

        # ---------------------------------------------------------
        # STAGE 2: Investment Thesis Synthesis (Consumes News, Macro, Credit)
        # ---------------------------------------------------------
        invest_input = FinOSAgentInput(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
            relevant_previous_outputs={
                "news": news_out,
                "macro": macro_out,
                "credit": credit_out,
            },
        )
        invest_out = run_agent(self.investment_agent, invest_input)
        state["investment"] = to_dict(invest_out)

        # ---------------------------------------------------------
        # STAGE 3: Risk & Position Sizing (Consumes Investment, Credit, Macro)
        # ---------------------------------------------------------
        risk_input = FinOSAgentInput(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
            relevant_previous_outputs={
                "investment": invest_out,
                "credit": credit_out,
                "macro": macro_out,
            },
        )
        risk_out = run_agent(self.risk_agent, risk_input)
        state["risk"] = to_dict(risk_out)

        port_input = FinOSAgentInput(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
            relevant_previous_outputs={
                "investment": invest_out,
                "risk": risk_out,
            },
        )
        port_out = run_agent(self.portfolio_agent, port_input)
        state["portfolio"] = to_dict(port_out)

        # ---------------------------------------------------------
        # STAGE 4: Trade Proposal Generation (Consumes Investment, Risk, Portfolio)
        # ---------------------------------------------------------
        trading_input = FinOSAgentInput(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
            relevant_previous_outputs={
                "investment": invest_out,
                "risk": risk_out,
                "portfolio": port_out,
            },
        )
        trading_out = run_agent(self.trading_agent, trading_input)
        state["trading"] = to_dict(trading_out)

        # ---------------------------------------------------------
        # STAGE 5: Auxiliary Governance & Auditing (Tax, Fraud)
        # ---------------------------------------------------------
        tax_input = FinOSAgentInput(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
            relevant_previous_outputs={"trading": trading_out},
        )
        tax_out = run_agent(self.tax_agent, tax_input)
        state["tax"] = to_dict(tax_out)

        fraud_input = FinOSAgentInput(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
            relevant_previous_outputs={"credit": credit_out, "trading": trading_out},
        )
        fraud_out = run_agent(self.fraud_agent, fraud_input)
        state["fraud"] = to_dict(fraud_out)

        # ---------------------------------------------------------
        # STAGE 6: Final Synthesized Report Generation (Consumes ALL outputs)
        # ---------------------------------------------------------
        report_input = FinOSAgentInput(
            entity_id=entity_id,
            as_of_date=as_of_date,
            request=request,
            context={"market": market, **state["metadata"]},
            relevant_previous_outputs={
                "news": news_out,
                "macro": macro_out,
                "credit": credit_out,
                "investment": invest_out,
                "risk": risk_out,
                "portfolio": port_out,
                "trading": trading_out,
                "tax": tax_out,
                "fraud": fraud_out,
            },
        )
        report_out = run_agent(self.report_agent, report_input)
        state["report"] = to_dict(report_out)

        end_time = time.perf_counter()
        elapsed_ms = round((end_time - start_time) * 1000, 2)

        # Aggregate data quality & missing data in FinosState
        state["data_quality"] = {
            "credit_status": credit_out.metadata.get("field_status", {}),
            "news_scope": news_out.metadata.get("news_scope", "UNKNOWN"),
            "tax_status": tax_out.metadata.get("tax_calculation_status", "UNKNOWN"),
            "fraud_status": fraud_out.metadata.get("transaction_monitoring_status", "UNKNOWN"),
            "execution_time_ms": elapsed_ms,
        }
        state["sender"] = "Report Agent"

        # Publish optional workflow completed events
        self.publisher.publish_graph_state_updated(state, stage_name="completed", correlation_id=correlation_id)
        self.publisher.publish_analysis_completed(
            entity_id=entity_id,
            as_of_date=as_of_date,
            correlation_id=correlation_id,
            report_output=report_out,
            data_quality=state.get("data_quality"),
        )

        return state
