/**
 * authService.js
 * Supabase Authentication & Profile Management Service
 * Provides secure login/logout and session management for Students and Admins.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { getHostelByName } from '../config/hostels.js';
import { lookupWardenByEmail, getAssignedHostelsForWarden } from '../config/wardens.js';

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
    const studentUser = {
      id: `mock-student-${username}`,
      email: normalizedEmail,
      name: formattedName,
      rollNo: username.toUpperCase(),
      hostel: hostel,
      hostelId: hostelRecord?.id,
      role: 'student'
    };

    try {
      localStorage.setItem('iiitdmj_student_session', JSON.stringify(studentUser));
    } catch (e) {}

    return {
      success: true,
      user: studentUser
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

      const studentUser = {
        id: signUpData.user?.id,
        email: normalizedEmail,
        name: formattedName,
        rollNo: username.toUpperCase(),
        hostel: hostel,
        hostelId: hostelRecord?.id,
        role: 'student'
      };

      try {
        localStorage.setItem('iiitdmj_student_session', JSON.stringify(studentUser));
      } catch (e) {}

      return {
        success: true,
        user: studentUser
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

    const studentUser = {
      id: authData.user.id,
      email: authData.user.email,
      name: profile?.full_name || formattedName,
      rollNo: profile?.roll_number || username.toUpperCase(),
      hostel: profile?.hostels?.name || hostel,
      hostelId: profile?.hostel_id || hostelRecord?.id,
      role: 'student'
    };

    try {
      localStorage.setItem('iiitdmj_student_session', JSON.stringify(studentUser));
    } catch (e) {}

    return {
      success: true,
      user: studentUser
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
 * Strictly validates administrative credentials and extracts authorized hostel assignments
 * directly from the database relationship (public.admin_hostel_assignments).
 * 
 * @param {Object} params
 * @param {string} params.email - Admin email (e.g. warden email)
 * @param {string} params.password - Admin password
 * @param {string} [params.selectedHostelId] - Optional specifically selected authorized hostel ID
 */
