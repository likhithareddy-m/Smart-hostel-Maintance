/**
 * complaintStorage.js
 * IIITDM Jabalpur Smart Hostel Portal — Refactored to use Backend API.
 *
 * NOTE: All complaint persistence is now handled by the MySQL database via the backend.
 * COMPLAINT_STAGES is kept as an export because MyComplaints.jsx uses it for timeline UI rendering.
 */

/**
 * COMPLAINT_STAGES — Used by MyComplaints.jsx for timeline UI rendering.
 * This must stay here as MyComplaints imports it directly.
 */
export const COMPLAINT_STAGES = [
  { key: 'Reported',    label: 'Reported',    description: 'Complaint lodged by resident and logged in portal' },
  { key: 'Assigned',   label: 'Assigned',    description: 'Hostel caretaker assigned ticket to maintenance staff' },
  { key: 'Scheduled',  label: 'Scheduled',   description: 'Technician visit scheduled for room inspection' },
  { key: 'In Progress', label: 'In Progress', description: 'Technician on-site repairing the reported issue' },
  { key: 'Resolved',   label: 'Resolved',    description: 'Work completed and verified by hostel caretaker' }
];

/**
 * @deprecated — Use complaintsAPI.getMyComplaints() from api.js instead.
 * Kept for backwards compatibility. Returns empty array.
 */
export function getComplaintsByStudent(studentEmail) {
  console.warn('[complaintStorage] getComplaintsByStudent() is deprecated. Use complaintsAPI.getMyComplaints() from api.js.');
  return [];
}

/**
 * @deprecated — Use complaintsAPI.getAll() from api.js instead.
 */
export function getAllComplaints() {
  console.warn('[complaintStorage] getAllComplaints() is deprecated. Use complaintsAPI.getAll() from api.js.');
  return [];
}

/**
 * @deprecated — Use complaintsAPI.getMyComplaints() from api.js instead.
 */
export function getComplaints(studentEmail) {
  return getComplaintsByStudent(studentEmail);
}

/**
 * @deprecated — Use complaintsAPI.submit() from api.js instead.
 */
export function addComplaint(newComplaint) {
  console.warn('[complaintStorage] addComplaint() is deprecated. Use complaintsAPI.submit() from api.js.');
  return null;
}
