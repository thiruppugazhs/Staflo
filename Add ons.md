# DailyFlow — Add-On Features & Integrations
## Complete Ideation Document

**Project:** DailyFlow (DailyFlow HRMS)
**Hackathon:** Odoo Hackathon — August 2026
**Role:** Add-on / Integration Specialist
**Base Stack:** React + TypeScript + Tailwind (Frontend) | FastAPI + PostgreSQL + Supabase (Backend)

---

## Overview

The core HRMS (authentication, employee profiles, attendance check-in/out, leave management, payroll, and admin dashboards) is being built by the team. This document defines the add-on layer — a set of integrations and novel features that transform the project from a standard HRMS into a modern, connected workplace platform.

Three integrations and one standalone feature module are planned:

| # | Integration / Feature | What It Adds | External Service |
|---|----------------------|--------------|-----------------|
| 1 | Google Calendar + Meet | Meeting scheduling with auto-generated video call links | Google Calendar API |
| 2 | AI HR Chatbot | Natural-language assistant for employee queries | Anthropic Claude API |
| 3 | Communication Hub | One-click Call, WhatsApp, Email, and Meet from any profile | tel: / wa.me / mailto: protocols |
| 4 | Intern Management Module | Complete intern lifecycle — onboarding to conversion | None (internal feature) |

---

---

## Integration 1: Google Calendar + Google Meet

### The Problem It Solves

HR teams constantly schedule meetings — interviews, one-on-ones, team standups, performance reviews, exit interviews. In most HRMS products, scheduling a meeting means leaving the app, opening Google Calendar separately, manually typing attendee emails, creating the event, copying the Meet link, and pasting it somewhere. This breaks the workflow and creates disconnected records.

### What We're Building

A meeting scheduling system built directly into the HRMS that uses the Google Calendar API to create events and auto-generate Google Meet video call links. When an admin or HR officer schedules a meeting from within DailyFlow, the system creates a Google Calendar event behind the scenes, attaches a Meet link, saves the meeting record in our database, and sends email invites to all selected attendees with the join link. No one needs to leave the app.

### How Google Meet Link Generation Actually Works

There is no standalone "Google Meet API" for creating meeting links. The way it works is through the Google Calendar API. When you create a Calendar event and include a special `conferenceData` object in the request body with `conferenceSolutionKey` set to `hangoutsMeet`, and pass `conferenceDataVersion=1` as a query parameter, Google automatically generates a Meet link and attaches it to the event. The Meet link comes back in the API response under `conferenceData.entryPoints`, where you look for the entry with `entryPointType: "video"` and extract its `uri` field. That URI is the Meet link (e.g., `https://meet.google.com/abc-defg-hij`).

### Authentication with Google

We're using a Google Cloud Service Account, which is the simplest approach for a hackathon. A service account is like a robot Google account — it doesn't need a human to log in. You create it in the Google Cloud Console, download a JSON key file, and use that file to authenticate API calls. The service account needs the Google Calendar shared with it (you add its email as a calendar editor). This avoids the complexity of OAuth 2.0 redirect flows.

If the service account isn't configured (during development or if credentials aren't available), the system falls back to generating mock Meet links that look and behave identically in the UI. This means the demo flow works perfectly even without Google Cloud setup.

### User Flows

**Admin schedules a meeting:**
The admin clicks "Schedule Meeting" on their dashboard. A modal appears with fields for meeting title, agenda/description, date, start time, end time, and a searchable employee picker where they can select multiple attendees by checking boxes. On submit, the backend creates the Google Calendar event, extracts the Meet link, saves the meeting record to the database, and triggers background email notifications to all attendees. The modal shows a success screen with the Meet link and a copy button.

**Employee sees their meetings:**
On the employee dashboard, an "Upcoming Meetings" card appears showing all meetings they've been invited to. Each meeting shows the title, date/time, number of attendees, and a "Join" button that opens the Meet link in a new tab. If a meeting is currently happening (the current time falls between start and end time), the card shows a pulsing "LIVE" badge with a highlighted "Join Now" button.

**Instant Meet from Communication Hub:**
When viewing any employee's profile, clicking the Google Meet button in the Communication Hub creates an instant one-hour meeting and opens the link immediately. This is for unscheduled quick calls — "I need to talk to this person right now."

### Data Model

