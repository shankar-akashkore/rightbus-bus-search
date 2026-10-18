from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gds_base_url: str = "http://127.0.0.1:8001"
    gds_timeout_seconds: float = 5.0
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # True by default because the supplied dataset (2026-08-09) is already in the past.
    allow_past_dates: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
