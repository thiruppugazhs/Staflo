-- Supabase initial — tables are auto-created via SQLAlchemy Base.metadata.create_all on startup.
-- Keep this file for reference / manual Supabase SQL editor if needed.

-- Enable UUID
create extension if not exists "pgcrypto";

-- Companies, Users, Attendance, Leave, Payroll are created by FastAPI.
-- For Supabase dashboard, ensure RLS disabled (since FastAPI uses service_role + custom JWT).

-- Storage buckets (run via dashboard or supabase storage API):
-- insert into storage.buckets (id, name, public) values ('company-logos','company-logos', true);
-- insert into storage.buckets (id, name, public) values ('avatars','avatars', true);
-- insert into storage.buckets (id, name, public) values ('employee-documents','employee-documents', false);
-- insert into storage.buckets (id, name, public) values ('leave-docs','leave-docs', false);
