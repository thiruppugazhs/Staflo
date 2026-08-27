from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from ..db.session import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..services.storage import upload_bytes

router = APIRouter(prefix="/users", tags=["avatars"])

@router.post("/me/avatar")
async def upload_my_avatar(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Avatar must be <2MB")
    ext = file.filename.split(".")[-1] if "." in (file.filename or "") else "png"
    filename = f"{current.id}_{uuid.uuid4().hex}.{ext}"
    url = await upload_bytes("avatars", filename, content, file.content_type)
    current.avatar_url = url
    await db.commit()
    return {"avatar_url": url}

@router.post("/{user_id}/avatar")
async def upload_user_avatar(user_id: uuid.UUID, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    # allow self or admin
    if str(current.id) != str(user_id) and current.role not in ("admin","hr"):
        raise HTTPException(status_code=403, detail="Forbidden")
    res = await db.execute(select(User).where(User.id == user_id, User.company_id == current.company_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found in company")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")
    content = await file.read()
    ext = file.filename.split(".")[-1] if "." in (file.filename or "") else "png"
    filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
    url = await upload_bytes("avatars", filename, content, file.content_type)
    target.avatar_url = url
    await db.commit()
    return {"avatar_url": url}
