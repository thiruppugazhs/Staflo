from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, date, timedelta, timezone
import re
import time

from ..db.session import get_db
from ..core.deps import get_current_user
from ..core.config import settings
from ..models.user import User
from ..models.leave import LeaveBalance, LeaveRequest
from ..models.attendance import AttendanceRecord
from ..models.payroll import SalaryStructure
from ..models.meeting import Meeting

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# in-memory rate limit: 20 questions / hour / user (Add ons.md:172)
_rate: dict[str, list[float]] = {}
RATE_LIMIT = 20
RATE_WINDOW = 3600


def _rate_ok(user_id: str) -> bool:
    now = time.time()
    bucket = [t for t in _rate.get(user_id, []) if now - t < RATE_WINDOW]
    if len(bucket) >= RATE_LIMIT:
        _rate[user_id] = bucket
        return False
    bucket.append(now)
    _rate[user_id] = bucket
    return True


async def build_context(db: AsyncSession, user: User) -> tuple[dict, list[str]]:
    """Fetch the authenticated user's live data (scoped). Returns context + sources used."""
    ctx: dict = {}
    sources: list[str] = []
    today = date.today()

    # leave balance
    res = await db.execute(select(LeaveBalance).where(LeaveBalance.user_id == user.id))
    bal = res.scalars().first()
    if bal:
        ctx["leave_balance"] = {
            "year": bal.year,
            "paid_remaining": bal.paid_remaining,
            "sick_remaining": bal.sick_remaining,
            "unpaid_taken": bal.unpaid_taken,
        }
        sources.append("leave_balance")

    # leave requests summary
    res = await db.execute(select(LeaveRequest).where(LeaveRequest.user_id == user.id).order_by(LeaveRequest.created_at.desc()).limit(10))
    leaves = res.scalars().all()
    if leaves:
        ctx["recent_leaves"] = [
            {"type": str(l.type), "start": str(l.start_date), "end": str(l.end_date), "days": l.days, "status": str(l.status)}
            for l in leaves[:5]
        ]
        sources.append("leave_requests")

    # attendance this month
    month_start = today.replace(day=1)
    res = await db.execute(select(AttendanceRecord).where(
        AttendanceRecord.user_id == user.id,
        AttendanceRecord.date >= month_start,
        AttendanceRecord.date <= today,
    ))
    recs = res.scalars().all()
    if recs:
        present = sum(1 for r in recs if r.status == "present")
        half = sum(1 for r in recs if r.status == "half_day")
        absent = sum(1 for r in recs if r.status == "absent")
        leave_d = sum(1 for r in recs if r.status == "leave")
        hours = round(sum(r.working_hours or 0 for r in recs), 1)
        last_checkin = max((r.check_in for r in recs if r.check_in), default=None)
        ctx["attendance_this_month"] = {
            "month": month_start.strftime("%B %Y"),
            "present": present, "half_day": half, "absent": absent, "leave": leave_d,
            "total_hours": hours, "records": len(recs),
            "last_check_in": last_checkin.isoformat() if last_checkin else None,
        }
        sources.append("attendance")

    # salary structure (own only)
    res = await db.execute(select(SalaryStructure).where(SalaryStructure.user_id == user.id).order_by(SalaryStructure.created_at.desc()))
    sal = res.scalars().first()
    if sal and isinstance(sal.breakdown, dict):
        ctx["salary"] = {
            "monthly_wage": float(sal.monthly_wage),
            "yearly_wage": float(sal.yearly_wage),
            "net_pay": sal.breakdown.get("net_pay"),
            "total_earnings": sal.breakdown.get("total_earnings"),
            "total_deductions": sal.breakdown.get("total_deductions"),
            "basic_amount": sal.breakdown.get("basic_amount"),
            "components": [
                {"name": b.get("name"), "type": b.get("type"), "monthly": b.get("amount_monthly")}
                for b in (sal.breakdown.get("breakdown") or [])
            ],
        }
        sources.append("salary_structure")

    # upcoming meetings
    now = datetime.now(timezone.utc)
    res = await db.execute(select(Meeting).where(Meeting.company_id == user.company_id, Meeting.start_time >= now, Meeting.status == "scheduled").order_by(Meeting.start_time.asc()).limit(20))
    meets = [m for m in res.scalars().all() if str(user.id) in (m.attendee_ids or [])]
    if meets:
        ctx["upcoming_meetings"] = [
            {"title": m.title, "start": m.start_time.isoformat(), "link": m.meet_link} for m in meets[:3]
        ]
        sources.append("meetings")

    ctx["profile"] = {
        "name": f"{user.first_name} {user.last_name}",
        "employee_id": user.employee_id,
        "role": str(user.role),
        "department": user.department or "—",
        "job_title": user.job_title or "—",
    }
    return ctx, sources


