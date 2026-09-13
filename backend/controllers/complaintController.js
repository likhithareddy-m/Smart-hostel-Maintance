/**
 * complaintController.js — Complaint CRUD & Status Management
 * IIITDM Jabalpur Smart Hostel Portal Backend
 */

import pool from '../config/db.js';
import { analyzeComplaintText } from '../utils/aiAnalyzer.js';

/**
 * Generate a unique complaint ID: CMP-YYYY-NNNN
 */
async function generateComplaintId() {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;

  const [rows] = await pool.execute(
    `SELECT complaint_id FROM complaints
     WHERE complaint_id LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNum = 1001;
  if (rows.length > 0) {
    const lastId   = rows[0].complaint_id;
    const lastNum  = parseInt(lastId.split('-')[2], 10);
    nextNum        = lastNum + 1;
  }
  return `${prefix}${nextNum}`;
}

/**
 * Format timeline from DB rows into the shape the frontend expects.
 */
function buildTimeline(timelineRows, currentStatus) {
  const STAGES = ['Reported', 'Assigned', 'Scheduled', 'In Progress', 'Resolved'];
  const stageIndex = STAGES.indexOf(currentStatus);

  return STAGES.map((stage, idx) => {
    const dbEntry = timelineRows.find(t => t.status === stage);
    const completed = idx < stageIndex || (dbEntry && idx <= stageIndex);
    const isCurrent = stage === currentStatus;
    return {
      stage,
      completed: completed || !!dbEntry,
      isCurrent,
      timestamp: dbEntry ? formatDate(dbEntry.created_at) : null,
      note:      dbEntry ? dbEntry.note : null,
      updated_by: dbEntry ? dbEntry.updated_by : null
    };
  });
}

function formatDate(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// -----------------------------------------------------------------------
// POST /api/complaints  — Student submits complaint
// -----------------------------------------------------------------------
export async function submitComplaint(req, res) {
  try {
    const { category, title, description, room } = req.body;
    const student = req.user; // from JWT

    if (!category || !title || !description || !room) {
      return res.status(400).json({ success: false, message: 'Category, title, description, and room are required.' });
    }

    // Fetch student's hostel from DB (source of truth)
    const [studentRows] = await pool.execute(
      'SELECT id, name, email, hostel, room_number FROM students WHERE id = ?',
      [student.id]
    );
    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student account not found.' });
    }
    const studentRecord = studentRows[0];

    // Run AI analysis
    const combinedText = `${title} ${description}`;
    const aiResult = analyzeComplaintText(combinedText, category);

    const complaintId = await generateComplaintId();
    const now = new Date();

    // Insert complaint
    await pool.execute(
      `INSERT INTO complaints
        (complaint_id, student_id, student_name, student_email, hostel, room,
         category, issue_type, title, description, department, priority, current_status,
         assigned_to, ai_reason, ai_confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reported', ?, ?, ?)`,
      [
        complaintId,
        studentRecord.id,
        studentRecord.name,
        studentRecord.email,
        studentRecord.hostel,
        room.trim(),
        aiResult.category,
        aiResult.issueType,
        title.trim(),
        description.trim(),
        aiResult.department,
        aiResult.priority,
        aiResult.department, // assigned_to initially set to department
        aiResult.reason,
        aiResult.confidence
      ]
    );

    // Insert initial timeline entry
    await pool.execute(
      `INSERT INTO complaint_timeline (complaint_id, status, note, updated_by)
       VALUES (?, 'Reported', ?, ?)`,
      [
        complaintId,
        `Complaint logged & auto-routed to ${aiResult.department}`,
        studentRecord.name
      ]
    );

    const formattedDate = formatDate(now);

    return res.status(201).json({
      success: true,
      message: 'Complaint registered successfully.',
      complaint: {
        id:           complaintId,
        complaint_id: complaintId,
        studentEmail: studentRecord.email,
        studentName:  studentRecord.name,
        category:     aiResult.category,
        issueType:    aiResult.issueType,
        department:   aiResult.department,
        priority:     aiResult.priority,
        title:        title.trim(),
        description:  description.trim(),
        hostel:       studentRecord.hostel,
        room:         room.trim(),
        currentStatus: 'Reported',
        createdAt:    formattedDate,
        dateReported: formattedDate,
        assignedTo:   aiResult.department,
        aiAnalysis: {
          category:   aiResult.category,
          issueType:  aiResult.issueType,
          department: aiResult.department,
          priority:   aiResult.priority,
          reason:     aiResult.reason,
          confidence: aiResult.confidence
        }
      }
    });
  } catch (err) {
    console.error('submitComplaint error:', err);
    return res.status(500).json({ success: false, message: 'Server error while submitting complaint.' });
  }
}

