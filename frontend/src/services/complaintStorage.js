/**
 * complaintStorage.js
 * Complaint Storage & Synchronization Service for IIITDM Jabalpur Smart Hostel Portal.
 * Bridges real Supabase PostgreSQL persistence with local client caching to preserve
 * snappy UI transitions and offline resilience.
 */

import { analyzeComplaintText } from './aiComplaintAnalyzer.js';
import { fetchStudentComplaints, insertComplaintToDb } from './complaintService.js';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';

const STORAGE_KEY = 'iiitdmj_student_complaints_v2';
const LEGACY_STORAGE_KEY = 'iiitdmj_student_complaints';

export const COMPLAINT_STAGES = [
  { key: 'Reported', label: 'Reported', description: 'Complaint lodged by resident and logged in portal' },
  { key: 'Assigned', label: 'Assigned', description: 'Hostel caretaker assigned ticket to maintenance staff' },
  { key: 'Scheduled', label: 'Scheduled', description: 'Technician visit scheduled for room inspection' },
  { key: 'In Progress', label: 'In Progress', description: 'Technician on-site repairing the reported issue' },
  { key: 'Resolved', label: 'Resolved', description: 'Work completed and verified by hostel caretaker' }
];

/**
 * Get all complaints from local cache
 */
export function getAllComplaints() {
  try {
    if (localStorage.getItem(LEGACY_STORAGE_KEY)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && item.studentEmail);
  } catch (err) {
    console.error('Error reading complaints from localStorage:', err);
    return [];
  }
}

/**
 * Get complaints strictly belonging to a specific student from local cache
 * @param {string} studentEmail
 */
export function getComplaintsByStudent(studentEmail) {
  if (!studentEmail) return [];
  const all = getAllComplaints();
  const normalized = studentEmail.trim().toLowerCase();
  return all.filter(c => c.studentEmail && c.studentEmail.trim().toLowerCase() === normalized);
}

/**
 * Backwards compatibility helper
 */
export function getComplaints(studentEmail) {
  if (studentEmail) {
    return getComplaintsByStudent(studentEmail);
  }
  return getAllComplaints();
}

/**
 * Asynchronously syncs student complaints from Supabase PostgreSQL database
 * and updates the local storage cache.
 * 
 * @param {string} studentId
 * @param {string} studentEmail
 * @returns {Promise<Array>}
 */
export async function syncStudentComplaintsFromDb(studentId, studentEmail) {
  if (!isSupabaseConfigured) {
    return getComplaintsByStudent(studentEmail);
  }

  try {
    const dbComplaints = await fetchStudentComplaints(studentId, studentEmail);
    if (dbComplaints && dbComplaints.length > 0) {
      // Merge with any local records
      const existing = getAllComplaints();
      const existingIds = new Set(dbComplaints.map(c => c.id));
      const remainingLocal = existing.filter(c => !existingIds.has(c.id));
      const merged = [...dbComplaints, ...remainingLocal];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return dbComplaints;
    }
  } catch (err) {
    console.warn('Could not sync complaints from Supabase:', err);
  }
  return getComplaintsByStudent(studentEmail);
}

/**
 * Save a new student complaint to cache and synchronize with Supabase PostgreSQL
 * @param {Object} newComplaint
 */
export function addComplaint(newComplaint) {
  const existing = getAllComplaints();
  const idNum = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
    ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Run AI Complaint Analyzer on the description
  const combinedText = `${newComplaint.title || ''} ${newComplaint.description || ''}`;
  const aiResult = analyzeComplaintText(combinedText, newComplaint.category);

  // Auto-detect or use user specified priority/category with AI fallback
  const resolvedCategory = newComplaint.category || aiResult.category;
  const resolvedPriority = newComplaint.priority || aiResult.priority;
  const resolvedIssueType = newComplaint.issueType || aiResult.issueType;
  const resolvedDepartment = newComplaint.department || aiResult.department;

  const complaintRecord = {
    id: `CMP-2026-${idNum}`,
    studentId: newComplaint.studentId || newComplaint.studentEmail || 'student@iiitdmj.ac.in',
    studentEmail: newComplaint.studentEmail ? newComplaint.studentEmail.trim().toLowerCase() : 'student@iiitdmj.ac.in',
    studentName: newComplaint.studentName || 'Student Resident',
    category: resolvedCategory,
    issueType: resolvedIssueType,
    department: resolvedDepartment,
    priority: resolvedPriority,
    title: newComplaint.title || newComplaint.description?.slice(0, 45) || 'Maintenance Request',
    description: newComplaint.description || 'No description provided.',
    hostel: newComplaint.hostel || 'Hall of Residence',
    hostelId: newComplaint.hostelId || null,
    room: newComplaint.room || 'Room',
    currentStatus: 'Reported',
    createdAt: formattedDate,
    dateReported: formattedDate,
    assignedTo: resolvedDepartment,
    aiAnalysis: {
      category: resolvedCategory,
      issueType: resolvedIssueType,
      department: resolvedDepartment,
      priority: resolvedPriority,
      reason: aiResult.reason,
      confidence: aiResult.confidence
    },
    timeline: [
      { stage: 'Reported', completed: true, isCurrent: true, timestamp: formattedDate, note: `Complaint logged & auto-routed to ${resolvedDepartment}` },
      { stage: 'Assigned', completed: false, timestamp: null, note: `Caretaker assigned ticket to ${resolvedDepartment}` },
      { stage: 'Scheduled', completed: false, timestamp: null, note: 'Technician visit to be scheduled' },
      { stage: 'In Progress', completed: false, timestamp: null, note: 'Repair work pending' },
      { stage: 'Resolved', completed: false, timestamp: null, note: 'Resolution verification pending' }
    ]
  };

  // Save to local cache for instant UI rendering
  const updated = [complaintRecord, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving complaint to localStorage:', err);
  }

  // Asynchronously push to Supabase PostgreSQL database if configured
  if (isSupabaseConfigured) {
    insertComplaintToDb(complaintRecord).catch(err => {
      console.warn('Background Supabase complaint sync notice:', err);
    });
  }

  return complaintRecord;
}