The `Meeting` record stores: meeting ID, company ID, organizer (who created it), title, description, the Google Meet link, the Google Calendar event ID (for future reference or cancellation), start time, end time, status (scheduled / ongoing / completed / cancelled), and a list of attendee user IDs. Meetings are scoped to a company, and role-based filtering ensures employees only see meetings they're part of while admins see all company meetings.

### API Endpoints

- `POST /meetings` — Create a scheduled meeting (admin/HR only). Accepts title, description, start/end times, and attendee IDs. Returns the meeting record with the Meet link.
- `GET /meetings` — List all meetings. Admin sees all company meetings, employees see only their own.
- `GET /meetings/upcoming` — Get future scheduled meetings, sorted by date. Used by the dashboard card.
- `POST /meetings/instant` — Create an instant Meet link without scheduling or attendees. Any role can use this. Returns just the link.
- `DELETE /meetings/{id}` — Cancel a meeting (admin/HR only). Sets status to cancelled.

### Email Integration

When a meeting is created, the system sends an HTML email to each attendee using the existing Brevo SMTP mail service. The email includes the meeting title, date/time, organizer name, and a prominent "Join Google Meet" button linking to the Meet URL. This runs as a background task so the API response isn't delayed by email sending.

### Input Validations

- Title: required, 3–200 characters, sanitized for XSS
- Description: optional, max 1000 characters, sanitized
- Start time: must be in the future (can't schedule a meeting in the past)
- End time: must be after start time
- Attendees: at least one required, all must be valid active user IDs in the same company
- Date: standard date format, no free-text input (date picker enforced on frontend)
- Only admin and HR roles can create scheduled meetings

---

---

## Integration 2: AI HR Chatbot (Claude-Powered)

### The Problem It Solves

Employees have repetitive questions that eat up HR's time: "How many leaves do I have left?", "What's my salary breakdown?", "When did I last check in?", "What's the leave policy for sick days?", "How do I apply for time off?" In most companies, these questions go to HR via email or Slack, and HR has to look up the answer manually. This creates a bottleneck — HR spends hours answering the same types of questions instead of doing strategic work.

### What We're Building

An AI-powered chatbot embedded in the employee dashboard that answers HR-related questions using the employee's actual data from the database. When an employee types "How many leaves do I have left?", the chatbot doesn't give a generic answer — it pulls their real leave balance from the database and says "You have 8 paid leaves and 5 sick leaves remaining for 2026." This is the key differentiator: it uses real, dynamic data, not static responses.

### How It Works Technically

The chatbot uses a technique called "context-augmented generation." Here's the flow:

1. Employee types a question in the chat interface
2. The frontend sends the question to the backend endpoint `POST /chatbot/ask`
3. The backend identifies the current user from their auth token
4. The backend fetches the employee's relevant data from the database — their leave balance, attendance summary for the current month, salary structure, pending leave requests, profile details, and any recent notifications
5. The backend constructs a prompt for the Claude API that includes a system instruction ("You are an HR assistant for {company name}") and the employee's data as context, followed by the employee's question
6. The Claude API processes the prompt and returns a natural language answer that references the actual data
7. The backend sends the answer back to the frontend
8. The chat interface displays the response

The employee's raw data is never exposed to the AI directly in a way that could leak to other users. Each API call is scoped to the authenticated user — the backend only fetches and sends that specific employee's data.

### What the Chatbot Can Answer

**Leave-related queries:**
"How many leaves do I have left?" → Fetches from `leave_balances` table → "You have 8 paid leaves and 5 sick leaves remaining for 2026. You've taken 4 paid leaves and 2 sick leaves so far."

"Can I take leave next Friday?" → Checks leave balance and any existing requests for that date → "Yes, you have sufficient paid leave balance. You don't have any existing requests overlapping with that date. You can apply through the Time Off page."

**Attendance-related queries:**
"How many days was I present this month?" → Fetches from `attendance_records` for current month → "You've been present 16 out of 18 working days this month. You had 1 half-day on August 12th and were on leave on August 8th."

"When did I check in today?" → Fetches today's attendance record → "You checked in today at 9:23 AM and haven't checked out yet."

**Salary-related queries:**
"What's my salary breakdown?" → Fetches from `salary_structures` → "Your monthly wage is ₹50,000. Breakdown: Basic ₹20,000, HRA ₹10,000, DA ₹5,000, Allowances ₹15,000. Deductions: PF ₹2,400, Professional Tax ₹200. Net pay: ₹47,400."

"What percentage is my PF?" → "Your PF deduction is 12% of your basic salary (₹20,000), which amounts to ₹2,400 per month."

**Policy and general queries:**
"How do I apply for sick leave?" → "You can apply for sick leave from the Time Off page. Select 'Sick' as the leave type, choose your dates, and upload a medical certificate if required. Your request will go to HR for approval."

"What types of leave are available?" → Answers from the company's leave type configuration.

**Things the chatbot should NOT answer:**
- Other employees' salary or personal data
- Medical advice
- Legal advice about employment law
- Anything outside the HR domain — it should politely redirect: "I can help with HR-related questions like leave balance, attendance, and salary. For other queries, please contact your manager."

### User Interface

The chatbot appears as a floating chat bubble icon in the bottom-right corner of the screen, visible on all pages after login. Clicking it opens a chat panel (sliding up from the bottom or opening as a side panel) with:

- A header showing "HR Assistant" with an AI indicator
- A scrollable message area showing the conversation history
- A text input at the bottom with a send button
- Messages alternate between the user (right-aligned, colored) and the assistant (left-aligned, plain)
- A typing indicator ("Thinking...") while waiting for the API response
- An option to clear the conversation

The conversation history is stored in the frontend only (React state) and resets when the page is refreshed. No chat history is persisted in the database — this keeps things simple and avoids privacy concerns about storing employee questions.

### Data Model

No new database tables are needed. The chatbot reads from existing tables:
- `users` — employee profile, name, department, role
- `leave_balances` — remaining paid/sick/unpaid leave counts
- `leave_requests` — pending, approved, rejected requests
- `attendance_records` — check-in/out times, status, working hours
- `salary_structures` — monthly wage, breakdown, components
- `salary_components` — earnings and deductions configuration

### API Endpoints

- `POST /chatbot/ask` — Accepts `{ question: string }`. Returns `{ answer: string, data_used: string[] }` where `data_used` lists which data sources were consulted (e.g., ["leave_balance", "attendance"]).

### Input Validations

- Question: required, 1–500 characters, sanitized for XSS and prompt injection attempts
- Rate limiting: max 20 questions per user per hour (prevents API cost abuse)
- The system prompt instructs the AI to refuse questions about other employees, decline non-HR topics, and never fabricate data — if it doesn't have the information, it says so
- All responses are scoped to the authenticated user's data only

### Why This Impresses Judges

The hackathon "must-have" rules explicitly say: "Use real-time or dynamic data sources, and avoid relying on static JSON." The chatbot is the purest expression of this rule — it pulls live data from the database for every single response. It's not a hardcoded FAQ. It's not a static knowledge base. It's a dynamic, personalized AI assistant that gives different answers to different employees because their data is different.

---

---

## Integration 3: Communication Hub

### The Problem It Solves

In a typical HRMS, if an HR officer needs to contact an employee, they have to: look up the employee's profile, copy their phone number, open their phone app, paste the number, and call. Or copy the email, open Gmail, paste it, write a message. Every contact action requires multiple steps across multiple apps. This friction adds up when HR is managing dozens of employees daily.

### What We're Building

A unified contact panel that appears on every employee's profile and on each employee card in the admin dashboard. It provides one-click access to four communication channels — phone call, WhatsApp message, email, and Google Meet video call. No copying, no pasting, no switching apps. One tap and you're connected.

### The Four Channels

**Phone Call (📞)**
Uses the `tel:` protocol, which is a standard web protocol supported by all browsers and devices. When clicked, it opens the device's native phone dialer with the number pre-filled. On mobile, it directly initiates the call. On desktop, it opens whatever app handles phone calls (Skype, FaceTime, or the system phone app). The phone number is formatted with India's country code (+91) automatically.

Implementation: `<a href="tel:+91{phone}">`

**WhatsApp (💬)**
Uses WhatsApp's official deep link format: `https://wa.me/91{phone}`. When clicked on mobile, it opens the WhatsApp app directly with a new conversation to that number. On desktop, it opens WhatsApp Web. No API key or WhatsApp Business account needed — this is a standard deep link that WhatsApp supports officially.

Implementation: `<a href="https://wa.me/91{phone}" target="_blank">`

**Email (📧)**
Uses the `mailto:` protocol, which opens the device's default email client (Gmail, Outlook, Apple Mail, etc.) with the "To" field pre-filled with the employee's email address. The HR officer just needs to type the subject and body.

Implementation: `<a href="mailto:{email}">`

**Google Meet (🎥)**
Unlike the other three channels which use simple URL protocols, this one triggers an API call. When clicked, it calls the `POST /meetings/instant` endpoint which creates a quick one-hour Google Calendar event with a Meet link and opens it in a new tab. This creates an unscheduled, spontaneous video call — ideal for "I need to talk to this person right now" moments.

### Two Display Modes

**Full Mode (Profile Page):**
A bordered card with four large buttons arranged in a 2×2 grid. Each button shows the channel icon, the channel name, and the relevant detail (phone number, email address, or "Start instant call" for Meet). If the employee doesn't have a phone number on file, the Call and WhatsApp buttons are greyed out with a "No phone number" label. When a Meet link is generated, it appears below the buttons with a copy button.

**Compact Mode (Dashboard Cards):**
A row of four small circular icon buttons that fit within the employee cards on the admin dashboard. No labels, just icons — 📞 💬 📧 🎥. Hover tooltip shows what each does. This keeps the cards clean while giving admins quick contact access.

### Smart Behavior

- The Communication Hub doesn't appear when you view your own profile (you don't need to call yourself)
- Phone numbers are automatically cleaned: spaces, dashes, parentheses, and leading +91/91/0 prefixes are stripped before formatting
- If a phone number has fewer than 10 digits after cleaning, Call and WhatsApp are disabled
- The Meet button shows a loading spinner while the API creates the link
- After creating a Meet link, the link persists in the UI until the user navigates away, with a copy-to-clipboard button
- All links open in new tabs (except tel: and mailto: which use native handlers)

