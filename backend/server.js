/**
 * server.js — Express Application Entry Point
 * IIITDM Jabalpur Smart Hostel Portal Backend
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------------------------------------------------
// CORS Configuration
// -----------------------------------------------------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// -----------------------------------------------------------------------
// Body Parsing
// -----------------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'IIITDM Smart Hostel Portal API is running.',
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);

// -----------------------------------------------------------------------
// 404 Handler
// -----------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// -----------------------------------------------------------------------
// Global Error Handler
// -----------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

// -----------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------
async function startServer() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 IIITDM Smart Hostel Portal API`);
    console.log(`   Running at: http://localhost:${PORT}`);
    console.log(`   Health:     http://localhost:${PORT}/api/health\n`);
  });
}

startServer();
