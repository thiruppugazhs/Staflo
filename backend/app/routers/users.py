from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.user import User
from ..schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=list[UserOut])
async def list_users(search: str | None = None, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    q = select(User).where(User.company_id == current.company_id)
    if current.role == "employee":
        # employees can list but limited? allow all for dashboard grid
        pass
    if search:
        like = f"%{search}%"
        q = q.where(or_(User.first_name.ilike(like), User.last_name.ilike(like), User.email.ilike(like), User.employee_id.ilike(like)))
    q = q.order_by(User.created_at.asc())
    res = await db.execute(q)
    return res.scalars().all()

@router.get("/me", response_model=UserOut)
async def get_me(current: User = Depends(get_current_user)):
    return current

@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    res = await db.execute(select(User).where(User.id == user_id, User.company_id == current.company_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    res = await db.execute(select(User).where(User.id == user_id, User.company_id == current.company_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # permissions: employee can only edit self and limited fields
    is_self = str(current.id) == user_id
    is_admin = current.role in ("admin","hr")
    if not (is_self or is_admin):
        raise HTTPException(status_code=403, detail="Not allowed")
    data = payload.model_dump(exclude_unset=True)
    # restrict employee self-edit
    if is_self and not is_admin:
        allowed = {"phone","address","avatar_url","first_name","last_name"}
        data = {k:v for k,v in data.items() if k in allowed}
    # admin can edit role/is_active etc but not self-demote last admin? skip check
    for k,v in data.items():
        setattr(user, k, v)
    await db.commit()
    await db.refresh(user)
    return user
