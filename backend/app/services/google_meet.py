import asyncio
import json
import os
import re
import string
import uuid
from datetime import datetime, timedelta, timezone

from ..core.config import settings

_SCOPES = ["https://www.googleapis.com/auth/calendar"]
_credentials = None
_credentials_loaded = False


def _env(name: str, fallback: str = "") -> str:
    """Prefer process env (Docker/CI), fall back to backend/.env via settings."""
    return os.getenv(name) or getattr(settings, name, "") or fallback


def _load_credentials():
    """Build and cache Google credentials from configured env vars.

    Priority:
      1. Service-account JSON key file  -> GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS
      2. Service-account JSON inline    -> GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT
      3. OAuth user refresh token       -> GOOGLE_OAUTH_CLIENT_ID + SECRET + REFRESH_TOKEN
    Returns None when nothing usable is configured.
    """
    global _credentials, _credentials_loaded
    if _credentials_loaded:
        return _credentials
    _credentials_loaded = True

    try:
        from google.oauth2 import service_account
        from google.oauth2.credentials import Credentials as UserCredentials

        subject = (_env("GOOGLE_IMPERSONATE_EMAIL") or "").strip() or None
        creds = None

        sa_path = _env("GOOGLE_SERVICE_ACCOUNT_JSON") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or ""
        sa_inline = _env("GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT")

        if sa_path and os.path.exists(sa_path):
            creds = service_account.Credentials.from_service_account_file(sa_path, scopes=_SCOPES)
        elif sa_inline and sa_inline.strip():
            info = json.loads(sa_inline)
            creds = service_account.Credentials.from_service_account_info(info, scopes=_SCOPES)
        else:
            client_id = _env("GOOGLE_OAUTH_CLIENT_ID")
            client_secret = _env("GOOGLE_OAUTH_CLIENT_SECRET")
            refresh_token = _env("GOOGLE_OAUTH_REFRESH_TOKEN")
            if client_id and client_secret and refresh_token:
                creds = UserCredentials(
                    token=None,
                    refresh_token=refresh_token,
                    client_id=client_id,
                    client_secret=client_secret,
                    token_uri="https://oauth2.googleapis.com/token",
                    scopes=_SCOPES,
                )

        if creds is not None and subject and hasattr(creds, "with_subject"):
            # Domain-wide delegation: act as a real Workspace user
            creds = creds.with_subject(subject)

        _credentials = creds
    except Exception as e:
        print(f"[MEET] Failed to load Google credentials: {e}")
        _credentials = None
    return _credentials


def is_configured() -> bool:
    """True when real Google Calendar credentials are available."""
    return _load_credentials() is not None


def _build_service():
    creds = _load_credentials()
    if creds is None:
        return None
    from googleapiclient.discovery import build

    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def _calendar_id() -> str:
    return _env("GOOGLE_CALENDAR_ID", "primary") or "primary"


def _insert_event_sync(service, body: dict) -> dict:
    return (
        service.events()
        .insert(
            calendarId=_calendar_id(),
            body=body,
            conferenceDataVersion=1,
            sendUpdates="all",
        )
        .execute()
    )


def _get_event_sync(service, event_id: str) -> dict:
    return service.events().get(calendarId=_calendar_id(), eventId=event_id).execute()


def _delete_event_sync(service, event_id: str) -> None:
    service.events().delete(
        calendarId=_calendar_id(), eventId=event_id, sendUpdates="all"
    ).execute()


def _extract_meet_link(created: dict) -> str | None:
    for ep in (created.get("conferenceData") or {}).get("entryPoints", []):
        if ep.get("entryPointType") == "video" and ep.get("uri"):
            return ep["uri"]
    return created.get("hangoutLink")


def _sanitize(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]*>", "", text).strip()


def _demo_meet_link() -> str:
    """Well-formed but non-existent Meet code (letters only, xxx-yyyy-zzz).

    Used only as a visible fallback when Google credentials are missing/failing.
    Responses are flagged with source="mock" so the UI can warn users.
    """
    letters = string.ascii_lowercase
    rng = __import__("random").SystemRandom()
    part = lambda n: "".join(rng.choice(letters) for _ in range(n))
    return f"https://meet.google.com/{part(3)}-{part(4)}-{part(3)}"


async def create_calendar_event_with_meet(
    title: str,
    description: str,
    start_time: datetime,
    end_time: datetime,
    attendee_emails: list[str],
    organizer_email: str | None = None,
) -> tuple[str, str | None, str]:
    """Create a Google Calendar event with an auto-generated Meet link.

    Returns (meet_link, calendar_event_id, source) where source is
    "google" on success or "mock" when falling back to a demo link.
    """
    title = _sanitize(title)[:200]
    description = _sanitize(description)[:2000]

    try:
        service = await asyncio.to_thread(_build_service)
        if service is None:
            print("[MEET] Google Calendar not configured - using demo link")
            return _demo_meet_link(), f"mock_{uuid.uuid4().hex[:8]}", "mock"

        event = {
            "summary": title or "DailyFlow Meeting",
            "description": description,
            "start": {"dateTime": start_time.astimezone(timezone.utc).isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": end_time.astimezone(timezone.utc).isoformat(), "timeZone": "UTC"},
            "attendees": [{"email": e} for e in attendee_emails if e],
            "conferenceData": {
                "createRequest": {
                    "requestId": f"dailyflow-{uuid.uuid4().hex[:16]}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }
        if organizer_email:
            event["organizer"] = {"email": organizer_email}

        created = await asyncio.to_thread(_insert_event_sync, service, event)

        meet_link = _extract_meet_link(created)
        if not meet_link:
            # conferenceData can lag right after insert; fetch once more
            await asyncio.sleep(1.5)
            created = await asyncio.to_thread(_get_event_sync, service, created.get("id"))
            meet_link = _extract_meet_link(created)
        if not meet_link:
            raise RuntimeError("event created but no Meet link returned")

        return meet_link, created.get("id"), "google"
    except Exception as e:
        print(f"[MEET] Google Calendar API failed ({e}) - using demo link")
        return _demo_meet_link(), f"mock_{uuid.uuid4().hex[:8]}", "mock"


async def create_instant_meet(
    organizer_email: str | None = None,
    attendee_emails: list[str] | None = None,
) -> tuple[str, str | None, str]:
    """Create a real one-hour Meet starting now (scheduled in Calendar too)."""
    now = datetime.now(timezone.utc).replace(microsecond=0)
    return await create_calendar_event_with_meet(
        title="Instant Meet",
        description="Instant meeting created from DailyFlow",
        start_time=now,
        end_time=now + timedelta(hours=1),
        attendee_emails=attendee_emails or [],
        organizer_email=organizer_email,
    )


async def delete_calendar_event(calendar_event_id: str | None) -> bool:
    """Delete the backing Calendar event (no-op for mock/demo ids)."""
    if not calendar_event_id or calendar_event_id.startswith(("mock_", "instant_")):
        return False
    try:
        service = await asyncio.to_thread(_build_service)
        if service is None:
            return False
        await asyncio.to_thread(_delete_event_sync, service, calendar_event_id)
        return True
    except Exception as e:
        print(f"[MEET] Failed to delete calendar event {calendar_event_id}: {e}")
        return False
