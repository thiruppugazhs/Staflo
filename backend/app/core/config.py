from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/DailyFlow"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    SECRET_KEY: str = "dev-secret-change-me-please-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    # Base URL of the frontend — used to build verification / invite links in emails
    FRONTEND_URL: str = "http://localhost:5173"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@DailyFlow.susindran.in"
    SMTP_USE_TLS: bool = False
    SMTP_USE_SSL: bool = True
    REQUIRE_EMAIL_VERIFICATION: bool = False
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-haiku-20240307"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Google Calendar + Meet integration (real Meet links)
    # Option A: path to a service-account JSON key file
    GOOGLE_SERVICE_ACCOUNT_JSON: str = ""
    # Option B: full service-account JSON key content inline (single line)
    GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT: str = ""
    # Option C: OAuth user refresh token (works with personal Gmail)
    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""
    GOOGLE_OAUTH_REFRESH_TOKEN: str = ""
    # Workspace domain-wide delegation subject (service account impersonation)
    GOOGLE_IMPERSONATE_EMAIL: str = ""
    # Calendar to create events on
    GOOGLE_CALENDAR_ID: str = "primary"

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

settings = Settings()
