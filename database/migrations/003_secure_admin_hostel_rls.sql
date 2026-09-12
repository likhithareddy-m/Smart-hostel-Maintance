-- ==============================================================================
-- IIITDM Jabalpur - Smart Hostel Complaint Portal
-- Migration: 003_secure_admin_hostel_rls.sql
-- Description: 
--   1. Secure RPC function to lookup warden's assigned hostel(s) by official email.
--   2. Enforces strict RLS on complaints so admins cannot view complaints outside
--      their database-authorized hostel assignments.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURE FUNCTION: LOOKUP WARDEN ASSIGNED HOSTELS BY EMAIL
-- Allows the Admin Login view to identify the warden's assigned hostel(s) directly
-- from the database upon entering their administrative email.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_warden_hostels_by_email(lookup_email text)
RETURNS TABLE (
    hostel_id UUID,
    hostel_name VARCHAR,
    hostel_code VARCHAR,
    warden_name VARCHAR,
    role_title VARCHAR
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        h.id AS hostel_id,
        h.name AS hostel_name,
        h.code AS hostel_code,
        p.full_name AS warden_name,
        aha.role_title
    FROM public.profiles p
    JOIN public.admin_hostel_assignments aha ON aha.admin_id = p.id
    JOIN public.hostels h ON h.id = aha.hostel_id
    WHERE LOWER(p.email) = LOWER(TRIM(lookup_email))
      AND p.role = 'admin'
    ORDER BY h.name ASC;
$$;

-- Allow anon and authenticated clients to query warden hostel assignments
GRANT EXECUTE ON FUNCTION public.get_warden_hostels_by_email(text) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. TIGHTEN RLS ON COMPLAINTS
-- Ensure admins can ONLY select and update complaints strictly within their
-- assigned hostels in admin_hostel_assignments. Disallow any NULL-hostel bypass.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view assigned hostel complaints" ON public.complaints;
CREATE POLICY "Admins can view assigned hostel complaints"
    ON public.complaints
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_hostel_assignments aha
            WHERE aha.admin_id = auth.uid() 
              AND aha.hostel_id = complaints.hostel_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
              AND p.role = 'admin' 
              AND p.hostel_id IS NOT NULL 
              AND p.hostel_id = complaints.hostel_id
        )
    );

DROP POLICY IF EXISTS "Admins can update assigned hostel complaints" ON public.complaints;
CREATE POLICY "Admins can update assigned hostel complaints"
    ON public.complaints
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_hostel_assignments aha
            WHERE aha.admin_id = auth.uid() 
              AND aha.hostel_id = complaints.hostel_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
              AND p.role = 'admin' 
              AND p.hostel_id IS NOT NULL 
              AND p.hostel_id = complaints.hostel_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_hostel_assignments aha
            WHERE aha.admin_id = auth.uid() 
              AND aha.hostel_id = complaints.hostel_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
              AND p.role = 'admin' 
              AND p.hostel_id IS NOT NULL 
              AND p.hostel_id = complaints.hostel_id
        )
    );
