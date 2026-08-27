from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.company import Company
from ..models.user import User
from ..services.storage import upload_bytes

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("/me")
async def get_my_company(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    res = await db.execute(select(Company).where(Company.id == current.company_id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"id": str(c.id), "name": c.name, "slug": c.slug, "logo_url": c.logo_url, "created_at": c.created_at.isoformat() if c.created_at else None}

@router.patch("/me")
async def update_company(payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    res = await db.execute(select(Company).where(Company.id == current.company_id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    if "name" in payload:
        c.name = payload["name"]
    await db.commit()
    return {"id": str(c.id), "name": c.name, "slug": c.slug, "logo_url": c.logo_url}

@router.post("/logo")
async def upload_logo(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed for logo")
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Logo must be <2MB")
    ext = file.filename.split(".")[-1] if "." in (file.filename or "") else "png"
    filename = f"{current.company_id}_{uuid.uuid4().hex}.{ext}"
    url = await upload_bytes("company-logos", filename, content, file.content_type)
    # update company
    res = await db.execute(select(Company).where(Company.id == current.company_id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    c.logo_url = url
    await db.commit()
    return {"logo_url": url, "company_id": str(c.id)}
