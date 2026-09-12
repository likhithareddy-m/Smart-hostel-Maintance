-- ==============================================================================
-- IIITDM Jabalpur - Smart Hostel Complaint Portal
-- Seed Data: 002_seed_wardens.sql
-- Description: Seeds the verified IIITDM Jabalpur wardens into public.profiles
--              and registers their official hostel assignments in
--              public.admin_hostel_assignments.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED WARDEN AUTH USERS (IF RUN IN SUPABASE SQL EDITOR)
-- Note: In Supabase, auth.users holds the authentication identities.
-- If users exist or are created via auth API, profiles will link to them.
-- ------------------------------------------------------------------------------

DO $$
DECLARE
    h1_id UUID;
    h3_id UUID;
    h4_id UUID;
    msg_id UUID;
    pgh_id UUID;
    njh_id UUID;
    
    gowthaman_id UUID;
    sachin_id UUID;
    akshay_id UUID;
    pushpa_id UUID;
    ponappa_id UUID;
BEGIN
    -- Resolve Hostel UUIDs from public.hostels
    SELECT id INTO h1_id FROM public.hostels WHERE code = 'H1' OR name = 'Hall of Residence 1';
    SELECT id INTO h3_id FROM public.hostels WHERE code = 'H3' OR name = 'Hall of Residence 3';
    SELECT id INTO h4_id FROM public.hostels WHERE code = 'H4' OR name = 'Hall of Residence 4 (Vivekananda)';
    SELECT id INTO msg_id FROM public.hostels WHERE code = 'MSG' OR name = 'Maa Saraswati Girls Hostel';
    SELECT id INTO pgh_id FROM public.hostels WHERE code = 'PGH' OR name = 'Panini PG Hostel';
    SELECT id INTO njh_id FROM public.hostels WHERE code = 'NJH' OR name = 'Nagarjuna Hostel';

    -- Upsert Auth Users if not already present in auth.users
    -- 1. Dr. Gowthaman S (Hall-I)
    SELECT id INTO gowthaman_id FROM auth.users WHERE email = 'gowthaman@iiitdmj.ac.in';
    IF gowthaman_id IS NULL THEN
        gowthaman_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (
            gowthaman_id,
            '00000000-0000-0000-0000-000000000000',
            'gowthaman@iiitdmj.ac.in',
            crypt('Warden@IIITDMJ2026', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Dr. Gowthaman S","role":"admin"}',
            now(),
            now(),
            'authenticated'
        ) ON CONFLICT (email) DO UPDATE SET updated_at = now() RETURNING id INTO gowthaman_id;
    END IF;

    -- 2. Dr. Sachin Kumar (Hall-III)
    SELECT id INTO sachin_id FROM auth.users WHERE email = 'sachin@iiitdmj.ac.in';
    IF sachin_id IS NULL THEN
        sachin_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (
            sachin_id,
            '00000000-0000-0000-0000-000000000000',
            'sachin@iiitdmj.ac.in',
            crypt('Warden@IIITDMJ2026', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Dr. Sachin Kumar","role":"admin"}',
            now(),
            now(),
            'authenticated'
        ) ON CONFLICT (email) DO UPDATE SET updated_at = now() RETURNING id INTO sachin_id;
    END IF;

    -- 3. Dr. Akshay Pandey (Hall-IV & Panini PG Hostel)
    SELECT id INTO akshay_id FROM auth.users WHERE email = 'akshay.pandey@iiitdmj.ac.in';
    IF akshay_id IS NULL THEN
        akshay_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (
            akshay_id,
            '00000000-0000-0000-0000-000000000000',
            'akshay.pandey@iiitdmj.ac.in',
            crypt('Warden@IIITDMJ2026', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Dr. Akshay Pandey","role":"admin"}',
            now(),
            now(),
            'authenticated'
        ) ON CONFLICT (email) DO UPDATE SET updated_at = now() RETURNING id INTO akshay_id;
    END IF;

    -- 4. Dr. Pushpa Raikwal (Maa Saraswati Girls Hostel)
    SELECT id INTO pushpa_id FROM auth.users WHERE email = 'pushpa@iiitdmj.ac.in';
    IF pushpa_id IS NULL THEN
        pushpa_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (
            pushpa_id,
            '00000000-0000-0000-0000-000000000000',
            'pushpa@iiitdmj.ac.in',
            crypt('Warden@IIITDMJ2026', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Dr. Pushpa Raikwal","role":"admin"}',
            now(),
            now(),
            'authenticated'
        ) ON CONFLICT (email) DO UPDATE SET updated_at = now() RETURNING id INTO pushpa_id;
    END IF;

    -- 5. Dr. Ponappa.K (Nagarjuna Hostel)
    SELECT id INTO ponappa_id FROM auth.users WHERE email = 'ponappa@iiitdmj.ac.in';
    IF ponappa_id IS NULL THEN
        ponappa_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (
            ponappa_id,
            '00000000-0000-0000-0000-000000000000',
            'ponappa@iiitdmj.ac.in',
            crypt('Warden@IIITDMJ2026', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Dr. Ponappa.K","role":"admin"}',
            now(),
            now(),
            'authenticated'
        ) ON CONFLICT (email) DO UPDATE SET updated_at = now() RETURNING id INTO ponappa_id;
    END IF;

    -- --------------------------------------------------------------------------
    -- 2. UPSERT PUBLIC.PROFILES FOR WARDENS
    -- --------------------------------------------------------------------------
    INSERT INTO public.profiles (id, email, full_name, role, hostel_id)
    VALUES
        (gowthaman_id, 'gowthaman@iiitdmj.ac.in', 'Dr. Gowthaman S', 'admin', h1_id),
        (sachin_id, 'sachin@iiitdmj.ac.in', 'Dr. Sachin Kumar', 'admin', h3_id),
        (akshay_id, 'akshay.pandey@iiitdmj.ac.in', 'Dr. Akshay Pandey', 'admin', h4_id),
        (pushpa_id, 'pushpa@iiitdmj.ac.in', 'Dr. Pushpa Raikwal', 'admin', msg_id),
        (ponappa_id, 'ponappa@iiitdmj.ac.in', 'Dr. Ponappa.K', 'admin', njh_id)
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'admin',
        hostel_id = EXCLUDED.hostel_id,
        updated_at = now();

    -- --------------------------------------------------------------------------
    -- 3. UPSERT PUBLIC.ADMIN_HOSTEL_ASSIGNMENTS
    -- Official mappings:
    --   Vasishtha Hostel (Hall-I)   -> Dr. Gowthaman S
    --   Aryabhatta Hostel (Hall-III)-> Dr. Sachin Kumar
    --   Vivekananda Hostel (Hall-IV)-> Dr. Akshay Pandey
    --   Maa Saraswati Girls Hostel  -> Dr. Pushpa Raikwal
    --   Panini Hostel (PG)          -> Dr. Akshay Pandey (Multi-hostel!)
    --   Nagarjuna Hostel (PG)       -> Dr. Ponappa.K
    -- --------------------------------------------------------------------------
    INSERT INTO public.admin_hostel_assignments (admin_id, hostel_id, role_title)
    VALUES
        (gowthaman_id, h1_id, 'Warden'),
        (sachin_id, h3_id, 'Warden'),
        (akshay_id, h4_id, 'Warden'),
        (pushpa_id, msg_id, 'Warden'),
        (akshay_id, pgh_id, 'Warden'),
        (ponappa_id, njh_id, 'Warden')
    ON CONFLICT (admin_id, hostel_id) DO UPDATE SET
        role_title = EXCLUDED.role_title;

    RAISE NOTICE 'Official IIITDM Jabalpur wardens and assignments successfully seeded!';
END $$;
