from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres.epnkoxnepauxkluqewib:thiruppugazhs@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
    SUPABASE_URL: str = "https://epnkoxnepauxkluqewib.supabase.co"
    SUPABASE_SERVICE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmtveG5lcGF1eGtsdXFld2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczOTU2NTEsImV4cCI6MjEwMjk3MTY1MX0.bnYLqzTFPrtoQjJjq4tRh2-ETfPymWJR32JBWNJVtnE"
    SUPABASE_ANON_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmtveG5lcGF1eGtsdXFld2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczOTU2NTEsImV4cCI6MjEwMjk3MTY1MX0.bnYLqzTFPrtoQjJjq4tRh2-ETfPymWJR32JBWNJVtnE"
    SECRET_KEY: str = "9f4a1c6e8b2d5e7f0a3c4b6d8e1f2a3c4e5b6a7d8e9f0a1b2c3d4e5f6a7b8c9d"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://epnkoxnepauxkluqewib.supabase.co,https://staflo.thiruppugazhs.in,http://staflo.thiruppugazhs.in"
    # Base URL of the frontend — used to build verification / invite links in emails
    FRONTEND_URL: str = "https://staflo.thiruppugazhs.in"
    # Email (Resend REST API primary, SMTP fallback)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "Staflo <onboarding@resend.dev>"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@staflo.thiruppugazhs.in"
    SMTP_USE_TLS: bool = False
    SMTP_USE_SSL: bool = True
    REQUIRE_EMAIL_VERIFICATION: bool = False
    # HR AI Chatbot: Raya (Powered by Google Gemini)
    AGENT_NAME: str = "Raya"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
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
    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = "rzp_test_TUjXmrPNGhYVpq"
    RAZORPAY_KEY_SECRET: str = "mllaW6PHW7l5IAvND8BvLspU"

    class Config:
        env_file = ".env"

    @property
    def clean_database_url(self) -> str:
        return "".join(self.DATABASE_URL.strip().split())

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

settings = Settings()
