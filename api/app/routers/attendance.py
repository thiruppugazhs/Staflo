from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, date, timezone, timedelta
from ..db.session import get_db
from ..core.deps import get_current_user
from ..models.attendance import AttendanceRecord
from ..models.user import User
from ..services.attendance_calc import calc_working_hours, determine_status
import uuid

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/check-in")
async def check_in(payload: dict | None = None, request: Request = None, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    payload = payload or {}
    today = date.today()
    existing = await db.execute(select(AttendanceRecord).where(AttendanceRecord.user_id==current.id, AttendanceRecord.date==today))
    rec = existing.scalar_one_or_none()
    if rec and rec.check_in:
        raise HTTPException(status_code=400, detail="Already checked in today")
    lat = payload.get("lat")
    lng = payload.get("lng")
    loc_in = {"lat": lat, "lng": lng} if lat is not None else None
    ip = request.client.host if (request and request.client) else None
    now = datetime.now(timezone.utc)
    if rec is None:
        rec = AttendanceRecord(
            user_id=current.id,
            company_id=current.company_id,
            date=today,
            check_in=now,
            status="present",
            location_in=loc_in,
            ip_address=ip
        )
        db.add(rec)
    else:
        rec.check_in = now
        rec.location_in = loc_in
        rec.ip_address = ip
        rec.status = "present"
    await db.commit()
    await db.refresh(rec)
    return {
        "message": "Checked in successfully",
        "record": {
            "id": str(rec.id),
            "check_in": rec.check_in.isoformat() if rec.check_in else None,
            "status": rec.status
        }
    }

@router.post("/check-out")
async def check_out(payload: dict | None = None, request: Request = None, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    payload = payload or {}
    today = date.today()
    res = await db.execute(select(AttendanceRecord).where(AttendanceRecord.user_id==current.id, AttendanceRecord.date==today))
    rec = res.scalar_one_or_none()
    if not rec or not rec.check_in:
        raise HTTPException(status_code=400, detail="Not checked in today")
    if rec.check_out:
        raise HTTPException(status_code=400, detail="Already checked out")
    lat = payload.get("lat")
    lng = payload.get("lng")
    loc_out = {"lat": lat, "lng": lng} if lat is not None else None
    now = datetime.now(timezone.utc)
    rec.check_out = now
    rec.location_out = loc_out
    wh = calc_working_hours(rec.check_in, rec.check_out)
    rec.working_hours = wh
    rec.status = determine_status(wh)
    await db.commit()
    await db.refresh(rec)
    return {
        "message": "Checked out successfully",
        "record": {
            "id": str(rec.id),
            "check_out": rec.check_out.isoformat() if rec.check_out else None,
            "working_hours": wh,
            "status": rec.status
        }
    }

@router.post("/status")
async def set_status(payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    """Manually set own attendance status for today (present/absent/break) — header dropdown"""
    status = payload.get("status")
    if status not in ("present", "absent", "break"):
        raise HTTPException(status_code=400, detail="status must be present, absent or break")
    today = date.today()
    res = await db.execute(select(AttendanceRecord).where(AttendanceRecord.user_id==current.id, AttendanceRecord.date==today))
    rec = res.scalar_one_or_none()
    if rec is None:
        rec = AttendanceRecord(user_id=current.id, company_id=current.company_id, date=today, status=status)
        db.add(rec)
    else:
        rec.status = status
        if status == "break":
            rec.working_hours = None if rec.check_in is None else rec.working_hours
    await db.commit()
    await db.refresh(rec)
    return {"message": f"Status set to {status}", "record": {"id": str(rec.id), "status": status}}

@router.get("")
async def list_attendance(
    user_id: uuid.UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    view: str = Query(default="day", enum=["day","week","month"]),
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user)
):
    # permission: employee can only see own
    target_user = user_id or current.id
    if current.role == "employee" and str(target_user) != str(current.id):
        raise HTTPException(status_code=403, detail="Employees can only view own attendance")
    q = select(AttendanceRecord).where(AttendanceRecord.company_id==current.company_id)
    if current.role == "employee":
        q = q.where(AttendanceRecord.user_id==current.id)
    elif user_id:
        q = q.where(AttendanceRecord.user_id==target_user)
    if date_from:
        q = q.where(AttendanceRecord.date >= date_from)
    if date_to:
        q = q.where(AttendanceRecord.date <= date_to)
    q = q.order_by(AttendanceRecord.date.desc())
    res = await db.execute(q)
    records = res.scalars().all()
    return [{"id": str(r.id), "user_id": str(r.user_id), "date": r.date.isoformat(), "check_in": r.check_in.isoformat() if r.check_in else None, "check_out": r.check_out.isoformat() if r.check_out else None, "working_hours": r.working_hours, "status": r.status, "location_in": r.location_in, "location_out": r.location_out} for r in records]

@router.get("/today")
async def today_status(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    today = date.today()
    res = await db.execute(select(AttendanceRecord).where(AttendanceRecord.user_id==current.id, AttendanceRecord.date==today))
    rec = res.scalar_one_or_none()
    if not rec:
        return {"checked_in": False, "checked_out": False, "status": "absent"}
    return {"checked_in": bool(rec.check_in), "checked_out": bool(rec.check_out), "status": rec.status, "check_in": rec.check_in.isoformat() if rec.check_in else None, "check_out": rec.check_out.isoformat() if rec.check_out else None, "working_hours": rec.working_hours}

@router.get("/today/batch")
async def today_batch(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    """Admin/HR: today's status for all employees in company for per-card dot (image.png)"""
    if current.role not in ("admin","hr"):
        raise HTTPException(status_code=403, detail="Admin/HR only")
    today = date.today()
    # fetch all users in company
    from ..models.user import User as U
    ures = await db.execute(select(U).where(U.company_id==current.company_id))
    users = ures.scalars().all()
    ares = await db.execute(select(AttendanceRecord).where(AttendanceRecord.company_id==current.company_id, AttendanceRecord.date==today))
    by_user = {str(r.user_id): r for r in ares.scalars().all()}
    out = []
    for u in users:
        r = by_user.get(str(u.id))
        if not r:
            status = "absent"
            checked = False
        else:
            status = r.status
            checked = bool(r.check_in)
        # if on approved leave today, override to leave
        out.append({"user_id": str(u.id), "employee_id": u.employee_id, "status": status, "checked_in": checked})
    return out

@router.get("/week")
async def week_view(start: date | None = None, user_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    """ISO week Mon-Sun aggregation for weekly view (wireframe Attendance List view week)"""
    ref = start or date.today()
    # ISO Monday
    monday = ref - timedelta(days=ref.weekday())
    sunday = monday + timedelta(days=6)
    target = user_id or current.id
    if current.role == "employee" and str(target) != str(current.id):
        raise HTTPException(status_code=403, detail="Employees can only view own attendance")
    q = select(AttendanceRecord).where(AttendanceRecord.company_id==current.company_id, AttendanceRecord.date >= monday, AttendanceRecord.date <= sunday)
    if current.role == "employee":
        q = q.where(AttendanceRecord.user_id==current.id)
    elif target:
        q = q.where(AttendanceRecord.user_id==target)
    q = q.order_by(AttendanceRecord.date.asc())
    res = await db.execute(q)
    rows = res.scalars().all()
    by_date = {r.date.isoformat(): r for r in rows}
    days = []
    total_hrs = 0
    for i in range(7):
        d = monday + timedelta(days=i)
        r = by_date.get(d.isoformat())
        if r:
            total_hrs += r.working_hours or 0
            days.append({"date": d.isoformat(), "weekday": d.strftime("%a"), "check_in": r.check_in.isoformat() if r.check_in else None, "check_out": r.check_out.isoformat() if r.check_out else None, "working_hours": r.working_hours, "status": r.status})
        else:
            days.append({"date": d.isoformat(), "weekday": d.strftime("%a"), "check_in": None, "check_out": None, "working_hours": None, "status": "absent"})
    # payroll basis: half_day 0.5, absent 0, present 1, leave 1
    payable = sum(0 if d["status"]=="absent" else 0.5 if d["status"]=="half_day" else 1 for d in days)
    return {"monday": monday.isoformat(), "sunday": sunday.isoformat(), "days": days, "total_hours": round(total_hrs,2), "payable_days": payable}

@router.get("/absentees")
async def get_absentees(target_date: date | None = None, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    from ..models.leave import LeaveRequest
    ref_date = target_date or date.today()

    # 1. Fetch all active employees in company
    users_res = await db.execute(select(User).where(User.company_id == current.company_id, User.is_active == True))
    all_users = users_res.scalars().all()

    # 2. Fetch all attendance records for ref_date
    att_res = await db.execute(select(AttendanceRecord).where(AttendanceRecord.company_id == current.company_id, AttendanceRecord.date == ref_date))
    att_map = {str(r.user_id): r for r in att_res.scalars().all()}

    # 3. Fetch approved leaves covering ref_date
    leave_res = await db.execute(select(LeaveRequest).where(
        LeaveRequest.company_id == current.company_id,
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= ref_date,
        LeaveRequest.end_date >= ref_date
    ))
    leave_map = {str(l.user_id): l for l in leave_res.scalars().all()}

    absentees = []
    for u in all_users:
        uid = str(u.id)
        att = att_map.get(uid)
        leave = leave_map.get(uid)

        is_present = att and att.status in ("present", "half_day", "break") and att.check_in is not None
        if not is_present:
            leave_name = str(leave.type).capitalize() if leave else None
            status_label = "on_leave" if leave else "absent"
            absentees.append({
                "user_id": uid,
                "employee_id": u.employee_id,
                "name": f"{u.first_name} {u.last_name}".strip(),
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "phone": u.phone or "—",
                "department": u.department or "General",
                "job_title": u.job_title or "Employee",
                "avatar_url": u.avatar_url,
                "role": str(u.role),
                "status": status_label,
                "is_on_leave": bool(leave),
                "leave_type": leave_name,
                "date": ref_date.isoformat()
            })

    return {
        "date": ref_date.isoformat(),
        "total_employees": len(all_users),
        "absent_count": len(absentees),
        "absentees": absentees
    }
