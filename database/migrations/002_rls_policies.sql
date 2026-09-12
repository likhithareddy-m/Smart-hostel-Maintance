-- ==============================================================================
-- IIITDM Jabalpur - Smart Hostel Complaint Portal
-- Migration: 002_rls_policies.sql
-- Description: Row Level Security (RLS) policies and auth synchronization triggers.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_hostel_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. HOSTELS POLICIES
-- ------------------------------------------------------------------------------
-- All users (authenticated and anonymous) can read the hostel list (needed for login/signup)
CREATE POLICY "Allow public read of hostels"
    ON public.hostels
    FOR SELECT
    USING (true);

-- ------------------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Admins can view profiles of students in their assigned hostels
CREATE POLICY "Admins can view assigned student profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles current_user_p
            WHERE current_user_p.id = auth.uid() AND current_user_p.role = 'admin'
        )
    );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4. ADMIN HOSTEL ASSIGNMENTS POLICIES
-- ------------------------------------------------------------------------------
-- Admins can view their own hostel assignments
CREATE POLICY "Admins can view own assignments"
    ON public.admin_hostel_assignments
    FOR SELECT
    TO authenticated
    USING (admin_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 5. COMPLAINTS POLICIES
-- ------------------------------------------------------------------------------
-- Students can only view their own registered complaints
CREATE POLICY "Students can view own complaints"
    ON public.complaints
    FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid()
    );

-- Admins can view complaints belonging strictly to their assigned hostels
CREATE POLICY "Admins can view assigned hostel complaints"
    ON public.complaints
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_hostel_assignments aha
            WHERE aha.admin_id = auth.uid() AND aha.hostel_id = complaints.hostel_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin' AND (p.hostel_id = complaints.hostel_id OR p.hostel_id IS NULL)
        )
    );

-- Students can insert complaints under their own student_id
CREATE POLICY "Students can insert own complaints"
    ON public.complaints
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid()
    );

-- Admins can update complaints belonging to their authorized hostels (e.g. status changes)
CREATE POLICY "Admins can update assigned hostel complaints"
    ON public.complaints
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_hostel_assignments aha
            WHERE aha.admin_id = auth.uid() AND aha.hostel_id = complaints.hostel_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin' AND (p.hostel_id = complaints.hostel_id OR p.hostel_id IS NULL)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_hostel_assignments aha
            WHERE aha.admin_id = auth.uid() AND aha.hostel_id = complaints.hostel_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin' AND (p.hostel_id = complaints.hostel_id OR p.hostel_id IS NULL)
        )
    );

-- ------------------------------------------------------------------------------
-- 6. COMPLAINT STATUS HISTORY POLICIES
-- ------------------------------------------------------------------------------
-- Users can view timeline entries for complaints they are authorized to view
CREATE POLICY "Users can view accessible complaint status history"
    ON public.complaint_status_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.complaints c
            WHERE c.id = complaint_status_history.complaint_id
              AND (
                  c.student_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.admin_hostel_assignments aha
                      WHERE aha.admin_id = auth.uid() AND aha.hostel_id = c.hostel_id
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.profiles p
                      WHERE p.id = auth.uid() AND p.role = 'admin' AND (p.hostel_id = c.hostel_id OR p.hostel_id IS NULL)
                  )
              )
        )
    );

-- Authorized admins and students can insert history entries for their tickets
CREATE POLICY "Authorized users can insert complaint status history"
    ON public.complaint_status_history
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.complaints c
            WHERE c.id = complaint_status_history.complaint_id
              AND (
                  c.student_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.admin_hostel_assignments aha
                      WHERE aha.admin_id = auth.uid() AND aha.hostel_id = c.hostel_id
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.profiles p
                      WHERE p.id = auth.uid() AND p.role = 'admin'
                  )
              )
        )
    );

-- ------------------------------------------------------------------------------
-- 7. SUPABASE AUTH USER SYNCHRONIZATION TRIGGER
-- ------------------------------------------------------------------------------
-- Automatically creates a public.profiles record when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_hostel_id UUID;
    user_role VARCHAR(20);
    user_roll_no VARCHAR(50);
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    user_roll_no := COALESCE(NEW.raw_user_meta_data->>'roll_number', split_part(NEW.email, '@', 1));
    
    -- Attempt to look up hostel by name if provided in metadata
    IF NEW.raw_user_meta_data->>'hostel_name' IS NOT NULL THEN
        SELECT id INTO assigned_hostel_id
        FROM public.hostels
        WHERE name = (NEW.raw_user_meta_data->>'hostel_name')
        LIMIT 1;
    ELSIF NEW.raw_user_meta_data->>'hostel_id' IS NOT NULL THEN
        assigned_hostel_id := (NEW.raw_user_meta_data->>'hostel_id')::UUID;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, roll_number, role, hostel_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', initcap(split_part(NEW.email, '@', 1))),
        user_roll_no,
        user_role,
        assigned_hostel_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        hostel_id = COALESCE(EXCLUDED.hostel_id, public.profiles.hostel_id),
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to hook into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
