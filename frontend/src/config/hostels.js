/**
 * hostels.js
 * Single Source of Truth for IIITDM Jabalpur Hostels across the application.
 * Matches the Supabase PostgreSQL database seeds exactly.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

export const OFFICIAL_HOSTELS = [
  {
    id: 'h1-default-uuid',
    name: 'Hall of Residence 1',
    code: 'H1',
    description: 'Undergraduate Boys Hostel - Hall of Residence 1'
  },
  {
    id: 'h3-default-uuid',
    name: 'Hall of Residence 3',
    code: 'H3',
    description: 'Undergraduate Boys Hostel - Hall of Residence 3'
  },
  {
    id: 'h4-default-uuid',
    name: 'Hall of Residence 4 (Vivekananda)',
    code: 'H4',
    description: 'Swami Vivekananda Hall of Residence 4'
  },
  {
    id: 'msg-default-uuid',
    name: 'Maa Saraswati Girls Hostel',
    code: 'MSG',
    description: 'Maa Saraswati Girls Hostel (Resident Hall for Women)'
  },
  {
    id: 'pgh-default-uuid',
    name: 'Panini PG Hostel',
    code: 'PGH',
    description: 'Panini Postgraduate & Research Scholars Hostel'
  },
  {
    id: 'njh-default-uuid',
    name: 'Nagarjuna Hostel',
    code: 'NJH',
    description: 'Nagarjuna Postgraduate & Research Scholars Hostel'
  }
];

/**
 * Array of official hostel names for dropdown rendering
 */
export const HOSTEL_NAMES = OFFICIAL_HOSTELS.map(h => h.name);

/**
 * Fetches the active hostel list from Supabase if connected,
 * otherwise falls back instantly to the official static records.
 * 
 * @returns {Promise<Array<{id: string, name: string, code: string}>>}
 */
export async function fetchHostels() {
  if (!isSupabaseConfigured || !supabase) {
    return OFFICIAL_HOSTELS;
  }

  try {
    const { data, error } = await supabase
      .from('hostels')
      .select('id, name, code, description')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return OFFICIAL_HOSTELS;
    }
    return data;
  } catch (err) {
    console.warn('Could not fetch hostels from Supabase, using static source of truth:', err);
    return OFFICIAL_HOSTELS;
  }
}

/**
 * Helper to get a hostel record by name
 */
export function getHostelByName(name) {
  if (!name) return null;
  return OFFICIAL_HOSTELS.find(h => h.name.toLowerCase() === name.toLowerCase()) || null;
}
