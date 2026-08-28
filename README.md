<div align="center">

# ⚡ Staflo — Modern Enterprise HRMS & Workforce Platform

**A powerful, multi-tenant Human Resource Management System for attendance, employee lifecycle, payroll, leaves, meetings, and AI-driven HR operations.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-staflo.thiruppugazhs.in-004E72?style=for-the-badge&logo=vercel&logoColor=white)](https://staflo.thiruppugazhs.in)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

[🌐 Explore Live Application](https://staflo.thiruppugazhs.in) • [📖 Documentation](#-key-modules--capabilities) • [🚀 Quick Start](#-quick-start-local-development) • [⚡ Tech Stack](#️-technology-stack)

---

</div>

## 🌟 Live Demo

🔗 **Production URL**: [https://staflo.thiruppugazhs.in](https://staflo.thiruppugazhs.in)

> **Quick Access / Instant Sign In:**
> - Create a new company with instant **Email OTP Verification** or sign in to your workspace with generated Employee IDs (e.g. `OS0001`) or email address.

---

## 🚀 Key Modules & Capabilities

### 1. 🔐 Security & Email OTP Verification
- **Email OTP Verification**: 6-digit email OTPs delivered via Resend for Signup, Forgot Password, Account Verification, and Change Password.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `Admin`, `HR`, `Employee`, and `Intern`.
- **JWT Authentication**: Secure Bearer token lifecycle with auto-refresh and protected serverless routes.

### 2. 👥 Employee Management & Bulk Import
- **Bulk Excel/CSV Import**: Upload employee rosters via `.csv`/`.xlsx` with instant preview and validation.
- **Smart ID Generation**: Auto-assigns structured corporate IDs (e.g. `OS0001`, `OS0002`).
- **Complete Employee CRUD**: Edit employee profiles, job titles, departments, joining dates, or perform cascade deletion.

### 3. ⏰ Attendance & Absentee Tracking
- **Live Attendance Punch**: 1-click Check In / Check Out with fast, non-blocking geolocation & IP logging.
- **Real-time Status Tracking**: Automatic calculation of work hours and statuses (`Present`, `Half-day`, `Break`, `Absent`).
- **Absentee Roster**: Dedicated dashboard listing all absent or on-leave employees for any date with 1-click **Call**, **Email**, and **Profile** actions.

### 4. 📢 Multi-Channel Notification Dispatcher
- **Multi-Channel Delivery**: Broadcast announcements or direct messages via **Email (Resend)**, **WhatsApp** (prefilled click-to-chat links), **SMS**, and **In-App Alerts**.
- **Audience Targeting**: Send to **All Employees** or select a **Specific Employee**.
- **Priority Alerts**: Tag alerts with `Normal` or `🚨 Urgent` priority tags.

### 5. 🗓️ Meetings, Google Calendar & Google Meet
- **Google Meet 1-Click Launch**: Instant video meeting room generation (`meet.google.com/new`).
- **Google Calendar Integration**: Add scheduled meetings directly to Google Calendar with pre-filled titles, participant details, and timestamps.

### 6. 🎓 Internship & Resume Management
- **Intern Bulk Import**: Batch upload interns with project domains, mentors, and stipend structures.
- **HR & Intern Resume Portal**: Admins can attach and review intern resumes; interns can upload and manage resumes directly via self-service.

### 7. 🎨 Dynamic Theme Customization & Appearance
- **5 Curated Theme Palettes**: Ocean Blue (`#004E72`), Sage & Forest (`#4E6B50`), Pebble & Yam (`#8C6239`), Crimson & Sand (`#710014`), and Almond & Matcha (`#677D6A`).
- **Light & Dark Mode**: Persistent UI modes with real-time CSS variable updates across icons, cards, and sidebars.
- **Custom Profile Pictures**: Upload and display user avatars in headers, profiles, and team directories.

---

## 🛠️ Technology Stack

| Layer | Stack |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Zustand, React Router 6 |
| **Backend** | FastAPI, Python 3.11+, Pydantic v2, SQLAlchemy 2 (Asyncio), asyncpg |
| **Database** | PostgreSQL, Supabase Cloud (PgBouncer with transaction pooling) |
| **Email & SMS** | Resend REST API, Brevo SMTP fallback, WhatsApp Web API |
| **Meetings** | Google Meet, Google Calendar API |
| **Billing** | Razorpay Checkout SDK |
| **Hosting** | Vercel (Frontend & Serverless Backend API) |

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Frontend: React 18 + Vite                │
│    (Tailwind CSS • Zustand • React Router • Lucide)    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼────────────────────────────┐
│              Backend: FastAPI Serverless               │
│        (Pydantic v2 • SQLAlchemy 2.0 Asyncio)          │
└─────────────┬─────────────┬─────────────┬──────────────┘
              │             │             │
   ┌──────────▼───┐  ┌──────▼─────┐ ┌─────▼──────────┐
   │ PostgreSQL   │  │ Resend API │ │ Google Meet /   │
   │ (Supabase)   │  │ (Email OTP)│ │ Google Calendar│
   └──────────────┘  └────────────┘ └─────────────────┘
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+
- **Python**: v3.11+
- **PostgreSQL** or **Supabase** instance

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run the API locally
uvicorn app.main:app --reload --port 8000
```
- **API Swagger Docs**: `http://localhost:8000/docs`
- **API Health Check**: `http://localhost:8000/health`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- **Local App**: `http://localhost:5173`

---

## 📁 Repository Structure

```text
Staflo/
├── api/                       # Vercel Serverless entrypoints and sync
├── backend/
│   ├── app/
│   │   ├── core/              # Security, JWT tokens, config settings
│   │   ├── db/                # Async engine with Supabase PgBouncer setup
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── routers/           # FastAPI routers (auth, attendance, users, etc.)
│   │   ├── schemas/           # Pydantic input/output schemas
│   │   └── services/          # Email (Resend), Google Meet, ID Generator
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client configuration
│   │   ├── components/        # Layout, Navigation, Chatbot, Modals
│   │   ├── pages/             # Dashboard, Attendance, Employees, Interns...
│   │   └── stores/            # Zustand stores (auth, theme)
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🔒 Security & Best Practices

- **Zero Plaintext Passwords**: Cryptographically hashed using PBKDF2 with SHA-256.
- **Scoped Tenant Isolation**: Strict multi-tenant row level scoping via `company_id`.
- **PgBouncer Optimized**: Configured with `statement_cache_size=0` and `NullPool` for rock-solid serverless DB connection handling.
- **Safe Secrets**: Protected by environment variable injection and GitHub Secret Protection.

---

<div align="center">

Made with ❤️ by [Thiruppugazh S](https://github.com/thiruppugazhs)

[🌐 staflo.thiruppugazhs.in](https://staflo.thiruppugazhs.in)

</div>
