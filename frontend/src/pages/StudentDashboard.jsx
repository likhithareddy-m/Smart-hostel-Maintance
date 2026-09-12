import React, { useState, useEffect } from 'react';
import './StudentDashboard.css';
import { getComplaintsByStudent, syncStudentComplaintsFromDb } from '../services/complaintStorage.js';

/**
 * StudentDashboard Component
 * Official Student Dashboard for IIITDM Jabalpur Smart Hostel Portal.
 * 
 * @param {Object} props
 * @param {Object} props.student - Student details { name, email, hostel }
 * @param {Function} props.onLogout - Callback to log out and return to role selection
 * @param {Function} props.onNavigateToMyComplaints - Callback to open My Complaints view
 * @param {Function} props.onNavigateToReport - Callback to open Report a Problem form
 */
function StudentDashboard({ student, onLogout, onNavigateToMyComplaints, onNavigateToReport }) {
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const list = getComplaintsByStudent(student?.email);
    setComplaintsCount(list.length);
    setActiveCount(list.filter(c => c.currentStatus !== 'Resolved').length);

    syncStudentComplaintsFromDb(student?.id, student?.email).then(syncedList => {
      if (syncedList) {
        setComplaintsCount(syncedList.length);
        setActiveCount(syncedList.filter(c => c.currentStatus !== 'Resolved').length);
      }
    });
  }, [student?.email, student?.id]);

  const studentData = {
    name: student?.name || 'Student Resident',
    email: student?.email || 'student@iiitdmj.ac.in',
    hostel: student?.hostel || 'Hall of Residence 4 (Vivekananda)',
    rollNo: student?.email ? student.email.split('@')[0].toUpperCase() : '2023CSB001'
  };

  return (
    <div className="student-dashboard-container">
      {/* Background Campus Visual */}
      <div className="campus-backdrop" aria-hidden="true" />
      <div className="campus-backdrop-overlay" aria-hidden="true" />

      {/* Main Layout Container */}
      <div className="dashboard-content-wrapper">
        
        {/* Top Navigation Bar */}
        <header className="dashboard-header">
          <div className="header-brand">
            <div className="institution-emblem-badge">
              <span className="emblem-text">PDPM IIITDM JABALPUR</span>
            </div>
            <div className="brand-titles">
              <h1 className="header-institute-title">IIITDM JABALPUR</h1>
              <h2 className="header-portal-subtitle">Smart Hostel Portal &bull; Resident Dashboard</h2>
            </div>
          </div>

          <div className="header-actions">
            <button 
              type="button" 
              className="dashboard-logout-btn" 
              id="student-logout-btn"
              onClick={onLogout}
              aria-label="Log out of student portal"
            >
              <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Student Welcome & Profile Overview Card */}
        <section className="student-overview-card" aria-label="Student Information">
          <div className="overview-left">
            <div className="student-avatar-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="overview-text">
              <span className="welcome-greeting">Welcome back</span>
              <h3 className="student-display-name">{studentData.name}</h3>
              <p className="overview-caption">Hostel Resident &bull; Session 2026-27</p>
            </div>
          </div>

          <div className="overview-details-grid">
            <div className="detail-item">
              <span className="detail-label">College Email</span>
              <span className="detail-value email-value">{studentData.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Allotted Hostel</span>
              <span className="detail-value highlight-value">{studentData.hostel}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Active Tickets</span>
              <span className="detail-badge">{activeCount} Pending</span>
            </div>
          </div>
        </section>

        {/* Action Hub / Dashboard Cards Grid */}
        <main className="dashboard-main-section">
          <div className="section-header">
            <h3 className="section-title">Hostel Services &amp; Complaints</h3>
            <p className="section-subtitle">Select a service below to manage maintenance requests and view announcements</p>
          </div>

          <div className="services-grid">
            
            {/* Card 1: Report a Problem */}
            <div 
              className="service-card" 
              id="card-report-problem" 
              tabIndex="0" 
              role="button" 
              aria-label="Report a Problem"
              onClick={onNavigateToReport}
            >
              <div className="service-card-top">
                <div className="service-icon-box icon-report">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <span className="service-badge">Primary Service</span>
              </div>
              <div className="service-content">
                <h4 className="service-title">Report a Problem</h4>
                <p className="service-description">
                  Register a new complaint for electrical, plumbing, carpentry, cleaning, internet/LAN, or hostel infrastructure issues.
                </p>
              </div>
              <div className="service-card-footer">
                <button 
                  type="button" 
                  className="service-action-btn btn-primary" 
                  aria-label="Report a Problem"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToReport) onNavigateToReport();
                  }}
                >
                  <span>Report a Problem</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Card 2: My Complaints */}
            <div 
              className="service-card" 
              id="card-my-complaints" 
              tabIndex="0" 
              role="button" 
              aria-label="My Complaints"
              onClick={onNavigateToMyComplaints}
            >
              <div className="service-card-top">
                <div className="service-icon-box icon-complaints">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <span className="service-badge-neutral">History ({complaintsCount})</span>
              </div>
              <div className="service-content">
                <h4 className="service-title">My Complaints</h4>
                <p className="service-description">
                  Review all previously submitted maintenance tickets, assigned technician logs, and completed hostel work orders.
                </p>
              </div>
              <div className="service-card-footer">
                <button 
                  type="button" 
                  className="service-action-btn btn-secondary" 
                  aria-label="View My Complaints"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToMyComplaints) onNavigateToMyComplaints();
                  }}
                >
                  <span>My Complaints</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Card 3: Complaint Status */}
            <div 
              className="service-card" 
              id="card-complaint-status" 
              tabIndex="0" 
              role="button" 
              aria-label="Complaint Status"
              onClick={onNavigateToMyComplaints}
            >
              <div className="service-card-top">
                <div className="service-icon-box icon-status">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="service-badge-neutral">Live Tracking ({activeCount} Active)</span>
              </div>
              <div className="service-content">
                <h4 className="service-title">Complaint Status</h4>
                <p className="service-description">
                  Check live progress of pending room repairs, caretaker approvals, technician visit schedules, and resolution verification.
                </p>
              </div>
              <div className="service-card-footer">
                <button 
                  type="button" 
                  className="service-action-btn btn-secondary" 
                  aria-label="Check Complaint Status"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToMyComplaints) onNavigateToMyComplaints();
                  }}
                >
                  <span>Complaint Status</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Card 4: Notifications */}
            <div className="service-card" id="card-notifications" tabIndex="0" role="region" aria-label="Notifications">
              <div className="service-card-top">
                <div className="service-icon-box icon-notifications">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <span className="service-badge-neutral">Announcements</span>
              </div>
              <div className="service-content">
                <h4 className="service-title">Notifications</h4>
                <p className="service-description">
                  Read official circulars from the Warden's Office, scheduled water/power maintenance schedules, and mess committee updates.
                </p>
              </div>
              <div className="service-card-footer">
                <button type="button" className="service-action-btn btn-secondary" aria-label="View Notifications">
                  <span>Notifications</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Official Institutional Footer */}
        <footer className="institutional-footer dashboard-footer">
          <p className="footer-institute-name">
            Pandit Dwarka Prasad Mishra Indian Institute of Information Technology, Design and Manufacturing Jabalpur
          </p>
          <p className="footer-address">
            An Institute of National Importance established by an Act of Parliament &bull; Hostel Affairs Office
          </p>
          <p className="footer-location">
            Dumna Airport Road, P.O. Khamaria, Jabalpur - 482005, Madhya Pradesh, India
          </p>
        </footer>

      </div>
    </div>
  );
}

export default StudentDashboard;
