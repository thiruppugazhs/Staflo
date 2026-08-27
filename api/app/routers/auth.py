from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import re
import uuid

from ..db.session import get_db
from ..models.company import Company
from ..models.user import User, UserRole
from ..schemas.auth import SignupCompanyRequest, LoginRequest, TokenResponse, InviteEmployeeRequest
from ..core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from ..core.deps import get_current_user, require_admin
from ..services.id_generator import generate_employee_id, generate_temp_password
from ..services.validators import validate_password
from jose import jwt
from datetime import datetime, timedelta, timezone
from ..core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

def slugify(name: str) -> str:
    s = re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')
    return s[:50]

def make_verify_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": str(user_id), "type": "verify", "exp": datetime.now(timezone.utc) + timedelta(days=1)},
        settings.SECRET_KEY, algorithm=settings.ALGORITHM,
    )

def make_verify_url(token: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/verify?token={token}"

@router.post("/signup-company", response_model=TokenResponse)
async def signup_company(payload: SignupCompanyRequest, db: AsyncSession = Depends(get_db)):
    validate_password(payload.password)
    # check email exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This email is already registered. Please Sign In or use a different email.")

    company_name = payload.resolved_company_name or "My Company"
    first_name = payload.resolved_first_name or "Admin"
    last_name = payload.resolved_last_name or "User"

    slug = slugify(company_name)
    # ensure unique slug
    base_slug = slug
    counter = 1
    while True:
        check = await db.execute(select(Company).where(Company.slug == slug))
        if not check.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    company = Company(name=company_name, slug=slug)
    db.add(company)
    await db.flush()

    # first admin is OS0001
    emp_id = generate_employee_id(company_name, 1)
    user = User(
        company_id=company.id,
        employee_id=emp_id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.admin,
        first_name=first_name,
        last_name=last_name,
        phone=payload.phone,
        job_title=payload.jobTitle or "Administrator",
        department=payload.department or "Administration",
        address=payload.address,
        is_temp_password=False,
        # company owner signs up interactively and receives session tokens immediately —
        # never lock the admin out; email verification applies to invited users only
        email_verified=True
    )
    db.add(user)
    await db.flush()
    company.created_by_user_id = user.id
    await db.commit()
    await db.refresh(user)

    access = create_access_token({"sub": str(user.id), "company_id": str(company.id), "role": user.role})
    refresh = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user={"id": str(user.id), "employee_id": emp_id, "email": user.email, "role": user.role, "company_id": str(company.id), "company_slug": slug}
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # allow email or employee_id
    result = await db.execute(select(User).where((User.email == payload.email) | (User.employee_id == payload.email)))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials - check Login ID/Email and Password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled — contact Admin")
    if settings.REQUIRE_EMAIL_VERIFICATION and not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified — check your inbox for the verification link or use the Resend button below")

    # fetch company slug
    comp = await db.execute(select(Company).where(Company.id == user.company_id))
    company = comp.scalar_one_or_none()
    slug = company.slug if company else ""

    access = create_access_token({"sub": str(user.id), "company_id": str(user.company_id), "role": user.role})
    refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user={"id": str(user.id), "employee_id": user.employee_id, "email": user.email, "role": user.role, "company_id": str(user.company_id), "company_slug": slug, "first_name": user.first_name, "last_name": user.last_name}
    )

