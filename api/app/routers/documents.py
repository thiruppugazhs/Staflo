from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid, os
from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.document import Document
from ..models.user import User
from ..services.storage import upload_bytes

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload/{user_id}")
async def upload_doc(user_id: uuid.UUID, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    # employee can upload own, admin for anyone in company
    if str(current.id) != str(user_id) and current.role not in ("admin","hr"):
        raise HTTPException(status_code=403, detail="Only self or admin")
    # check user exists in same company
    res = await db.execute(select(User).where(User.id==user_id, User.company_id==current.company_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target user not in company")
    # Supabase Storage (or local fallback)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    fname = f"{user_id}_{uuid.uuid4().hex}.{ext}"
    content = await file.read()
    file_url = await upload_bytes("employee-documents", fname, content, file.content_type or "application/octet-stream")
    doc = Document(user_id=user_id, company_id=current.company_id, name=file.filename, file_url=file_url, mime_type=file.content_type)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"id": str(doc.id), "file_url": file_url, "name": file.filename}

@router.get("/{user_id}")
async def list_docs(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    if str(current.id) != str(user_id) and current.role not in ("admin","hr"):
        raise HTTPException(status_code=403, detail="Forbidden")
    res = await db.execute(select(Document).where(Document.user_id==user_id, Document.company_id==current.company_id).order_by(Document.uploaded_at.desc()))
    docs = res.scalars().all()
    return [{"id": str(d.id), "name": d.name, "file_url": d.file_url, "mime_type": d.mime_type, "uploaded_at": d.uploaded_at.isoformat() } for d in docs]

@router.delete("/{doc_id}")
async def delete_doc(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    res = await db.execute(select(Document).where(Document.id==doc_id))
    doc = res.scalar_one_or_none()
    if not doc or doc.company_id != current.company_id:
        raise HTTPException(status_code=404, detail="Not found")
    if str(doc.user_id) != str(current.id) and current.role not in ("admin","hr"):
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.delete(doc)
    await db.commit()
    return {"deleted": True}