export async function signInAdmin({ email, password, selectedHostelId }) {
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

    // If a specific hostel was selected, verify it is strictly authorized
    let activeHostel = authorizedHostels[0];
    if (selectedHostelId) {
      const matched = authorizedHostels.find(
        (h) => h.hostelId === selectedHostelId || h.hostelName.toLowerCase() === String(selectedHostelId).toLowerCase()
      );
      if (matched) {
        activeHostel = matched;
      } else {
        return {
          success: false,
          error: 'Access denied: Selected hostel does not match your authorized administrative assignment.'
        };
      }
    }

    const userObj = {
      id: `local-warden-${normalizedEmail.split('@')[0]}`,
      email: normalizedEmail,
      name: warden.name,
      role: 'admin',
      authorizedHostels: authorizedHostels,
      activeHostelId: activeHostel.hostelId,
      activeHostelName: activeHostel.hostelName
    };

    // Persist admin session locally without storing password
    try {
      localStorage.setItem('iiitdmj_admin_session', JSON.stringify({
        id: userObj.id,
        email: userObj.email,
        role: 'admin',
        activeHostelId: userObj.activeHostelId
      }));
    } catch (e) {}

    return {
      success: true,
      user: userObj
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

    // If profile row doesn't exist yet, check official warden registry
    if (!profile && !lookupWardenByEmail(normalizedEmail)) {
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
          await supabase.from('profiles').upsert({
            id: userId,
            email: normalizedEmail,
            full_name: wardenConfig.name,
            role: 'admin'
          }, { onConflict: 'id' });

          // Persist real assignments to admin_hostel_assignments
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

    // If a specific hostel was selected, verify it is strictly one of the authorized hostels
    let activeHostel = authorizedHostels[0];
    if (selectedHostelId) {
      const matched = authorizedHostels.find(
        (h) => h.hostelId === selectedHostelId || h.hostelName.toLowerCase() === String(selectedHostelId).toLowerCase()
      );
      if (matched) {
        activeHostel = matched;
      } else {
        return {
          success: false,
          error: 'Access denied: Selected hostel does not match your authorized administrative assignment.'
        };
      }
    }

    const wardenName = profile?.full_name || lookupWardenByEmail(normalizedEmail)?.name || 'Administrator';

    const userObj = {
      id: userId,
      email: normalizedEmail,
      name: wardenName,
      role: 'admin',
      authorizedHostels: authorizedHostels,
      activeHostelId: activeHostel.hostelId,
      activeHostelName: activeHostel.hostelName
    };

    // Persist admin session locally without storing password
    try {
      localStorage.setItem('iiitdmj_admin_session', JSON.stringify({
        id: userObj.id,
        email: userObj.email,
        role: 'admin',
        activeHostelId: userObj.activeHostelId
      }));
    } catch (e) {}

    // 5. Return authenticated admin with database-authorized hostel assignments
    return {
      success: true,
      user: userObj
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
 * Restores and re-verifies active admin session from Supabase Auth or secure local session.
 * Re-validates admin role and strictly fetches authorized hostels from the database relationship.
 * Never trusts unverified client-side hostel parameters.
 * 
 * @returns {Promise<Object|null>} Authenticated admin object or null
 */
export async function restoreAdminSession() {
  // 1. Supabase configured session check
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        return null;
      }

      const userId = session.user.id;
      const normalizedEmail = (session.user.email || '').trim().toLowerCase();

      // Retrieve profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, hostel_id')
        .eq('id', userId)
        .maybeSingle();

      // Verify administrative role
      if (profile && profile.role !== 'admin') {
        return null;
      }

      if (!profile && !lookupWardenByEmail(normalizedEmail)) {
        return null;
      }

      // Retrieve admin's authorized hostel assignments from public.admin_hostel_assignments
      const { data: assignments } = await supabase
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
      if (Array.isArray(assignments) && assignments.length > 0) {
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

      // Fallback query to hostels table
      if (authorizedHostels.length === 0) {
        const wardenConfig = lookupWardenByEmail(normalizedEmail);
        if (wardenConfig && Array.isArray(wardenConfig.assignedHostelNames) && wardenConfig.assignedHostelNames.length > 0) {
          const { data: hostelRecords } = await supabase
            .from('hostels')
            .select('id, name, code')
            .in('name', wardenConfig.assignedHostelNames);

          if (hostelRecords && hostelRecords.length > 0) {
            authorizedHostels = hostelRecords.map((h) => ({
              hostelId: h.id,
              hostelName: h.name,
              hostelCode: h.code,
              roleTitle: wardenConfig.role || 'Warden'
            }));
          }
        }
      }

      if (authorizedHostels.length === 0) {
        return null;
      }

      // Read saved active hostel preference from local session if present and valid
      let activeHostel = authorizedHostels[0];
      try {
        const raw = localStorage.getItem('iiitdmj_admin_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.activeHostelId) {
            const matched = authorizedHostels.find((h) => h.hostelId === parsed.activeHostelId);
            if (matched) activeHostel = matched;
          }
        }
      } catch (e) {}

      const wardenName = profile?.full_name || lookupWardenByEmail(normalizedEmail)?.name || 'Administrator';

      return {
        id: userId,
        email: normalizedEmail,
        name: wardenName,
        role: 'admin',
        authorizedHostels,
        activeHostelId: activeHostel.hostelId,
        activeHostelName: activeHostel.hostelName
      };
    } catch (err) {
      console.warn('Error restoring Supabase admin session:', err);
      return null;
    }
  }

  // 2. Local fallback / offline mode session restoration
  try {
    const rawSession = localStorage.getItem('iiitdmj_admin_session') || sessionStorage.getItem('iiitdmj_admin_session');
    if (!rawSession) return null;

    const parsed = JSON.parse(rawSession);
    if (!parsed || !parsed.email || parsed.role !== 'admin') {
      return null;
    }

    const normalizedEmail = parsed.email.trim().toLowerCase();
    const warden = lookupWardenByEmail(normalizedEmail);
    if (!warden) {
      localStorage.removeItem('iiitdmj_admin_session');
      sessionStorage.removeItem('iiitdmj_admin_session');
      return null;
    }

    const assignedHostels = getAssignedHostelsForWarden(normalizedEmail);
    if (!assignedHostels || assignedHostels.length === 0) {
      return null;
    }

    const authorizedHostels = assignedHostels.map((h) => ({
      hostelId: h.id,
      hostelName: h.name,
      hostelCode: h.code,
      roleTitle: warden.role || 'Warden'
    }));

    // Re-validate saved active hostel selection strictly against database assignments
    let activeHostel = authorizedHostels[0];
    if (parsed.activeHostelId) {
      const matched = authorizedHostels.find((h) => h.hostelId === parsed.activeHostelId);
      if (matched) activeHostel = matched;
    }

    return {
      id: parsed.id || `local-warden-${normalizedEmail.split('@')[0]}`,
      email: normalizedEmail,
      name: warden.name,
      role: 'admin',
      authorizedHostels,
      activeHostelId: activeHostel.hostelId,
      activeHostelName: activeHostel.hostelName
    };
  } catch (err) {
    console.warn('Error restoring local admin session:', err);
    return null;
  }
}

/**
 * Restores and re-verifies student session from Supabase or secure local session.
 * 
 * @returns {Promise<Object|null>} Authenticated student object or null
 */
export async function restoreStudentSession() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, hostels(id, name, code)')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile && profile.role !== 'student') return null;

      const email = session.user.email || '';
      const username = email.split('@')[0];
      const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

      return {
        id: session.user.id,
        email: email,
        name: profile?.full_name || formattedName,
        rollNo: profile?.roll_number || username.toUpperCase(),
        hostel: profile?.hostels?.name || '',
        hostelId: profile?.hostel_id || null,
        role: 'student'
      };
    } catch (err) {
      return null;
    }
  }

  try {
    const raw = localStorage.getItem('iiitdmj_student_session') || sessionStorage.getItem('iiitdmj_student_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.role === 'student') {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Sign Out Current User
 */
export async function signOut() {
  try {
    localStorage.removeItem('iiitdmj_admin_session');
    sessionStorage.removeItem('iiitdmj_admin_session');
    localStorage.removeItem('iiitdmj_student_session');
    sessionStorage.removeItem('iiitdmj_student_session');
  } catch (e) {}

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during Supabase sign out:', err);
    }
  }
}

