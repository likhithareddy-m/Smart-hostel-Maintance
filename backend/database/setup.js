/**
 * setup.js — Automatic Database Initializer & Migration
 * IIITDM Jabalpur Smart Hostel Portal
 *
 * Connects to MySQL, creates smart_hostel_portal database, applies schema.sql tables,
 * and runs seed data.
 *
 * Usage: node database/setup.js
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function setup() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'smart_hostel_portal';

  console.log(`Connecting to MySQL server at ${dbHost}:${dbPort} as user "${dbUser}"...`);

  let connection;
  try {
    // 1. Connect without selecting database
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      multipleStatements: true,
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL server successfully.');

    // 2. Create database if not exists
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${dbName}\`
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;
    `);
    console.log(`✅ Database "${dbName}" created or verified.`);

    // 3. Switch to database
    await connection.changeUser({ database: dbName });

    // 4. Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying tables from schema.sql...');
    await connection.query(schemaSql);
    console.log('✅ Tables created/verified successfully.');

    await connection.end();

    // 5. Run seed.js
    console.log('\nRunning database seed...');
    await import('./seed.js');
  } catch (err) {
    console.error('❌ Database setup error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Could not connect to MySQL server. Please ensure MySQL is running (e.g. start MySQL in XAMPP Control Panel).');
    }
    process.exit(1);
  }
}

setup();
