"""FinOS Core Foundation Package.

Provides domain-neutral core infrastructure:
- state: Domain-neutral workflow state schemas
- schemas: Pydantic structured output contracts
- graph: Workflow orchestration, checkpointing, and execution engine
- llm: Universal multi-provider LLM client abstractions
- tools: Reusable tool definitions with point-in-time constraints
- data: Data routing, vendor integrations, and UTC windowing
- memory: Append-only audit and decision logs
- portfolio: Broker-neutral portfolio context
- evaluation: Outcome assessment, alpha calculation, and reflection
- backtesting: Historical grid evaluation and scoring
"""

from finos.core.config import FINOS_CONFIG

__all__ = ["FINOS_CONFIG"]
