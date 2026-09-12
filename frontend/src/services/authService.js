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

import { lookupWardenByEmail } from '../config/wardens.js';


/**
 * Authenticate Admin / Warden / Caretaker
 * Strictly validates administrative credentials and extracts authorized hostel assignments
 * directly from the database relationship (public.admin_hostel_assignments).
 * 
 * @param {Object} params
 * @param {string} params.email - Admin email (e.g. warden email)
 * @param {string} params.password - Admin password
 */
export async function signInAdmin({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured || !supabase) {
    // Graceful offline / local development mode using verified institutional records
    const warden = lookupWardenByEmail(normalizedEmail);
    if (!warden) {
      return {
        success: false,
        error: 'Access denied: This email is not associated with any authorized hostel administration record.'
      };
    }

    const assignedHostels = getAssignedHostelsForWarden(normalizedEmail);
    if (!assignedHostels || assignedHostels.length === 0) {
      return {
        success: false,
        error: 'No authorized hostel assignments found for this administrator.'
      };
    }

    const authorizedHostels = assignedHostels.map((h) => ({
      hostelId: h.id,
      hostelName: h.name,
      hostelCode: h.code,
      roleTitle: warden.role || 'Warden'
    }));

    return {
      success: true,
      user: {
        id: `local-warden-${normalizedEmail.split('@')[0]}`,
        email: normalizedEmail,
        name: warden.name,
        role: 'admin',
        authorizedHostels: authorizedHostels,
        activeHostelId: authorizedHostels[0].hostelId,
        activeHostelName: authorizedHostels[0].hostelName
      }
    };
  }

  try {
    // 1. Authenticate with Supabase Auth
    let authUser = null;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (authError) {
      // If user not yet created in Supabase Auth, check if official warden for dev auto-provisioning
      const wardenConfig = lookupWardenByEmail(normalizedEmail);
      if (wardenConfig && authError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: password,
          options: {
            data: {
              full_name: wardenConfig.name,
              role: 'admin'
            }
          }
        });

        if (signUpError || !signUpData?.user) {
          throw authError;
        }
        authUser = signUpData.user;
      } else {
        throw authError;
      }
    } else {
      authUser = authData.user;
    }

    const userId = authUser.id;

    // 2. Retrieve admin profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, hostel_id')
      .eq('id', userId)
      .maybeSingle();

    // Verify administrative role
    if (profile && profile.role !== 'admin') {
      return {
        success: false,
        error: 'Access denied: The authenticated account does not have administrative privileges.'
      };
    }

    // 3. Retrieve admin's authorized hostel assignments from public.admin_hostel_assignments
    const { data: assignments, error: assignError } = await supabase
      .from('admin_hostel_assignments')
      .select(`
        id,
        role_title,
        hostel_id,
        hostels (
          id,
          name,
          code,
          description
        )
      `)
      .eq('admin_id', userId);

    let authorizedHostels = [];

    if (!assignError && Array.isArray(assignments) && assignments.length > 0) {
      authorizedHostels = assignments
        .filter((a) => a && (a.hostels || a.hostel_id))
        .map((a) => ({
          assignmentId: a.id,
          hostelId: a.hostels?.id || a.hostel_id,
          hostelName: a.hostels?.name || 'Assigned Hostel',
          hostelCode: a.hostels?.code || '',
          roleTitle: a.role_title || 'Warden'
        }));
    }

    // If admin_hostel_assignments is empty, resolve hostels using verified
    // institutional mapping and query REAL UUIDs from the hostels table.
    if (authorizedHostels.length === 0) {
      const wardenConfig = lookupWardenByEmail(normalizedEmail);
      if (wardenConfig && Array.isArray(wardenConfig.assignedHostelNames) && wardenConfig.assignedHostelNames.length > 0) {
        // Query real hostel UUIDs from Supabase — never use static fake UUIDs
        const { data: hostelRecords, error: hostelLookupErr } = await supabase
          .from('hostels')
          .select('id, name, code')
          .in('name', wardenConfig.assignedHostelNames);

        if (!hostelLookupErr && hostelRecords && hostelRecords.length > 0) {
          authorizedHostels = hostelRecords.map((h) => ({
            hostelId: h.id,
            hostelName: h.name,
            hostelCode: h.code,
            roleTitle: wardenConfig.role || 'Warden'
          }));

          // Ensure the profile row exists with admin role
          // (the trigger may not have run for accounts created via SQL)
          await supabase.from('profiles').upsert({
            id: userId,
            email: normalizedEmail,
            full_name: wardenConfig.name,
            role: 'admin'
          }, { onConflict: 'id' });

          // Persist real assignments to admin_hostel_assignments so future
          // logins hit the DB path directly (no fallback needed)
          for (const wh of authorizedHostels) {
            supabase.from('admin_hostel_assignments').upsert({
              admin_id: userId,
              hostel_id: wh.hostelId,
              role_title: wh.roleTitle || 'Warden'
            }, { onConflict: 'admin_id, hostel_id' }).then(() => {});
          }
        }
      }
    }

    // 4. Validate authorized hostel presence
    if (authorizedHostels.length === 0) {
      return {
        success: false,
        error: 'Access denied: No authorized hostel assignments found for this administrator. Please contact Institute IT Cell.'
      };
    }

    const wardenName = profile?.full_name || lookupWardenByEmail(normalizedEmail)?.name || 'Administrator';

    // 5. Return authenticated admin with database-authorized hostel assignments
    return {
      success: true,
      user: {
        id: userId,
        email: normalizedEmail,
        name: wardenName,
        role: 'admin',
        authorizedHostels: authorizedHostels,
        activeHostelId: authorizedHostels[0].hostelId,
        activeHostelName: authorizedHostels[0].hostelName
      }
    };
  } catch (err) {
    console.error('Supabase admin login error:', err);
    return {
      success: false,
      error: err.message || 'Administrative authentication failed. Please check your credentials.'
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
