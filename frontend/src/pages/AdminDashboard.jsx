import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

/**
 * AdminDashboard Component
 * Official Administration Dashboard for IIITDM Jabalpur Smart Hostel System.
 * Accessible to verified Wardens, Caretakers, and Maintenance Supervisors.
 * 
 * Guarantees that all operations are strictly scoped to the admin's database-authorized hostel(s).
 * 
 * @param {Object} props
 * @param {Object} props.admin - Authenticated admin object from database/authService
 * @param {Function} props.onLogout - Callback to logout and return to role selection
 */
function AdminDashboard({ admin, onLogout }) {
  const authorizedHostels = admin?.authorizedHostels || [];

  // Default to initial authorized hostel ID
  const [activeHostelId, setActiveHostelId] = useState(
    admin?.activeHostelId || (authorizedHostels[0] ? authorizedHostels[0].hostelId : '')
  );

  // Sync activeHostelId when admin prop changes
  useEffect(() => {
    if (admin?.activeHostelId) {
      setActiveHostelId(admin.activeHostelId);
    } else if (authorizedHostels.length > 0 && !activeHostelId) {
      setActiveHostelId(authorizedHostels[0].hostelId);
    }
  }, [admin?.activeHostelId, authorizedHostels]);

  // Security check: ensure activeHostelId is strictly one of the authorized hostels
  useEffect(() => {
    if (authorizedHostels.length > 0 && activeHostelId) {
      const isAuthorized = authorizedHostels.some((h) => h.hostelId === activeHostelId);
      if (!isAuthorized) {
        // Fallback strictly to first authorized hostel ID from database relationship
        setActiveHostelId(authorizedHostels[0].hostelId);
      }
    }
  }, [activeHostelId, authorizedHostels]);

  // Handle graceful loading / missing admin authorization
  if (!admin || authorizedHostels.length === 0) {
    return (
      <div className="admin-dashboard-container">
        <div className="campus-backdrop" aria-hidden="true" />
        <div className="campus-backdrop-overlay" aria-hidden="true" />
        <div className="dashboard-content-wrapper" style={{ minHeight: '60vh', justifyContent: 'center', alignItems: 'center' }}>
          <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h3 className="auth-title" style={{ marginBottom: '0.75rem' }}>
              {!admin ? 'Administrative Session Not Found' : 'No Authorized Hostel Assigned'}
            </h3>
            <p className="auth-subtitle" style={{ marginBottom: '1.5rem', color: !admin ? 'var(--text-muted)' : 'var(--color-danger)' }}>
              {!admin 
                ? 'Your administrative login session could not be verified. Please sign in again.'
                : 'Your administrator account does not have authorized hostel allocations registered in the database. Please contact the Institute IT Cell.'}
            </p>
            <button
              type="button"
              className="auth-submit-btn"
              onClick={onLogout}
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeHostel = authorizedHostels.find((h) => h.hostelId === activeHostelId) || authorizedHostels[0] || {
    hostelId: 'unassigned-uuid',
    hostelName: 'No Authorized Hostel',
    hostelCode: 'N/A',
    roleTitle: 'Warden'
  };

  const adminData = {
    name: admin?.name || 'Hostel Administrator',
    email: admin?.email || 'admin@iiitdmj.ac.in',
    role: admin?.role || 'admin',
    roleTitle: activeHostel.roleTitle || 'Warden'
  };

  // Switch active hostel (STRICTLY constrained to authorizedHostels array from database)
  const handleSelectHostel = (newHostelId) => {
    const isPermitted = authorizedHostels.some((h) => h.hostelId === newHostelId);
    if (isPermitted) {
      setActiveHostelId(newHostelId);
      try {
        const rawSession = localStorage.getItem('iiitdmj_admin_session');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          parsed.activeHostelId = newHostelId;
          localStorage.setItem('iiitdmj_admin_session', JSON.stringify(parsed));
        }
      } catch (e) {}
    } else {
      console.warn('Security alert: Unauthorized hostel selection attempt blocked.');
    }
  };

  return (
    <div className="admin-dashboard-container">
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
              <h2 className="header-portal-subtitle">Smart Hostel Portal &bull; Admin &amp; Warden Dashboard</h2>
            </div>
          </div>

          <div className="header-actions">
            <button 
              type="button" 
              className="dashboard-logout-btn" 
              id="admin-logout-btn"
              onClick={onLogout}
              aria-label="Log out of admin portal"
            >
              <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Admin Welcome & Profile Overview Card */}
        <section className="admin-overview-card" aria-label="Administrator Profile Information">
          <div className="overview-left">
            <div className="admin-avatar-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="overview-text">
              <span className="welcome-greeting">Welcome back</span>
              <h3 className="admin-display-name" id="admin-welcome-name">{adminData.name}</h3>
              <p className="overview-caption">{adminData.roleTitle} &bull; Official Administration</p>
            </div>
          </div>

          <div className="overview-details-grid">
            <div className="detail-item">
              <span className="detail-label">Admin Email</span>
              <span className="detail-value email-value" id="admin-display-email">{adminData.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Assigned Jurisdiction</span>
              <span className="detail-value highlight-value" id="admin-display-hostel">{activeHostel.hostelName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Security &amp; RLS Status</span>
              <span className="detail-badge security-badge">Database Verified</span>
            </div>
          </div>
        </section>

        {/* Authorized Hostel Jurisdiction Hub */}
        <main className="dashboard-main-section">
          <div className="section-header">
            <div className="section-title-row">
              <h3 className="section-title">Assigned Hostel Jurisdiction</h3>
              <span className="jurisdiction-counter">
                {authorizedHostels.length} {authorizedHostels.length === 1 ? 'Authorized Hostel' : 'Authorized Hostels'}
              </span>
            </div>
            <p className="section-subtitle">
              Complaints and administrative records are strictly scoped to your database-authorized hostel assignments.
            </p>
          </div>

          {/* Active Hostel Card with Multi-Hostel Selector if Assigned to Multiple */}
          <div className="hostel-jurisdiction-card" id="hostel-jurisdiction-panel">
            <div className="jurisdiction-card-header">
              <div className="jurisdiction-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                </svg>
              </div>
              <div className="jurisdiction-header-info">
                <span className="jurisdiction-tag">Active Jurisdiction</span>
                <h4 className="active-hostel-title" id="active-hostel-title">{activeHostel.hostelName}</h4>
              </div>
            </div>

            {/* Multiple Hostel Switching Interface (ONLY shows authorized hostels) */}
            {authorizedHostels.length > 1 ? (
              <div className="multi-hostel-selector-container">
                <label htmlFor="authorized-hostel-select" className="selector-label">
                  Switch Active Authorized Hostel:
                </label>
                <div className="selector-control-wrapper">
                  <select
                    id="authorized-hostel-select"
                    className="authorized-hostel-dropdown"
                    value={activeHostelId}
                    onChange={(e) => handleSelectHostel(e.target.value)}
                    aria-label="Select authorized hostel"
                  >
                    {authorizedHostels.map((hostel) => (
                      <option key={hostel.hostelId} value={hostel.hostelId}>
                        {hostel.hostelName} ({hostel.hostelCode})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="selector-notice">
                  You are officially assigned to {authorizedHostels.length} hostels. Only your authorized hostels are available.
                </p>
              </div>
            ) : (
              <div className="single-hostel-notice-container">
                <div className="single-hostel-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Read-Only Assignment &bull; Single Hostel Allocation</span>
                </div>
              </div>
            )}

            {/* Database Technical Scope Details */}
            <div className="jurisdiction-meta-grid">
              <div className="meta-card">
                <span className="meta-label">Authorized Hostel ID (Database UUID)</span>
                <code className="meta-code" id="active-hostel-id">{activeHostel.hostelId}</code>
              </div>
              <div className="meta-card">
                <span className="meta-label">Hostel Code</span>
                <span className="meta-value" id="active-hostel-code">{activeHostel.hostelCode}</span>
              </div>
              <div className="meta-card">
                <span className="meta-label">Administrative Role</span>
                <span className="meta-value">{activeHostel.roleTitle || 'Warden'}</span>
              </div>
              <div className="meta-card">
                <span className="meta-label">RLS Policy Scope</span>
                <span className="meta-value status-secure">Enforced (admin_id = auth.uid())</span>
              </div>
            </div>
          </div>

          {/* Security & Access Protection Card */}
          <div className="security-notice-card" id="security-notice-card">
            <div className="security-notice-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="security-notice-content">
              <h5 className="security-notice-title">Row-Level Security (RLS) Active</h5>
              <p className="security-notice-text">
                Your session is authenticated as <strong>{adminData.email}</strong>. 
                Hostel complaints and records are filtered strictly at the PostgreSQL database layer via <code>admin_hostel_assignments</code>. 
                Arbitrary hostel parameter changes or client-side storage modifications are automatically rejected by database security policies.
              </p>
            </div>
          </div>
        </main>

        {/* Official Institutional Footer */}
        <footer className="institutional-footer dashboard-footer">
          <p className="footer-institute-name">
            Pandit Dwarka Prasad Mishra Indian Institute of Information Technology, Design and Manufacturing Jabalpur
          </p>
          <p className="footer-address">
            An Institute of National Importance established by an Act of Parliament &bull; Office of the Dean of Students (Hostel Affairs)
          </p>
          <p className="footer-location">
            Dumna Airport Road, P.O. Khamaria, Jabalpur - 482005, Madhya Pradesh, India
          </p>
        </footer>

      </div>
    </div>
  );
}

export default AdminDashboard;
