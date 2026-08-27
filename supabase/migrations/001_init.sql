-- DailyFlow Database Migration for Supabase PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE userrole AS ENUM ('admin', 'hr', 'employee', 'intern');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendancestatus AS ENUM ('present', 'absent', 'half_day', 'leave', 'break');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE leavetypename AS ENUM ('paid', 'sick', 'unpaid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE leavestatus AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE componenttype AS ENUM ('earning', 'deduction');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE valuetype AS ENUM ('fixed', 'percentage');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE meetingstatus AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE internshipstatus AS ENUM ('active', 'extended', 'completed', 'converted', 'terminated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE conversionstatus AS ENUM ('pending', 'offered', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE evaluationtype AS ENUM ('midterm', 'final');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE recommendation AS ENUM ('convert', 'extend', 'end');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Drop old conflicting tables if needed
DROP TABLE IF EXISTS intern_evaluations CASCADE;
DROP TABLE IF EXISTS internship_details CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS payroll_slips CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS salary_components CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS leave_limits CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 3. Create Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by_user_id UUID
);

-- 4. Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role userrole NOT NULL DEFAULT 'employee',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    address VARCHAR(500),
    job_title VARCHAR(100),
    department VARCHAR(100),
    date_of_joining DATE,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_temp_password BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);

-- 5. Create Attendance Records Table
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status attendancestatus DEFAULT 'present',
    working_hours FLOAT,
    location_in JSONB,
    location_out JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX idx_attendance_company_id ON attendance_records(company_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);

-- 6. Create Leave Types, Balances, Requests
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name leavetypename NOT NULL,
    days_per_year INT DEFAULT 12,
    requires_docs BOOLEAN DEFAULT FALSE
);

CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INT NOT NULL,
    paid_remaining INT DEFAULT 12,
    sick_remaining INT DEFAULT 7,
    unpaid_taken INT DEFAULT 0
);
CREATE INDEX idx_leave_balances_user_id ON leave_balances(user_id);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type leavetypename NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INT NOT NULL,
    reason TEXT,
    doc_url VARCHAR(500),
    status leavestatus DEFAULT 'pending',
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_company_id ON leave_requests(company_id);

-- 7. Create Payroll Components, Structures, Runs
CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type componenttype NOT NULL,
    value_type valuetype NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    percentage_of VARCHAR(50),
    is_mandatory BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_salary_components_company_id ON salary_components(company_id);

CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    monthly_wage NUMERIC(12,2) NOT NULL,
    yearly_wage NUMERIC(12,2) NOT NULL,
    breakdown JSONB,
    effective_from DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_salary_structures_user_id ON salary_structures(user_id);

CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    month INT NOT NULL,
    year INT NOT NULL,
    generated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- 9. Create Meetings Table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    meet_link VARCHAR(500),
    calendar_event_id VARCHAR(200),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status meetingstatus NOT NULL DEFAULT 'scheduled',
    attendee_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_meetings_company_id ON meetings(company_id);

-- 10. Create Internships & Evaluations Table
CREATE TABLE internship_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    stipend NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status internshipstatus NOT NULL DEFAULT 'active',
    project_title VARCHAR(200),
    institute VARCHAR(200),
    evaluation_score FLOAT,
    conversion_status conversionstatus NOT NULL DEFAULT 'pending',
    conversion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_internship_details_user_id ON internship_details(user_id);
CREATE INDEX idx_internship_details_company_id ON internship_details(company_id);

CREATE TABLE intern_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    evaluation_type evaluationtype NOT NULL,
    technical INT NOT NULL,
    communication INT NOT NULL,
    teamwork INT NOT NULL,
    punctuality INT NOT NULL,
    initiative INT NOT NULL,
    overall_score FLOAT NOT NULL,
    strengths TEXT,
    improvements TEXT,
    comments TEXT,
    recommendation recommendation,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_intern_evaluations_intern_id ON intern_evaluations(intern_id);
CREATE INDEX idx_intern_evaluations_company_id ON intern_evaluations(company_id);

