-- ==============================================================================
-- IIITDM Jabalpur - Smart Hostel Complaint Portal
-- Seed Data: 001_seed_hostels.sql
-- Description: Seeds the official IIITDM Jabalpur hostels as the single source
--              of truth for the database.
-- ==============================================================================

INSERT INTO public.hostels (name, code, description)
VALUES
    (
        'Hall of Residence 1',
        'H1',
        'Undergraduate Boys Hostel - Hall of Residence 1, PDPM IIITDM Jabalpur'
    ),
    (
        'Hall of Residence 3',
        'H3',
        'Undergraduate Boys Hostel - Hall of Residence 3, PDPM IIITDM Jabalpur'
    ),
    (
        'Hall of Residence 4 (Vivekananda)',
        'H4',
        'Swami Vivekananda Hall of Residence 4, PDPM IIITDM Jabalpur'
    ),
    (
        'Maa Saraswati Girls Hostel',
        'MSG',
        'Maa Saraswati Girls Hostel (Resident Hall for Women), PDPM IIITDM Jabalpur'
    ),
    (
        'Panini PG Hostel',
        'PGH',
        'Panini Postgraduate & Research Scholars Hostel, PDPM IIITDM Jabalpur'
    ),
    (
        'Nagarjuna Hostel',
        'NJH',
        'Nagarjuna Postgraduate & Research Scholars Hostel, PDPM IIITDM Jabalpur'
    )
ON CONFLICT (name) DO UPDATE SET
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    updated_at = now();
