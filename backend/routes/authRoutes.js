/**
 * authRoutes.js — Authentication Routes
 */

import { Router } from 'express';
import { studentLogin, studentRegister, adminLogin } from '../controllers/authController.js';

const router = Router();

// Student auth
router.post('/student/login',    studentLogin);
router.post('/student/register', studentRegister);

// Admin auth
router.post('/admin/login', adminLogin);

export default router;
