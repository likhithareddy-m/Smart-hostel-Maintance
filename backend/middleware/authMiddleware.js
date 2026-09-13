/**
 * authMiddleware.js — JWT Authentication & Role Authorization
 * IIITDM Jabalpur Smart Hostel Portal Backend
 */

import jwt from 'jsonwebtoken';

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches decoded user to req.user.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

/**
 * Middleware: Require admin or caretaker role.
 * Must be used AFTER authenticateToken.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'caretaker')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }
  next();
}

/**
 * Middleware: Require student role.
 * Must be used AFTER authenticateToken.
 */
export function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student account required.'
    });
  }
  next();
}
