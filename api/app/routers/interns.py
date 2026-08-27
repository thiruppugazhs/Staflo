from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
from datetime import date, datetime, timezone

from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.user import User, UserRole
from ..models.company import Company
from ..models.intern import (
    InternshipDetail, InternEvaluation, InternshipStatus, ConversionStatus,
    EvaluationType, Recommendation, compute_overall, score_band,
)
from ..models.leave import LeaveBalance

router = APIRouter(prefix="/interns", tags=["interns"])

INTERN_PAID = 3
INTERN_SICK = 2


async def _detail_for_company(db: AsyncSession, intern_id, company_id) -> InternshipDetail | None:
    res = await db.execute(select(InternshipDetail).where(
        InternshipDetail.user_id == intern_id,
        InternshipDetail.company_id == company_id,
    ).order_by(InternshipDetail.created_at.desc()).limit(1))
    return res.scalars().first()


def _progress(d: InternshipDetail) -> dict:
    today = date.today()
    total = max(1, (d.end_date - d.start_date).days)
    elapsed = min(max(0, (today - d.start_date).days), total)
    pct = round(elapsed / total * 100)
    midterm_at = d.start_date + (d.end_date - d.start_date) / 2
    return {
        "day": elapsed, "total_days": total, "percent": pct,
        "midterm_due": today >= midterm_at and d.status in ("active", "extended"),
        "final_due": pct >= 85 and d.status in ("active", "extended"),
        "days_remaining": max(0, (d.end_date - today).days),
    }


async def _serialize(db: AsyncSession, d: InternshipDetail, include_private: bool = True) -> dict:
    u = await db.execute(select(User).where(User.id == d.user_id))
    user = u.scalar_one_or_none()
    mentor_name = mentor_email = mentor_phone = None
    if d.mentor_id:
        mres = await db.execute(select(User).where(User.id == d.mentor_id))
        mentor = mres.scalar_one_or_none()
        if mentor:
            mentor_name = f"{mentor.first_name} {mentor.last_name}"
            mentor_email = mentor.email
            mentor_phone = mentor.phone
    evals = await db.execute(select(InternEvaluation).where(InternEvaluation.intern_id == d.user_id))
    evaluations = evals.scalars().all()
    return {
        "id": str(d.id),
        "user_id": str(d.user_id),
        "name": f"{user.first_name} {user.last_name}" if user else "",
        "employee_id": user.employee_id if user else "",
        "email": user.email if user else "",
        "role": str(user.role) if user else "",
        "avatar_url": user.avatar_url if user else None,
        "mentor_id": str(d.mentor_id) if d.mentor_id else None,
        "mentor_name": mentor_name,
        "mentor_email": mentor_email,
        "mentor_phone": mentor_phone,
        "department": d.department,
        "start_date": d.start_date.isoformat(),
        "end_date": d.end_date.isoformat(),
        "stipend": float(d.stipend),
        "status": str(d.status),
        "project_title": d.project_title,
        "institute": d.institute,
        "evaluation_score": d.evaluation_score,
        "conversion_status": str(d.conversion_status),
        "conversion_date": d.conversion_date.isoformat() if d.conversion_date else None,
        **_progress(d),
        "evaluations": [
            {
                "id": str(e.id), "type": str(e.evaluation_type), "overall_score": e.overall_score,
                "band": score_band(e.overall_score), "technical": e.technical,
                "communication": e.communication, "teamwork": e.teamwork,
                "punctuality": e.punctuality, "initiative": e.initiative,
                "strengths": e.strengths, "improvements": e.improvements,
                # recommendation visible to admin only (Add ons.md:266)
                **({"recommendation": str(e.recommendation)} if include_private and e.recommendation else {}),
                "created_at": e.created_at.isoformat() if e.created_at else None,
            } for e in sorted(evaluations, key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc))
        ],
    }


