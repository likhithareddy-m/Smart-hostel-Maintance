import React, { useState } from 'react';
import './ReportProblem.css';
import { complaintsAPI } from '../services/api.js';

const CATEGORIES = [
  'Electrical (Fan, Light, Switchboard, Wiring)',
  'Plumbing (Tap, Washbasin, Flush, Leakage)',
  'Carpentry (Door, Window, Almirah, Bed, Lock)',
  'LAN / Internet / Wi-Fi Wall Socket',
  'Civil / Masonry & Tiles',
  'Hostel Cleanliness & Sanitation',
  'Water Cooler / Purifier Facility',
  'General Maintenance'
];

/**
 * ReportProblem Component
 * Official IIITDM Jabalpur Student Maintenance Complaint Submission Form.
 */
function ReportProblem({ student, onBack, onComplaintSubmitted }) {
  const [formData, setFormData] = useState({
    category:    '',
    title:       '',
    description: '',
    room:        student?.room_number || '',
    priority:    'Medium'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const hostelName = student?.hostel || 'Hall of Residence 4 (Vivekananda)';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (submitError) setSubmitError(null);
  };

  const validate = () => {
    const errs = {};
    if (!formData.category)           errs.category    = 'Please select a problem category';
    if (!formData.title.trim())       errs.title       = 'Please provide a brief problem title';
    if (!formData.description.trim()) errs.description = 'Please describe the issue in detail';
    if (!formData.room.trim())        errs.room        = 'Please specify your room or area number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await complaintsAPI.submit({
      category:    formData.category.split(' (')[0],
      title:       formData.title.trim(),
      description: formData.description.trim(),
      room:        formData.room.trim(),
      priority:    formData.priority
    });

    setIsSubmitting(false);

    if (!result.success) {
      if (result.networkError) {
        setSubmitError('Cannot connect to server. Please ensure the backend is running on port 5000.');
      } else {
        setSubmitError(result.message || 'Failed to submit complaint. Please try again.');
      }
      return;
    }

    setSubmissionSuccess(result.complaint);
    if (onComplaintSubmitted) {
      setTimeout(() => {
        onComplaintSubmitted(result.complaint);
      }, 4000);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#16a34a';
      default: return '#64748b';
    }
  };

  return (
    <div className="report-problem-container">
      {/* Campus Background Layer */}
      <div className="campus-backdrop" aria-hidden="true" />
      <div className="campus-backdrop-overlay" aria-hidden="true" />

      <div className="report-content-wrapper">
        
        {/* Top Navigation */}
        <div className="report-top-nav">
          <button 
            type="button" 
            className="back-nav-btn" 
            id="back-to-dashboard-btn"
            onClick={onBack}
            aria-label="Back to dashboard"
          >
            <svg className="back-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Form Header */}
        <header className="report-header">
          <div className="institution-emblem-badge">
            <span className="emblem-text">PDPM IIITDM JABALPUR &bull; HOSTEL CELL</span>
          </div>
          <h1 className="report-title">Report a Problem</h1>
          <p className="report-subtitle">
            Submit a maintenance or repair request for {hostelName}
          </p>
        </header>

        {/* Complaint Form Card */}
        <div className="report-card">
          
          {/* Error Banner */}
          {submitError && (
            <div className="auth-alert-banner alert-error" role="alert" style={{ marginBottom: '1rem', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#fca5a5' }}>
              <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          {submissionSuccess && (
            <div className="submission-success-banner" role="alert">
              <div className="success-header-row">
                <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div>
                  <strong>Complaint Registered Successfully!</strong>
                  <p>Tracking ID: <code>{submissionSuccess.id}</code></p>
                </div>
              </div>

              {/* AI Analysis Results Panel */}
              {submissionSuccess.aiAnalysis && (
                <div className="ai-analysis-panel">
                  <div className="ai-analysis-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ai-brain-icon">
                      <path d="M12 2a4 4 0 0 0-4 4c0 1.1.45 2.1 1.17 2.83L12 12l2.83-3.17A4 4 0 0 0 12 2z" />
                      <path d="M12 12l-2.83 3.17A4 4 0 1 0 12 22a4 4 0 0 0 2.83-1.17L12 12z" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span className="ai-analysis-title">AI Smart Analysis</span>
                    <span className="ai-confidence-badge">{submissionSuccess.aiAnalysis.confidence} Confidence</span>
                  </div>

                  <div className="ai-results-grid">
                    <div className="ai-result-item">
                      <span className="ai-result-label">Auto-Detected Category</span>
                      <span className="ai-result-value">{submissionSuccess.aiAnalysis.category}</span>
                    </div>
                    <div className="ai-result-item">
                      <span className="ai-result-label">Issue Type</span>
                      <span className="ai-result-value">{submissionSuccess.aiAnalysis.issueType}</span>
                    </div>
                    <div className="ai-result-item">
                      <span className="ai-result-label">Routed Department</span>
                      <span className="ai-result-value ai-dept-value">{submissionSuccess.aiAnalysis.department}</span>
                    </div>
                    <div className="ai-result-item">
                      <span className="ai-result-label">Smart Priority</span>
                      <span 
                        className="ai-result-value ai-priority-value" 
                        style={{ color: getPriorityColor(submissionSuccess.aiAnalysis.priority) }}
                      >
                        ● {submissionSuccess.aiAnalysis.priority}
                      </span>
                    </div>
                  </div>

                  <div className="ai-reason-box">
                    <span className="ai-reason-label">AI Reasoning:</span>
                    <span className="ai-reason-text">{submissionSuccess.aiAnalysis.reason}</span>
                  </div>

                  <p className="ai-redirect-note">Redirecting to My Complaints in a moment...</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="complaint-form" noValidate>
            
            {/* Auto-populated Hostel Info */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Hostel Location</label>
                <input 
                  type="text" 
                  className="form-input input-readonly" 
                  value={hostelName} 
                  readOnly 
                />
                <span className="field-hint-text">Auto-assigned based on your resident profile</span>
              </div>

              <div className="form-group">
                <label htmlFor="comp-room" className="form-label">
                  Room / Flat No. <span className="required-indicator">*</span>
                </label>
                <input 
                  type="text" 
                  id="comp-room" 
                  name="room" 
                  className={`form-input ${errors.room ? 'input-invalid' : ''}`}
                  placeholder="e.g. Room 314, Wing B" 
                  value={formData.room}
                  onChange={handleChange}
                />
                {errors.room && <p className="field-error-text">{errors.room}</p>}
              </div>
            </div>

            {/* Category Select */}
            <div className="form-group">
              <label htmlFor="comp-category" className="form-label">
                Problem Category <span className="required-indicator">*</span>
              </label>
              <select 
                id="comp-category" 
                name="category" 
                className={`form-select ${errors.category ? 'input-invalid' : ''}`}
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">-- Select Category of Problem --</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="field-error-text">{errors.category}</p>}
            </div>

            {/* Title / Summary */}
            <div className="form-group">
              <label htmlFor="comp-title" className="form-label">
                Problem Summary / Title <span className="required-indicator">*</span>
              </label>
              <input 
                type="text" 
                id="comp-title" 
                name="title" 
                className={`form-input ${errors.title ? 'input-invalid' : ''}`}
                placeholder="e.g. Washbasin tap leaking continuously in bathroom" 
                value={formData.title}
                onChange={handleChange}
                maxLength="80"
              />
              {errors.title && <p className="field-error-text">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="comp-desc" className="form-label">
                Detailed Problem Description <span className="required-indicator">*</span>
              </label>
              <textarea 
                id="comp-desc" 
                name="description" 
                className={`form-textarea ${errors.description ? 'input-invalid' : ''}`}
                rows="4"
                placeholder="Describe the issue in detail (location, exact problem, urgency, convenient time for technician visit)..."
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && <p className="field-error-text">{errors.description}</p>}
            </div>

            {/* Priority Selection */}
            <div className="form-group">
              <label className="form-label">Estimated Priority Level</label>
              <div className="priority-options-grid">
                {['Low', 'Medium', 'High'].map(p => (
                  <label 
                    key={p} 
                    className={`priority-option-label ${formData.priority === p ? 'priority-selected' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name="priority" 
                      value={p} 
                      checked={formData.priority === p}
                      onChange={handleChange}
                    />
                    <span>{p} Priority</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="form-actions">
              <button 
                type="submit" 
                id="submit-complaint-btn"
                className="complaint-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-loading-wrapper">
                    <span className="btn-spinner" aria-hidden="true" />
                    Registering Complaint...
                  </span>
                ) : (
                  'Submit Complaint'
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default ReportProblem;
