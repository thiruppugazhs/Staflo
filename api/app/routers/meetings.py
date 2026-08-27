from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime, timedelta, timezone
import re
from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.user import User
from ..models.meeting import Meeting, MeetingStatus
from ..models.company import Company
from ..services.google_meet import (
    create_calendar_event_with_meet,
    create_instant_meet,
    delete_calendar_event,
    is_configured,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])

def _sanitize(text: str | None) -> str | None:
    if not text:
        return text
    # strip tags, limit length
    s = re.sub(r'<[^>]*>', '', text).strip()
    return s

@router.post("")
async def create_meeting(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_admin)
):
    title = _sanitize(payload.get("title", ""))
    description = _sanitize(payload.get("description", ""))
    start_str = payload.get("start_time")
    end_str = payload.get("end_time")
    attendee_ids = payload.get("attendee_ids") or payload.get("attendees") or []

    # validations per Add ons.md
    if not title or len(title) < 3 or len(title) > 200:
        raise HTTPException(status_code=400, detail="Title required 3-200 characters")
    if description and len(description) > 1000:
        raise HTTPException(status_code=400, detail="Description max 1000 characters")
    if not start_str or not end_str:
        raise HTTPException(status_code=400, detail="start_time and end_time required (ISO format)")
    try:
        start_time = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format, use ISO8601")
    # ensure timezone aware
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    if start_time <= now:
        raise HTTPException(status_code=400, detail="Start time must be in the future")
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    if not attendee_ids or len(attendee_ids) == 0:
        raise HTTPException(status_code=400, detail="At least one attendee required")

    # validate attendees are valid users in same company and active
    attendee_uuids = []
    attendee_emails = []
    for aid in attendee_ids:
        try:
            uid = uuid.UUID(str(aid))
        except:
            raise HTTPException(status_code=400, detail=f"Invalid attendee id: {aid}")
        res = await db.execute(select(User).where(User.id == uid, User.company_id == current.company_id, User.is_active == True))
        u = res.scalar_one_or_none()
        if not u:
            raise HTTPException(status_code=400, detail=f"Attendee {aid} not found in company or inactive")
        attendee_uuids.append(str(uid))
        attendee_emails.append(u.email)

    # create Google Calendar event + Meet link (real API, demo fallback)
    meet_link, cal_event_id, meet_source = await create_calendar_event_with_meet(
        title=title,
        description=description or "",
        start_time=start_time,
        end_time=end_time,
        attendee_emails=attendee_emails,
        organizer_email=current.email
    )

    meeting = Meeting(
        company_id=current.company_id,
        organizer_id=current.id,
        title=title,
        description=description,
        meet_link=meet_link,
        calendar_event_id=cal_event_id,
        start_time=start_time,
        end_time=end_time,
        status=MeetingStatus.scheduled,
        attendee_ids=attendee_uuids
    )
    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)

    # background email to attendees
    def send_invites():
        try:
            from ..services.mail import send_email
            comp_res = None
            # fetch company name synchronously not needed - use generic
            html = f"""
            <div style="font-family:sans-serif; max-width:600px; margin:auto; border:1px solid #e5e7eb; border-radius:8px; padding:24px;">
              <h2 style="color:#eab308;">New Meeting: {title}</h2>
              <p><b>Organizer:</b> {current.first_name} {current.last_name} ({current.email})</p>
              <p><b>When:</b> {start_time.strftime('%a, %d %b %Y %H:%M UTC')} → {end_time.strftime('%H:%M UTC')}</p>
              {f'<p>{description}</p>' if description else ''}
              <a href="{meet_link}" style="display:inline-block; background:#eab308; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:12px;">Join Google Meet</a>
              <p style="color:#6b7280; font-size:12px; margin-top:16px;">Meeting ID: {meeting.id}</p>
            </div>
            """
            for email in attendee_emails:
                send_email(email, f"Meeting Invite: {title} • {start_time.strftime('%d %b %H:%M')}", html, f"Join: {meet_link}")
            # notify
            from ..routers.notifications import add_notification
            add_notification(current.company_id, "Meeting Scheduled", f"{title} with {len(attendee_emails)} attendees • {meet_link}", "info")
        except Exception as e:
            print(f"[MEET EMAIL] failed: {e}")

    background_tasks.add_task(send_invites)

    return {
        "id": str(meeting.id),
        "company_id": str(meeting.company_id),
        "organizer_id": str(meeting.organizer_id),
        "title": meeting.title,
        "description": meeting.description,
        "meet_link": meeting.meet_link,
        "calendar_event_id": meeting.calendar_event_id,
        "start_time": meeting.start_time.isoformat(),
        "end_time": meeting.end_time.isoformat(),
        "status": meeting.status,
        "attendee_ids": meeting.attendee_ids,
        "source": meet_source,
        "google_meet_configured": is_configured(),
        "created_at": meeting.created_at.isoformat() if meeting.created_at else None
    }