@router.post("")
async def create_internship(payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    """Create internship details for an existing company user; sets role=intern + reduced leave."""
    uid = payload.get("user_id")
    if not uid:
        raise HTTPException(status_code=400, detail="user_id required")
    try:
        target_uuid = uuid.UUID(str(uid))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id")
    res = await db.execute(select(User).where(User.id == target_uuid, User.company_id == current.company_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in company")
    existing = await _detail_for_company(db, user.id, current.company_id)
    if existing and existing.status in ("active", "extended"):
        raise HTTPException(status_code=400, detail="User already has an active internship")

    try:
        start = date.fromisoformat(payload["start_date"])
        end = date.fromisoformat(payload["end_date"])
    except Exception:
        raise HTTPException(status_code=400, detail="start_date and end_date required (YYYY-MM-DD)")
    if end <= start:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    mentor_id = payload.get("mentor_id") or None
    if mentor_id:
        try:
            mentor_uuid = uuid.UUID(str(mentor_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid mentor_id")
        mres = await db.execute(select(User).where(User.id == mentor_uuid, User.company_id == current.company_id))
        mentor = mres.scalar_one_or_none()
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found in company")
        mentor_id = mentor_uuid

    stipend = payload.get("stipend", 0)
    try:
        stipend = max(0.0, float(stipend))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="stipend must be a number")

    d = InternshipDetail(
        user_id=user.id,
        company_id=current.company_id,
        mentor_id=mentor_id,
        department=payload.get("department") or user.department,
        start_date=start,
        end_date=end,
        stipend=stipend,
        project_title=payload.get("project_title"),
        institute=payload.get("institute"),
    )
    user.role = UserRole.intern
    db.add(d)

    # reduced leave allocation for internship year (Add ons.md:321)
    year = start.year
    bres = await db.execute(select(LeaveBalance).where(LeaveBalance.user_id == user.id, LeaveBalance.year == year))
    bal = bres.scalar_one_or_none()
    if not bal:
        db.add(LeaveBalance(user_id=user.id, company_id=current.company_id, year=year,
                            paid_remaining=INTERN_PAID, sick_remaining=INTERN_SICK))

    await db.commit()

    # notifications per Add ons.md:326-327
    try:
        from .notifications import add_notification
        from ..services.mail import send_email
        add_notification(current.company_id, "Intern Onboarded",
                         f"{user.first_name} {user.last_name} ({user.employee_id}) internship {start} → {end}", "info")
        if mentor_id:
            m_res = await db.execute(select(User).where(User.id == mentor_id))
            mentor = m_res.scalar_one_or_none()
            add_notification(current.company_id, "Mentor Assigned",
                             f"You are the mentor for {user.first_name} {user.last_name} — see My Interns", "info",
                             to_emails=mentor.email if mentor else None)
        send_email(user.email, "Welcome as Intern — Staflo",
                   f"<p>Hi {user.first_name},</p><p>Your internship ({start} → {end}) is active. Stipend ₹{stipend}/month.</p>",
                   f"Internship {start} - {end}, stipend {stipend}")
    except Exception as e:
        print(f"[INTERN] notify failed: {e}")

    await db.refresh(d)
    return await _serialize(db, d)


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    res = await db.execute(select(InternshipDetail).where(InternshipDetail.company_id == current.company_id))
    rows = res.scalars().all()
    today = date.today()
    active = [r for r in rows if r.status == "active"]
    ending_soon = [r for r in active if 0 <= (r.end_date - today).days <= 7]
    awaiting_decision = [r for r in rows if r.status == "completed" or r.conversion_status == "pending" and r.evaluation_score]
    pending_evals = []
    for r in active:
        p = _progress(r)
        eres = await db.execute(select(func.count(InternEvaluation.id)).where(InternEvaluation.intern_id == r.user_id))
        cnt = eres.scalar() or 0
        if p["final_due"] or (p["midterm_due"] and cnt == 0):
            pending_evals.append(str(r.id))
    return {
        "total_interns": len(rows),
        "active": len(active),
        "ending_within_7_days": len(ending_soon),
        "pending_evaluations": len(pending_evals),
        "awaiting_decision": len(awaiting_decision),
    }


@router.get("/my-interns")
async def my_interns(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    res = await db.execute(select(InternshipDetail).where(
        InternshipDetail.mentor_id == current.id, InternshipDetail.company_id == current.company_id))
    rows = res.scalars().all()
    return [await _serialize(db, d, include_private=False) for d in rows]


@router.get("/my-internship")
async def my_internship(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    d = await _detail_for_company(db, current.id, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="No internship record")
    return await _serialize(db, d, include_private=False)


@router.get("")
async def list_interns(
    status: str | None = None, department: str | None = None, mentor_id: str | None = None,
    db: AsyncSession = Depends(get_db), current: User = Depends(require_admin),
):
    q = select(InternshipDetail).where(InternshipDetail.company_id == current.company_id)
    if status:
        q = q.where(InternshipDetail.status == status)
    if department:
        q = q.where(InternshipDetail.department.ilike(f"%{department}%"))
    if mentor_id:
        q = q.where(InternshipDetail.mentor_id == uuid.UUID(mentor_id))
    q = q.order_by(InternshipDetail.created_at.desc())
    res = await db.execute(q)
    rows = res.scalars().all()
    return [await _serialize(db, d) for d in rows]


@router.get("/{intern_id}")
async def get_intern(intern_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    try:
        iuuid = uuid.UUID(intern_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    d = await _detail_for_company(db, iuuid, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="Intern not found")
    is_self = str(current.id) == intern_id
    is_mentor = d.mentor_id and str(d.mentor_id) == str(current.id)
    if not (is_self or is_mentor or current.role in ("admin", "hr")):
        raise HTTPException(status_code=403, detail="Forbidden")
    return await _serialize(db, d, include_private=(current.role in ("admin", "hr")))


@router.put("/{intern_id}")
async def update_intern(intern_id: str, payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    try:
        iuuid = uuid.UUID(intern_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    d = await _detail_for_company(db, iuuid, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="Intern not found")
    for field in ("department", "project_title", "institute"):
        if field in payload:
            setattr(d, field, payload[field])
    if "stipend" in payload:
        d.stipend = max(0.0, float(payload["stipend"]))
    if "mentor_id" in payload:
        mid = payload["mentor_id"]
        if mid:
            try:
                muuid = uuid.UUID(str(mid))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid mentor_id")
            mres = await db.execute(select(User).where(User.id == muuid, User.company_id == current.company_id))
            if not mres.scalar_one_or_none():
                raise HTTPException(status_code=404, detail="Mentor not found")
            d.mentor_id = muuid
        else:
            d.mentor_id = None
    if "status" in payload and payload["status"] in [s.value for s in InternshipStatus]:
        d.status = payload["status"]
    await db.commit()
    return await _serialize(db, d)


@router.post("/{intern_id}/evaluate")
async def evaluate(intern_id: str, payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    try:
        iuuid = uuid.UUID(intern_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    d = await _detail_for_company(db, iuuid, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="Intern not found")
    is_mentor = d.mentor_id and str(d.mentor_id) == str(current.id)
    if not (is_mentor or current.role in ("admin", "hr")):
        raise HTTPException(status_code=403, detail="Only mentor or admin can evaluate")

    etype = payload.get("evaluation_type")
    if etype not in ("midterm", "final"):
        raise HTTPException(status_code=400, detail="evaluation_type must be midterm|final")
    scores = {}
    for field in ("technical", "communication", "teamwork", "punctuality", "initiative"):
        v = payload.get(field)
        if not isinstance(v, int) or not (1 <= v <= 10):
            raise HTTPException(status_code=400, detail=f"{field} must be integer 1-10")
        scores[field] = v
    recommendation = payload.get("recommendation")
    if etype == "final":
        if recommendation not in ("convert", "extend", "end"):
            raise HTTPException(status_code=400, detail="Final evaluation requires recommendation convert|extend|end")
    elif recommendation:
        recommendation = None

    overall = compute_overall(**scores)
    ev = InternEvaluation(
        intern_id=d.user_id, evaluator_id=current.id, company_id=current.company_id,
        evaluation_type=etype, overall_score=overall,
        strengths=payload.get("strengths"), improvements=payload.get("improvements"),
        comments=payload.get("comments"), recommendation=recommendation, **scores,
    )
    db.add(ev)
    d.evaluation_score = overall
    await db.commit()

    # notify intern with scores (Add ons.md:330)
    try:
        i_res = await db.execute(select(User).where(User.id == d.user_id))
        intern_user = i_res.scalar_one_or_none()
        from .notifications import add_notification
        add_notification(current.company_id, f"{etype.capitalize()} Evaluation Submitted",
                         f"Score {overall}/100 ({score_band(overall)}) for intern {intern_id}", "success",
                         to_emails=intern_user.email if intern_user else None)
    except Exception:
        pass
    return {"id": str(ev.id), "overall_score": overall, "band": score_band(overall), "recommendation": recommendation}


@router.get("/{intern_id}/evaluations")
async def get_evaluations(intern_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    try:
        iuuid = uuid.UUID(intern_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    d = await _detail_for_company(db, iuuid, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="Intern not found")
    is_self = str(current.id) == intern_id
    is_mentor = d.mentor_id and str(d.mentor_id) == str(current.id)
    if not (is_self or is_mentor or current.role in ("admin", "hr")):
        raise HTTPException(status_code=403, detail="Forbidden")
    res = await db.execute(select(InternEvaluation).where(InternEvaluation.intern_id == iuuid))
    rows = res.scalars().all()
    show_rec = current.role in ("admin", "hr")
    return [{
        "id": str(e.id), "type": str(e.evaluation_type), "overall_score": e.overall_score,
        "band": score_band(e.overall_score), "technical": e.technical, "communication": e.communication,
        "teamwork": e.teamwork, "punctuality": e.punctuality, "initiative": e.initiative,
        "strengths": e.strengths, "improvements": e.improvements, "comments": e.comments,
        **({"recommendation": str(e.recommendation)} if show_rec and e.recommendation else {}),
        "created_at": e.created_at.isoformat() if e.created_at else None,
    } for e in rows]


@router.post("/{intern_id}/convert")
async def convert(intern_id: str, payload: dict | None = None, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    try:
        iuuid = uuid.UUID(intern_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    d = await _detail_for_company(db, iuuid, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="Intern not found")
    if d.status == "converted":
        raise HTTPException(status_code=400, detail="Already converted")
    user_res = await db.execute(select(User).where(User.id == d.user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User missing")
    user.role = UserRole.employee
    d.status = InternshipStatus.converted
    d.conversion_status = ConversionStatus.accepted
    d.conversion_date = datetime.now(timezone.utc)
    # reset leave balance to employee level
    year = date.today().year
    bres = await db.execute(select(LeaveBalance).where(LeaveBalance.user_id == user.id, LeaveBalance.year == year))
    bal = bres.scalar_one_or_none()
    if not bal:
        db.add(LeaveBalance(user_id=user.id, company_id=current.company_id, year=year, paid_remaining=24, sick_remaining=7))
    else:
        bal.paid_remaining = max(bal.paid_remaining, 24)
        bal.sick_remaining = max(bal.sick_remaining, 7)
    await db.commit()
    try:
        from .notifications import add_notification
        add_notification(current.company_id, "Intern Converted",
                         f"{user.first_name} {user.last_name} converted to full-time employee 🎉", "success")
        from ..services.mail import send_email
        send_email(user.email, "Congratulations — You're now a full-time employee!",
                   f"<p>Hi {user.first_name},</p><p>Welcome aboard as a full-time employee! Your leave balance has been upgraded.</p>")
    except Exception:
        pass
    return await _serialize(db, d)


@router.post("/{intern_id}/extend")
async def extend(intern_id: str, payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    try:
        iuuid = uuid.UUID(intern_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    d = await _detail_for_company(db, iuuid, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="Intern not found")
    new_end = payload.get("end_date")
    if not new_end:
        raise HTTPException(status_code=400, detail="end_date required")
    try:
        end = date.fromisoformat(new_end)
    except ValueError:
        raise HTTPException(status_code=400, detail="end_date must be YYYY-MM-DD")
    if end <= d.end_date:
        raise HTTPException(status_code=400, detail="New end_date must be after current")
    d.end_date = end
    d.status = InternshipStatus.extended
    if "stipend" in payload:
        d.stipend = max(0.0, float(payload["stipend"]))
    await db.commit()
    try:
        from .notifications import add_notification
        u_res = await db.execute(select(User).where(User.id == d.user_id))
        intern_user = u_res.scalar_one_or_none()
        add_notification(current.company_id, "Internship Extended", f"New end date {end}", "info",
                         to_emails=intern_user.email if intern_user else None)
    except Exception:
        pass
    return await _serialize(db, d)


@router.post("/{intern_id}/end")
async def end_internship(intern_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    try:
        iuuid = uuid.UUID(intern_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    d = await _detail_for_company(db, iuuid, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="Intern not found")
    d.status = InternshipStatus.completed
    user_res = await db.execute(select(User).where(User.id == d.user_id))
    user = user_res.scalar_one_or_none()
    if user:
        user.is_active = False
    await db.commit()
    try:
        from .notifications import add_notification
        add_notification(current.company_id, "Internship Completed",
                         f"{user.first_name if user else intern_id} internship marked completed", "info",
                         to_emails=user.email if user else None)
    except Exception:
        pass
    return await _serialize(db, d)


@router.get("/{intern_id}/certificate")
async def certificate(intern_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    try:
        iuuid = uuid.UUID(intern_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    d = await _detail_for_company(db, iuuid, current.company_id)
    if not d:
        raise HTTPException(status_code=404, detail="Intern not found")
    user_res = await db.execute(select(User).where(User.id == d.user_id))
    user = user_res.scalar_one_or_none()
    comp_res = await db.execute(select(Company).where(Company.id == current.company_id))
    company = comp_res.scalar_one_or_none()
    pdf = certificate_pdf(
        company_name=company.name if company else "Staflo",
        intern_name=f"{user.first_name} {user.last_name}" if user else "Intern",
        employee_id=user.employee_id if user else "",
        department=d.department or "—",
        project_title=d.project_title or "",
        start_date=str(d.start_date),
        end_date=str(d.end_date),
        evaluation_score=d.evaluation_score,
        institute=d.institute,
    )
    fname = f"certificate_{user.employee_id if user else intern_id}.pdf"
    return Response(content=pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{fname}"'
    })
