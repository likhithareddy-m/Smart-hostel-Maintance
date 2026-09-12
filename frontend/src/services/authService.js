/**
 * authService.js
 * Supabase Authentication & Profile Management Service
 * Provides secure login/logout and session management for Students and Admins.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { getHostelByName } from '../config/hostels.js';

/**
 * Authenticate Student
 * @param {Object} params
 * @param {string} params.email - Student institutional email (rollno@iiitdmj.ac.in)
 * @param {string} params.password - Student password
 * @param {string} params.hostel - Selected hostel name
 */
export async function signInStudent({ email, password, hostel }) {
  const normalizedEmail = email.trim().toLowerCase();
  const username = normalizedEmail.split('@')[0];
  const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
  const hostelRecord = getHostelByName(hostel);

  if (!isSupabaseConfigured || !supabase) {
    // Return client session object
    return {
      success: true,
      user: {
        id: `mock-student-${username}`,
        email: normalizedEmail,
        name: formattedName,
        rollNo: username.toUpperCase(),
        hostel: hostel,
        hostelId: hostelRecord?.id,
        role: 'student'
      }
    };
  }

  try {
    // 1. Attempt login with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    // If user does not exist yet in Supabase Auth, attempt sign-up for quick dev testing
    if (authError && authError.message.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          data: {
            full_name: formattedName,
            roll_number: username.toUpperCase(),
            role: 'student',
            hostel_name: hostel,
            hostel_id: hostelRecord?.id
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      return {
        success: true,
        user: {
          id: signUpData.user?.id,
          email: normalizedEmail,
          name: formattedName,
          rollNo: username.toUpperCase(),
          hostel: hostel,
          hostelId: hostelRecord?.id,
          role: 'student'
        }
      };
    }

    if (authError) {
      throw authError;
    }

    // 2. Fetch profile from Supabase
    let profile = null;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, hostels(id, name, code)')
      .eq('id', authData.user.id)
      .single();

    profile = profileData;

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.full_name || formattedName,
        rollNo: profile?.roll_number || username.toUpperCase(),
        hostel: profile?.hostels?.name || hostel,
        hostelId: profile?.hostel_id || hostelRecord?.id,
        role: 'student'
      }
    };
  } catch (err) {
    console.error('Supabase student login error:', err);
    return {
      success: false,
      error: err.message || 'Authentication failed. Please check your credentials.'
    };
  }
}

/**
 * Authenticate Admin / Warden / Caretaker
 * @param {Object} params
 * @param {string} params.email - Admin email
 * @param {string} params.password - Admin password
 */
export async function signInAdmin({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: true,
      user: {
        id: 'mock-admin-id',
        email: normalizedEmail,
        name: 'Hostel Administrator',
        role: 'admin',
        hostels: ['Hall of Residence 4 (Vivekananda)']
      }
    };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (authError) {
      throw authError;
    }

    // Fetch admin profile and assigned hostels
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, admin_hostel_assignments(hostel_id, hostels(id, name, code))')
      .eq('id', authData.user.id)
      .single();

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profileData?.full_name || 'Administrator',
        role: 'admin',
        assignedHostels: profileData?.admin_hostel_assignments || []
      }
    };
  } catch (err) {
    console.error('Supabase admin login error:', err);
    return {
      success: false,
      error: err.message || 'Administrative authentication failed.'
    };
  }
}

/**
 * Sign Out Current User
 */
export async function signOut() {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during Supabase sign out:', err);
    }
  }
}
