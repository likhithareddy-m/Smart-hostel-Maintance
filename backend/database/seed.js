/**
 * seed.js — Database Seed Script
 * IIITDM Jabalpur Smart Hostel Portal
 *
 * Creates demo admin and student accounts with bcrypt-hashed passwords.
 * Run: node database/seed.js
 */

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from backend root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SALT_ROUNDS = 12;

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '3306', 10),
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'smart_hostel_portal',
      charset:  'utf8mb4'
    });

    console.log('✅ Connected to MySQL database.');

    // ----------------------------------------------------------------
    // SEED ADMINS
    // ----------------------------------------------------------------
    const adminPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);
    const caretakerPassword = await bcrypt.hash('Caretaker@123', SALT_ROUNDS);

    const admins = [
      {
        name:          'Hostel Warden',
        email:         'warden@iiitdmj.ac.in',
        password_hash: adminPassword,
        role:          'admin'
      },
      {
        name:          'Hostel Caretaker',
        email:         'caretaker@iiitdmj.ac.in',
        password_hash: caretakerPassword,
        role:          'caretaker'
      }
    ];

    for (const admin of admins) {
      const [existing] = await connection.execute(
        'SELECT id FROM admins WHERE email = ?',
        [admin.email]
      );
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [admin.name, admin.email, admin.password_hash, admin.role]
        );
        console.log(`✅ Admin created: ${admin.email} (role: ${admin.role})`);
      } else {
        console.log(`ℹ️  Admin already exists: ${admin.email}`);
      }
    }

    // ----------------------------------------------------------------
    // SEED STUDENTS
    // ----------------------------------------------------------------
    const studentPassword = await bcrypt.hash('Student@123', SALT_ROUNDS);

    const students = [
      {
        name:        'Arjun Sharma',
        email:       '2023csb001@iiitdmj.ac.in',
        password_hash: studentPassword,
        roll_number: '2023CSB001',
        hostel:      'Hall of Residence 4 (Vivekananda)',
        room_number: 'Room 214'
      },
      {
        name:        'Priya Singh',
        email:       '2023csb002@iiitdmj.ac.in',
        password_hash: studentPassword,
        roll_number: '2023CSB002',
        hostel:      'Maa Saraswati Girls Hostel',
        room_number: 'Room 108'
      },
      {
        name:        'Rahul Verma',
        email:       '2022ecd015@iiitdmj.ac.in',
        password_hash: studentPassword,
        roll_number: '2022ECD015',
        hostel:      'Hall of Residence 1',
        room_number: 'Room 312'
      }
    ];

    for (const student of students) {
      const [existing] = await connection.execute(
        'SELECT id FROM students WHERE email = ?',
        [student.email]
      );
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO students (name, email, password_hash, roll_number, hostel, room_number) VALUES (?, ?, ?, ?, ?, ?)',
          [student.name, student.email, student.password_hash, student.roll_number, student.hostel, student.room_number]
        );
        console.log(`✅ Student created: ${student.email}`);
      } else {
        console.log(`ℹ️  Student already exists: ${student.email}`);
      }
    }

    // ----------------------------------------------------------------
    // SEED ANNOUNCEMENTS
    // ----------------------------------------------------------------
    const announcements = [
      {
        title:      'Water Supply Maintenance — 15 Sep 2026',
        message:    'Water supply will be interrupted from 10:00 AM to 2:00 PM on 15 Sep 2026 for pipeline maintenance. Residents are advised to store water in advance.',
        created_by: 'Hostel Warden'
      },
      {
        title:      'Mess Committee Meeting',
        message:    'A mess committee meeting will be held on 16 Sep 2026 at 5:00 PM in the Common Room. All hostel representatives are requested to attend.',
        created_by: 'Hostel Warden'
      }
    ];

    const [existingAnn] = await connection.execute('SELECT COUNT(*) as cnt FROM announcements');
    if (existingAnn[0].cnt === 0) {
      for (const ann of announcements) {
        await connection.execute(
          'INSERT INTO announcements (title, message, created_by) VALUES (?, ?, ?)',
          [ann.title, ann.message, ann.created_by]
        );
        console.log(`✅ Announcement created: "${ann.title}"`);
      }
    } else {
      console.log('ℹ️  Announcements already seeded.');
    }

    console.log('\n🎉 Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo Login Credentials:');
    console.log('');
    console.log('  ADMIN (Warden):');
    console.log('    Email:    warden@iiitdmj.ac.in');
    console.log('    Password: Admin@123');
    console.log('');
    console.log('  ADMIN (Caretaker):');
    console.log('    Email:    caretaker@iiitdmj.ac.in');
    console.log('    Password: Caretaker@123');
    console.log('');
    console.log('  STUDENT 1:');
    console.log('    Email:    2023csb001@iiitdmj.ac.in');
    console.log('    Password: Student@123');
    console.log('    Hostel:   Hall of Residence 4 (Vivekananda)');
    console.log('    Room:     Room 214');
    console.log('');
    console.log('  STUDENT 2:');
    console.log('    Email:    2023csb002@iiitdmj.ac.in');
    console.log('    Password: Student@123');
    console.log('    Hostel:   Maa Saraswati Girls Hostel');
    console.log('    Room:     Room 108');
    console.log('');
    console.log('  STUDENT 3:');
    console.log('    Email:    2022ecd015@iiitdmj.ac.in');
    console.log('    Password: Student@123');
    console.log('    Hostel:   Hall of Residence 1');
    console.log('    Room:     Room 312');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seed();
