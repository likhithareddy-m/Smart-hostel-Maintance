/**
 * announcementController.js — Announcements CRUD
 * IIITDM Jabalpur Smart Hostel Portal Backend
 */

import pool from '../config/db.js';

// -----------------------------------------------------------------------
// POST /api/announcements  — Admin creates announcement
// -----------------------------------------------------------------------
export async function createAnnouncement(req, res) {
  try {
    const { title, message } = req.body;
    const admin = req.user;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO announcements (title, message, created_by) VALUES (?, ?, ?)',
      [title.trim(), message.trim(), admin.name]
    );

    return res.status(201).json({
      success: true,
      message: 'Announcement created successfully.',
      announcement: {
        id:         result.insertId,
        title:      title.trim(),
        message:    message.trim(),
        created_by: admin.name,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('createAnnouncement error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating announcement.' });
  }
}

// -----------------------------------------------------------------------
// GET /api/announcements  — List all announcements
// -----------------------------------------------------------------------
export async function getAnnouncements(req, res) {
  try {
    const [announcements] = await pool.execute(
      'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20'
    );
    return res.json({ success: true, announcements });
  } catch (err) {
    console.error('getAnnouncements error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching announcements.' });
  }
}
