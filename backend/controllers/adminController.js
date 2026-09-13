/**
 * adminController.js — Admin Dashboard Stats & Management
 * IIITDM Jabalpur Smart Hostel Portal Backend
 */

import pool from '../config/db.js';

// -----------------------------------------------------------------------
// GET /api/admin/dashboard-stats
// -----------------------------------------------------------------------
export async function getDashboardStats(req, res) {
  try {
    const [statusCounts] = await pool.execute(`
      SELECT current_status, COUNT(*) as count
      FROM complaints
      GROUP BY current_status
    `);

    const [priorityCounts] = await pool.execute(`
      SELECT priority, COUNT(*) as count
      FROM complaints
      GROUP BY priority
    `);

    const [totalRow] = await pool.execute('SELECT COUNT(*) as total FROM complaints');

    const stats = {
      total:      totalRow[0].total,
      reported:   0,
      assigned:   0,
      scheduled:  0,
      in_progress: 0,
      resolved:   0,
      critical:   0,
      high:       0,
      medium:     0,
      low:        0
    };

    for (const row of statusCounts) {
      switch (row.current_status) {
        case 'Reported':    stats.reported    = row.count; break;
        case 'Assigned':    stats.assigned    = row.count; break;
        case 'Scheduled':   stats.scheduled   = row.count; break;
        case 'In Progress': stats.in_progress = row.count; break;
        case 'Resolved':    stats.resolved    = row.count; break;
      }
    }

    for (const row of priorityCounts) {
      switch (row.priority) {
        case 'Critical': stats.critical = row.count; break;
        case 'High':     stats.high     = row.count; break;
        case 'Medium':   stats.medium   = row.count; break;
        case 'Low':      stats.low      = row.count; break;
      }
    }

    return res.json({ success: true, stats });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
}
