from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from ..core.config import settings

# pool_pre_ping: validate pooled connections before use — prevents stale-connection
# 500s on serverless/warm-lambda deployments (Vercel + Supabase pooler)
import re

# Resolve IPv4 Pooler URL to prevent [Errno 99] Cannot assign requested address on Vercel/Lambda
# Strip all accidental trailing/leading whitespace and spaces in the URL
from sqlalchemy.pool import NullPool

raw_url = "".join(settings.DATABASE_URL.strip().split())
connect_args: dict = {
    "ssl": "require",
    "statement_cache_size": 0,
    "prepared_statement_cache_size": 0,
}

# If direct IPv6 host is used (db.epnkoxnepauxkluqewib.supabase.co:5432), convert to IPv4 Pooler
match = re.search(r"db\.([a-z0-9]+)\.supabase\.co", raw_url)
if match:
    ref = match.group(1)
    # Ensure username is postgres.<ref> for pooler
    if f"postgres.{ref}" not in raw_url:
        raw_url = raw_url.replace("://postgres:", f"://postgres.{ref}:")
    raw_url = raw_url.replace(f"db.{ref}.supabase.co:5432", "aws-0-ap-south-1.pooler.supabase.com:6543")
    raw_url = raw_url.replace(f"db.{ref}.supabase.co", "aws-0-ap-south-1.pooler.supabase.com")

if "ssl=require" in raw_url or "sslmode=require" in raw_url:
    raw_url = raw_url.split("?")[0]

raw_url = raw_url.strip()

# NullPool is essential for serverless + PgBouncer transaction pooling
engine = create_async_engine(
    raw_url,
    connect_args=connect_args,
    poolclass=NullPool,
    echo=False,
    future=True,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