@router.post("/refresh", response_model=dict)
async def refresh(payload: dict, db: AsyncSession = Depends(get_db)):
    token = payload.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token required")
    data = decode_token(token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = data.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token({"sub": str(user.id), "company_id": str(user.company_id), "role": user.role})
    return {"access_token": access}

@router.get("/me")
async def me(current: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    comp = await db.execute(select(Company).where(Company.id == current.company_id))
    company = comp.scalar_one_or_none()
    return {
        "id": str(current.id),
        "employee_id": current.employee_id,
        "email": current.email,
        "role": current.role,
        "first_name": current.first_name,
        "last_name": current.last_name,
        "company_id": str(current.company_id),
        "company_name": company.name if company else "",
        "company_slug": company.slug if company else "",
        "company_logo": company.logo_url if company else None,
        "phone": current.phone,
        "avatar_url": current.avatar_url,
        "is_temp_password": current.is_temp_password
    }

@router.post("/change-password")
async def change_password(payload: dict, current: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    old = payload.get("old_password")
    new = payload.get("new_password")
    if not old or not new:
        raise HTTPException(status_code=400, detail="old_password and new_password required")
    if not verify_password(old, current.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    validate_password(new)
    current.password_hash = hash_password(new)
    current.is_temp_password = False
    await db.commit()
    return {"message": "Password updated — please re-login"}

@router.post("/verify-email")
async def verify_email(payload: dict, db: AsyncSession = Depends(get_db)):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="token required")
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if data.get("type") != "verify":
            raise HTTPException(status_code=400, detail="Invalid verify token")
        uid = data.get("sub")
        res = await db.execute(select(User).where(User.id == uid))
        user = res.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.email_verified = True
        await db.commit()
        return {"verified": True, "email": user.email}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or expired token: {e}")

@router.post("/resend-verification")
async def resend_verification(payload: dict, db: AsyncSession = Depends(get_db)):
    email = (payload.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="email required")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user and not user.email_verified:
        comp = await db.execute(select(Company).where(Company.id == user.company_id))
        company = comp.scalar_one_or_none()
        verify_token = make_verify_token(user.id)
        verify_url = make_verify_url(verify_token)
        try:
            from ..services.mail import send_email, verification_email_html
            name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.employee_id
            html = verification_email_html(name, verify_url, user.employee_id)
            send_email(user.email, f"Verify your Staflo account — {company.name if company else 'Staflo'}", html, f"Verify: {verify_url} | Employee ID: {user.employee_id}")
            print(f"[MAIL] verification resent to {user.email} ({user.employee_id})")
        except Exception as e:
            print(f"[MAIL] verification resend failed: {e}")
    # generic response to avoid email enumeration
    return {"message": "If that account needs verification, a new link has been sent."}

@router.get("/verify-token/{user_id}")
async def get_verify_token(user_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    # for demo: allow user to fetch their own verify token if not verified
    if str(current.id) != user_id and current.role not in ("admin","hr"):
        raise HTTPException(status_code=403, detail="Forbidden")
    token = make_verify_token(user_id)
    return {"token": token, "verify_url": make_verify_url(token)}

@router.post("/invite")
async def invite_employee(payload: InviteEmployeeRequest, current: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    # check email
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    # count employees in company
    count_res = await db.execute(select(func.count(User.id)).where(User.company_id == current.company_id))
    count = count_res.scalar() or 0
    comp = await db.execute(select(Company).where(Company.id == current.company_id))
    company = comp.scalar_one()
    seq = count + 1
    emp_id = generate_employee_id(company.name, seq)
    temp_pw = generate_temp_password(10)
    role = payload.role if payload.role in ("admin","hr","employee","intern") else "employee"
    # only admin can create admin/hr? allow
    user = User(
        company_id=current.company_id,
        employee_id=emp_id,
        email=payload.email,
        password_hash=hash_password(temp_pw),
        role=role,
        first_name=payload.firstName,
        last_name=payload.lastName,
        phone=payload.phone,
        job_title=payload.jobTitle,
        department=payload.department,
        is_temp_password=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    # verification link so the invitee can activate their account before first login
    verify_url = make_verify_url(make_verify_token(user.id))
    # real email via Brevo SMTP + notification
    try:
        from .notifications import add_notification
        add_notification(current.company_id, "New Employee Invited", f"{payload.firstName} {payload.lastName} ({emp_id}) invited with temp password. Email verification link sent.", "invite")
    except Exception as e:
        print(f"notify failed: {e}")
    try:
        from ..services.mail import send_email, invite_email_html
        login_url = f"{settings.FRONTEND_URL.rstrip('/')}/login"
        html = invite_email_html(f"{payload.firstName} {payload.lastName}", emp_id, payload.email, temp_pw, company.name, login_url, verify_url)
        send_email(payload.email, f"You're invited to {company.name} on Staflo — Employee ID {emp_id}", html, f"Employee ID: {emp_id} Temp Password: {temp_pw} Login: {login_url}\nVerify your email: {verify_url}")
        print(f"[MAIL] Invite sent to {payload.email} ({emp_id})")
    except Exception as e:
        print(f"[MAIL] invite send failed: {e}")
    return {"id": str(user.id), "employee_id": emp_id, "email": payload.email, "temp_password": temp_pw, "role": role, "verify_url": verify_url}