def _rule_answer(question: str, ctx: dict) -> str | None:
    """Deterministic answers from real DB data — used when no Anthropic key configured."""
    q = question.lower()
    name = ctx.get("profile", {}).get("name", "")

    lb = ctx.get("leave_balance")
    if lb and any(k in q for k in ["leave", "time off", "vacation"]):
        if "left" in q or "remaining" in q or "balance" in q or "have" in q:
            return (
                f"You have {lb['paid_remaining']} paid leaves and {lb['sick_remaining']} sick leaves "
                f"remaining for {lb['year']}. You've taken {lb['unpaid_taken']} unpaid leave day(s) so far. "
                f"Apply via the Time Off page."
            )
        if "apply" in q or "request" in q or "how do i" in q or "how to" in q:
            return ("Go to Time Off → pick type (Paid/Sick/Unpaid), select dates, add remarks and attach a doc "
                    "if needed. Your request goes to HR as Pending until approved.")
        if any(k in q for k in ["sick", "medical"]):
            return (f"Sick leave remaining: {lb['sick_remaining']} day(s). Select 'Sick' on the Time Off page and "
                    "attach a medical certificate if required.")

    att = ctx.get("attendance_this_month")
    if att and any(k in q for k in ["present", "attendance", "check in", "checked in", "hours", "absent"]):
        if "today" in q and att.get("last_check_in"):
            t = datetime.fromisoformat(att["last_check_in"])
            return f"You checked in today at {t.strftime('%I:%M %p')} (per attendance records)."
        if "check in" in q or "checked in" in q:
            if att.get("last_check_in"):
                t = datetime.fromisoformat(att["last_check_in"])
                return f"Your latest check-in was {t.strftime('%a %d %b at %I:%M %p')}."
            return "No check-ins recorded yet this month."
        return (
            f"This month ({att['month']}): present {att['present']} day(s), half-day {att['half_day']}, "
            f"absent {att['absent']}, leave {att['leave']} — total {att['total_hours']}h across {att['records']} record(s)."
        )

    sal = ctx.get("salary")
    if sal and any(k in q for k in ["salary", "pay", "wage", "pf", "deduction", "earning", "net", "breakdown", "stipend"]):
        comps = sal.get("components") or []
        pf = next((c for c in comps if c["name"].lower().startswith("pf")), None)
        if "pf" in q and pf:
            return f"Your PF deduction is ₹{pf['monthly']} per month (12% of Basic as per your salary structure)."
        if "net" in q:
            return f"Your net pay is ₹{sal.get('net_pay')} / month (earnings ₹{sal.get('total_earnings')} minus deductions ₹{sal.get('total_deductions')})."
        lines = ", ".join(f"{c['name']} ₹{c['monthly']}" for c in comps[:8])
        return (f"Your monthly wage is ₹{sal['monthly_wage']}. Breakdown — {lines}. "
                f"Net pay ₹{sal.get('net_pay')}.")

    meets = ctx.get("upcoming_meetings")
    if meets and any(k in q for k in ["meeting", "meet", "call", "standup"]):
        nxt = meets[0]
        t = datetime.fromisoformat(nxt["start"])
        extra = f" Plus {len(meets)-1} more." if len(meets) > 1 else ""
        return f"Your next meeting is '{nxt['title']}' on {t.strftime('%a %d %b at %I:%M %p')}.{extra}"

    prof = ctx.get("profile")
    if prof and any(k in q for k in ["who am i", "my id", "employee id", "my role", "my department", "my profile"]):
        return f"You are {prof['name']} ({prof['employee_id']}), role: {prof['role']}, department: {prof['department']}, title: {prof['job_title']}."

    # HR-domain guardrail
    hr_words = ["hr", "leave", "attendance", "salary", "payroll", "meeting", "policy", "balance", "time off"]
    if not any(w in q for w in hr_words):
        return ("I can help with HR-related questions like leave balance, attendance, salary breakdown, "
                "and meetings. For other queries, please contact your manager.")
    return None


