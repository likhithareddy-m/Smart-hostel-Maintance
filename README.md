# PDPM IIITDM Jabalpur - Smart Hostel Complaint Portal

A modern web-based Maintenance & Service Management System designed specifically for the resident students and administration of Pandit Dwarka Prasad Mishra Indian Institute of Information Technology, Design and Manufacturing, Jabalpur (PDPM IIITDM Jabalpur).

---

## 📌 Project Overview & Checkpoint Status

This repository contains the **Hackathon Checkpoint** release of the Smart Hostel Complaint Portal. The application is currently structured as a responsive, high-performance client-side Single Page Application (SPA) built with **React** and **Vite**.

### Architecture Note:
- **Frontend**: Full React application located in `frontend/`.
- **Backend & Database**: No external backend server or database is required for this checkpoint. All persistence is handled via browser `localStorage` (`iiitdmj_student_complaints_v2`), and problem analysis is handled via a client-side rule-based NLP AI Complaint Analyzer (`aiComplaintAnalyzer.js`).

---

## 📁 Repository Structure

```text
can-u-hack-it/
├── .gitignore                        # Git exclusion rules (node_modules, build outputs, secrets)
├── README.md                         # Project documentation and setup guide
└── frontend/                         # React + Vite application
    ├── .env.example                  # Environment variable reference template
    ├── index.html                    # Application entry HTML
    ├── package.json                  # Dependencies and build scripts
    ├── package-lock.json             # Locked dependency versions
    ├── vite.config.js                # Vite build and dev server configuration
    ├── public/                       # Static web assets
    │   └── campus-bg.jpg             # Public campus background visual
    └── src/
        ├── main.jsx                  # React application entry point
        ├── App.jsx                   # Root application state & role router
        ├── index.css                 # Global institutional design system & CSS variables
        ├── assets/                   # Bundled assets (campus visuals, svg)
        │   ├── README.md             # Asset documentation
        │   ├── campus-bg.jpg         # High-resolution campus backdrop
        │   └── campus-bg.svg         # Vector fallback backdrop
        ├── components/
        │   └── .gitkeep              # Shared component directory placeholder
        ├── pages/                    # Core view components
        │   ├── RoleSelection.jsx     # Landing page (Student vs. Admin role selector)
        │   ├── RoleSelection.css
        │   ├── StudentLogin.jsx      # Resident login with @iiitdmj.ac.in validation
        │   ├── StudentLogin.css
        │   ├── AdminLogin.jsx        # Hostel administration & caretaker login
        │   ├── AdminLogin.css
        │   ├── StudentDashboard.jsx  # Resident dashboard & action hub
        │   ├── StudentDashboard.css
        │   ├── ReportProblem.jsx     # Complaint registration form with AI analysis
        │   ├── ReportProblem.css
        │   ├── MyComplaints.jsx      # Ticket history & live resolution tracking timeline
        │   └── MyComplaints.css
        └── services/                 # Client-side business logic
            ├── .gitkeep
            ├── aiComplaintAnalyzer.js # Smart NLP category, department, and priority detector
            └── complaintStorage.js    # LocalStorage complaint persistence manager
```

---

## 🚀 Key Features

1. **Role Selection Landing Page**:
   - Institutional portal entry with dedicated gateways for **Students (Hostel Residents)** and **Administrators (Wardens, Caretakers, Maintenance Staff)**.

2. **Student Authentication & Hostel Selection**:
   - Enforces official institute email domain: `@iiitdmj.ac.in`.
   - Comprehensive hostel selection covering all institute residences:
     - Hall of Residence 1
     - Hall of Residence 3
     - Hall of Residence 4 (Vivekananda)
     - Maa Saraswati Girls Hostel
     - Panini PG Hostel
     - Nagarjuna Hostel

3. **Resident Dashboard**:
   - Personalized student welcome badge with live count of active maintenance tickets.
   - Quick service access cards for lodging complaints, checking tracking logs, and reviewing institute circulars.

4. **AI-Assisted Complaint Reporting**:
   - Automated NLP analysis of problem titles and descriptions.
   - Automatic classification into departments:
     - **Electrical Maintenance Cell (EMC)**
     - **Plumbing & Water Supply Cell**
     - **Institute Computer Centre (ICC) - Network Division**
     - **Carpentry & Civil Infrastructure Wing**
     - **Hostel Sanitation & Housekeeping Cell**
   - Intelligent priority calculation (**Critical**, **High**, **Medium**, **Low**) with transparent explainable AI reasoning.

5. **My Complaints & Live Status Tracking**:
   - Filter tickets by status: All, Active / In Progress, and Resolved.
   - Interactive 5-stage live resolution timeline:
     1. **Reported** (Logged & auto-routed)
     2. **Assigned** (Caretaker work order)
     3. **Scheduled** (Technician inspection scheduled)
     4. **In Progress** (On-site repair underway)
     5. **Resolved** (Verified & completed)

6. **Admin Login Portal**:
   - Dedicated administrative authentication interface for staff and caretakers.

---

## 🛠️ Tech Stack

- **Framework**: React 18 (`react`, `react-dom`)
- **Build Tool / Dev Server**: Vite 5
- **Styling**: Vanilla CSS with custom institutional design system tokens (No external heavy UI libraries)
- **Typography**: Google Fonts (*Plus Jakarta Sans*)
- **State & Storage**: React component state + Browser `localStorage` API

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js** (v18.0.0 or later recommended)
- **npm** (v9.0.0 or later)

### Installation & Execution Steps

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Access the portal**:
   Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

### Production Build Verification

To verify that the application compiles cleanly without errors:
```bash
cd frontend
npm run build
```

The production-ready bundle will be output to `frontend/dist/`.

---

## 🔒 Security & Best Practices

- **Zero Hardcoded Secrets**: No sensitive API keys, passwords, or credentials are hardcoded or tracked in version control.
- **Git Protection**: A root-level `.gitignore` prevents `node_modules/`, `dist/`, build artifacts, and `.env*` files from being committed.
- **Environment Template**: `frontend/.env.example` is provided for future backend integration.