### Why It Doesn't Need Google Contacts API

The user's initial idea was to integrate Google Contacts for making calls. But our HRMS database already contains every employee's name, phone number, and email — it IS the contacts directory. Pulling the same data from Google Contacts would add complexity (OAuth setup, API calls, sync logic) without adding value. The Communication Hub achieves the same outcome (one-click contact) using data we already have, with zero external dependencies for three of the four channels.

### Input Validations

- Phone number display: only rendered if the stored number has at least 10 digits after cleaning
- WhatsApp link: only rendered if a valid phone number exists
- Email: always rendered (email is a required field in user registration)
- Meet link creation: handled by the meetings router with proper error handling and fallback

---

---

## Feature 4: Intern Management Module

### The Problem It Solves

Every HRMS handles full-time employees, but interns have a fundamentally different lifecycle that standard employee features don't address. Interns have fixed-duration contracts, receive stipends instead of salaries, need mentors assigned, go through performance evaluations, and at the end face a decision point — convert to full-time, extend, or end the internship. Treating interns as regular employees means losing track of internship durations, not tracking evaluations, and having no conversion workflow. Treating them as a completely separate system means duplicating attendance, leave, and profile management.

### What We're Building

A hybrid approach: interns use the same authentication, attendance, and leave infrastructure as employees, but with a distinct role (`intern`) that triggers different behavior — reduced leave allocation, stipend instead of salary, an internship progress tracker, mentor assignment, performance evaluations, and a conversion pipeline. The intern management module adds an overlay of features specifically designed for the intern lifecycle while reusing the existing core.

