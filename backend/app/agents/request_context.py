"""Request-scoped context for agent tools (e.g. which user triggered the planner)."""

from contextvars import ContextVar

# Set for the lifetime of a single /api/chat/stream run (see chat route).
agent_request_user_id: ContextVar[int | None] = ContextVar("agent_request_user_id", default=None)
