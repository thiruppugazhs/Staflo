# Daily Flow — Human Resource Management System (HRMS)
> *Every workday, perfectly aligned.*

🔗 **Live Demo**: [https://dailyflow.thiruppugazhs.in](https://dailyflow.thiruppugazhs.in)

A full-stack, enterprise-grade Human Resource Management System (HRMS) built with React, Vite, Tailwind CSS, Lucide Icons, Recharts, Express.js, Supabase Cloud PostgreSQL, SQLite caching, Resend Transactional Email Engine, and JWT Role-Based Access Control (RBAC).

---

## 🔑 Master Admin Credentials

| Role | Work Email | Password | Access & Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@dayflow.com` | `Admin@1234` | Master Administrative Access (Onboard HR & Employees, Manage Departments, Configure Leave Policies) |

> ℹ️ **Note on Employee Accounts**: Staff and HR Officer accounts are onboarded directly by the Administrator or HR. Newly onboarded members automatically receive their temporary login credentials and welcome pack via official transactional email.

---

## 🌟 Key Features

### 1. Authentication & Security
- **JWT & Role-Based Access Control (RBAC)**: Distinct permission boundaries for **System Administrator**, **HR Officers**, and **Employees**.
- **Transactional Welcome Emails**: Powered by **Resend** with direct automated credential dispatch.
- **3-Stage Forgot Password Flow**: Secure verification via 6-digit email OTP before unlocking password resets.
- **First-Time Login Security**: Mandatory temporary password reset on initial sign-in.
- **Interactive Password Visibility**: One-click view/hide toggle for password inputs.

### 2. Workforce Directory & Profiles
- **Dynamic Table & Card Views**: Sortable table with employee IDs, role badges, departments, job designations, status, net compensation, and quick profile inspection.
- **Comprehensive Profile Management**:
  - Personal Details & Contact Info (self-service profile edits with permanent cloud persistence).
  - Job & Department Hierarchy (department classification, job title, joining date).
  - Compensation & Salary Structure (Basic, HRA, Allowances, Deductions, Net Salary).
  - Document Management (contracts, IDs, NDAs with live upload and preview).
- **Admin Record Deletion**: Delete records with confirmation modals and permission safeguards.

### 3. Department Management (Admin)
- **Custom Business Units**: Create new organizational departments with dedicated names and descriptions.
- **Real-Time Staff Counts**: Live employee tally badges per department.
- **Deletion Safeguards**: Prevents accidental deletion of departments that have active staff assigned.

### 4. Time-Off & Leave Quota Policy
- **Configurable Annual Limits**: Admins can customize annual day quotas for **Paid Leave**, **Sick Leave**, **Casual Leave**, and **Unpaid Leave**.
- **Dynamic Balance Engine**: Automatic calculation of used vs. remaining leave days based on organization policy.
- **Approval Workflow**: Dedicated HR/Admin review inbox with Approve/Reject actions and remarks.

### 5. Attendance & Time Tracking
- **Live Punch Clock**: Real-time timer, Check-In and Check-Out actions, and dynamic duration computation.
- **Daily & Historical Views**: Date pickers, status filters (Present, Half-Day, Leave, Absent).
- **Hardware Integration Ready**: Architecture prepared for biometric and RFID card punch machine sync.

### 6. Payroll & Compensation
- **Printable Salary Slips**: Official PDF-ready monthly pay stubs with tax deductions and net take-home pay.
- **Batch Monthly Disbursement**: One-click organization-wide payroll processing.

### 7. Cloud Persistence & Reliability
- **Supabase Cloud PostgreSQL**: Full cloud database persistence guaranteeing zero data loss across deployments.
- **High-Speed Cache**: Sub-millisecond queries with automatic background delta sync.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm

### 1. Installation
Install all dependencies:
```bash
# In repository root:
npm run install:all
```
*Or manually:*
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Running in Development Mode
Start backend (Port 5000) and frontend (Port 3000) concurrently:
```bash
npm run dev
```

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Live Production URL**: `https://dailyflow.thiruppugazhs.in`

### 3. Automated Verification Test Suite
Run the full backend integration test suite verifying all 15 endpoints:
```bash
cd server
node tests/api.test.js
```