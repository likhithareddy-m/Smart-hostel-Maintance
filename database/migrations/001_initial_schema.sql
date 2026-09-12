-- ==============================================================================
-- IIITDM Jabalpur - Smart Hostel Complaint Portal
-- Migration: 001_initial_schema.sql
-- Description: Core relational schema for hostels, user profiles, admin assignments,
--              complaints, and status tracking history.
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. HOSTELS TABLE (Single Source of Truth for Institute Hostels)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on hostel code and name
CREATE INDEX IF NOT EXISTS idx_hostels_code ON public.hostels(code);
CREATE INDEX IF NOT EXISTS idx_hostels_name ON public.hostels(name);

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES TABLE (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    roll_number VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE SET NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on profile lookup fields
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_hostel_id ON public.profiles(hostel_id);

-- ------------------------------------------------------------------------------
-- 3. ADMIN HOSTEL ASSIGNMENTS TABLE (Maps Wardens/Caretakers to Specific Hostels)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_hostel_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    role_title VARCHAR(50) NOT NULL DEFAULT 'Caretaker', -- 'Warden', 'Caretaker', 'Supervisor'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_admin_hostel UNIQUE (admin_id, hostel_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_hostel_admin ON public.admin_hostel_assignments(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_hostel_hostel ON public.admin_hostel_assignments(hostel_id);

-- ------------------------------------------------------------------------------
-- 4. COMPLAINTS TABLE (Official Student Maintenance Tickets)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number VARCHAR(30) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE RESTRICT,
    room VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    issue_type VARCHAR(100),
    department VARCHAR(100),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(30) NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'Assigned', 'Scheduled', 'In Progress', 'Resolved')),
    assigned_to VARCHAR(150),
    ai_analysis JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON public.complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_hostel_id ON public.complaints(hostel_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. COMPLAINT STATUS HISTORY TABLE (Audit Trail & Timeline Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL CHECK (stage IN ('Reported', 'Assigned', 'Scheduled', 'In Progress', 'Resolved')),
    note TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_complaint_id ON public.complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON public.complaint_status_history(created_at ASC);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_hostels_updated_at ON public.hostels;
CREATE TRIGGER set_hostels_updated_at
    BEFORE UPDATE ON public.hostels
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_complaints_updated_at ON public.complaints;
CREATE TRIGGER set_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
