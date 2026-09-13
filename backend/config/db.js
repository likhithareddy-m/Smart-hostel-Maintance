/**
 * db.js — MySQL2 Connection Pool
 * IIITDM Jabalpur Smart Hostel Portal Backend
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'smart_hostel_portal',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+05:30',
  charset:            'utf8mb4'
});

/**
 * Test the database connection at startup.
 */
export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL database connected successfully.');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Please check your .env database credentials.');
    process.exit(1);
  }
}

export default pool;