// -----------------------------------------------------------------------
// GET /api/complaints/my  — Student's own complaints
// -----------------------------------------------------------------------
export async function getMyComplaints(req, res) {
  try {
    const studentId = req.user.id;

    const [complaints] = await pool.execute(
      `SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC`,
      [studentId]
    );

    if (complaints.length === 0) {
      return res.json({ success: true, complaints: [] });
    }

    // Fetch timelines for all complaints
    const complaintIds = complaints.map(c => c.complaint_id);
    const placeholders = complaintIds.map(() => '?').join(',');
    const [timelineRows] = await pool.execute(
      `SELECT * FROM complaint_timeline WHERE complaint_id IN (${placeholders}) ORDER BY created_at ASC`,
      complaintIds
    );

    const result = complaints.map(c => {
      const myTimeline = timelineRows.filter(t => t.complaint_id === c.complaint_id);
      return formatComplaint(c, myTimeline);
    });

    return res.json({ success: true, complaints: result });
  } catch (err) {
    console.error('getMyComplaints error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching complaints.' });
  }
}

// -----------------------------------------------------------------------
// GET /api/complaints  — Admin: all complaints with filters
// -----------------------------------------------------------------------
export async function getAllComplaints(req, res) {
  try {
    const { status, priority, category, hostel, department, search } = req.query;

    let query = 'SELECT * FROM complaints WHERE 1=1';
    const params = [];

    if (status)     { query += ' AND current_status = ?'; params.push(status); }
    if (priority)   { query += ' AND priority = ?'; params.push(priority); }
    if (category)   { query += ' AND category = ?'; params.push(category); }
    if (hostel)     { query += ' AND hostel = ?'; params.push(hostel); }
    if (department) { query += ' AND department = ?'; params.push(department); }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR complaint_id LIKE ? OR student_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    const [complaints] = await pool.execute(query, params);

    if (complaints.length === 0) {
      return res.json({ success: true, complaints: [] });
    }

    const complaintIds = complaints.map(c => c.complaint_id);
    const placeholders = complaintIds.map(() => '?').join(',');
    const [timelineRows] = await pool.execute(
      `SELECT * FROM complaint_timeline WHERE complaint_id IN (${placeholders}) ORDER BY created_at ASC`,
      complaintIds
    );

    const result = complaints.map(c => {
      const myTimeline = timelineRows.filter(t => t.complaint_id === c.complaint_id);
      return formatComplaint(c, myTimeline);
    });

    return res.json({ success: true, complaints: result });
  } catch (err) {
    console.error('getAllComplaints error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching complaints.' });
  }
}

