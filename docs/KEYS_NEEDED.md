# DailyFlow — Active Supabase & DevOps Configuration

> Project: `epnkoxnepauxkluqewib` (ap-south-1)
> Project URL: `https://epnkoxnepauxkluqewib.supabase.co`
> Database URL: `postgresql+asyncpg://postgres:thiruppugazhs@db.epnkoxnepauxkluqewib.supabase.co:5432/postgres`
> Database Status: **Active & Schema Migrated (13 tables configured)**
> Storage Buckets: `logos`, `company-logos`, `avatars`, `documents`, `employee-documents`, `leave-docs`

## 1) Supabase (Project `epnkoxnepauxkluqewib`)
- `SUPABASE_URL` — `https://epnkoxnepauxkluqewib.supabase.co`
- `SUPABASE_ANON_KEY` — Configured in `backend/.env` & `frontend/.env`
- `SUPABASE_SERVICE_KEY` — Configured in `backend/.env`
- `DATABASE_URL` — Configured in `backend/.env`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — `sb_publishable_K7iZ-nkDLbnhJK9ZaSkQmw_0pKMzzV_`

Storage buckets are initialized in Supabase Cloud:
`logos` (public), `company-logos` (public), `avatars` (public), `documents` (private), `employee-documents` (private), `leave-docs` (private)


## 2) SMTP — Brevo (you gave these, but login fails 535 — please regenerate)
Current `backend/.env` has:
- `SMTP_HOST=smtp-relay.brevo.com`
- `SMTP_PORT=465`
- `SMTP_USER=a2301b001@smtp-brevo.com`
- `SMTP_PASSWORD=<REDACTED>` — please regenerate and re-share
- `SMTP_FROM_EMAIL=noreply@VibeHR.susindran.in` (domain must be authenticated in Brevo → Senders & Domains → verify SPF/DKIM or use a verified Brevo sender)
- `SMTP_USE_TLS=false`
- `SMTP_USE_SSL=true`

## 3) JWT / Backend Core (already in `backend/.env`, change for prod)
- `SECRET_KEY` — 32+ random chars (currently `dev-secret-change-...-prod-32`)
- `ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=60`
- `REFRESH_TOKEN_EXPIRE_DAYS=7`
- `CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://VibeHR.susindran.in`

Optional:
- `REQUIRE_EMAIL_VERIFICATION=true|false` — if `true`, `POST /auth/login` returns 403 until verified (currently soft banner only)

## 4) Frontend `frontend/.env`
- `VITE_API_URL=http://localhost:8000/api/v1` (local) or `https://api.VibeHR.susindran.in/api/v1` (prod)
- `VITE_SUPABASE_URL` — same as `SUPABASE_URL` (for `lib/supabase.ts` direct public URL helpers)
- `VITE_SUPABASE_ANON_KEY` — same as `SUPABASE_ANON_KEY`
- Optional for verification link: `VITE_APP_URL=https://VibeHR.susindran.in` (used in `verify_url`)

## 5) How to Give Later
Paste either:
- The 3 Supabase keys + regenerated Brevo `SMTP_PASSWORD` (and confirm `SMTP_USER`/`HOST`), or
- A fresh `.env` file content, or
- Brevo API key if you prefer API over SMTP (we support `sib-api-v3-sdk` alternative)

> I'm continuing on other tasks (verification gate, weekly ISO, per-employee dot batch, Company Settings, printable PDF slip, Resume full) while you gather keys — no block.

## 6) Google Calendar + Meet (real Meet links)

There is no standalone "Meet API" — VibeHR creates a **Google Calendar event** with
`conferenceData` and extracts the generated `https://meet.google.com/xxx-yyyy-zzz` link.
Until credentials below are set, meetings return flagged **demo** links (`source: "mock"`)
that Meet rejects ("Check your meeting code").

Setup (Google Cloud Console):
1. Create/select a project → **APIs & Services → Library** → enable **Google Calendar API**.
2. **APIs & Services → Credentials → Create Credentials → Service account**.
3. Open the service account → **Keys → Add key → Create new key → JSON** → download.
4. Pick ONE auth option for `backend/.env`:
   - **Option A — Workspace (recommended):** Admin Console → Security → API controls →
     **Domain-wide delegation**: authorize the service account's client ID for scope
     `https://www.googleapis.com/auth/calendar`, then set
     `GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json` and
     `GOOGLE_IMPERSONATE_EMAIL=hr@yourdomain.com`.
   - **Option B — any account:** share your calendar with the service-account address
     (Calendar → Settings → Share with specific people → "Make changes to events"), then set
     `GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json` and `GOOGLE_CALENDAR_ID=<your@gmail.com>`.
   - **Option C — personal Gmail via OAuth:** set `GOOGLE_OAUTH_CLIENT_ID`,
     `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` (refresh token granted the
     `https://www.googleapis.com/auth/calendar` scope).
5. Restart the backend. Verify: create an Instant Meet — the returned link should open a real
   Meet lobby and the event should appear in the target calendar.

Notes:
- Attendee emails are added to the event, so Workspace users also get Calendar invites;
  the app additionally sends its own HTML invite email via Brevo.
- Cancelling a meeting deletes the backing Calendar event.