### The Intern Lifecycle

The lifecycle flows through five phases:

**Phase 1 — Onboarding:** Admin creates the intern via the same invite flow but with `role: intern` and additional fields (internship dates, stipend, mentor, institute, project title). The system generates an employee ID, sends an invite email, and creates a restricted account with reduced leave allocation (3 paid + 2 sick for the entire internship, compared to 12 + 7 per year for employees).

**Phase 2 — Active Internship:** The intern logs in and sees a custom dashboard with an internship progress bar (e.g., "Day 45 of 90 — 50% complete"), their mentor's contact card with Communication Hub buttons, attendance check-in/out, limited leave application, and a stipend display instead of salary breakdown. They cannot see salary structures, company-wide reports, or other employees' data.

**Phase 3 — Midterm Evaluation:** When the intern reaches the halfway point, the mentor receives an alert to submit a midterm evaluation. The evaluation scores the intern across five weighted categories: Technical Skills (30%), Communication (20%), Teamwork (20%), Punctuality (15%), and Initiative (15%). Each category is rated 1–10, and the system auto-calculates a weighted overall score out of 100. The mentor also writes text feedback on strengths and areas for improvement. The intern can see their scores and feedback (read-only) on their dashboard.

**Phase 4 — Final Evaluation:** When the intern reaches 85% completion, the mentor submits a final evaluation using the same scoring system, plus an additional field: a recommendation — Convert to Employee, Extend Internship, or End Internship. This recommendation is visible only to admin, not to the intern. The system shows a comparison with the midterm score to highlight progress.

