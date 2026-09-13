import React from 'react';
import './RoleSelection.css';

/**
 * RoleSelection Component
 * Landing Page for IIITDM Jabalpur Smart Hostel Portal
 * Allows users to choose between Student (Resident) and Admin (Administration) logins.
 * 
 * @param {Object} props
 * @param {Function} props.onSelectRole - Callback to set the active view ('student' | 'admin')
 */
function RoleSelection({ onSelectRole }) {
  return (
    <div className="portal-page-container">
      {/* Campus Background Layer */}
      <div className="campus-backdrop" aria-hidden="true" />
      <div className="campus-backdrop-overlay" aria-hidden="true" />

      {/* Main Content Area */}
      <div className="portal-content-wrapper">
        
        {/* Official Institute Branding Header */}
        <header className="institutional-header">
          <div className="institution-emblem-badge">
            <span className="emblem-text">PDPM IIITDM JABALPUR</span>
          </div>
          
          <h1 className="institute-name">IIITDM JABALPUR</h1>
          <h2 className="portal-title">Smart Hostel Portal</h2>
          <p className="portal-subtitle">Maintenance &amp; Service Management System</p>
          <div className="header-divider" />
        </header>

        {/* Role Selection Section */}
        <main className="role-selection-section">
          <div className="selection-prompt-container">
            <h3 className="selection-prompt">Continue as</h3>
            <p className="selection-instruction">Select your portal access level to proceed</p>
          </div>

          <div className="role-cards-grid">
            
            {/* Student Role Card */}
            <div 
              className="role-card" 
              id="student-role-card"
              tabIndex="0"
              role="button"
              aria-label="Continue as Student - Hostel Resident"
              onClick={() => onSelectRole('student')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRole('student');
                }
              }}
            >
              <div className="role-card-header">
                <div className="role-icon-box student-icon-box">
                  <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div className="role-titles">
                  <h4 className="role-primary-title">STUDENT</h4>
                  <span className="role-secondary-title">Hostel Resident</span>
                </div>
              </div>

              <p className="role-description">
                Log in to register maintenance requests, report electrical/plumbing issues, check mess updates, and track resolution status.
              </p>

              <div className="role-card-action">
                <span className="action-button-text">Student Login</span>
                <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

            {/* Admin Role Card */}
            <div 
              className="role-card" 
              id="admin-role-card"
              tabIndex="0"
              role="button"
              aria-label="Continue as Admin - Hostel Administration"
              onClick={() => onSelectRole('admin')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRole('admin');
                }
              }}
            >
              <div className="role-card-header">
                <div className="role-icon-box admin-icon-box">
                  <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="role-titles">
                  <h4 className="role-primary-title">ADMIN</h4>
                  <span className="role-secondary-title">Hostel Administration</span>
                </div>
              </div>

              <p className="role-description">
                Administrative access for Wardens, Caretakers, and Maintenance Supervisors to manage tickets and oversee facility operations.
              </p>

              <div className="role-card-action">
                <span className="action-button-text">Admin Login</span>
                <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

          </div>

          {/* Institutional Help & Support Notice */}
          <div className="institutional-notice-box">
            <div className="notice-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div className="notice-text">
              <strong>Need Assistance?</strong> For hostel allotment queries or login issues, contact the 
              Hostel Affairs Office or email <span className="notice-contact">hostel-affairs@iiitdmj.ac.in</span>.
            </div>
          </div>
        </main>

        {/* Official University Footer */}
        <footer className="institutional-footer">
          <p className="footer-institute-name">
            Pandit Dwarka Prasad Mishra Indian Institute of Information Technology, Design and Manufacturing Jabalpur
          </p>
          <p className="footer-address">
            An Institute of National Importance established by an Act of Parliament
          </p>
          <p className="footer-location">
            Dumna Airport Road, P.O. Khamaria, Jabalpur - 482005, Madhya Pradesh, India
          </p>
        </footer>

      </div>
    </div>
  );
}

export default RoleSelection;
