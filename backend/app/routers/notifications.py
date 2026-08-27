from fastapi import APIRouter, Depends
from ..core.deps import get_current_user
from ..models.user import User
from ..services.mail import send_email
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])

# In-app notification feed (emails are delivered for real via Brevo SMTP)
_notifications = []

def add_notification(company_id: str, title: str, message: str, type: str = "info", to_emails=None):
    _notifications.append({
        "id": len(_notifications)+1,
        "company_id": str(company_id),
        "title": title,
        "message": message,
        "type": type,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    if not to_emails:
        return
    recipients = [to_emails] if isinstance(to_emails, str) else [e for e in to_emails if e]
    if not recipients:
        return
    html = (
        f"<div style=\"font-family: sans-serif; max-width: 600px; margin: auto; border:1px solid #e5e7eb; border-radius:8px; padding:24px;\">"
        f"<h2 style=\"color:#a855f7;\">{title}</h2>"
        f"<p>{message}</p>"
        f"<p style=\"color:#6b7280; font-size:12px; margin-top:24px;\">Staflo — Every workday, perfectly aligned.</p>"
        f"</div>"
    )
    for recipient in recipients:
        try:
            send_email(recipient, f"Staflo: {title}", html, message)
        except Exception as e:
            logger.error(f"[MAIL ERROR] notification '{title}' to {recipient}: {e}")

@router.get("")
async def list_notifications(current: User = Depends(get_current_user)):
    # return latest 20 for company
    filtered = [n for n in _notifications if n["company_id"] == str(current.company_id)]
    return filtered[-20:][::-1]

@router.post("/test")
async def test_notif(payload: dict, current: User = Depends(get_current_user)):
    add_notification(
        current.company_id,
        payload.get("title", "Test"),
        payload.get("message", "Hello"),
        payload.get("type", "info"),
        to_emails=current.email,
    )
    return {"sent": True}