**Phase 5 — Decision:** Admin reviews the evaluations and makes one of three choices:
- **Convert to Employee** — The intern's role changes from `intern` to `employee`, a full salary structure is created (replacing the stipend), leave balance resets to employee-level, and a congratulations email is sent.
- **Extend Internship** — The end date is pushed forward, status changes to `extended`, and optionally the stipend and leave allocation are adjusted.
- **End Internship** — The account is deactivated, status changes to `completed`, and an experience certificate PDF can be auto-generated with the intern's name, duration, project, department, and evaluation score.

### What Each Role Sees

**Intern sees:**
- Internship Progress card (progress bar, days remaining, status badge, project title)
- Mentor Info card (name, department, Communication Hub buttons)
- Attendance (same check-in/out as employees)
- My Leaves (reduced allocation, same apply/view flow)
- My Stipend (flat monthly amount, no salary breakdown)
- My Evaluations (read-only scores and feedback after mentor submits)
- Does NOT see: Salary Info tab, Reports page, other employees' data, evaluation recommendations

**Mentor (regular employee) sees:**
- "My Interns" section on their dashboard (list of assigned interns with progress bars)
- Alerts when midterm/final evaluations are due
- Evaluation submission form
- Intern's profile and attendance (read-only)
- Does NOT have: ability to edit intern details, approve/reject leaves, or make conversion decisions

**Admin sees:**
- Intern Management panel (list of all interns with status badges and quick actions)
- Summary stats: total active, ending within 7 days, pending evaluations, awaiting decisions
- Filters by status, department, mentor
- Actions per intern: Evaluate, Convert, Extend, End, Generate Certificate
- All evaluation data including mentor's recommendation
- Alerts for overdue evaluations and internships ending soon

### Evaluation Scoring System

Five categories with different weights reflecting what matters most in an internship:

- **Technical Skills (30%)** — How well the intern handles the technical aspects of their project. Code quality, problem-solving, tool proficiency.
- **Communication (20%)** — Clarity in asking questions, giving updates, writing documentation, presenting work.
- **Teamwork & Collaboration (20%)** — Working with the team, being proactive, participating in discussions.
- **Punctuality & Discipline (15%)** — Being on time, following check-in/out routines, meeting deadlines.
- **Initiative & Learning (15%)** — Going beyond what's asked, learning independently, suggesting improvements.

Overall Score = (Technical × 0.30) + (Communication × 0.20) + (Teamwork × 0.20) + (Punctuality × 0.15) + (Initiative × 0.15), then scaled to 100.

Score ratings: 90–100 Outstanding (gold), 75–89 Excellent (green), 60–74 Good (blue), 45–59 Average (amber), below 45 Below Expectations (red).

### Stipend vs Salary

Interns receive a flat monthly stipend — a single number with no HRA, DA, PF deductions, or tax calculations. On their profile, instead of the "Salary Info" tab (which is hidden entirely for interns), they see a simple "My Stipend" section showing the monthly amount and total expected for the internship period.

If an intern takes unpaid leave, their stipend is pro-rated: `Actual = (Monthly Stipend ÷ Working Days) × Days Attended`. So if the stipend is ₹15,000 and there are 22 working days but the intern only attended 20, they receive ₹13,636.

### Leave Policy Differences

Interns get 3 paid leaves and 2 sick leaves for the entire internship (not per year). These don't roll over if the internship is extended. Sick leave still requires a medical certificate attachment. Leave dates must fall within the internship period. If an intern applies for more leaves than they have, the system blocks it with a clear message explaining their allocation.

### Automated Notifications

The module triggers emails at key moments:
1. Intern onboarding — welcome email with internship details and mentor info
2. Mentor assignment — notification to the mentor about their new intern
3. Midterm evaluation reminder — to mentor, 7 days before the midpoint
4. Final evaluation reminder — to mentor, 7 days before the end date
5. Evaluation submitted — to intern, with their scores
6. Conversion offer — congratulations email with role and salary details
7. Extension notification — to intern, with updated end date
8. Internship completion — to intern, with experience certificate if generated

### Data Models

Two new tables:

