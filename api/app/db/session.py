from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from ..core.config import settings

# pool_pre_ping: validate pooled connections before use — prevents stale-connection
# 500s on serverless/warm-lambda deployments (Vercel + Supabase pooler)
db_url = settings.DATABASE_URL
connect_args = {}
if "supabase.co" in db_url or "sslmode=require" in db_url or "ssl=require" in db_url:
    connect_args["ssl"] = "require"
    # Clean query string if present so asyncpg accepts it cleanly
    db_url = db_url.split("?")[0]

engine = create_async_engine(
    db_url,
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
