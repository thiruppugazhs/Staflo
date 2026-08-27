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

@router.put("/{user_id}", response_model=UserOut)
@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    res = await db.execute(select(User).where(User.id == user_id, User.company_id == current.company_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_self = str(current.id) == user_id
    is_admin = current.role in ("admin", "hr")
    if not (is_self or is_admin):
        raise HTTPException(status_code=403, detail="Not allowed to edit this employee")

    data = payload.model_dump(exclude_unset=True)
    if is_self and not is_admin:
        allowed = {"phone", "address", "avatar_url", "first_name", "last_name"}
        data = {k: v for k, v in data.items() if k in allowed}

    for k, v in data.items():
        if k == "date_of_joining" and isinstance(v, str):
            try:
                v = date.fromisoformat(v[:10])
            except Exception:
                continue
        setattr(user, k, v)

    await db.commit()
    await db.refresh(user)
    return user

from ..models.company import Company
from ..models.leave import LeaveBalance
from ..models.payroll import SalaryStructure
from ..core.security import hash_password
from ..services.id_generator import generate_employee_id, generate_temp_password
from ..services.mail import send_email, invite_email_html
from datetime import date

@router.get("/template")
async def get_employee_import_template():
    csv_content = (
        "first_name,last_name,email,phone,role,department,job_title,date_of_joining,monthly_wage\n"
        "Aarav,Sharma,aarav.sharma@example.com,+919876543210,employee,Engineering,Software Engineer,2026-01-15,65000\n"
        "Priya,Patel,priya.patel@example.com,+919876543211,hr,Human Resources,HR Executive,2026-02-01,55000\n"
        "Rahul,Verma,rahul.verma@example.com,+919876543212,employee,Marketing,Marketing Lead,2026-03-10,60000\n"
    )
    return {"template": csv_content, "columns": ["first_name", "last_name", "email", "phone", "role", "department", "job_title", "date_of_joining", "monthly_wage"]}

@router.post("/bulk-import")
async def bulk_import_employees(payload: dict, current: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    employees = payload.get("employees") or []
    if not employees or not isinstance(employees, list):
        raise HTTPException(status_code=400, detail="A list of 'employees' is required")

    # Fetch company info
    comp = await db.execute(select(Company).where(Company.id == current.company_id))
    company = comp.scalar_one_or_none()
    company_name = company.name if company else "Staflo"

    # Count existing employees
    count_res = await db.execute(select(User).where(User.company_id == current.company_id))
    existing_users = count_res.scalars().all()
    count = len(existing_users)
    existing_emails = {u.email.lower() for u in existing_users}

    imported = []
    skipped = []
    current_year = date.today().year

    for idx, emp_data in enumerate(employees):
        first_name = (emp_data.get("first_name") or emp_data.get("firstName") or "").strip()
        last_name = (emp_data.get("last_name") or emp_data.get("lastName") or "").strip()
        email = (emp_data.get("email") or "").strip().lower()

        if not email or not first_name:
            skipped.append({"row": idx + 1, "reason": "Missing first name or email", "data": emp_data})
            continue

        if email in existing_emails:
            skipped.append({"row": idx + 1, "reason": f"Email '{email}' is already registered", "data": emp_data})
            continue

        # Check DB for global uniqueness
        db_existing = await db.execute(select(User).where(User.email == email))
        if db_existing.scalar_one_or_none():
            skipped.append({"row": idx + 1, "reason": f"Email '{email}' already exists in the system", "data": emp_data})
            continue

        count += 1
        emp_id = generate_employee_id(company_name, count)
        temp_pw = generate_temp_password(10)
        role = emp_data.get("role") or "employee"
        if role not in ("admin", "hr", "employee", "intern"):
            role = "employee"

        doj = None
        doj_raw = emp_data.get("date_of_joining") or emp_data.get("dateOfJoining")
        if doj_raw:
            try:
                doj = date.fromisoformat(str(doj_raw)[:10])
            except Exception:
                pass

        user = User(
            company_id=current.company_id,
            employee_id=emp_id,
            email=email,
            password_hash=hash_password(temp_pw),
            role=role,
            first_name=first_name,
            last_name=last_name,
            phone=emp_data.get("phone"),
            job_title=emp_data.get("job_title") or emp_data.get("jobTitle"),
            department=emp_data.get("department"),
            date_of_joining=doj,
            is_temp_password=True,
            email_verified=True
        )
        db.add(user)
        await db.flush()

        # Seed leave balance
        lb = LeaveBalance(
            user_id=user.id,
            year=current_year,
            paid_remaining=18,
            sick_remaining=12,
            unpaid_taken=0
        )
        db.add(lb)

        # Seed salary structure if wage provided
        wage_val = emp_data.get("monthly_wage") or emp_data.get("monthlyWage")
        if wage_val:
            try:
                wage = float(wage_val)
                sal = SalaryStructure(
                    user_id=user.id,
                    monthly_wage=wage,
                    yearly_wage=wage * 12,
                    breakdown={
                        "basic_amount": round(wage * 0.5, 2),
                        "net_pay": round(wage * 0.88, 2),
                        "total_earnings": wage,
                        "total_deductions": round(wage * 0.12, 2)
                    }
                )
                db.add(sal)
            except Exception:
                pass

        existing_emails.add(email)
        imported.append({
            "id": str(user.id),
            "employee_id": emp_id,
            "name": f"{first_name} {last_name}".strip(),
            "email": email,
            "role": role,
            "temp_password": temp_pw
        })

        # Try to send email
        try:
            login_url = f"{settings.FRONTEND_URL.rstrip('/')}/login"
            html = invite_email_html(f"{first_name} {last_name}".strip(), emp_id, email, temp_pw, company_name, login_url)
            send_email(email, f"Welcome to {company_name} on Staflo — Employee ID {emp_id}", html, f"Employee ID: {emp_id} | Password: {temp_pw}")
        except Exception as e:
            print(f"[MAIL] Bulk invite send error: {e}")

    await db.commit()
    return {
        "success": True,
        "imported_count": len(imported),
        "skipped_count": len(skipped),
        "imported": imported,
        "skipped": skipped
    }

@router.delete("/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    if str(current.id) == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    res = await db.execute(select(User).where(User.id == user_id, User.company_id == current.company_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete user's associated leave balances, salary structures, etc.
    from ..models.leave import LeaveBalance, LeaveRequest
    from ..models.payroll import SalaryStructure
    from ..models.attendance import AttendanceRecord
    from sqlalchemy import delete

    await db.execute(delete(LeaveRequest).where(LeaveRequest.user_id == user.id))
    await db.execute(delete(LeaveBalance).where(LeaveBalance.user_id == user.id))
    await db.execute(delete(SalaryStructure).where(SalaryStructure.user_id == user.id))
    await db.execute(delete(AttendanceRecord).where(AttendanceRecord.user_id == user.id))
    await db.delete(user)
    await db.commit()

    return {"success": True, "message": f"Employee {user.first_name} {user.last_name} ({user.employee_id}) has been deleted."}
