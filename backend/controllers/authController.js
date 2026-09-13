/**
 * authController.js — Authentication Controller
 * IIITDM Jabalpur Smart Hostel Portal Backend
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const ALLOWED_STUDENT_DOMAIN = '@iiitdmj.ac.in';
const SALT_ROUNDS = 12;

/**
 * Generate a signed JWT token.
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// -----------------------------------------------------------------------
// POST /api/auth/student/login
// -----------------------------------------------------------------------
export async function studentLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm.endsWith(ALLOWED_STUDENT_DOMAIN)) {
      return res.status(400).json({
        success: false,
        message: `Only official college emails ending with ${ALLOWED_STUDENT_DOMAIN} are allowed.`
      });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, roll_number, hostel, room_number FROM students WHERE email = ?',
      [emailNorm]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const student = rows[0];
    const passwordMatch = await bcrypt.compare(password, student.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken({
      id:          student.id,
      email:       student.email,
      name:        student.name,
      role:        'student',
      hostel:      student.hostel,
      room_number: student.room_number,
      roll_number: student.roll_number
    });

    return res.json({
      success: true,
      token,
      user: {
        id:          student.id,
        name:        student.name,
        email:       student.email,
        hostel:      student.hostel,
        room_number: student.room_number,
        roll_number: student.roll_number,
        role:        'student'
      }
    });
  } catch (err) {
    console.error('studentLogin error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
}

// -----------------------------------------------------------------------
// POST /api/auth/student/register
// -----------------------------------------------------------------------
export async function studentRegister(req, res) {
  try {
    const { name, email, password, hostel, room_number, roll_number } = req.body;

    if (!name || !email || !password || !hostel) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and hostel are required.' });
    }

    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm.endsWith(ALLOWED_STUDENT_DOMAIN)) {
      return res.status(400).json({
        success: false,
        message: `Only official college emails ending with ${ALLOWED_STUDENT_DOMAIN} are allowed.`
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.execute('SELECT id FROM students WHERE email = ?', [emailNorm]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.execute(
      'INSERT INTO students (name, email, password_hash, hostel, room_number, roll_number) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), emailNorm, password_hash, hostel, room_number || null, roll_number || null]
    );

    const token = generateToken({
      id:          result.insertId,
      email:       emailNorm,
      name:        name.trim(),
      role:        'student',
      hostel,
      room_number: room_number || null,
      roll_number: roll_number || null
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id:          result.insertId,
        name:        name.trim(),
        email:       emailNorm,
        hostel,
        room_number: room_number || null,
        roll_number: roll_number || null,
        role:        'student'
      }
    });
  } catch (err) {
    console.error('studentRegister error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
}

// -----------------------------------------------------------------------
// POST /api/auth/admin/login
// -----------------------------------------------------------------------
export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const emailNorm = email.trim().toLowerCase();

    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role FROM admins WHERE email = ?',
      [emailNorm]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = generateToken({
      id:    admin.id,
      email: admin.email,
      name:  admin.name,
      role:  admin.role
    });

    return res.json({
      success: true,
      token,
      user: {
        id:    admin.id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role
      }
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
}
