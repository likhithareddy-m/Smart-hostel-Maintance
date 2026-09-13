import React, { useState, useEffect } from 'react';
import './AdminLogin.css';
import { signInAdmin } from '../services/authService.js';
import { fetchWardenHostels } from '../config/wardens.js';

/**
 * AdminLogin Component
 * Official Administration Authentication Portal for IIITDM Jabalpur Smart Hostel System.
 * Accessible by Wardens, Caretakers, and Maintenance Supervisors.
 * 
 * @param {Object} props
 * @param {Function} props.onBack - Callback to return to role selection landing page
 * @param {Function} props.onLoginSuccess - Callback when admin authentication succeeds
 */
function AdminLogin({ onBack, onLoginSuccess }) {
  // Form input state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Selected authorized hostel ID (for wardens assigned to multiple hostels)
  const [selectedHostelId, setSelectedHostelId] = useState('');

  // Database-resolved warden & assigned hostel state
  const [assignedHostelInfo, setAssignedHostelInfo] = useState({
    isChecking: false,
    wardenName: '',
    hostels: [],
    isAuthorized: false,
    hasChecked: false
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);

  // Dynamically resolve assigned hostel from database as admin enters their official email
  useEffect(() => {
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setAssignedHostelInfo({
        isChecking: false,
        wardenName: '',
        hostels: [],
        isAuthorized: false,
        hasChecked: false
      });
      setSelectedHostelId('');
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setAssignedHostelInfo((prev) => ({ ...prev, isChecking: true }));
      try {
        const result = await fetchWardenHostels(trimmedEmail);
        if (isMounted) {
          const hostels = result.hostels || [];
          setAssignedHostelInfo({
            isChecking: false,
            wardenName: result.wardenName,
            hostels: hostels,
            isAuthorized: result.isAuthorizedWarden && hostels.length > 0,
            hasChecked: true
          });
          if (hostels.length > 0) {
            setSelectedHostelId((prev) => {
              const exists = hostels.some((h) => h.hostelId === prev);
              return exists ? prev : hostels[0].hostelId;
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setAssignedHostelInfo({
            isChecking: false,
            wardenName: '',
            hostels: [],
            isAuthorized: false,
            hasChecked: true
          });
          setSelectedHostelId('');
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formData.email]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user begins typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
    if (loginStatus) {
      setLoginStatus(null);
    }
  };

  // Validate Form Inputs
  const validateForm = () => {
    const newErrors = {};
    const emailTrimmed = formData.email.trim();

    // Admin email validation
    if (!emailTrimmed) {
      newErrors.email = 'Admin email is required';
    } else if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      newErrors.email = 'Please enter a valid official administrative email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setLoginStatus(null);

      try {
        const result = await signInAdmin({
          email: formData.email,
          password: formData.password,
          selectedHostelId: selectedHostelId || undefined
        });

        setIsSubmitting(false);
        if (result.success) {
          setLoginStatus({
            type: 'success',
            message: `Admin authentication successful. Welcome, ${result.user?.name || 'Administrator'}.`
          });
          if (onLoginSuccess) {
            onLoginSuccess(result.user);
          }
        } else {
          setLoginStatus({
            type: 'error',
            message: result.error || 'Administrative authentication failed.'
          });
        }
      } catch (err) {
        setIsSubmitting(false);
        setLoginStatus({
          type: 'error',
          message: err?.message || 'An unexpected error occurred during administrative authentication.'
        });
      }
    }
  };

  return (
    <div className="login-page-container">
      {/* Background Campus Visual */}
      <div className="campus-backdrop" aria-hidden="true" />
      <div className="campus-backdrop-overlay" aria-hidden="true" />

      <div className="login-content-wrapper">
        
        {/* Navigation Bar / Back Action */}
        <div className="login-top-nav">
          <button 
            type="button" 
            className="back-nav-btn"
            id="admin-back-btn"
            onClick={onBack}
            aria-label="Back to role selection"
          >
            <svg className="back-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Role Selection</span>
          </button>
        </div>

        {/* Institutional Branding Header */}
        <header className="institutional-header">
          <div className="institution-emblem-badge">
            <span className="emblem-text">PDPM IIITDM JABALPUR</span>
          </div>
          <h1 className="institute-name">IIITDM JABALPUR</h1>
          <h2 className="portal-title">Smart Hostel Portal</h2>
          <p className="portal-subtitle">Maintenance &amp; Service Management System</p>
        </header>

        {/* Admin Login Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <h3 className="auth-title">Admin Login</h3>
              <p className="auth-subtitle">Hostel Administration &amp; Staff</p>
            </div>
            <div className="auth-badge admin-badge">Administration</div>
          </div>

          {/* Success / Notification Banner */}
          {loginStatus && (
            <div className={`auth-alert-banner alert-${loginStatus.type}`} role="alert">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{loginStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            
            {/* Admin Email Field */}
            <div className="form-group">
              <label htmlFor="admin-email" className="form-label">
                Admin Email <span className="required-indicator" aria-hidden="true">*</span>
              </label>
              <div className="input-container">
                <input
                  type="email"
                  id="admin-email"
                  name="email"
                  className={`form-input ${errors.email ? 'input-invalid' : ''}`}
                  placeholder="admin@iiitdmj.ac.in or official staff email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'admin-email-error' : 'admin-email-hint'}
                />
              </div>
              {errors.email ? (
                <p id="admin-email-error" className="field-error-text" role="alert">{errors.email}</p>
              ) : (
                <p id="admin-email-hint" className="field-hint-text">Enter your designated administrative email address</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="admin-password" className="form-label">
                  Password <span className="required-indicator" aria-hidden="true">*</span>
                </label>
              </div>
              <div className="input-container password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password"
                  name="password"
                  className={`form-input ${errors.password ? 'input-invalid' : ''}`}
                  placeholder="Enter administrator password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'admin-password-error' : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password text' : 'Show password text'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="admin-password-error" className="field-error-text" role="alert">{errors.password}</p>
              )}
            </div>

            {/* Assigned Hostel (Database-Identified & Read-Only) */}
            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="admin-assigned-hostel" className="form-label">
                  Assigned Hostel
                </label>
                <span className="locked-badge" title="Hostel assignment is strictly enforced by the institute database">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lock-icon-svg" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Database Assigned</span>
                </span>
              </div>

              <div className="assigned-hostel-display" id="admin-assigned-hostel">
                {assignedHostelInfo.isChecking ? (
                  <div className="hostel-resolving-state">
                    <span className="btn-spinner inline-spinner" aria-hidden="true" />
                    <span>Identifying authorized hostel from database...</span>
                  </div>
                ) : assignedHostelInfo.isAuthorized && assignedHostelInfo.hostels.length > 0 ? (
                  <div className="hostel-resolved-state">
                    {assignedHostelInfo.hostels.length > 1 ? (
                      <div className="multi-hostel-selection-wrapper">
                        <div className="hostel-primary-row" style={{ marginBottom: '0.35rem' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="building-icon-svg" aria-hidden="true">
                            <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                          </svg>
                          <span className="hostel-name-text" style={{ fontSize: '0.85rem' }}>
                            Select Authorized Hostel ({assignedHostelInfo.hostels.length} authorized):
                          </span>
                        </div>
                        <select
                          id="admin-hostel-select"
                          className="form-input"
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.9rem', backgroundColor: '#ffffff', cursor: 'pointer' }}
                          value={selectedHostelId}
                          onChange={(e) => setSelectedHostelId(e.target.value)}
                          aria-label="Select authorized hostel"
                        >
                          {assignedHostelInfo.hostels.map((h) => (
                            <option key={h.hostelId} value={h.hostelId}>
                              {h.hostelName} ({h.hostelCode || 'Authorized'})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="hostel-primary-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="building-icon-svg" aria-hidden="true">
                          <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                        </svg>
                        <span className="hostel-name-text" id="assigned-hostel-name">
                          {assignedHostelInfo.hostels[0].hostelName}
                        </span>
                      </div>
                    )}
                    {assignedHostelInfo.wardenName && (
                      <div className="warden-identity-subtext" id="assigned-warden-name">
                        Authorized Warden: <strong>{assignedHostelInfo.wardenName}</strong>
                      </div>
                    )}
                  </div>
                ) : assignedHostelInfo.hasChecked ? (
                  <div className="hostel-unassigned-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="warning-icon-svg" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>No official hostel assignment found for this administrative email.</span>
                  </div>
                ) : (
                  <div className="hostel-placeholder-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lock-dim-icon-svg" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Authorized hostel will be identified upon entering official email</span>
                  </div>
                )}
              </div>
              <p className="field-hint-text">Hostel access is locked to your verified warden assignment in the database.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="admin-signin-btn"
              className="auth-submit-btn admin-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-loading-wrapper">
                  <span className="btn-spinner" aria-hidden="true" />
                  Verifying Admin Access...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Administrative Notice (No Registration) */}
          <div className="admin-access-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>
              Authorized personnel only. For new staff provisioning or password resets, contact the <strong>Institute Computer Centre / IT Cell</strong>.
            </span>
          </div>
        </div>

        {/* Official Footer */}
        <footer className="institutional-footer">
          <p className="footer-institute-name">
            Pandit Dwarka Prasad Mishra Indian Institute of Information Technology, Design and Manufacturing Jabalpur
          </p>
          <p className="footer-location">
            Dumna Airport Road, P.O. Khamaria, Jabalpur - 482005, Madhya Pradesh, India
          </p>
        </footer>

      </div>
    </div>
  );
}

export default AdminLogin;
