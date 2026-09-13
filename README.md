# IIITDM Jabalpur Smart Hostel Portal
## Student Complaint & Maintenance Management System

A complete full-stack web application designed for PDPM Indian Institute of Information Technology, Design and Manufacturing (IIITDM) Jabalpur. The platform streamlines student maintenance issue reporting, automated AI categorization and department routing, administrative management, status tracking with real-time lifecycle history, and official announcements.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, Vite, Vanilla CSS Design System with Institutional Branding
- **Backend**: Node.js, Express.js (REST API, JWT Authentication, bcrypt password hashing)
- **Database**: MySQL (Connection Pooling via `mysql2`)
- **Intelligence**: Built-in Rule-Based AI Complaint Diagnostic & Department Routing Engine

```
Student Portal (React) ──┐
                         ├──► Express REST API (:5000) ──► MySQL Database (:3306)
Admin Console (React)  ──┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js** (v18 or higher recommended)
2. **MySQL Server** (e.g., MySQL Community Server, XAMPP, or Docker) running on port `3306`

---

### Step 1: Database Setup

1. Start your MySQL Server (e.g. click **Start** for MySQL in the XAMPP Control Panel).
2. Configure credentials in `backend/.env` (default is user `root` with empty password):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=smart_hostel_portal
   JWT_SECRET=iiitdmj_smart_hostel_super_secure_jwt_secret_2026
   FRONTEND_URL=http://localhost:3000
   ```
3. Initialize the database schema and seed default demo users automatically:
   ```bash
   npm run setup:db
   ```
   *(Or navigate into `backend/` and run `npm run setup:db`)*

---

### Step 2: Start the Backend Server

```bash
npm run backend
# Or from backend directory:
cd backend
npm run dev
```
The API server will run at: `http://localhost:5000`

---

### Step 3: Start the Frontend Portal

Open a new terminal window:
```bash
npm run frontend
# Or from frontend directory:
cd frontend
npm run dev
```
The application will launch at: `http://localhost:3000`

---

## 🔑 Demo Login Credentials

### Administration & Caretaker Portal
| Role | Email | Password |
|---|---|---|
| **Hostel Warden** | `warden@iiitdmj.ac.in` | `Admin@123` |
| **Hostel Caretaker** | `caretaker@iiitdmj.ac.in` | `Caretaker@123` |

### Student Portal
| Student Name | Email | Password | Hostel | Room |
|---|---|---|---|---|
| **Arjun Sharma** | `2023csb001@iiitdmj.ac.in` | `Student@123` | Hall of Residence 4 (Vivekananda) | Room 214 |
| **Priya Singh** | `2023csb002@iiitdmj.ac.in` | `Student@123` | Maa Saraswati Girls Hostel | Room 108 |
| **Rahul Verma** | `2022ecd015@iiitdmj.ac.in` | `Student@123` | Hall of Residence 1 | Room 312 |

---

## 📋 Features Overview

### 1. Student Portal
- **Secure Authentication**: Official `@iiitdmj.ac.in` domain verification.
- **Student Dashboard**: Live summary metrics (Active, In Progress, Resolved complaints), hostel profile, and campus announcements feed.
- **AI-Powered Complaint Reporting**:
  - Auto-extracts category and issues.
  - Automatically assesses priority (Critical, High, Medium, Low).
  - Determines responsible department (e.g. *Electrical Maintenance*, *Plumbing & Sanitation*, *Network & IT*).
  - Immediate feedback with AI diagnosis explanation and confidence score.
- **My Complaints & Live Tracking**:
  - Interactive multi-stage timeline tracker: `Reported` ➔ `Assigned` ➔ `Scheduled` ➔ `In Progress` ➔ `Resolved`.
  - Detailed view with timestamps and admin update notes.
  - Search and filter by category and status.

### 2. Administrator & Caretaker Portal
- **Administrative Metrics**: Real-time totals, pending, active, resolved, and priority counters.
- **Complaints Central Table**: Filter by Status, Priority, Category, Hostel, and keyword search.
- **Complaint Action Modal**:
  - Inspect student details, room, and AI diagnostic assessment.
  - Update complaint status across stages with custom notes visible in student timeline.
  - Reassign responsible departments/technicians.
  - Full audit trail of complaint history.
- **Campus Notice Publisher**: Post notices visible directly on student dashboards.

---

## 🗄️ Database Tables (`smart_hostel_portal`)

1. `students` — Student accounts, college email, hashed password, roll number, hostel, room.
2. `admins` — Administrative accounts (Warden, Caretaker).
3. `complaints` — Maintenance tickets with category, department, priority, current status, AI explanation.
4. `complaint_timeline` — Event audit trail storing status updates, remarks, and timestamps per complaint.
5. `announcements` — Administrative bulletins and maintenance schedules broadcast to students.

---

## 📡 API Endpoints Summary

### Auth
- `POST /api/auth/student/login` — Student authentication
- `POST /api/auth/student/register` — Student registration
- `POST /api/auth/admin/login` — Admin authentication

### Complaints
- `POST /api/complaints` — Submit complaint with AI analysis *(Student)*
- `GET /api/complaints/my` — Fetch student's own complaints *(Student)*
- `GET /api/complaints` — Query complaints with filters *(Admin)*
- `GET /api/complaints/:id` — Retrieve complaint and timeline history *(Authenticated)*
- `PATCH /api/complaints/:id/status` — Update resolution status *(Admin)*
- `PATCH /api/complaints/:id/assign` — Assign department *(Admin)*

### Admin
- `GET /api/admin/dashboard-stats` — Aggregated counts by status and priority *(Admin)*

### Announcements
- `GET /api/announcements` — List latest notices *(Public / Student)*
- `POST /api/announcements` — Create notice *(Admin)*
