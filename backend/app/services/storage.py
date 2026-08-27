import os
import logging

logger = logging.getLogger("uvicorn.error")

# Supabase storage helper — uses supabase-py if credentials exist, else local fallback
# Buckets: company-logos, avatars, employee-documents, leave-docs

def get_supabase_client():
    from ..core.config import settings
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        logger.warning("Supabase storage not configured: SUPABASE_URL/SUPABASE_SERVICE_KEY missing")
        return None
    try:
        from supabase import create_client
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    except Exception as e:
        logger.warning(f"Supabase client init failed: {e}")
        return None

def _local_upload(bucket: str, filename: str, content: bytes) -> str:
    local_dir = os.path.join(os.environ.get("UPLOAD_DIR", "uploads"), bucket)
    try:
        os.makedirs(local_dir, exist_ok=True)
        path = os.path.join(local_dir, filename)
        with open(path, "wb") as f:
            f.write(content)
        # return local path (frontend will prefix with API)
        return f"/{path.replace(os.sep, '/')}"
    except OSError as e:
        raise RuntimeError(
            f"Supabase storage unavailable and local upload failed ({e}). "
            "On serverless hosts (Vercel) the filesystem is read-only — set "
            "SUPABASE_URL and SUPABASE_SERVICE_KEY env vars."
        ) from e

async def upload_bytes(bucket: str, filename: str, content: bytes, content_type: str = "application/octet-stream") -> str:
    client = get_supabase_client()
    if client:
        try:
            res = client.storage.from_(bucket).upload(filename, content, {"content-type": content_type, "upsert": "true"})
            err = getattr(res, "error", None) or getattr(getattr(res, "json", lambda: {}), "get", lambda k, d=None: d)("error")
            if err:
                raise RuntimeError(f"Supabase storage error: {err}")
            pub = client.storage.from_(bucket).get_public_url(filename)
            url = getattr(pub, "data", {}).get("publicUrl") if hasattr(pub, "data") else str(pub)
            if not url:
                raise RuntimeError(f"Supabase returned no public URL for {bucket}/{filename}")
            return url
        except Exception as e:
            logger.warning(f"Supabase upload failed ({bucket}/{filename}): {e} — trying local fallback")
    return _local_upload(bucket, filename, content)

def is_supabase_configured() -> bool:
    from ..core.config import settings
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)
