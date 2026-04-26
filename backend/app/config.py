from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
_DEFAULT_FREE_MODELS = [
    "openrouter:meta-llama/llama-3.3-70b-instruct:free",
    "openrouter:qwen/qwen3-32b:free",
    "openrouter:mistralai/mistral-small-3.2-24b-instruct:free",
]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://sandy:sandy123@localhost:5433/sandy_lab"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    openrouter_api_key: str = ""
    openrouter_model: str = "openrouter:openai/gpt-4o-mini"
    # Comma-separated fallback order used when provider/model is rate-limited.
    # If empty, only OPENROUTER_MODEL is used.
    openrouter_fallback_models: str = ""  # env: OPENROUTER_FALLBACK_MODELS

    tavily_api_key: str = ""

    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    cors_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    allow_open_registration: bool = True  # env: ALLOW_OPEN_REGISTRATION

    # When True, protected routes accept requests without Bearer token (dev only).
    skip_auth: bool = False  # env: SKIP_AUTH

    # Optional POST target for AI usage events (see services/usage-reporter/README.md).
    usage_webhook_url: str = ""  # env: USAGE_WEBHOOK_URL

    @field_validator("cors_origins", mode="before")
    @classmethod
    def strip_cors(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v

    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def openrouter_model_pool(self) -> list[str]:
        ordered: list[str] = []
        primary = self.openrouter_model.strip()
        if primary and primary != "openrouter/free":
            ordered.append(primary)
        for raw in self.openrouter_fallback_models.split(","):
            m = raw.strip()
            if m and m not in ordered:
                ordered.append(m)
        if primary == "openrouter/free":
            for m in _DEFAULT_FREE_MODELS:
                if m not in ordered:
                    ordered.append(m)
        return ordered


@lru_cache
def get_settings() -> Settings:
    return Settings()
