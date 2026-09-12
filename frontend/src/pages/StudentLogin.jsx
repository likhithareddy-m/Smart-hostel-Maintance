import React, { useState } from 'react';
import './StudentLogin.css';
import { HOSTEL_NAMES as HOSTEL_OPTIONS } from '../config/hostels.js';
import { signInStudent } from '../services/authService.js';

/**
 * Official College Email Domain Constraint
 */
const ALLOWED_STUDENT_EMAIL_DOMAIN = '@iiitdmj.ac.in';

/**
 * StudentLogin Component
 * Official Student Authentication Portal for IIITDM Jabalpur Smart Hostel System.
 * 
 * @param {Object} props
 * @param {Function} props.onBack - Callback to return to role selection landing page
 * @param {Function} props.onLoginSuccess - Callback to navigate to student dashboard
 */
function StudentLogin({ onBack, onLoginSuccess }) {
  // Form input state (not pre-filled with real credentials)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    hostel: ''
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);

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

    // Email validation
    if (!emailTrimmed) {
      newErrors.email = 'College email is required';
    } else if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!emailTrimmed.toLowerCase().endsWith(ALLOWED_STUDENT_EMAIL_DOMAIN.toLowerCase())) {
      newErrors.email = `Please enter your official college email ending with ${ALLOWED_STUDENT_EMAIL_DOMAIN}`;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Hostel validation
    if (!formData.hostel) {
      newErrors.hostel = 'Please select your allotted hostel';
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

      const result = await signInStudent({
        email: formData.email,
        password: formData.password,
        hostel: formData.hostel
      });

      setIsSubmitting(false);
      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        setLoginStatus({
          type: 'error',
          message: result.error || 'Authentication failed. Please check your credentials.'
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
            id="student-back-btn"
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

        {/* Student Login Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <h3 className="auth-title">Student Login</h3>
              <p className="auth-subtitle">Hostel Resident Authentication</p>
            </div>
            <div className="auth-badge student-badge">Resident</div>
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
            
            {/* College Email Field */}
            <div className="form-group">
              <label htmlFor="student-email" className="form-label">
                College Email <span className="required-indicator" aria-hidden="true">*</span>
              </label>
              <div className="input-container">
                <input
                  type="email"
                  id="student-email"
                  name="email"
                  className={`form-input ${errors.email ? 'input-invalid' : ''}`}
                  placeholder={`e.g. rollno${ALLOWED_STUDENT_EMAIL_DOMAIN}`}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'student-email-error' : 'student-email-hint'}
                />
              </div>
              {errors.email ? (
                <p id="student-email-error" className="field-error-text" role="alert">{errors.email}</p>
              ) : (
                <p id="student-email-hint" className="field-hint-text">Use your official institutional email ({ALLOWED_STUDENT_EMAIL_DOMAIN})</p>
              )}
            </div>

            {/* Allotted Hostel Dropdown */}
            <div className="form-group">
              <label htmlFor="student-hostel" className="form-label">
                Allotted Hostel <span className="required-indicator" aria-hidden="true">*</span>
              </label>
              <div className="input-container">
                <select
                  id="student-hostel"
                  name="hostel"
                  className={`form-select ${errors.hostel ? 'input-invalid' : ''}`}
                  value={formData.hostel}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={errors.hostel ? 'true' : 'false'}
                  aria-describedby={errors.hostel ? 'student-hostel-error' : undefined}
                >
                  <option value="">-- Select Your Allotted Hostel --</option>
                  {HOSTEL_OPTIONS.map((hostelName) => (
                    <option key={hostelName} value={hostelName}>
                      {hostelName}
                    </option>
                  ))}
                </select>
              </div>
              {errors.hostel && (
                <p id="student-hostel-error" className="field-error-text" role="alert">{errors.hostel}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="student-password" className="form-label">
                  Password <span className="required-indicator" aria-hidden="true">*</span>
                </label>
              </div>
              <div className="input-container password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="student-password"
                  name="password"
                  className={`form-input ${errors.password ? 'input-invalid' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'student-password-error' : undefined}
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
                <p id="student-password-error" className="field-error-text" role="alert">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="student-signin-btn"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-loading-wrapper">
                  <span className="btn-spinner" aria-hidden="true" />
                  Verifying Credentials...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
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

export default StudentLogin;
