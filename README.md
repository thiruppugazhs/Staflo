# Dayflow — Human Resource Management System (HRMS)
> *Every workday, perfectly aligned.*

A full-stack, enterprise-grade Human Resource Management System (HRMS) built with React, Vite, Tailwind CSS, Lucide Icons, Recharts, Express.js, SQLite, and JWT RBAC authentication.

---

## 🌟 Key Features

### 1. Authentication & Security
- **JWT & Role-Based Access Control (RBAC)**: Distinct permissions for **Admin / HR Officers** vs **Employees**.
- **Sign Up & Sign In**: Input validation, password security rules, and email activation workflow.
- **One-Click Demo Switcher**: Instant fast login toggles for testing Admin and Employee roles.

### 2. Workforce Directory & Profiles
- **Full Employee Directory**: Filter by department (Engineering, HR, Product, Finance, Marketing, Sales), search by name/title/ID, and toggle between Card and Table views.
- **Comprehensive Profile Tabs**:
  - Personal Details & Contact Info (self-service editing for phone, address, profile photo).
  - Job & Hierarchy Info (department, designation, manager, joining date, active status).
  - Compensation & Salary Structure (Basic, HRA, Allowances, Deductions, Net Salary).
  - Document Management (employment contracts, ID proofs, NDAs with preview/download).
  - Historical Attendance & Leave Activity logs.
- **Onboarding Modal**: HR Admins can onboard new employees directly with compensation setup.

### 3. Attendance & Time Tracking
- **Live Punch Clock**: Real-time timer, Check-In and Check-Out buttons, dynamic status indicator (Present, Working, Checked Out), and duration computation.
- **Daily & Historical Views**: Date pickers, status filters (Present, Half-Day, Leave, Absent).
- **Admin Overrides & Manual Entries**: Manual attendance log modal and record adjustments.

### 4. Time-Off & Leave Management
- **Apply for Leave**: Automatic duration calculation between start and end dates, leave category selection (Paid, Sick, Casual, Unpaid), and reason submission.
- **Quota Tracking**: Real-time balance meters (Paid: 18, Sick: 12, Casual: 6, Unpaid: 30).
- **HR Approval Inbox**: Pending queue, one-click review modal with Approve/Reject actions, and reviewer remarks.
- **Immediate Reflection**: Approved leaves update employee records and attendance sheets automatically.

### 5. Payroll & Salary Slips
- **Employee Pay Stub Viewer**: View and print official monthly pay slips with earnings breakdown, tax deductions, and take-home pay.
- **Printable & PDF-Ready Statements**: Formatted for print or export directly from the browser.
- **Admin Compensation Engine**: Configure basic salary, HRA, allowances, and tax deductions per employee.
- **Batch Payroll Generator**: Process and disburse monthly payroll for the entire organization in one click.

### 6. Analytics & Intelligence
- **Executive KPI Dashboard**: Live attendance rate, active headcount, monthly payroll burn, and pending review counts.
- **Interactive Recharts Visualizations**:
  - Weekly Attendance Volume (Present, Half-Day, Leave, Absent).
  - Department Headcount & Payroll Expenditure bar charts.
  - Leave Types Breakdown.
- **CSV Data Export**: One-click download of organization analytics.

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin / HR Officer** | `admin@dayflow.com` | `Admin@1234` | Sarah Jenkins (HR Director) — full administrative access |
| **Employee** | `employee@dayflow.com` | `Employee@1234` | Alex Rivera (Senior Full Stack Engineer) — standard access |

*(Quick switch buttons are also provided directly on the Login screen and Sidebar)*

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Installation
Install root, server, and client dependencies:
```bash
# In the repository root:
npm run install:all
```
*Or manually:*
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Running Locally in Development Mode
Start both backend (Port 5000) and frontend (Port 3000) concurrently:
```bash
npm run dev
```

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

### 3. Automated Test Suite
Run the backend integration test suite verifying all 11 API endpoints:
```bash
cd server
node tests/api.test.js
```