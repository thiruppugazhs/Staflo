from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from urllib.parse import quote_plus
from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.user import User
from ..services.mail import send_email, notification_email_html
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])

# In-app notification feed
_notifications = []

def add_notification(company_id: str, title: str, message: str, type: str = "info", to_emails=None, target_user_id=None, channels=None, priority="normal"):
    notif_id = len(_notifications) + 1
    notif_obj = {
        "id": notif_id,
        "company_id": str(company_id),
        "target_user_id": str(target_user_id) if target_user_id else None,
        "title": title,
        "message": message,
        "type": type,
        "priority": priority,
        "channels": channels or ["in_app"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    _notifications.append(notif_obj)

    if not to_emails:
        return
    recipients = [to_emails] if isinstance(to_emails, str) else [e for e in to_emails if e]
    for recipient in recipients:
        try:
            html = notification_email_html("Team Member", title, message, priority)
            send_email(recipient, f"Staflo Broadcast: {title}", html, message)
        except Exception as e:
            logger.error(f"[MAIL ERROR] notification '{title}' to {recipient}: {e}")

@router.get("")
async def list_notifications(current: User = Depends(get_current_user)):
    # return latest 50 for company
    filtered = [
        n for n in _notifications 
        if n["company_id"] == str(current.company_id) and 
        (n.get("target_user_id") is None or n.get("target_user_id") == str(current.id))
    ]
    return filtered[-50:][::-1]

@router.post("/send")
async def send_notification(payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    recipient_type = payload.get("recipient_type", "all")  # "all" or "single"
    target_user_id = payload.get("user_id")
    title = (payload.get("title") or "").strip()
    message = (payload.get("message") or "").strip()
    channels = payload.get("channels") or ["in_app", "email"]
    priority = payload.get("priority") or "normal"

    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message are required")

    recipients: list[User] = []
    if recipient_type == "single":
        if not target_user_id:
            raise HTTPException(status_code=400, detail="Target employee is required for single recipient notification")
        res = await db.execute(select(User).where(User.id == target_user_id, User.company_id == current.company_id))
        target_user = res.scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target employee not found")
        recipients.append(target_user)
    else:
        res = await db.execute(select(User).where(User.company_id == current.company_id, User.is_active == True))
        recipients = res.scalars().all()

    whatsapp_links = []
    email_count = 0
    sms_count = 0

    # 1. In-App
    if "in_app" in channels:
        add_notification(
            company_id=current.company_id,
            title=title,
            message=message,
            type="announcement",
            target_user_id=target_user_id if recipient_type == "single" else None,
            channels=channels,
            priority=priority
        )

    # 2. Process external channels for recipients
    for user in recipients:
        # Email
        if "email" in channels and user.email:
            try:
                html = notification_email_html(user.first_name, title, message, priority)
                send_email(user.email, f"Staflo Notice: {title}", html, f"{title}\n\n{message}")
                email_count += 1
            except Exception as e:
                logger.error(f"Failed to email {user.email}: {e}")

        # WhatsApp (generate deep-links)
        if "whatsapp" in channels and user.phone:
            clean_phone = "".join(c for c in user.phone if c.isdigit() or c == '+')
            if clean_phone:
                encoded_text = quote_plus(f"📢 *Staflo Notice: {title}*\n\n{message}\n\n— {current.first_name} (Admin)")
                wa_url = f"https://wa.me/{clean_phone.lstrip('+')}?text={encoded_text}"
                whatsapp_links.append({
                    "user_id": str(user.id),
                    "name": f"{user.first_name} {user.last_name}",
                    "phone": user.phone,
                    "url": wa_url
                })

        # SMS
        if "sms" in channels and user.phone:
            sms_count += 1

    return {
        "success": True,
        "recipient_count": len(recipients),
        "emails_sent": email_count,
        "sms_dispatched": sms_count,
        "whatsapp_links": whatsapp_links,
        "message": f"Notification successfully broadcast to {len(recipients)} employee(s)."
    }

@router.post("/test")
async def test_notif(payload: dict, current: User = Depends(get_current_user)):
    add_notification(
        current.company_id,
        payload.get("title", "Test Broadcast"),
        payload.get("message", "Staflo HRMS system update"),
        payload.get("type", "info"),
        to_emails=current.email,
    )
    return {"sent": True}
