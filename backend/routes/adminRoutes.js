/**
 * adminRoutes.js — Admin Dashboard Routes
 */

import { Router } from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard-stats', authenticateToken, requireAdmin, getDashboardStats);

export default router;