// -----------------------------------------------------------------------
// GET /api/complaints/:id  — Get single complaint with timeline
// -----------------------------------------------------------------------
export async function getComplaintById(req, res) {
  try {
    const { id } = req.params;
    const user   = req.user;

    const [complaints] = await pool.execute(
      'SELECT * FROM complaints WHERE complaint_id = ?',
      [id]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = complaints[0];

    // Students can only access their own complaints
    if (user.role === 'student' && complaint.student_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [timelineRows] = await pool.execute(
      'SELECT * FROM complaint_timeline WHERE complaint_id = ? ORDER BY created_at ASC',
      [id]
    );

    return res.json({ success: true, complaint: formatComplaint(complaint, timelineRows) });
  } catch (err) {
    console.error('getComplaintById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// -----------------------------------------------------------------------
// PATCH /api/complaints/:id/status  — Admin updates status
// -----------------------------------------------------------------------
const VALID_STATUSES = ['Reported', 'Assigned', 'Scheduled', 'In Progress', 'Resolved'];

export async function updateComplaintStatus(req, res) {
  try {
    const { id }     = req.params;
    const { status, note } = req.body;
    const admin      = req.user;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const [complaints] = await pool.execute(
      'SELECT * FROM complaints WHERE complaint_id = ?',
      [id]
    );
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const resolvedAt = status === 'Resolved' ? new Date() : null;

    if (resolvedAt) {
      await pool.execute(
        'UPDATE complaints SET current_status = ?, resolved_at = ?, updated_at = NOW() WHERE complaint_id = ?',
        [status, resolvedAt, id]
      );
    } else {
      await pool.execute(
        'UPDATE complaints SET current_status = ?, updated_at = NOW() WHERE complaint_id = ?',
        [status, id]
      );
    }

    await pool.execute(
      `INSERT INTO complaint_timeline (complaint_id, status, note, updated_by)
       VALUES (?, ?, ?, ?)`,
      [id, status, note || `Status updated to ${status}`, admin.name]
    );

    return res.json({ success: true, message: `Complaint status updated to "${status}".` });
  } catch (err) {
    console.error('updateComplaintStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
}

// -----------------------------------------------------------------------
// PATCH /api/complaints/:id/assign  — Admin assigns complaint
// -----------------------------------------------------------------------
export async function assignComplaint(req, res) {
  try {
    const { id }        = req.params;
    const { assigned_to, note } = req.body;
    const admin         = req.user;

    if (!assigned_to) {
      return res.status(400).json({ success: false, message: 'assigned_to is required.' });
    }

    const [complaints] = await pool.execute(
      'SELECT * FROM complaints WHERE complaint_id = ?',
      [id]
    );
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    await pool.execute(
      `UPDATE complaints SET assigned_to = ?, current_status = 'Assigned', updated_at = NOW()
       WHERE complaint_id = ?`,
      [assigned_to, id]
    );

    await pool.execute(
      `INSERT INTO complaint_timeline (complaint_id, status, note, updated_by)
       VALUES (?, 'Assigned', ?, ?)`,
      [id, note || `Assigned to: ${assigned_to}`, admin.name]
    );

    return res.json({ success: true, message: `Complaint assigned to "${assigned_to}".` });
  } catch (err) {
    console.error('assignComplaint error:', err);
    return res.status(500).json({ success: false, message: 'Server error assigning complaint.' });
  }
}

// -----------------------------------------------------------------------
// Helper: Format a DB complaint row into frontend-compatible shape
// -----------------------------------------------------------------------
function formatComplaint(c, timelineRows) {
  const timeline = buildTimeline(timelineRows, c.current_status);
  return {
    id:           c.complaint_id,
    complaint_id: c.complaint_id,
    studentId:    c.student_id,
    studentEmail: c.student_email,
    studentName:  c.student_name,
    category:     c.category,
    issueType:    c.issue_type,
    department:   c.department,
    priority:     c.priority,
    title:        c.title,
    description:  c.description,
    hostel:       c.hostel,
    room:         c.room,
    currentStatus: c.current_status,
    assignedTo:   c.assigned_to,
    createdAt:    formatDate(c.created_at),
    dateReported: formatDate(c.created_at),
    updatedAt:    formatDate(c.updated_at),
    resolvedAt:   formatDate(c.resolved_at),
    aiAnalysis: {
      category:   c.category,
      issueType:  c.issue_type,
      department: c.department,
      priority:   c.priority,
      reason:     c.ai_reason,
      confidence: c.ai_confidence || '98%'
    },
    timeline
  };
}
