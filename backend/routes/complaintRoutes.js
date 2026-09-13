/**
 * complaintRoutes.js — Complaint API Routes
 */

import { Router } from 'express';
import {
  submitComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint
} from '../controllers/complaintController.js';
import { authenticateToken, requireStudent, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Student routes
router.post('/',    authenticateToken, requireStudent, submitComplaint);
router.get('/my',   authenticateToken, requireStudent, getMyComplaints);

// Shared (student can access their own, admin can access all)
router.get('/:id',  authenticateToken, getComplaintById);

// Admin routes
router.get('/',               authenticateToken, requireAdmin, getAllComplaints);
router.patch('/:id/status',   authenticateToken, requireAdmin, updateComplaintStatus);
router.patch('/:id/assign',   authenticateToken, requireAdmin, assignComplaint);

export default router;
