from __future__ import annotations

from typing import Any, cast

from deepagents.middleware.subagents import SubAgent

from app.agents.tools import db_tools, inventory_tools, research_tools


def build_subagents() -> list[SubAgent]:
    """Planner delegates to these specialists via deepagents' built-in task tool."""
    subs: list[dict[str, Any]] = [
        {
            "name": "research-agent",
            "description": (
                "Web research and summarization with citations; caches findings in research_cache."
            ),
            "system_prompt": (
                "You are Sandy's Research Agent. Prefer web_search for fresh facts. "
                "Always cite sources. After producing a useful answer, call cache_research "
                "with topic, summary, and source URL or title."
            ),
            "tools": [research_tools.web_search, research_tools.cache_research],
        },
        {
            "name": "database-agent",
            "description": (
                "Structured questions about projects, experiments, inventory rows, and research_cache — "
                "via human-approved reads and approved project updates."
            ),
            "system_prompt": (
                "You are the Database Agent. "
                "For read-only data access, use propose_select_query with a single SELECT and "
                "never claim query results until a human approves. "
                "For project updates after top-level approval, use update_project_fields. "
                "Do not generate raw write SQL."
            ),
            "tools": [db_tools.propose_select_query, db_tools.update_project_fields],
        },
        {
            "name": "inventory-agent",
            "description": "Stock checks and ledger-style inventory movements via inventory_transactions.",
            "system_prompt": (
                "You are the Inventory Agent. Use list_low_stock to find shortages. "
                "Use record_inventory_transaction for stock changes (in/out/adjust/expired) "
                "and always include a clear reason string."
            ),
            "tools": [
                inventory_tools.list_low_stock,
                inventory_tools.record_inventory_transaction,
            ],
        },
    ]
    return cast(list[SubAgent], subs)