**internship_details** — Links to the user record. Stores: mentor ID, department, start date, end date, stipend amount, status (active/extended/completed/converted/terminated), project title, institute name, evaluation score, conversion status (pending/offered/accepted/rejected), and conversion date.

**intern_evaluations** — Stores individual evaluations. Links to the intern and the evaluator. Stores: evaluation type (midterm/final), five category scores (1–10 each), overall score (computed), strengths text, improvements text, additional comments, and recommendation (convert/extend/end — final evaluation only).

### API Endpoints

- `POST /interns/` — Create internship details for a user (admin only)
- `GET /interns/` — List all interns with filters (admin/HR)
- `GET /interns/{id}` — Get intern details (admin, mentor, or self)
- `PUT /interns/{id}` — Update internship details (admin)
- `POST /interns/{id}/evaluate` — Submit evaluation (mentor or admin)
- `GET /interns/{id}/evaluations` — Get evaluations (mentor, admin, or self)
- `POST /interns/{id}/convert` — Convert intern to employee (admin)
- `POST /interns/{id}/extend` — Extend internship (admin)
- `POST /interns/{id}/end` — End internship (admin)
- `GET /interns/{id}/certificate` — Generate experience certificate PDF (admin)
- `GET /interns/my-interns` — Get interns assigned to current mentor
- `GET /interns/my-internship` — Get own internship details (intern)
- `GET /interns/stats` — Summary statistics (admin)

---

---

## Cross-Feature Connections

These four features aren't isolated — they connect to create a cohesive experience:

**Communication Hub + Google Meet:** The "Meet" button in the Communication Hub uses the same `/meetings/instant` endpoint from the Meet integration. One feature provides the scheduling infrastructure, the other provides the quick-access interface.

**AI Chatbot + Leave/Attendance/Payroll:** The chatbot reads from the same database tables that the core HRMS writes to. When an admin approves a leave request through the regular flow, the chatbot immediately reflects the updated balance in its answers. No sync needed — they share the same source of truth.

**Intern Management + Communication Hub:** The intern's dashboard shows their mentor's contact card with Communication Hub buttons. The mentor can quickly call, WhatsApp, email, or Meet their intern from the "My Interns" section.

**Intern Management + AI Chatbot:** Interns can ask the chatbot about their stipend, leave balance, or internship progress. The chatbot checks the user's role and fetches from `internship_details` instead of `salary_structures` when the user is an intern.

**Google Meet + Intern Management:** When scheduling performance review meetings, admin can use the Schedule Meeting modal to invite both the intern and their mentor, automatically generating a Meet link for the evaluation discussion.

---

---

## Implementation Priority

| Priority | Feature | Estimated Time | Impact on Demo |
|----------|---------|---------------|----------------|
| 1 | AI HR Chatbot | 2 hours | Highest — live AI answering real questions is the most memorable demo moment |
| 2 | Communication Hub | 1 hour | High — visually impressive, immediately understandable, works on every profile |
| 3 | Google Calendar + Meet | 2 hours | High — shows external API integration, professional meeting workflow |
| 4 | Intern Management | 3 hours | Very High — deepest feature, shows complete lifecycle thinking |

Total estimated: ~8 hours across the virtual round.

If time is tight, the chatbot and communication hub alone (3 hours) create the strongest impression per hour invested. The Meet integration adds external API credibility. The intern module adds depth and originality.

---

---

## Hackathon Rule Compliance

| Hackathon Rule | How Our Add-Ons Address It |
|----------------|---------------------------|
| "Use real-time or dynamic data sources" | AI Chatbot pulls live data from DB for every response. Meet integration creates real Calendar events. Communication Hub uses live employee data. |
| "Avoid relying on static JSON" | Zero static data — all features query the database or external APIs in real time. |
| "Create a responsive and clean UI" | Communication Hub has compact + full modes. Meeting modal is responsive. Chat panel adapts to screen size. All use the existing Tailwind theme. |
| "Validate user input robustly" | Every form field has specific validations. Chat has rate limiting. Meeting forms validate dates, times, and attendee selection. Intern evaluations enforce score ranges and required text. |
| "Use intuitive navigation" | Communication Hub integrates into existing profiles. Chatbot floats on all pages. Meetings appear on dashboards. Intern management extends the existing admin nav. |
| "Use version control properly" | All add-ons live in separate files (new routers, new components) to minimize merge conflicts with the core team's work. Each feature can be its own commit or branch. |