async def _openai_answer(question: str, ctx: dict, company_hint: str) -> str | None:
    """Call an OpenAI-compatible chat API with employee context. Returns None if unavailable."""
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        return None
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key, base_url=settings.OPENAI_BASE_URL)
        system = (
            f"You are an HR assistant for {company_hint}. Answer ONLY using the provided JSON context about "
            "the authenticated employee. Never fabricate data; say so if info is missing. Refuse questions about "
            "other employees, medical/legal advice, or non-HR topics. Be concise (max 120 words)."
        )
        user_msg = f"Employee data:\n{ctx}\n\nQuestion: {question}"
        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=300,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_msg},
            ],
        )
        text = (resp.choices[0].message.content or "").strip() if resp.choices else ""
        return text or None
    except Exception as e:
        print(f"[CHATBOT] openai failed: {e}")
    return None


async def _claude_answer(question: str, ctx: dict, company_hint: str) -> str | None:
    """Call Anthropic Claude API with employee context. Returns None if unavailable."""
    import httpx
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        return None
    system = (
        f"You are an HR assistant for {company_hint}. Answer ONLY using the provided JSON context about "
        "the authenticated employee. Never fabricate data; say so if info is missing. Refuse questions about "
        "other employees, medical/legal advice, or non-HR topics. Be concise (max 120 words)."
    )
    user_msg = f"Employee data:\n{ctx}\n\nQuestion: {question}"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={
                    "model": settings.ANTHROPIC_MODEL,
                    "max_tokens": 300,
                    "system": system,
                    "messages": [{"role": "user", "content": user_msg}],
                },
            )
            if r.status_code == 200:
                data = r.json()
                parts = data.get("content") or []
                text = "".join(p.get("text", "") for p in parts if p.get("type") == "text")
                return text.strip() or None
            print(f"[CHATBOT] anthropic {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"[CHATBOT] claude failed: {e}")
    return None


async def _gemini_answer(question: str, ctx: dict, company_hint: str) -> str | None:
    """Call Google Gemini API with employee context for AI Agent Raya."""
    import httpx
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    agent_name = settings.AGENT_NAME or "Raya"
    system_instruction = (
        f"You are {agent_name}, the intelligent AI HR Agent for {company_hint}. "
        "Answer questions accurately, warmly, and professionally ONLY using the provided JSON context about "
        "the authenticated employee. Never fabricate data; politely inform the employee if specific info is not available. "
        "Refuse to answer questions about other employees' sensitive records, medical diagnoses, or non-HR topics. "
        "Be concise, helpful, and clear (max 150 words)."
    )
    prompt = f"Employee Live Context:\n{ctx}\n\nEmployee Question: {question}"

    # Standard Gemini 1.5 API Endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 400
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates") or []
                if candidates:
                    content = candidates[0].get("content") or {}
                    parts = content.get("parts") or []
                    text = "".join(p.get("text", "") for p in parts)
                    if text.strip():
                        return text.strip()
            print(f"[CHATBOT] Gemini response {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"[CHATBOT] Gemini request failed: {e}")
    return None


@router.post("/ask")
async def ask(payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    question = (payload.get("question") or "").strip()
    # validations per Add ons.md:171
    if not question:
        raise HTTPException(status_code=400, detail="Question required")
    if len(question) > 500:
        raise HTTPException(status_code=400, detail="Question max 500 characters")
    # basic prompt-injection / XSS strip
    question = re.sub(r"[<>]", "", question)

    if not _rate_ok(str(current.id)):
        raise HTTPException(status_code=429, detail="Rate limit: max 20 questions/hour")

    ctx, sources = await build_context(db, current)

    engine = "gemini"
    # 1. Primary: Google Gemini (Raya)
    answer = await _gemini_answer(question, ctx, "Staflo")
    if not answer:
        # 2. Fallbacks
        answer = await _openai_answer(question, ctx, "Staflo")
        if answer:
            engine = "openai"
        else:
            answer = await _claude_answer(question, ctx, "Staflo")
            if answer:
                engine = "claude"
            else:
                answer = _rule_answer(question, ctx)
                engine = "rules"

    if not answer:
        answer = ("I don't have that information yet. Try asking about leave balance, attendance, "
                  "salary, meetings, or your profile.")

    return {"answer": answer, "data_used": sources, "engine": engine, "agent": settings.AGENT_NAME or "Raya"}
