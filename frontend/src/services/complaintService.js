/**
 * complaintService.js
 * Supabase Database Operations for Hostel Complaints
 * Handles real PostgreSQL queries for lodging, retrieving, and updating complaint tickets.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { getHostelByName } from '../config/hostels.js';

/**
 * Format database complaint row into frontend complaint model
 */
export function formatComplaintRecord(row) {
  if (!row) return null;

  const hostelName = row.hostels?.name || row.hostel_name || 'Hall of Residence';

  // Map complaint_status_history to timeline
  const stages = ['Reported', 'Assigned', 'Scheduled', 'In Progress', 'Resolved'];
  const history = row.complaint_status_history || [];

  const timeline = stages.map((stageKey) => {
    const matched = history.find(h => h.stage === stageKey);
    const isCompleted = Boolean(matched) || stages.indexOf(stageKey) <= stages.indexOf(row.status);
    const isCurrent = row.status === stageKey;

    let timestamp = matched?.created_at
      ? new Date(matched.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;

    let note = matched?.note || null;
    if (!note) {
      if (stageKey === 'Reported') note = `Complaint logged & routed to ${row.department || row.assigned_to || 'Maintenance Cell'}`;
      else if (stageKey === 'Assigned') note = `Caretaker assigned ticket to ${row.assigned_to || 'Maintenance Cell'}`;
      else if (stageKey === 'Scheduled') note = 'Technician visit to be scheduled';
      else if (stageKey === 'In Progress') note = 'Repair work pending';
      else if (stageKey === 'Resolved') note = 'Resolution verification pending';
    }

    return {
      stage: stageKey,
      completed: isCompleted,
      isCurrent: isCurrent,
      timestamp: timestamp,
      note: note
    };
  });

  const formattedDate = row.created_at
    ? new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' + new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : 'Recently';

  return {
    id: row.complaint_number || row.id,
    dbId: row.id,
    studentId: row.student_id,
    studentEmail: row.profiles?.email || '',
    studentName: row.profiles?.full_name || 'Student Resident',
    category: row.category,
    issueType: row.issue_type,
    department: row.department,
    priority: row.priority,
    title: row.title,
    description: row.description,
    hostel: hostelName,
    hostelId: row.hostel_id,
    room: row.room,
    currentStatus: row.status,
    createdAt: formattedDate,
    dateReported: formattedDate,
    assignedTo: row.assigned_to || row.department,
    aiAnalysis: row.ai_analysis || null,
    timeline: timeline
  };
}

/**
 * Fetch all complaints for a specific student from Supabase
 * @param {string} studentId - Supabase user UUID
 * @param {string} studentEmail - Student email fallback
 */
export async function fetchStudentComplaints(studentId, studentEmail) {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('complaints')
      .select(`
        *,
        hostels(id, name, code),
        profiles(id, email, full_name, roll_number),
        complaint_status_history(stage, note, created_at)
      `)
      .order('created_at', { ascending: false });

    if (studentId && !studentId.startsWith('mock-')) {
      query = query.eq('student_id', studentId);
    } else if (studentEmail) {
      // Lookup profile by email first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', studentEmail.trim().toLowerCase())
        .maybeSingle();

      if (profile) {
        query = query.eq('student_id', profile.id);
      } else {
        return [];
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(formatComplaintRecord);
  } catch (err) {
    console.error('Error fetching student complaints from Supabase:', err);
    return [];
  }
}

/**
 * Insert a new complaint into Supabase
 * @param {Object} complaint
 */
export async function insertComplaintToDb(complaint) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    // Resolve hostel UUID
    let hostelId = complaint.hostelId;
    if (!hostelId && complaint.hostel) {
      const hostelObj = getHostelByName(complaint.hostel);
      // Query DB for real UUID
      const { data: dbHostel } = await supabase
        .from('hostels')
        .select('id')
        .eq('name', complaint.hostel)
        .maybeSingle();

      hostelId = dbHostel?.id || hostelObj?.id;
    }

    // Resolve student UUID
    let studentId = complaint.studentDbId || complaint.studentId;
    if (!studentId || studentId.startsWith('mock-')) {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user?.id) {
        studentId = authUser.user.id;
      }
    }

    if (!studentId || !hostelId) {
      console.warn('Cannot insert complaint to Supabase: missing valid student_id or hostel_id');
      return null;
    }

    const complaintNum = complaint.id || `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert into complaints table
    const { data: newRow, error: insertError } = await supabase
      .from('complaints')
      .insert({
        complaint_number: complaintNum,
        student_id: studentId,
        hostel_id: hostelId,
        room: complaint.room,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        issue_type: complaint.issueType,
        department: complaint.department,
        priority: complaint.priority,
        status: 'Reported',
        assigned_to: complaint.assignedTo,
        ai_analysis: complaint.aiAnalysis
      })
      .select(`
        *,
        hostels(id, name, code),
        profiles(id, email, full_name, roll_number)
      `)
      .single();

    if (insertError) throw insertError;

    // Insert initial status history record
    await supabase.from('complaint_status_history').insert({
      complaint_id: newRow.id,
      stage: 'Reported',
      note: `Complaint logged & auto-routed to ${complaint.department || 'Maintenance Cell'}`,
      updated_by: studentId
    });

    return formatComplaintRecord(newRow);
  } catch (err) {
    console.error('Error inserting complaint to Supabase:', err);
    return null;
  }
}
