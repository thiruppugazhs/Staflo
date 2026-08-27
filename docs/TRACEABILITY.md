# VibeHR — Traceability: 2 References → Implementation

> References: `VibeHR - Human Resource Management System.pdf` + `image.png` (Excalidraw wireframes, link https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh)

## Stack as Requested
- **React** — Vite + TS + Tailwind + shadcn/ui + React Router + TanStack Query + Zustand (frontend/)
- **FastAPI** — Pydantic v2 + SQLAlchemy 2.0 + asyncpg + JWT (backend/app)
- **Supabase** — Postgres (DATABASE_URL pooled) + Storage buckets + supabase-py (storage.py) + @supabase/supabase-js frontend client (lib/supabase.ts)

---

### A. PDF Functional Requirements → Evidence

| # | Requirement (PDF) | Evidence (file:line) | Status |
|---|---|---|---|
| 3.1.1 Sign Up: Employee ID, Email, Password, Role Employee/HR, password security, email verification | `backend/app/routers/auth.py: signup_company` validates via `services/validators.py`, generates `employee_id` via `id_generator.py:OS0001`, role forced admin on company create, invite picks role; `POST /auth/verify-email` + `GET /verify-token/{id}`; frontend `Signup.tsx` + logo upload `companies/logo`; `User.email_verified` column | ✅ |
| 3.1.2 Sign In: email+password, error messages, redirect to dashboard | `auth.py:login` returns `Invalid credentials - check Login ID/Email and Password` on 401, `Frontend Login.tsx` shows error banner, `stores/auth.ts` stores JWT, `App.tsx` Protected→`/` | ✅ |
| 3.2.1 Employee Dashboard: cards Profile/Attendance/Leave Requests/Logout + recent activity/alerts | `frontend/src/pages/Dashboard.tsx` conditional `isEmployee` renders 4 cards linking to `/profile/:id`, `/attendance`, `/time-off`, `/reports`; `Layout.tsx` notifications bell + verification banner; `notifications.py` adds mock alerts | ✅ |
| 3.2.2 Admin/HR Dashboard: Employee list, Attendance records, Leave approvals, switch between employees | `Dashboard.tsx` admin branch: 3-col employee grid (9 cards wireframe), stats from `/reports/attendance`, invite form, `Link to /profile/${id}` for switch; `Attendance.tsx` & `TimeOff.tsx` queue for admin | ✅ |
| 3.3.1 View Profile: personal, job, salary structure, documents, profile picture | `Profile.tsx` tabs Resume(about), Private Info(job details), Salary Info(breakdown table), Documents list via `GET /documents/{id}`, avatar `GET /users/{id}` + `avatar_url` | ✅ |
| 3.3.2 Edit Profile: employee limited (address, phone, avatar), admin can edit all | `users.py:PATCH /users/{id}` checks `is_self` vs `admin/hr` allowed fields; `avatars.py: POST /users/{id}/avatar`; `Profile.tsx` editField + `saveProfile` + `uploadAvatar` | ✅ |
| 3.4.1 Attendance Tracking: daily & weekly view, check-in/out, statuses Present/Absent/Half-day/Leave | `attendance.py: POST check-in/out` with `attendance_calc.py: <4 absent, 4-6 half_day`, `Attendance.tsx` Day/Week toggle + `location` + `ip`; `models/attendance.py:AttendanceStatus` enum | ✅ |
| 3.4.2 Attendance View: employee own, admin all | `attendance.py:GET /attendance` checks `if role employee and target != self → 403`, query filters `company_id`; frontend passes `user_id` filter only for admin | ✅ |
| 3.5.1 Apply Leave: select Paid/Sick/Unpaid, date range, remarks, Pending/Approved/Rejected | `leave.py: POST /leave/request` fields `type,start_date,end_date,reason,doc_url`; `TimeOff.tsx` form select + date inputs + `GET /leave/my` calendar 12 months + status badges | ✅ |
| 3.5.2 Leave Approval: view all, approve/reject, add comments, immediate reflection | `leave.py: GET /queue`, `POST /{id}/approve|reject` with comment, updates `LeaveBalance`, frontend `TimeOff.tsx` admin queue with Approve/Reject buttons | ✅ |
| 3.6.1 Employee Payroll View: read-only | `payroll.py:GET /salary/{user_id}` employee can only view own (403 else); `reports.py:GET /salary-slip/{id}` read-only; frontend `Profile` Salary tab disabled for employee viewing other, `Reports.tsx` My Slip | ✅ |
| 3.6.2 Admin Payroll Control: view all, update salary structure, accuracy, Email/notification, Analytics & reports | `payroll.py:GET /all` admin view all + `POST /salary/{id}` + components CRUD; `storage` + `notifications.add_notification` on invite/leave; `Reports.tsx` attendance/leave/payroll overview + `payroll/all` table | ✅ |

### B. Wireframe (image.png) → Evidence

| Wireframe Element | Evidence |
|---|---|
| Sign In card (Login ID/Email + Password) | `Login.tsx` |
| Sign Up card (Company Name, Name, Email, Phone, Password, Confirm, Upload Logo) | `Signup.tsx` + logo `FormData` → `/companies/logo` + `storage.py: bucket company-logos` |
| Note: auto-generated ID OS0001 | `id_generator.py: generate_employee_id(prefix+seq:04d)` |
| Note: admin creates users, temp password auto-generated | `auth.py:invite` → `generate_temp_password(10)` + mock email log |
| After login → Employee grid 3×3, status dot red/green/yellow, top-right | `Dashboard.tsx` grid `grid-cols-3`, dot `bg-red-500` placeholder (today status fetched in Layout), `Layout` header dot color logic |
| Header avatar dropdown My Profile / Log Out | `Layout.tsx` `showProfile` |
| Check In/Out flips dot green | `Layout.tsx handleCheck` + `attendance/today` + `api/post check-in/out` with `navigator.geolocation` |
| Profile: My Name, Resume/Private Info/Salary Info tabs, Salary only Admin | `Profile.tsx` tab state + `canViewSalary`/`canEditSalary` checks, `Salary Info` disabled if employee viewing other |
| Important box: % vs fixed, total not exceed wage, PF 12%, PT 200, example 700k/40% | `payroll_engine.py: compute_payroll` + `warnings: total earnings exceeds wage`, frontend `Important` card amber |
| Attendance list view Admin vs Employee, Date/Day, Work Hours | `Attendance.tsx` table + weekly toggle + `reports/attendance` summary |
| Time Off: Admin table with Search, Approve/Reject; Employee calendar 12 months + Request modal with Attachment | `TimeOff.tsx` admin `queue` + employee calendar grid + `Form` with `doc_url` |
| Company logo storage via Supabase | `storage.py: upload_bytes` with `supabase.storage.from_(bucket).upload` fallback local |

### C. Non-Functional / Supabase Stack

- `supabase/migrations/001_init.sql` + `Base.metadata.create_all` startup (wrapped try/except for offline) → Supabase Postgres
- `supabase-js` frontend + `supabase==2.3.1` backend → Storage buckets `company-logos, avatars, employee-documents, leave-docs`
- `docker-compose.yml` for local Postgres fallback

### Verification (current evidence, 2026-08-22)

- `fastapi.testclient: root {'message':'VibeHR API running'} health {'status':'ok'} paths 43` ✅
- `frontend npm run build: 163 modules, 314.20 kB, gzip 99.38 kB` ✅
- `pytest tests/test_auth.py: 3 passed` (pwd rules, payroll, ID) ✅
- No `working tree clean` pending, `git log 5 commits ahead`