@router.get("")
async def list_meetings(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    q = select(Meeting).where(Meeting.company_id == current.company_id).order_by(Meeting.start_time.desc())
    res = await db.execute(q)
    rows = res.scalars().all()
    # role filtering
    if current.role not in ("admin", "hr"):
        rows = [r for r in rows if str(current.id) in (r.attendee_ids or []) or str(r.organizer_id) == str(current.id)]
    return [
        {
            "id": str(r.id),
            "title": r.title,
            "description": r.description,
            "meet_link": r.meet_link,
            "calendar_event_id": r.calendar_event_id,
            "start_time": r.start_time.isoformat(),
            "end_time": r.end_time.isoformat(),
            "status": r.status,
            "organizer_id": str(r.organizer_id),
            "attendee_ids": r.attendee_ids,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in rows
    ]

@router.get("/upcoming")
async def upcoming_meetings(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    q = select(Meeting).where(Meeting.company_id == current.company_id, Meeting.start_time >= now, Meeting.status == MeetingStatus.scheduled).order_by(Meeting.start_time.asc())
    res = await db.execute(q)
    rows = res.scalars().all()
    if current.role not in ("admin", "hr"):
        rows = [r for r in rows if str(current.id) in (r.attendee_ids or []) or str(r.organizer_id) == str(current.id)]
    # mark live
    out = []
    for r in rows[:10]:
        is_live = r.start_time <= now <= r.end_time
        out.append({
            "id": str(r.id),
            "title": r.title,
            "description": r.description,
            "meet_link": r.meet_link,
            "start_time": r.start_time.isoformat(),
            "end_time": r.end_time.isoformat(),
            "status": r.status,
            "organizer_id": str(r.organizer_id),
            "attendee_ids": r.attendee_ids,
            "is_live": is_live,
            "attendee_count": len(r.attendee_ids or [])
        })
    return out

@router.post("/instant")
async def instant_meet(payload: dict | None = None, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    # optionally invite the selected employee (from Communication Hub) to the call
    attendee_emails = []
    attendee_ids = [str(current.id)]
    data = payload or {}
    if data.get("attendee_id"):
        try:
            uid = uuid.UUID(str(data["attendee_id"]))
        except:
            raise HTTPException(status_code=400, detail="Invalid attendee id")
        res = await db.execute(select(User).where(User.id == uid, User.company_id == current.company_id, User.is_active == True))
        u = res.scalar_one_or_none()
        if not u:
            raise HTTPException(status_code=400, detail="Attendee not found in company or inactive")
        if str(uid) != str(current.id):
            attendee_ids.append(str(uid))
            attendee_emails.append(u.email)

    meet_link, cal_id, meet_source = await create_instant_meet(
        organizer_email=current.email,
        attendee_emails=attendee_emails,
    )
    now = datetime.now(timezone.utc)
    end = now + timedelta(hours=1)
    meeting = Meeting(
        company_id=current.company_id,
        organizer_id=current.id,
        title="Instant Meet",
        description=f"Instant call by {current.first_name} {current.last_name}",
        meet_link=meet_link,
        calendar_event_id=cal_id,
        start_time=now,
        end_time=end,
        status=MeetingStatus.scheduled,
        attendee_ids=attendee_ids
    )
    db.add(meeting)
    await db.commit()
    return {
        "meet_link": meet_link,
        "link": meet_link,
        "url": meet_link,
        "calendar_event_id": cal_id,
        "id": str(meeting.id),
        "source": meet_source,
        "google_meet_configured": is_configured(),
    }

@router.delete("/{meeting_id}")
async def cancel_meeting(meeting_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    try:
        mid = uuid.UUID(meeting_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid id")
    res = await db.execute(select(Meeting).where(Meeting.id == mid, Meeting.company_id == current.company_id))
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    m.status = MeetingStatus.cancelled
    await db.commit()
    # remove the backing Google Calendar event (no-op for demo ids)
    cal_deleted = await delete_calendar_event(m.calendar_event_id)
    return {"cancelled": True, "id": meeting_id, "calendar_event_deleted": cal_deleted}
