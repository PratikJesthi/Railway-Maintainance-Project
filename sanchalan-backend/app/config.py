from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "SANCHALAN ABP API"
    # Database URLs (PostgreSQL as primary, SQLite as fallback/standby)
    database_url: str = "postgresql://sanchalan:sanchalan@localhost:5433/sanchalan"
    fallback_database_url: str = "sqlite:///./sanchalan.db"

    # Vite dev server + common local frontend ports
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    feed_max_rows: int = 200      # hard cap kept in DB
    feed_default_limit: int = 12  # matches AppContext's .slice(0, 12)
    now_h: float = 10.7           # matches NOW_H in opsData.js (sim clock, Mon 00:00 = 0)

    secret_key: str = "change-me-in-.env"     # SANCHALAN_SECRET_KEY in production
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # Redis — primary caching & pub-sub; app degrades gracefully if down
    redis_url: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        env_prefix = "SANCHALAN_"


settings = Settings()
