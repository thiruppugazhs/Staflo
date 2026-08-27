from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from ..core.config import settings

# pool_pre_ping: validate pooled connections before use — prevents stale-connection
# 500s on serverless/warm-lambda deployments (Vercel + Supabase pooler)
import re

# Resolve IPv4 Pooler URL to prevent [Errno 99] Cannot assign requested address on Vercel/Lambda
raw_url = settings.DATABASE_URL
connect_args: dict = {}

# If direct IPv6 host is used (db.epnkoxnepauxkluqewib.supabase.co:5432), convert to IPv4 Pooler
match = re.search(r"db\.([a-z0-9]+)\.supabase\.co", raw_url)
if match:
    ref = match.group(1)
    # Ensure username is postgres.<ref> for pooler
    if f"postgres.{ref}" not in raw_url:
        raw_url = raw_url.replace("://postgres:", f"://postgres.{ref}:")
    raw_url = raw_url.replace(f"db.{ref}.supabase.co:5432", "aws-0-ap-south-1.pooler.supabase.com:6543")
    raw_url = raw_url.replace(f"db.{ref}.supabase.co", "aws-0-ap-south-1.pooler.supabase.com")
    connect_args["ssl"] = "require"
    connect_args["statement_cache_size"] = 0
elif "pooler.supabase.com" in raw_url:
    connect_args["ssl"] = "require"
    if ":6543" in raw_url:
        connect_args["statement_cache_size"] = 0

if "ssl=require" in raw_url or "sslmode=require" in raw_url:
    connect_args["ssl"] = "require"
    raw_url = raw_url.split("?")[0]

engine = create_async_engine(
    raw_url,
    connect_args=connect_args,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_recycle=240,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
