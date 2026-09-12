/**
 * wardens.js
 * Single Source of Truth for Official IIITDM Jabalpur Wardens & Hostel Assignments.
 * Matches the official institutional administration mappings and Supabase database seeds.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { OFFICIAL_HOSTELS } from './hostels.js';

export const OFFICIAL_WARDENS = [
  {
    name: 'Dr. Gowthaman S',
    primaryEmail: 'gowtham@iiitdmj.ac.in',
    // gowtham (single-a) is the primary login email; gowthaman (double-a) kept as alias
    aliases: ['gowtham@iiitdmj.ac.in', 'gowthaman@iiitdmj.ac.in', 'gowthaman.s@iiitdmj.ac.in', 'warden.h1@iiitdmj.ac.in'],
    role: 'Warden',
    assignedHostelNames: ['Hall of Residence 1'],
    notes: 'Vasishtha Hostel (Hall-I)'
  },
  {
    name: 'Dr. Sachin Kumar',
    primaryEmail: 'sachin@iiitdmj.ac.in',
    aliases: ['sachin@iiitdmj.ac.in', 'sachin.kumar@iiitdmj.ac.in', 'warden.h3@iiitdmj.ac.in'],
    role: 'Warden',
    assignedHostelNames: ['Hall of Residence 3'],
    notes: 'Aryabhatta Hostel (Hall-III)'
  },
  {
    name: 'Dr. Akshay Pandey',
    primaryEmail: 'akshay.pandey@iiitdmj.ac.in',
    aliases: ['akshay.pandey@iiitdmj.ac.in', 'akshay@iiitdmj.ac.in', 'warden.h4@iiitdmj.ac.in', 'warden.pgh@iiitdmj.ac.in'],
    role: 'Warden',
    // Officially assigned to BOTH Hall of Residence 4 and Panini PG Hostel
    assignedHostelNames: ['Hall of Residence 4 (Vivekananda)', 'Panini PG Hostel'],
    notes: 'Vivekananda Hostel (Hall-IV) & Panini PG Hostel (PG Unmarried)'
  },
  {
    name: 'Dr. Pushpa Raikwal',
    primaryEmail: 'pushpa@iiitdmj.ac.in',
    aliases: ['pushpa@iiitdmj.ac.in', 'pushpa.raikwal@iiitdmj.ac.in', 'warden.msg@iiitdmj.ac.in'],
    role: 'Warden',
    assignedHostelNames: ['Maa Saraswati Girls Hostel'],
    notes: 'Maa Saraswati Girls Hostel (Resident Hall for Women)'
  },
  {
    name: 'Dr. Ponappa.K',
    primaryEmail: 'ponappa@iiitdmj.ac.in',
    aliases: ['ponappa@iiitdmj.ac.in', 'ponappa.k@iiitdmj.ac.in', 'warden.njh@iiitdmj.ac.in'],
    role: 'Warden',
    assignedHostelNames: ['Nagarjuna Hostel'],
    notes: 'Nagarjuna Hostel (PG Married)'
  }
];

/**
 * Normalizes email string
 */
function normalize(email) {
  return (email || '').trim().toLowerCase();
}

/**
 * Find warden configuration record by email or alias
 * @param {string} email
 * @returns {Object|null}
 */
export function lookupWardenByEmail(email) {
  if (!email) return null;
  const target = normalize(email);
  return OFFICIAL_WARDENS.find((w) => 
    w.aliases.some((alias) => normalize(alias) === target) ||
    normalize(w.primaryEmail) === target
  ) || null;
}

/**
 * Retrieve assigned hostel objects for a given warden email from static verified records
 * @param {string} email
 * @returns {Array<Object>}
 */
export function getAssignedHostelsForWarden(email) {
  const warden = lookupWardenByEmail(email);
  if (!warden) return [];

  return warden.assignedHostelNames
    .map((name) => OFFICIAL_HOSTELS.find((h) => h.name.toLowerCase() === name.toLowerCase()))
    .filter(Boolean);
}

/**
 * Identify warden and assigned hostel(s) dynamically from Supabase database,
 * with graceful fallback to the verified static mappings.
 * 
 * @param {string} email
 * @returns {Promise<{
 *   wardenName: string,
 *   isAuthorizedWarden: boolean,
 *   hostels: Array<{hostelId: string, hostelName: string, hostelCode: string, roleTitle: string}>
 * }>}
 */
export async function fetchWardenHostels(email) {
  const normalizedEmail = normalize(email);
  if (!normalizedEmail) {
    return { wardenName: '', isAuthorizedWarden: false, hostels: [] };
  }

  // 1. Attempt database lookup via Supabase RPC if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('get_warden_hostels_by_email', {
        lookup_email: normalizedEmail
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          wardenName: data[0].warden_name || 'Hostel Administrator',
          isAuthorizedWarden: true,
          hostels: data.map((row) => ({
            hostelId: row.hostel_id,
            hostelName: row.hostel_name,
            hostelCode: row.hostel_code,
            roleTitle: row.role_title || 'Warden'
          }))
        };
      }
    } catch (err) {
      console.warn('Supabase warden lookup RPC error, falling back to verified mapping:', err);
    }
  }

  // 2. Fallback to official verified institutional mapping
  const localWarden = lookupWardenByEmail(normalizedEmail);
  if (localWarden) {
    const assignedHostels = getAssignedHostelsForWarden(normalizedEmail);
    return {
      wardenName: localWarden.name,
      isAuthorizedWarden: true,
      hostels: assignedHostels.map((h) => ({
        hostelId: h.id,
        hostelName: h.name,
        hostelCode: h.code,
        roleTitle: localWarden.role
      }))
    };
  }

  return {
    wardenName: '',
    isAuthorizedWarden: false,
    hostels: []
  };
}
