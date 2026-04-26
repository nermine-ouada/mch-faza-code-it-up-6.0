from app.config import get_settings


def openrouter_model_id() -> str:
    """Model id passed to deepagents (requires langchain-openrouter)."""
    return get_settings().openrouter_model


def openrouter_model_pool() -> list[str]:
    """Ordered list of candidate model ids (primary + fallbacks)."""
    return get_settings().openrouter_model_pool()
