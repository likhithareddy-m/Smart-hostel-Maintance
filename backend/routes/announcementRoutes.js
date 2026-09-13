/**
 * announcementRoutes.js — Announcement Routes
 */

import { Router } from 'express';
import { createAnnouncement, getAnnouncements } from '../controllers/announcementController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Any authenticated user can read announcements
router.get('/',  authenticateToken, getAnnouncements);

// Only admin/caretaker can create
router.post('/', authenticateToken, requireAdmin, createAnnouncement);

export default router;
