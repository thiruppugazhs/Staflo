import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

def _send_via_resend(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Send transactional email via Resend REST API."""
    import httpx
    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "from": settings.RESEND_FROM_EMAIL or "Staflo <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }
        if text_body:
            payload["text"] = text_body
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                logger.info(f"[RESEND SUCCESS] To={to_email} Subject={subject}")
                print(f"[RESEND SENT] To={to_email} Subject={subject} (id={resp.json().get('id')})")
                return True
            else:
                logger.error(f"[RESEND ERROR] status={resp.status_code} body={resp.text}")
                print(f"[RESEND ERROR] status={resp.status_code} body={resp.text}")
                return False
    except Exception as e:
        logger.error(f"[RESEND EXCEPTION] {e}")
        print(f"[RESEND EXCEPTION] {e}")
        return False

def send_email(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """
    Send email via Resend REST API (primary) or SMTP relay (fallback).
    """
    if settings.RESEND_API_KEY:
        ok = _send_via_resend(to_email, subject, html_body, text_body)
        if ok:
            return True
        logger.warning("Resend delivery failed, falling back to SMTP if configured...")

    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        if not settings.RESEND_API_KEY:
            raise RuntimeError("Email delivery not configured: set RESEND_API_KEY or SMTP_HOST/USER/PASSWORD in backend/.env")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        if settings.SMTP_USE_SSL and settings.SMTP_PORT == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=20) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
                if settings.SMTP_USE_TLS:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        logger.info(f"Email sent to {to_email}: {subject}")
        print(f"[MAIL SENT] To={to_email} Subject={subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        print(f"[MAIL ERROR] To={to_email} Error={e}")
        return False

# Background helper for FastAPI BackgroundTasks compatibility (sync call, but can be used as background)
async def send_email_async(to_email: str, subject: str, html_body: str, text_body: str | None = None):
    # Run sync in thread to avoid blocking
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: send_email(to_email, subject, html_body, text_body))

# Templates
def verification_email_html(name: str, verify_url: str, employee_id: str) -> str:
    return f"""
    <div style=\"font-family: sans-serif; max-width: 600px; margin: auto; border:1px solid #e5e7eb; border-radius:8px; padding:24px;\">
      <h2 style=\"color:#a855f7;\">Welcome to Staflo — Staflo</h2>
      <p>Hi {name},</p>
      <p>Your account has been created. <b>Employee ID: {employee_id}</b></p>
      <p>Please verify your email to activate your account:</p>
      <a href=\"{verify_url}\" style=\"display:inline-block; background:#a855f7; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;\">Verify Email</a>
      <p style=\"margin-top:16px;\">Or copy: <a href=\"{verify_url}\">{verify_url}</a></p>
      <p style=\"color:#6b7280; font-size:12px; margin-top:24px;\">Every workday, perfectly aligned. — Staflo Team</p>
    </div>
    """

def invite_email_html(name: str, employee_id: str, email: str, temp_password: str, company: str, login_url: str, verify_url: str | None = None) -> str:
    verify_section = ""
    if verify_url:
        verify_section = f"""
        <p style="margin-top:16px;"><b>Step 1 — Activate your account:</b></p>
        <a href="{verify_url}" style="display:inline-block; background:#2563eb; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;">Verify Email</a>
        <p style="color:#6b7280; font-size:12px; margin-top:8px;">Or copy: <a href="{verify_url}">{verify_url}</a><br/>This link expires in 24 hours.</p>
        <p style="margin-top:12px;"><b>Step 2 — Sign in</b> with your Employee ID / Email and Temp Password below.</p>
        """
    return f"""
    <div style=\"font-family: sans-serif; max-width: 600px; margin: auto; border:1px solid #e5e7eb; border-radius:8px; padding:24px;\">
      <h2 style=\"color:#a855f7;\">You've been invited to {company} on Staflo</h2>
      <p>Hi {name},</p>
      <p>You have been added to <b>{company}</b> HRMS.</p>{verify_section}
      <table style=\"background:#f9fafb; padding:12px; border-radius:6px; width:100%; margin:12px 0;\">
        <tr><td><b>Employee ID</b></td><td>{employee_id}</td></tr>
        <tr><td><b>Email</b></td><td>{email}</td></tr>
        <tr><td><b>Temp Password</b></td><td style=\"font-family:monospace; background:#fff; padding:2px 6px; border:1px solid #e5e7eb;\">{temp_password}</td></tr>
      </table>
      <a href="{login_url}" style="display:inline-block; background:#a855f7; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;">Sign In</a>
      <p><b>Please change your password after first login.</b></p>
      <p style=\"color:#6b7280; font-size:12px; margin-top:24px;\">Login ID is your Employee ID or Email. Contact HR if blocked.</p>
    </div>
    """

def leave_status_html(name: str, typ: str, start: str, end: str, status: str, comment: str | None) -> str:
    color = "#16a34a" if status=="approved" else "#dc2626" if status=="rejected" else "#d97706"
    comment_html = f"<p><b>Comment:</b> {comment}</p>" if comment else ""
    return f"""
    <div style=\"font-family: sans-serif; max-width: 600px; margin: auto; border:1px solid #e5e7eb; border-radius:8px; padding:24px;\">
      <h2 style=\"color:{color};\">Leave {status.capitalize()}</h2>
      <p>Hi {name},</p>
      <p>Your <b>{typ}</b> leave <b>{start} → {end}</b> has been <b>{status}</b>.</p>
      {comment_html}
      <p style=\"color:#6b7280; font-size:12px;\">Check Time Off page for balances. — Staflo</p>
    </div>
    """
