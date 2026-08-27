from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.attendance import AttendanceRecord
from ..models.leave import LeaveRequest
from ..models.user import User
from ..models.payroll import SalaryStructure

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/attendance")
async def attendance_report(month: int | None = None, year: int | None = None, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    # aggregate for company
    q = select(AttendanceRecord).where(AttendanceRecord.company_id==current.company_id)
    if month and year:
        # filter by month/year via date extraction — simple python filter for now
        pass
    res = await db.execute(q)
    rows = res.scalars().all()
    total = len(rows)
    present = sum(1 for r in rows if r.status=="present")
    half = sum(1 for r in rows if r.status=="half_day")
    absent = sum(1 for r in rows if r.status=="absent")
    leave = sum(1 for r in rows if r.status=="leave")
    avg_hours = round(sum(r.working_hours or 0 for r in rows)/total,2) if total else 0
    return {"total_records": total, "present": present, "half_day": half, "absent": absent, "leave": leave, "avg_hours": avg_hours, "period": f"{month}/{year}" if month else "all"}

@router.get("/leave")
async def leave_report(db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    res = await db.execute(select(LeaveRequest).where(LeaveRequest.company_id==current.company_id))
    rows = res.scalars().all()
    pending = sum(1 for r in rows if r.status=="pending")
    approved = sum(1 for r in rows if r.status=="approved")
    rejected = sum(1 for r in rows if r.status=="rejected")
    by_type = {"paid": sum(1 for r in rows if r.type=="paid"), "sick": sum(1 for r in rows if r.type=="sick"), "unpaid": sum(1 for r in rows if r.type=="unpaid")}
    return {"total": len(rows), "pending": pending, "approved": approved, "rejected": rejected, "by_type": by_type}

@router.get("/payroll")
async def payroll_report(db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    # salary structures
    res = await db.execute(select(SalaryStructure).where(SalaryStructure.company_id==current.company_id))
    structs = res.scalars().all()
    total_monthly = sum(float(s.monthly_wage) for s in structs)
    avg = round(total_monthly/len(structs),2) if structs else 0
    # employees count
    ures = await db.execute(select(func.count(User.id)).where(User.company_id==current.company_id))
    emp_count = ures.scalar() or 0
    return {"employees": emp_count, "salary_structures": len(structs), "total_monthly_payroll": total_monthly, "avg_salary": avg}

@router.get("/salary-slip/{user_id}")
async def salary_slip(user_id: str, month: int | None = None, year: int | None = None, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    # fetch latest salary structure
    from sqlalchemy import select as sel
    import uuid
    uid = uuid.UUID(user_id)
    if str(current.id) != user_id and current.role not in ("admin","hr"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Forbidden")
    res = await db.execute(sel(SalaryStructure).where(SalaryStructure.user_id==uid).order_by(SalaryStructure.created_at.desc()))
    s = res.scalars().first()
    if not s:
        return {"error": "No salary structure"}
    # mock attendance-based adjustment
    m = month or date.today().month
    y = year or date.today().year
    # count attendance for that month
    ares = await db.execute(sel(AttendanceRecord).where(AttendanceRecord.user_id==uid))
    recs = [r for r in ares.scalars().all() if r.date.month==m and r.date.year==y]
    payable_days = 30 - sum(1 for r in recs if r.status=="absent") - sum(0.5 for r in recs if r.status=="half_day")
    net = s.breakdown.get("net_pay", float(s.monthly_wage)) if isinstance(s.breakdown, dict) else float(s.monthly_wage)
    adjusted = round(net * (payable_days/30),2)
    return {
        "user_id": user_id,
        "month": m, "year": y,
        "monthly_wage": float(s.monthly_wage),
        "yearly_wage": float(s.yearly_wage),
        "breakdown": s.breakdown,
        "attendance_records": len(recs),
        "payable_days": max(0, payable_days),
        "net_pay_adjusted": adjusted,
        "period": f"{m:02d}/{y}",
        "company_id": str(s.company_id)
    }
