from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from ..core.config import settings

# pool_pre_ping: validate pooled connections before use — prevents stale-connection
# 500s on serverless/warm-lambda deployments (Vercel + Supabase pooler)
import re

raw_url = "".join(settings.DATABASE_URL.strip().split())

# Ensure asyncpg driver is specified for create_async_engine
if raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Convert direct IPv6 host to IPv4 Pooler (Session mode port 5432)
match = re.search(r"db\.([a-z0-9]+)\.supabase\.co", raw_url)
if match:
    ref = match.group(1)
    if f"postgres.{ref}" not in raw_url:
        raw_url = raw_url.replace("://postgres:", f"://postgres.{ref}:")
    raw_url = raw_url.replace(f"db.{ref}.supabase.co:5432", "aws-0-ap-south-1.pooler.supabase.com:5432")
    raw_url = raw_url.replace(f"db.{ref}.supabase.co:6543", "aws-0-ap-south-1.pooler.supabase.com:5432")
    raw_url = raw_url.replace(f"db.{ref}.supabase.co", "aws-0-ap-south-1.pooler.supabase.com")

# Use Session Mode (port 5432) on Supabase IPv4 pooler for full SQLAlchemy compatibility
if "pooler.supabase.com:6543" in raw_url:
    raw_url = raw_url.replace(":6543", ":5432")

if "ssl=require" in raw_url or "sslmode=require" in raw_url:
    raw_url = raw_url.split("?")[0]

raw_url = raw_url.strip()

connect_args = {
    "ssl": "require",
    "statement_cache_size": 0,
    "prepared_statement_cache_size": 0,
}

# NullPool is essential for serverless execution
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
