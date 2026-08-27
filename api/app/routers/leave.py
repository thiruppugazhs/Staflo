from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime, timezone
from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.leave import LeaveRequest, LeaveBalance, LeaveStatus
from ..models.user import User
import uuid

router = APIRouter(prefix="/leave", tags=["leave"])

@router.post("/request")
async def create_leave(payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    # payload: type, start_date, end_date, reason, doc_url
    try:
        ltype = payload["type"]
        start = date.fromisoformat(payload["start_date"])
        end = date.fromisoformat(payload["end_date"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dates")
    if end < start:
        raise HTTPException(status_code=400, detail="End before start")
    days = (end - start).days + 1
    lr = LeaveRequest(
        user_id=current.id,
        company_id=current.company_id,
        type=ltype,
        start_date=start,
        end_date=end,
        days=days,
        reason=payload.get("reason"),
        doc_url=payload.get("doc_url"),
        status="pending"
    )
    db.add(lr)
    await db.commit()
    await db.refresh(lr)
    return {"id": str(lr.id), "status": lr.status, "days": days}

@router.get("/my")
async def my_leaves(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    res = await db.execute(select(LeaveRequest).where(LeaveRequest.user_id==current.id).order_by(LeaveRequest.created_at.desc()))
    rows = res.scalars().all()
    return [{"id": str(r.id), "type": r.type, "start_date": r.start_date.isoformat(), "end_date": r.end_date.isoformat(), "days": r.days, "reason": r.reason, "status": r.status, "reviewer_comment": r.reviewer_comment} for r in rows]

@router.get("/queue")
async def queue(status: str | None = None, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    q = select(LeaveRequest).where(LeaveRequest.company_id==current.company_id)
    if status:
        q = q.where(LeaveRequest.status==status)
    q = q.order_by(LeaveRequest.created_at.desc())
    res = await db.execute(q)
    rows = res.scalars().all()
    # join user info
    out=[]
    for r in rows:
        u = await db.execute(select(User).where(User.id==r.user_id))
        user = u.scalar_one_or_none()
        out.append({"id": str(r.id), "user_id": str(r.user_id), "employee_id": user.employee_id if user else "", "email": user.email if user else "", "name": f"{user.first_name} {user.last_name}" if user else "", "type": r.type, "start_date": r.start_date.isoformat(), "end_date": r.end_date.isoformat(), "days": r.days, "reason": r.reason, "status": r.status, "doc_url": r.doc_url})
    return out

@router.post("/{leave_id}/approve")
async def approve(leave_id: uuid.UUID, payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    res = await db.execute(select(LeaveRequest).where(LeaveRequest.id==leave_id, LeaveRequest.company_id==current.company_id))
    lr = res.scalar_one_or_none()
    if not lr:
        raise HTTPException(status_code=404, detail="Not found")
    if lr.status != "pending":
        raise HTTPException(status_code=400, detail="Already decided")
    lr.status = "approved"
    lr.reviewer_id = current.id
    lr.reviewer_comment = payload.get("comment")
    lr.reviewed_at = datetime.now(timezone.utc)
    # notification + email
    try:
        from .notifications import add_notification
        add_notification(current.company_id, "Leave Approved", f"{lr.type} leave {lr.start_date} → {lr.end_date} approved for {lr.user_id}", "leave")
    except Exception:
        pass
    try:
        from ..services.mail import send_email, leave_status_html
        # fetch employee
        u = await db.execute(select(User).where(User.id == lr.user_id))
        emp = u.scalar_one_or_none()
        if emp and emp.email:
            html = leave_status_html(f"{emp.first_name} {emp.last_name}", lr.type, str(lr.start_date), str(lr.end_date), "approved", payload.get("comment"))
            send_email(emp.email, f"Leave Approved — {lr.type} {lr.start_date} → {lr.end_date}", html)
    except Exception as e:
        print(f"[MAIL] leave approve email failed: {e}")
    # update balance
    bal_res = await db.execute(select(LeaveBalance).where(LeaveBalance.user_id==lr.user_id, LeaveBalance.year==lr.start_date.year))
    bal = bal_res.scalar_one_or_none()
    if not bal:
        bal = LeaveBalance(user_id=lr.user_id, company_id=lr.company_id, year=lr.start_date.year, paid_remaining=24, sick_remaining=7)
        db.add(bal)
        await db.flush()
    if lr.type == "paid":
        bal.paid_remaining = max(0, bal.paid_remaining - lr.days)
    elif lr.type == "sick":
        bal.sick_remaining = max(0, bal.sick_remaining - lr.days)
    else:
        bal.unpaid_taken += lr.days
    await db.commit()
    return {"status":"approved"}

@router.post("/{leave_id}/reject")
async def reject(leave_id: uuid.UUID, payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    res = await db.execute(select(LeaveRequest).where(LeaveRequest.id==leave_id, LeaveRequest.company_id==current.company_id))
    lr = res.scalar_one_or_none()
    if not lr:
        raise HTTPException(status_code=404, detail="Not found")
    if lr.status != "pending":
        raise HTTPException(status_code=400, detail="Already decided")
    lr.status = "rejected"
    lr.reviewer_id = current.id
    lr.reviewer_comment = payload.get("comment")
    lr.reviewed_at = datetime.now(timezone.utc)
    try:
        from .notifications import add_notification
        add_notification(current.company_id, "Leave Rejected", f"{lr.type} leave {lr.start_date} → {lr.end_date} rejected for {lr.user_id}", "leave")
    except Exception:
        pass
    try:
        from ..services.mail import send_email, leave_status_html
        u = await db.execute(select(User).where(User.id == lr.user_id))
        emp = u.scalar_one_or_none()
        if emp and emp.email:
            html = leave_status_html(f"{emp.first_name} {emp.last_name}", lr.type, str(lr.start_date), str(lr.end_date), "rejected", payload.get("comment"))
            send_email(emp.email, f"Leave Rejected — {lr.type} {lr.start_date} → {lr.end_date}", html)
    except Exception as e:
        print(f"[MAIL] leave reject email failed: {e}")
    await db.commit()
    return {"status":"rejected"}

@router.get("/balances")
async def balances(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    year = date.today().year
    if current.role in ("admin","hr"):
        # for demo return current user balance
        pass
    res = await db.execute(select(LeaveBalance).where(LeaveBalance.user_id==current.id, LeaveBalance.year==year))
    bal = res.scalar_one_or_none()
    if not bal:
        return {"year": year, "paid_remaining": 24, "sick_remaining": 7, "unpaid_taken": 0}
    return {"year": year, "paid_remaining": bal.paid_remaining, "sick_remaining": bal.sick_remaining, "unpaid_taken": bal.unpaid_taken}

@router.get("/balances/{user_id}")
async def user_balances(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    year = date.today().year
    res = await db.execute(select(LeaveBalance).where(LeaveBalance.user_id==user_id, LeaveBalance.year==year))
    bal = res.scalar_one_or_none()
    if not bal:
        return {"year": year, "paid_remaining": 24, "sick_remaining": 7, "unpaid_taken": 0}
    return {"year": year, "paid_remaining": bal.paid_remaining, "sick_remaining": bal.sick_remaining, "unpaid_taken": bal.unpaid_taken}
