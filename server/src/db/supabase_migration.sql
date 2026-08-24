-- ==========================================================
-- DAILY FLOW HRMS - SUPABASE DATABASE MIGRATION SCRIPT
-- Paste and execute this entire script in Supabase SQL Editor
-- ==========================================================

-- Enable pgcrypto for UUIDs & hashing if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users Table (Admin, HR, Employee)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN', 'HR', 'EMPLOYEE')),
  department TEXT DEFAULT 'General',
  designation TEXT DEFAULT 'Staff',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  joining_date TEXT DEFAULT '',
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'PROBATION')),
  is_verified INTEGER DEFAULT 1,
  verification_token TEXT DEFAULT '',
  must_change_password INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Salary Structures
CREATE TABLE IF NOT EXISTS salary_structures (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  hra NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  effective_date TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Attendance & Timesheets
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  duration_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. Leaves & Time-Off
CREATE TABLE IF NOT EXISTS leaves (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK(leave_type IN ('PAID', 'SICK', 'UNPAID', 'CASUAL')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_comment TEXT DEFAULT '',
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payroll Slips
CREATE TABLE IF NOT EXISTS payroll_slips (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  basic_salary NUMERIC NOT NULL,
  hra NUMERIC NOT NULL,
  allowances NUMERIC NOT NULL,
  deductions NUMERIC NOT NULL,
  net_pay NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAID' CHECK(status IN ('PAID', 'PENDING', 'GENERATED')),
  payment_date TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- 6. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL' CHECK(category IN ('GENERAL', 'IMPORTANT', 'POLICY', 'EVENT', 'HOLIDAY')),
  target_department TEXT DEFAULT 'ALL',
  author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Helpdesk Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('PAYROLL', 'LEAVE', 'BENEFITS', 'WORKPLACE', 'TECHNICAL', 'OTHER')),
  priority TEXT DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  department TEXT NOT NULL,
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Helpdesk Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. OTP Verifications (Forgot Password)
CREATE TABLE IF NOT EXISTS otp_verifications (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Documents
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size TEXT DEFAULT '1.2 MB',
  upload_date DATE DEFAULT CURRENT_DATE
);

-- 11. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO' CHECK(type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT')),
  is_read INTEGER DEFAULT 0,
  link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Departments
CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Leave Policy Limits
CREATE TABLE IF NOT EXISTS leave_limits (
  id BIGSERIAL PRIMARY KEY,
  leave_type TEXT UNIQUE NOT NULL,
  annual_limit INTEGER NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Departments
INSERT INTO departments (name, description) VALUES
('Engineering', 'Software development, cloud infrastructure, and QA'),
('Product & Design', 'UI/UX design, product strategy, and user experience'),
('Human Resources', 'People operations, talent acquisition, and compliance'),
('Finance', 'Accounting, corporate payroll, and fiscal planning'),
('Marketing', 'Growth marketing, branding, and communications'),
('Sales', 'Business development and client accounts'),
('Executive Management', 'Executive leadership and company administration'),
('General', 'General administration and support')
ON CONFLICT (name) DO NOTHING;

-- Seed Default Leave Limits
INSERT INTO leave_limits (leave_type, annual_limit, description) VALUES
('PAID', 18, 'Annual Paid Vacation & Earned Leave'),
('SICK', 12, 'Medical, Health & Wellness Leave'),
('CASUAL', 10, 'Personal, Family & Casual Emergency Leave'),
('UNPAID', 30, 'Extended Unpaid Leave of Absence')
ON CONFLICT (leave_type) DO NOTHING;

-- Seed Initial Master Admin Account (admin@dayflow.com / Admin@1234)
INSERT INTO users (
  employee_id, name, email, password, role, department, designation, phone, status, is_verified, must_change_password
) VALUES (
  'ADM-001',
  'Sarah Jenkins',
  'admin@dayflow.com',
  '$2a$10$Q7eY45J36F6Zq1gRfZ6C6OPZk/6L6Ncf1M0wL2R8v3H4jI2w8wL6G',
  'ADMIN',
  'Executive Management',
  'System Administrator & HR Director',
  '9876543210',
  'ACTIVE',
  1,
  0
) ON CONFLICT (email) DO NOTHING;

-- Initial Admin Salary
INSERT INTO salary_structures (user_id, basic_salary, hra, allowances, deductions, net_salary, effective_date)
SELECT id, 8500, 2500, 1500, 1200, 11300, CURRENT_DATE::text
FROM users WHERE email = 'admin@dayflow.com'
ON CONFLICT (user_id) DO NOTHING;

-- Welcome Announcement
INSERT INTO announcements (title, content, category, target_department, author_id)
SELECT 'Welcome to Daily Flow', 'Welcome to the Daily Flow organizational workspace powered by Supabase Cloud.', 'IMPORTANT', 'ALL', id
FROM users WHERE email = 'admin@dayflow.com'
ON CONFLICT DO NOTHING;
